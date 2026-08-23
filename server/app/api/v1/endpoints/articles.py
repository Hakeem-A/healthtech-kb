from typing import List, Optional
import re

from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackResponse, ArticleRatingSummary
from sqlalchemy import or_, func

from app.api.deps import get_db, get_current_user, require_role_hierarchy
from app.models.article import Article
from app.models.tag import Tag
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.search_log import SearchLog
from app.schemas.article import (
    ArticleCreate,
    ArticleUpdate,
    ArticleResponse,
    ArticleListItem,
    ArticleSearchResult,
    ArticleRejectRequest,
)
from app.services.kb_search import search_articles, extract_keywords, extract_snippet

router = APIRouter()


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug


def unique_slug(db: Session, base_slug: str, exclude_id: Optional[int] = None) -> str:
    slug = base_slug
    counter = 2
    query = db.query(Article).filter(Article.slug == slug)
    if exclude_id:
        query = query.filter(Article.id != exclude_id)
    while query.first() is not None:
        slug = f"{base_slug}-{counter}"
        counter += 1
        query = db.query(Article).filter(Article.slug == slug)
        if exclude_id:
            query = query.filter(Article.id != exclude_id)
    return slug


@router.post(
    "/",
    response_model=ArticleResponse,
    status_code=http_status.HTTP_201_CREATED,
    dependencies=[Depends(require_role_hierarchy("editor"))],
)
def create_article(
    payload: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_slug = slugify(payload.title)
    slug = unique_slug(db, base_slug)

    # When editors create new articles, they are automatically sent to under_review.
    # Admins can set any valid status.
    article_status = "under_review" if current_user.role == "editor" else payload.status

    article = Article(
        title=payload.title,
        slug=slug,
        content=payload.content,
        category_id=payload.category_id,
        author_id=current_user.id,
        status=article_status,
    )

    if payload.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()
        article.tags_rel = tags

    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.get("/", response_model=List[ArticleListItem])
def list_articles(
    tag: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Article)
    if current_user.role == "viewer":
        query = query.filter(Article.status == "published")

    if status_filter:
        query = query.filter(Article.status == status_filter)

    if tag:
        query = query.join(Article.tags_rel).filter(Tag.slug == tag)

    return query.order_by(Article.created_at.desc()).all()


@router.post("/{article_id}/feedback", response_model=FeedbackResponse)
def submit_feedback(
    article_id: int,
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.status != "published":
        raise HTTPException(status_code=403, detail="Can only rate published articles")

    existing = (
        db.query(Feedback)
        .filter(Feedback.article_id == article_id, Feedback.user_id == current_user.id)
        .first()
    )

    if existing:
        existing.rating = payload.rating
        existing.comment = payload.comment
        db.commit()
        db.refresh(existing)
        return existing

    feedback = Feedback(
        article_id=article_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/{article_id}/feedback/summary", response_model=ArticleRatingSummary)
def get_feedback_summary(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = (
        db.query(func.avg(Feedback.rating), func.count(Feedback.id))
        .filter(Feedback.article_id == article_id)
        .first()
    )
    avg_rating, count = result if result else (None, 0)

    my_feedback = (
        db.query(Feedback)
        .filter(Feedback.article_id == article_id, Feedback.user_id == current_user.id)
        .first()
    )

    return ArticleRatingSummary(
        average_rating=round(float(avg_rating), 1) if avg_rating is not None else None,
        rating_count=count or 0,
        my_rating=my_feedback.rating if my_feedback else None,
    )


@router.get("/search", response_model=List[ArticleSearchResult])
def search_articles_endpoint(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    keywords = extract_keywords(q)
    include_all = current_user.role in ("editor", "admin")
    results = search_articles(db, q, limit=10, include_all_statuses=include_all)

    db.add(SearchLog(query=q, results_count=len(results), user_id=current_user.id))
    db.commit()

    return [
        ArticleSearchResult(
            id=article.id,
            title=article.title,
            slug=article.slug,
            status=article.status,
            category_id=article.category_id,
            views=article.views,
            snippet=extract_snippet(article.content, keywords),
        )
        for article, score in results
    ]


@router.get(
    "/review-queue",
    response_model=List[ArticleListItem],
    dependencies=[Depends(require_role_hierarchy("admin"))],
)
def review_queue(db: Session = Depends(get_db)):
    # Registered before /{article_id} so "review-queue" isn't parsed as an id.
    return (
        db.query(Article)
        .filter(Article.status == "under_review")
        .order_by(Article.updated_at.asc())
        .all()
    )


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if current_user.role == "viewer" and article.status != "published":
        raise HTTPException(
            status_code=403, detail="You do not have access to this article"
        )
    return article


@router.put(
    "/{article_id}",
    response_model=ArticleResponse,
    dependencies=[Depends(require_role_hierarchy("editor"))],
)
def update_article(
    article_id: int,
    payload: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Only admins may publish/unpublish or archive — editors changing status
    # are restricted to draft <-> under_review.
    if payload.status is not None and payload.status != article.status:
        if payload.status in ("published", "archived") and current_user.role != "admin":
            raise HTTPException(
                status_code=403, detail="Only admins can publish or archive articles"
            )

    content_changed = False

    if payload.title is not None:
        article.title = payload.title
        article.slug = unique_slug(db, slugify(payload.title), exclude_id=article.id)
        content_changed = True
    if payload.content is not None:
        article.content = payload.content
        content_changed = True
    if payload.category_id is not None:
        article.category_id = payload.category_id
    if payload.status is not None:
        article.status = payload.status
    if payload.tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()
        article.tags_rel = tags

    # Resubmitting edited content clears any prior rejection reason — it's
    # stale once the editor has actually changed the article.
    if content_changed and article.rejection_reason:
        article.rejection_reason = None

    db.add(
        AuditLog(
            actor_id=current_user.id,
            action="update_article",
            target_type="article",
            target_id=article.id,
        )
    )
    db.commit()
    db.refresh(article)
    return article


@router.put(
    "/{article_id}/approve",
    response_model=ArticleResponse,
    dependencies=[Depends(require_role_hierarchy("admin"))],
)
def approve_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.status != "under_review":
        raise HTTPException(
            status_code=400, detail="Only articles under review can be approved"
        )

    article.status = "published"
    article.rejection_reason = None

    db.add(
        AuditLog(
            actor_id=current_user.id,
            action="approve_article",
            target_type="article",
            target_id=article.id,
        )
    )
    db.commit()
    db.refresh(article)
    return article


@router.put(
    "/{article_id}/reject",
    response_model=ArticleResponse,
    dependencies=[Depends(require_role_hierarchy("admin"))],
)
def reject_article(
    article_id: int,
    payload: ArticleRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.status != "under_review":
        raise HTTPException(
            status_code=400, detail="Only articles under review can be rejected"
        )

    article.status = "draft"
    article.rejection_reason = payload.reason

    db.add(
        AuditLog(
            actor_id=current_user.id,
            action=f"reject_article: {payload.reason}",
            target_type="article",
            target_id=article.id,
        )
    )
    db.commit()
    db.refresh(article)
    return article


@router.delete(
    "/{article_id}",
    status_code=http_status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role_hierarchy("admin"))],
)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    db.add(
        AuditLog(
            actor_id=current_user.id,
            action="delete_article",
            target_type="article",
            target_id=article.id,
        )
    )
    db.delete(article)
    db.commit()
