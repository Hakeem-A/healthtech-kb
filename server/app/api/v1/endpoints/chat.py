from typing import Optional

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user, require_widget_api_key
from app.models.chat import ChatLog, ChatMessage
from app.models.user import User as UserModel

from app.schemas.chat import (
    ChatHistoryResponse,
    ChatSendRequest,
    ChatSendResponse,
)

router = APIRouter()


class ChatCaller:
    """Exactly one of `user` / `widget_host` is set."""

    def __init__(self, user: Optional[UserModel] = None, widget_host: Optional[str] = None):
        self.user = user
        self.widget_host = widget_host

    @property
    def user_id(self) -> Optional[int]:
        return self.user.id if self.user else None


async def get_chat_caller(
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> ChatCaller:
    """
    X-API-Key (widget) takes precedence if present; otherwise falls back
    to Authorization: Bearer <jwt> so a dashboard user can also exercise
    chat under their own account.
    """
    if x_api_key is not None:
        # Delegate to the existing dependency logic rather than
        # reimplementing key resolution here.
        host = require_widget_api_key(x_api_key=x_api_key)
        return ChatCaller(widget_host=host)

    if not authorization or not authorization.lower().startswith("bearer "):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing credentials: provide X-API-Key or an Authorization bearer token",
        )

    token = authorization.split(" ", 1)[1].strip()
    user = get_current_user(token=token, db=db)
    return ChatCaller(user=user)


def _find_or_create_log(db: Session, caller: ChatCaller, session_id: str, requested_widget_source: Optional[str]) -> ChatLog:
    query = db.query(ChatLog).filter(ChatLog.session_id == session_id)
    if caller.user_id is not None:
        query = query.filter(ChatLog.user_id == caller.user_id)
    else:
        query = query.filter(ChatLog.user_id.is_(None), ChatLog.widget_source == caller.widget_host)

    log = query.first()
    if log is not None:
        return log

    log = ChatLog(
        user_id=caller.user_id,
        session_id=session_id,
        widget_source=caller.widget_host if caller.widget_host else requested_widget_source,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.post("/", response_model=ChatSendResponse)
def send_chat_message(
    payload: ChatSendRequest,
    db: Session = Depends(get_db),
    caller: ChatCaller = Depends(get_chat_caller),
):
    log = _find_or_create_log(db, caller, payload.session_id, payload.widget_source)

    sender_label = "hmis_widget" if caller.widget_host else "dashboard_user"
    user_msg = ChatMessage(
        chat_log_id=log.id,
        sender=sender_label,
        message=payload.message,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(user_msg)
    db.commit()

    # Placeholder reply (replace with real KB-search-based response — Sprint 3)
    reply_text = f"ACK: {payload.message}"

    bot_msg = ChatMessage(
        chat_log_id=log.id,
        sender="bot",
        message=reply_text,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(bot_msg)
    db.commit()

    return ChatSendResponse(session_id=payload.session_id, reply=reply_text)


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history(
    session_id: str,
    db: Session = Depends(get_db),
    caller: ChatCaller = Depends(get_chat_caller),
):
    query = db.query(ChatLog).filter(ChatLog.session_id == session_id)
    if caller.user_id is not None:
        query = query.filter(ChatLog.user_id == caller.user_id)
    else:
        query = query.filter(ChatLog.user_id.is_(None), ChatLog.widget_source == caller.widget_host)

    log = query.first()
    if log is None:
        return ChatHistoryResponse(session_id=session_id, messages=[])

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_log_id == log.id)
        .order_by(ChatMessage.timestamp.asc())
        .all()
    )
    return ChatHistoryResponse(session_id=session_id, messages=messages)