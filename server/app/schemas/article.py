from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator, model_validator

ARTICLE_STATUSES = ("draft", "under_review", "published", "archived")


class TagResponse(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


class ArticleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    category_id: int
    status: str = "draft"
    tag_ids: Optional[List[int]] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ARTICLE_STATUSES:
            raise ValueError(f"status must be one of {ARTICLE_STATUSES}")
        return v


class ArticleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    category_id: Optional[int] = None
    status: Optional[str] = None
    tag_ids: Optional[List[int]] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ARTICLE_STATUSES:
            raise ValueError(f"status must be one of {ARTICLE_STATUSES}")
        return v


class ArticleListItem(BaseModel):
    id: int
    title: str
    slug: str
    status: str
    category_id: int
    author_id: Optional[int]
    views: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ArticleResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    status: str
    category_id: int
    author_id: Optional[int]
    views: int
    tags: List[TagResponse] = []
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def map_tags_rel(cls, obj: Any):
        if hasattr(obj, "tags_rel"):
            obj.tags = obj.tags_rel
        return obj


class ArticleSearchResult(BaseModel):
    id: int
    title: str
    slug: str
    status: str
    category_id: int
    views: int
    snippet: str

    class Config:
        from_attributes = True


class ArticleRejectRequest(BaseModel):
    reason: str = Field(..., min_length=1)


class FeedbackSnippet(BaseModel):
    id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LowRatedArticleItem(BaseModel):
    id: int
    title: str
    slug: str
    status: str
    category_id: int
    category_name: Optional[str] = None
    author_id: Optional[int] = None
    views: int
    average_rating: float
    rating_count: int
    recent_feedback: List[FeedbackSnippet] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
