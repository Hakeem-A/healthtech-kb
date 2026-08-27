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
import logging
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

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


class LLMValidationError(Exception):
    pass


FALLBACK_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "mistralai/mistral-small-24b-instruct-2501:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "liquid/lfm-2.5-2.6b:free",
]


def generate_grounded_reply(question: str, articles: list[dict], history: list = None) -> str:
    if not settings.OPENROUTER_API_KEY:
        raise LLMUnavailable("No OPENROUTER_API_KEY configured")

    total_source_length = sum(len(a["content"]) for a in articles)
    context_blocks = "\n\n".join(
        f"### {a['title']}\n{a['content']}" for a in articles
    )
    user_prompt = f"Articles:\n\n{context_blocks}\n\nQuestion: {question}"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_prompt})

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    if getattr(settings, "OR_SITE_URL", None):
        headers["HTTP-Referer"] = settings.OR_SITE_URL
    if getattr(settings, "OR_APP_NAME", None):
        headers["X-Title"] = settings.OR_APP_NAME

    models_to_try = [settings.OPENROUTER_MODEL] + [
        m for m in FALLBACK_MODELS if m != settings.OPENROUTER_MODEL
    ]

    last_error = None
    reply = ""

    for model_name in models_to_try:
        try:
            response = httpx.post(
                OPENROUTER_URL,
                headers=headers,
                json={
                    "model": model_name,
                    "messages": messages,
                    "temperature": 0.1,
                    "max_tokens": 350,
                },
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()

            choices = data.get("choices")
            if not choices or not isinstance(choices, list) or len(choices) == 0:
                raise LLMValidationError(f"Model {model_name} returned no choices in response.")

            first_choice = choices[0]
            msg_obj = first_choice.get("message") or {}
            raw_content = msg_obj.get("content")

            if raw_content is None:
                raw_content = first_choice.get("text") or msg_obj.get("reasoning")

            if raw_content is None or not isinstance(raw_content, str):
                raise LLMValidationError(f"Model {model_name} returned null or non-string content.")

            candidate_reply = raw_content.strip()

            # Deterministic guards
            if not candidate_reply or len(candidate_reply) < 10:
                raise LLMValidationError("Reply is too short or empty.")
            if "according to my knowledge" in candidate_reply.lower():
                raise LLMValidationError("Reply contains forbidden phrases.")

            reply = candidate_reply
            break
        except Exception as e:
            last_error = e
            logger.warning(f"OpenRouter model '{model_name}' failed: {e}. Trying fallback...")
            continue

    if not reply:
        if last_error:
            raise LLMUnavailable(f"All LLM models failed. Last error: {last_error}") from last_error
        raise LLMUnavailable("No reply generated from available LLM models.")

    # Heuristic grounding guard: a reply significantly longer than its
    # source material is a strong signal the model added content beyond
    # what was actually provided, despite instructions to the contrary.
    if len(reply) > max(450, total_source_length * 2 + 150):
        raise LLMUnavailable(
            f"Reply length ({len(reply)} chars) suggests fabrication "
            f"beyond source content ({total_source_length} chars)"
        )

    return reply