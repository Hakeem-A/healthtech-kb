from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, require_role_hierarchy
from app.models.article import Article
from app.models.feedback import Feedback
from app.models.search_log import SearchLog
from app.schemas.analytics import AnalyticsSummary, TopArticle, StatusBreakdown

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary,
            dependencies=[Depends(require_role_hierarchy("admin"))])
def get_analytics_summary(db: Session = Depends(get_db)):
    pending_review_count = (
        db.query(func.count(Article.id))
        .filter(Article.status == "under_review")
        .scalar()
    ) or 0

    published_count = (
        db.query(func.count(Article.id))
        .filter(Article.status == "published")
        .scalar()
    ) or 0

    total_views = db.query(func.sum(Article.views)).scalar() or 0

    avg_rating, rating_count = (
        db.query(func.avg(Feedback.rating), func.count(Feedback.id)).first()
        or (None, 0)
    )

    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    searches_this_week = (
        db.query(func.count(SearchLog.id))
        .filter(SearchLog.created_at >= one_week_ago)
        .scalar()
    ) or 0

    top_articles = (
        db.query(Article)
        .filter(Article.status == "published")
        .order_by(Article.views.desc())
        .limit(5)
        .all()
    )

    status_counts = dict(
        db.query(Article.status, func.count(Article.id)).group_by(Article.status).all()
    )

    return AnalyticsSummary(
        pending_review_count=pending_review_count,
        published_count=published_count,
        total_views=total_views,
        average_rating=round(float(avg_rating), 1) if avg_rating is not None else None,
        rating_count=rating_count or 0,
        searches_this_week=searches_this_week,
        top_articles=[TopArticle(id=a.id, title=a.title, views=a.views) for a in top_articles],
        status_breakdown=StatusBreakdown(
            published=status_counts.get("published", 0),
            draft=status_counts.get("draft", 0),
            under_review=status_counts.get("under_review", 0),
            archived=status_counts.get("archived", 0),
        ),
    )