from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict



class ChatSendRequest(BaseModel):
    session_id: str
    message: str
    # Optional metadata from the widget (can be used for analytics)
    widget_source: Optional[str] = None


class ChatSendResponse(BaseModel):
    session_id: str
    reply: str


class ChatMessageResponse(BaseModel):
    id: int
    sender: str
    message: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatMessageResponse]


