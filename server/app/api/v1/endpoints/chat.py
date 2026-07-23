from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.chat import ChatLog, ChatMessage
from app.models.user import User as UserModel

from app.schemas.chat import (
    ChatHistoryResponse,
    ChatSendRequest,
    ChatSendResponse,
)

router = APIRouter()


@router.post("/", response_model=ChatSendResponse)
def send_chat_message(
    payload: ChatSendRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    # Persist user message
    log = (
        db.query(ChatLog)
        .filter(ChatLog.user_id == current_user.id, ChatLog.session_id == payload.session_id)
        .first()
    )
    if log is None:
        log = ChatLog(
            user_id=current_user.id,
            session_id=payload.session_id,
            widget_source=payload.widget_source,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

    user_msg = ChatMessage(
        chat_log_id=log.id,
        sender="hmis_widget",
        message=payload.message,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(user_msg)
    db.commit()

    # Placeholder reply (replace with real HMIS chatbot integration)
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
    current_user: UserModel = Depends(get_current_user),
):
    log = (
        db.query(ChatLog)
        .filter(ChatLog.user_id == current_user.id, ChatLog.session_id == session_id)
        .first()
    )
    if log is None:
        return ChatHistoryResponse(session_id=session_id, messages=[])

    messages = db.query(ChatMessage).filter(ChatMessage.chat_log_id == log.id).order_by(ChatMessage.timestamp.asc()).all()

    return ChatHistoryResponse(session_id=session_id, messages=messages)


