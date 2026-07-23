from typing import List, Optional
import re

from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_current_user, require_role_hierarchy
from app.models.article import Article
from app.models.tag import Tag
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.article import ArticleCreate, ArticleUpdate, ArticleResponse, ArticleListItem

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


@router.post("/", response_model=ArticleResponse, status_code=http_status.HTTP_201_CREATED,
             dependencies=[Depends(require_role_hierarchy("editor"))])
def create_article(payload: ArticleCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    base_slug = slugify(payload.title)
    slug = unique_slug(db, base_slug)

    article = Article(
        title=payload.title,
        slug=slug,
        content=payload.content,
        category_id=payload.category_id,
        author_id=current_user.id,
        status=payload.status,
    )

    if payload.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()
        article.tags_rel = tags

    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.get("/", response_model=List[ArticleListItem])
def list_articles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Article)
    if current_user.role == "viewer":
        query = query.filter(Article.status == "published")
    return query.order_by(Article.created_at.desc()).all()


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(article_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if current_user.role == "viewer" and article.status != "published":
        raise HTTPException(status_code=403, detail="You do not have access to this article")
    return article


@router.put("/{article_id}", response_model=ArticleResponse,
            dependencies=[Depends(require_role_hierarchy("editor"))])
def update_article(article_id: int, payload: ArticleUpdate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Only admins may publish/unpublish or archive — editors changing status
    # are restricted to draft <-> under_review.
    if payload.status is not None and payload.status != article.status:
        if payload.status in ("published", "archived") and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can publish or archive articles")

    if payload.title is not None:
        article.title = payload.title
        article.slug = unique_slug(db, slugify(payload.title), exclude_id=article.id)
    if payload.content is not None:
        article.content = payload.content
    if payload.category_id is not None:
        article.category_id = payload.category_id
    if payload.status is not None:
        article.status = payload.status
    if payload.tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()
        article.tags_rel = tags

    db.add(AuditLog(
        actor_id=current_user.id,
        action="update_article",
        target_type="article",
        target_id=article.id,
    ))
    db.commit()
    db.refresh(article)
    return article


@router.delete("/{article_id}", status_code=http_status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_role_hierarchy("admin"))])
def delete_article(article_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    db.add(AuditLog(
        actor_id=current_user.id,
        action="delete_article",
        target_type="article",
        target_id=article.id,
    ))
    db.delete(article)
    db.commit()