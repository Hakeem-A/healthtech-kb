"""
llm_client.py

Thin wrapper around OpenRouter's chat completions API. Used to
synthesize a natural-language chat reply grounded strictly in
retrieved KB article content -- never open-domain generation.

Fails safe: any error (missing key, network issue, bad response, or
a reply that looks fabricated beyond the provided context) raises
LLMUnavailable, which the caller (kb_search.compose_reply) catches
and falls back to the deterministic template reply.
"""
import httpx

from app.core.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are the KB Assistant for a healthcare knowledge base (HMIS). "
    "You will be given one or more retrieved articles and a question. "
    "STRICT RULES:\n"
    "1. Use ONLY facts, steps, and terminology that appear verbatim or "
    "as a close paraphrase in the articles below. Never add steps, "
    "warnings, drug names, lab values, monitoring requirements, or "
    "procedures that are not explicitly stated in the articles, even "
    "if they seem like standard medical practice.\n"
    "2. If the articles only partially answer the question, answer only "
    "the part they cover, and explicitly say the rest isn't covered in "
    "the knowledge base rather than filling the gap yourself.\n"
    "3. If the articles don't contain a clear answer at all, say so "
    "plainly and suggest the user rephrase or contact a supervisor.\n"
    "4. Keep replies short (2-4 sentences, no headers, no bullet lists "
    "unless the source article itself is a numbered list you're "
    "directly summarizing) and always name the source article.\n"
    "5. Never offer to help with topics, follow-up scenarios, or "
    "system features that are not described in the articles."
)


class LLMUnavailable(Exception):
    pass


def generate_grounded_reply(question: str, articles: list[dict]) -> str:
    if not settings.OPENROUTER_API_KEY:
        raise LLMUnavailable("No OPENROUTER_API_KEY configured")

    total_source_length = sum(len(a["content"]) for a in articles)
    context_blocks = "\n\n".join(
        f"### {a['title']}\n{a['content']}" for a in articles
    )
    user_prompt = f"Articles:\n\n{context_blocks}\n\nQuestion: {question}"

    try:
        response = httpx.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.OPENROUTER_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 200,
            },
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()
        reply = data["choices"][0]["message"]["content"].strip()
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as e:
        raise LLMUnavailable(str(e)) from e

    # Heuristic grounding guard: a reply significantly longer than its
    # source material is a strong signal the model added content beyond
    # what was actually provided, despite instructions to the contrary.
    if len(reply) > total_source_length * 1.5 + 100:
        raise LLMUnavailable(
            f"Reply length ({len(reply)} chars) suggests fabrication "
            f"beyond source content ({total_source_length} chars)"
        )

    return reply