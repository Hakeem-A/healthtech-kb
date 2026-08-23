import json
import os
from typing import Optional
from urllib import request, error

from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
env_path = os.path.join(BASE_DIR, ".env")

load_dotenv(env_path)


SYSTEM_PROMPT = """
You are the Knowledge Base Assistant for a healthcare management system (HMIS).

STRICT RULES:
- Use ONLY facts, steps, and procedures from the provided knowledge context.
- Never make up steps or include external medical steps that are not in the context.
- If the answer cannot be found in the provided context, clearly state that it is not covered in the knowledge base.
- Reference the relevant source information when explaining workflows.
"""


def _call_openrouter(messages: list[dict]) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured")

    payload = {
        "model": os.getenv("OPENROUTER_MODEL", "google/gemma-4-26b-a4b-it:free"),
        "messages": messages,
        "temperature": 0.1,
    }

    req = request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("OR_SITE_URL", "http://localhost:5173"),
            "X-Title": os.getenv("OR_APP_NAME", "healthtech-kb"),
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            body = response.read().decode("utf-8")
            data = json.loads(body)
            content = data["choices"][0]["message"]["content"]
            return content.strip() if content else ""
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"OpenRouter request failed: {exc.code} {body}") from exc
    except Exception as exc:  # pragma: no cover - network/runtime guard
        raise RuntimeError(f"OpenRouter request failed: {exc}") from exc


def generate_reply(
    user_message: str, context: str = "", history: Optional[list] = None
) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]


    if context:
        messages.append(
            {
                "role": "system",
                "content": f"""
    Relevant knowledge from the system:

    {context}

    Use this to help answer the user clearly and practically.
    """,
            }
        )

    if history:
        messages.extend(history)

    messages.append({"role": "user", "content": user_message})

    return _call_openrouter(messages)
