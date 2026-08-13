"""
llm_client.py

Thin wrapper around OpenRouter's chat completions API. Used to
synthesize a natural-language chat reply grounded strictly in
retrieved KB article content -- never open-domain generation.

Fails safe: any error (missing key, network issue, bad response)
raises LLMUnavailable, which callers should catch and fall back to
the deterministic template reply.
"""

import httpx

from app.core.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class LLMUnavailable(Exception):
    """Raised when the LLM cannot be reached or returns an invalid response."""

    pass


def generate_grounded_reply(question: str, articles: list[dict]) -> str:
    if not settings.OPENROUTER_API_KEY:
        raise LLMUnavailable("No OPENROUTER_API_KEY configured")

    context_blocks = "\n\n".join(f"### {a['title']}\n{a['content']}" for a in articles)

    system_prompt = (
        "You are the KB Assistant for a healthcare knowledge base (HMIS). "
        "Answer the user's question using ONLY the information in the "
        "provided articles below. Do not use any outside knowledge, and "
        "do not guess or fabricate steps, drug names, or clinical details "
        "that aren't explicitly in the articles. "
        "If the articles don't contain a clear answer, say plainly that "
        "you couldn't find relevant information in the knowledge base "
        "and suggest the user rephrase or contact a supervisor—never "
        "invent an answer. "
        "Keep replies concise (2–5 sentences) and mention which article "
        "the answer comes from by name."
    )

    user_prompt = f"Articles:\n\n{context_blocks}\n\nQuestion: {question}"

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        "temperature": 0.2,
        "max_tokens": 300,
    }

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        print("\n========== OPENROUTER REQUEST ==========")
        print("URL:", OPENROUTER_URL)
        print("MODEL:", settings.OPENROUTER_MODEL)
        print("API KEY PREFIX:", settings.OPENROUTER_API_KEY[:12] + "...")
        print(
            "HEADERS:",
            {k: ("***" if k == "Authorization" else v) for k, v in headers.items()},
        )
        print("PAYLOAD:", payload)
        print("========================================\n")

        response = httpx.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=15.0,
        )

        print("HTTP STATUS:", response.status_code)

        response.raise_for_status()

        data = response.json()

        print("RESPONSE JSON:", data)

        return data["choices"][0]["message"]["content"].strip()

    except httpx.HTTPStatusError as e:
        print("\n========== OPENROUTER ERROR ==========")
        print("Status Code:", e.response.status_code)
        print("Response Body:")
        print(e.response.text)
        print("======================================\n")

        raise LLMUnavailable(e.response.text) from e

    except (httpx.HTTPError, KeyError, IndexError, ValueError) as e:
        print("\n========== CLIENT ERROR ==========")
        print(type(e).__name__)
        print(str(e))
        print("==================================\n")

        raise LLMUnavailable(str(e)) from e
