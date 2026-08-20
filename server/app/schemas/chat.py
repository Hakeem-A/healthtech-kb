from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict


class ChatSendRequest(BaseModel):
    session_id: str
    message: str
    widget_source: Optional[str] = None


class RelatedArticle(BaseModel):
    id: int
    title: str
    snippet: Optional[str] = None
    updated_at: Optional[datetime] = None


class ChatReply(BaseModel):
    reply: str
    primary_article: Optional[RelatedArticle] = None
    related_articles: list[RelatedArticle] = []


class ChatSendResponse(BaseModel):
    session_id: str
    reply: str
    message_id: Optional[int] = None
    primary_article: Optional[RelatedArticle] = None
    related_articles: list[RelatedArticle] = []


class ChatMessageResponse(BaseModel):
    id: int
    sender: str
    message: str
    timestamp: datetime
    helpful: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatMessageResponse]


class AssistantLogResponse(BaseModel):
    id: int
    session_id: str
    message: str
    reply: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageFeedback(BaseModel):
    helpful: bool