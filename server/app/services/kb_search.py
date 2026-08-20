import logging
import re
from html.parser import HTMLParser
from dataclasses import dataclass, field
from typing import List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.article import Article
from app.schemas.chat import ChatMessage as ChatMessageSchema
from app.schemas.chat import ChatReply, RelatedArticle
from app.services.llm_client import (
    LLMUnavailable,
    LLMValidationError,
    generate_grounded_reply,
)

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


@dataclass
class ChatContext:
    """Encapsulates all data related to a single chat interaction."""

    message: str
    history: List[ChatMessageSchema] = field(default_factory=list)
    retrieved_articles: list[tuple[Article, dict]] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    confidence: str = "none"
    confidence_reason: str = ""


def retrieve_articles(db: Session, context: ChatContext) -> None:
    """
    Retrieves articles from the KB based on keywords in the user's message.
    Updates the context with retrieved articles and confidence.
    """
    context.keywords = extract_keywords(context.message)
    if not context.keywords:
        return

    raw_results = search_articles(db, context.message, limit=5)
    if not raw_results:
        return

    # Placeholder for more advanced scoring and confidence
    context.retrieved_articles = [
        (article, {"score": score}) for article, score in raw_results
    ]
    context.confidence = "medium"
    context.confidence_reason = "Initial keyword match found."


def generate_answer(context: ChatContext) -> str:
    """
    Generates a reply using the LLM, grounded in the retrieved articles.
    Handles LLM unavailability and validation errors.
    """
    articles_for_context = [
        {
            "id": article.id,
            "title": article.title,
            "content": strip_html_tags(article.content),
        }
        for article, _ in context.retrieved_articles
    ]

    history_for_llm = [
        {
            "role": "assistant" if msg.sender == "bot" else "user",
            "content": msg.message,
        }
        for msg in sorted(context.history, key=lambda m: m.timestamp)
    ]

    try:
        llm_reply = generate_grounded_reply(
            question=context.message,
            articles=articles_for_context,
            history=history_for_llm,
        )
        context.confidence = "high"
        context.confidence_reason = "LLM successfully generated a grounded response."
        return llm_reply
    except (LLMUnavailable, LLMValidationError) as e:
        logger.warning(f"LLM generation failed, falling back to template: {e}")
        raise


def build_response(context: ChatContext, reply_text: str, status: str) -> ChatReply:
    """Builds the final ChatReply object for the API."""
    if not context.retrieved_articles:
        return ChatReply(
            reply=reply_text,
            status=status,
            confidence=context.confidence,
            explain_reason=context.confidence_reason,
            matched_keywords=context.keywords,
        )

    top_article, _ = context.retrieved_articles[0]
    primary_article = RelatedArticle(
        id=top_article.id,
        title=top_article.title,
        snippet=extract_snippet(top_article.content, context.keywords),
        last_updated=top_article.updated_at,
    )
    related_articles = [
        RelatedArticle(
            id=a.id,
            title=a.title,
            snippet=extract_snippet(a.content, context.keywords),
            last_updated=a.updated_at,
        )
        for a, _ in context.retrieved_articles[1:]
    ]

    return ChatReply(
        reply=reply_text,
        primary_article=primary_article,
        related_articles=related_articles,
        status=status,
        confidence=context.confidence,
        explain_reason=context.confidence_reason,
        matched_keywords=context.keywords,
    )


def compose_reply(
    db: Session, message: str, history: List[ChatMessageSchema]
) -> ChatReply:
    """
    Orchestrates the entire process of generating a chat reply.
    """
    context = ChatContext(message=message, history=history)

    retrieve_articles(db, context)

    if not context.retrieved_articles:
        reply_text = "I couldn't find anything in the knowledge base for that. Try rephrasing your question."
        return build_response(context, reply_text, status="no_results")

    try:
        llm_reply = generate_answer(context)
        return build_response(context, llm_reply, status="success")
    except (LLMUnavailable, LLMValidationError):
        fallback_text = (
            "I couldn't generate a direct answer, but here are some articles that might help."
        )
        return build_response(context, fallback_text, status="fallback")