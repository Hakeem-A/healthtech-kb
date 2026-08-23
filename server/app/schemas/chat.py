from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict


class ChatMessage(BaseModel):
    sender: str
    message: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSendRequest(BaseModel):
    session_id: str
    message: str
    widget_source: Optional[str] = None
    history: Optional[List[ChatMessage]] = None


class RelatedArticle(BaseModel):
    id: int
    title: str
    snippet: str
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatReply(BaseModel):
    reply: str
    primary_article: Optional[RelatedArticle] = None
    related_articles: List[RelatedArticle] = []
    status: str = "no_results"
    confidence: str = "none"
    explain_reason: Optional[str] = None
    matched_keywords: List[str] = []


class ChatSendResponse(ChatReply):
    session_id: str
    message_id: Optional[int] = None


class ChatMessageResponse(ChatMessage):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatMessageResponse]


class AssistantLogResponse(BaseModel):
    id: int
    session_id: str
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    widget_source: Optional[str] = None
    message: str
    reply: str
    status: Optional[str] = None
    confidence: Optional[str] = None
    helpful: Optional[bool] = None
    response_time_ms: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatMessageFeedback(BaseModel):
    helpful: bool