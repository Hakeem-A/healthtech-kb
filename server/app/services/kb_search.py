import re
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.article import Article

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "do", "does", "did",
    "how", "what", "when", "where", "why", "who", "can", "could", "should",
    "i", "you", "we", "they", "it", "to", "of", "in", "on", "for", "and",
    "or", "my", "me", "please", "help", "with", "about",
}


def extract_keywords(message: str) -> list[str]:
    words = re.findall(r"[a-zA-Z0-9]+", message.lower())
    keywords = [w for w in words if w not in STOPWORDS and len(w) > 2]
    return keywords or words  # fall back to everything if all filtered out


def search_articles(db: Session, message: str, limit: int = 3) -> list[tuple[Article, int]]:
    """
    Simple keyword-match ranking over published articles only.
    Title matches are weighted higher than content matches.
    Returns list of (article, score) sorted by score descending.
    """
    keywords = extract_keywords(message)
    if not keywords:
        return []

    candidates = (
        db.query(Article)
        .filter(Article.status == "published")
        .filter(
            or_(*[Article.title.ilike(f"%{kw}%") for kw in keywords]
                + [Article.content.ilike(f"%{kw}%") for kw in keywords])
        )
        .all()
    )

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
    """Return a short snippet centered on the first keyword match, or the
    start of the content if nothing matches directly."""
    # Strip markdown heading markers (#, ##, ...) so snippets don't open
    # with a bare "# Title" line when no keyword falls early in the body.
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
        snippet = content[start:start + window]

    snippet = " ".join(snippet.split())  # collapse whitespace/newlines
    return snippet.strip() + ("…" if len(snippet) >= window else "")


def compose_reply(db: Session, message: str) -> str:
    keywords = extract_keywords(message)
    results = search_articles(db, message)

    if not results:
        return (
            "I couldn't find anything in the knowledge base for that. "
            "Try rephrasing, or check with a supervisor if this is urgent."
        )

    top_article, _ = results[0]
    snippet = extract_snippet(top_article.content, keywords)

    reply = f"From \"{top_article.title}\": {snippet}"

    if len(results) > 1:
        others = ", ".join(f"\"{a.title}\"" for a, _ in results[1:])
        reply += f"\n\nRelated articles: {others}"

    return reply