from typing import List, Optional
from pydantic import BaseModel


class TopArticle(BaseModel):
    id: int
    title: str
    views: int


class StatusBreakdown(BaseModel):
    published: int
    draft: int
    under_review: int
    archived: int


class AnalyticsSummary(BaseModel):
    pending_review_count: int
    published_count: int
    total_views: int
    average_rating: Optional[float]
    rating_count: int
    searches_this_week: int
    top_articles: List[TopArticle]
    status_breakdown: StatusBreakdown
