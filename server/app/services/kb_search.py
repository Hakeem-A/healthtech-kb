import logging
import re
from html.parser import HTMLParser
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.article import Article
from app.services.llm_client import generate_grounded_reply, LLMUnavailable

logger = logging.getLogger(__name__)

STOPWORDS = {
    "a",
    "an",
    "the",
    "is",
    "are",
    "was",
    "were",
    "do",
    "does",
    "did",
    "how",
    "what",
    "when",
    "where",
    "why",
    "who",
    "can",
    "could",
    "should",
    "i",
    "you",
    "we",
    "they",
    "it",
    "to",
    "of",
    "in",
    "on",
    "for",
    "and",
    "or",
    "my",
    "me",
    "please",
    "help",
    "with",
    "about",
}


class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self._chunks = []

    def handle_data(self, data):
        self._chunks.append(data)

    def get_text(self):
        return "".join(self._chunks)


def strip_html_tags(content: str) -> str:
    """Article content is stored as HTML (Tiptap editor output). Strip
    tags before doing any plain-text keyword matching or snippet slicing,
    so search/chat never leaks raw markup into what the user reads."""
    stripper = _HTMLStripper()
    stripper.feed(content)
    return stripper.get_text()


def extract_keywords(message: str) -> list[str]:
    words = re.findall(r"[a-zA-Z0-9]+", message.lower())
    keywords = [w for w in words if w not in STOPWORDS and len(w) > 2]
    return keywords or words


def search_articles(
    db: Session, message: str, limit: int = 3, include_all_statuses: bool = False
) -> list[tuple[Article, int]]:
    keywords = extract_keywords(message)
    if not keywords:
        return []
    query = db.query(Article)
    if not include_all_statuses:
        query = query.filter(Article.status == "published")
    candidates = query.filter(
        or_(
            *[Article.title.ilike(f"%{kw}%") for kw in keywords]
            + [Article.content.ilike(f"%{kw}%") for kw in keywords]
        )
    ).all()
    scored: list[tuple[Article, int]] = []
    for article in candidates:
        title_lower = article.title.lower()
        content_lower = article.content.lower()
        score = 0
        for kw in keywords:
            score += title_lower.count(kw) * 3
            score += content_lower.count(kw) * 1
        if score > 0:
            scored.append((article, score))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:limit]


def extract_snippet(content: str, keywords: list[str], window: int = 160) -> str:
    """Return a short plain-text snippet centered on the first keyword
    match. Content may be HTML (Tiptap output) or legacy plain text —
    HTML tags are stripped first so tags never leak into a snippet."""
    content = strip_html_tags(content)
    content = re.sub(r"^#+\s*", "", content, flags=re.MULTILINE)
    content_lower = content.lower()
    best_pos = -1
    for kw in keywords:
        pos = content_lower.find(kw)
        if pos != -1 and (best_pos == -1 or pos < best_pos):
            best_pos = pos
    if best_pos == -1:
        snippet = content[:window]
    else:
        start = max(0, best_pos - window // 2)
        snippet = content[start : start + window]
    snippet = " ".join(snippet.split())
    return snippet.strip() + ("…" if len(snippet) >= window else "")


def _template_reply(results: list[tuple[Article, int]], keywords: list[str]) -> str:
    top_article, _ = results[0]
    snippet = extract_snippet(top_article.content, keywords)
    reply = f'From "{top_article.title}": {snippet}'
    if len(results) > 1:
        others = ", ".join(f'"{a.title}"' for a, _ in results[1:])
        reply += f"\n\nRelated articles: {others}"
    return reply


def compose_reply(db: Session, message: str) -> str:
    """
    Single entry point for generating a chat reply. This is the ONLY
    function that should be called by the chat endpoint -- no other
    code path may generate a reply, to guarantee every answer is
    grounded in retrieved KB content.

    Flow:
      1. Search published articles for keyword matches.
      2. If none found, say so plainly (no LLM call at all).
      3. Otherwise, try an LLM-synthesized answer strictly grounded in
         the retrieved articles. If the LLM is unavailable, errors, or
         its reply looks suspiciously longer than the source material
         (a heuristic signal of fabrication beyond the provided
         context), fall back to the deterministic template reply.
    """
    keywords = extract_keywords(message)
    results = search_articles(db, message, limit=3)

    if not results:
        return (
            "I couldn't find anything in the knowledge base for that. "
            "Try rephrasing, or check with a supervisor if this is urgent."
        )

    articles_for_context = [
        {"title": article.title, "content": strip_html_tags(article.content)}
        for article, _score in results
    ]

    try:
        return generate_grounded_reply(message, articles_for_context)
    except LLMUnavailable as e:
        logger.warning(f"LLM unavailable, falling back to template: {e}")
        return _template_reply(results, keywords)