from contextlib import suppress
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, Request, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_widget_api_key
from app.core.limiter import limiter
from app.models.chat import ChatLog, ChatMessage
from app.models.user import User as UserModel
from app.services.kb_search import compose_reply, search_articles, extract_snippet, extract_keywords
from app.services.llm import generate_reply


from app.schemas.chat import (
    ChatHistoryResponse,
    ChatSendRequest,
    ChatSendResponse,
)

router = APIRouter()


def _build_reply(db: Session, message: str) -> str:
    with suppress(Exception):
        keywords = extract_keywords(message)
        results = search_articles(db, message, limit=3)

        context_parts = []
        for article, _ in results:
            snippet = extract_snippet(str(article.content), keywords)
            context_parts.append(f"Title: {article.title}\nSnippet: {snippet}")

        context = "\n\n".join(context_parts)
        llm_reply = generate_reply(message, context=context)
        if llm_reply:
            return llm_reply

    return compose_reply(db, message)


class FeedbackRequest(BaseModel):
    helpful: bool


class ChatCaller:
    def __init__(
        self,
        user: Optional[UserModel] = None,
        widget_host: Optional[str] = None,
        is_guest: bool = False,
    ):
        self.user = user
        self.widget_host = widget_host
        self.is_guest = is_guest

    @property
    def user_id(self) -> Optional[int]:
        return self.user.id if self.user else None


async def get_chat_caller(
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> ChatCaller:

    if x_api_key is not None:
        host = require_widget_api_key(x_api_key=x_api_key)
        return ChatCaller(widget_host=host)

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        user = get_current_user(token=token, db=db)
        return ChatCaller(user=user)

    return ChatCaller(is_guest=True)


def _find_or_create_log(
    db: Session,
    caller: ChatCaller,
    session_id: str,
    requested_widget_source: Optional[str],
) -> Optional[ChatLog]:

    if caller.is_guest:
        return None

    query = db.query(ChatLog).filter(ChatLog.session_id == session_id)

    if caller.user_id is not None:
        query = query.filter(ChatLog.user_id == caller.user_id)
    else:
        query = query.filter(
            ChatLog.user_id.is_(None),
            ChatLog.widget_source == caller.widget_host,
        )

    log = query.first()
    if log:
        return log

    log = ChatLog(
        user_id=caller.user_id,
        session_id=session_id,
        widget_source=(caller.widget_host or requested_widget_source),
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return log


@router.post("/", response_model=ChatSendResponse)
@limiter.limit("20/minute")
def send_chat_message(
    request: Request,
    payload: ChatSendRequest,
    db: Session = Depends(get_db),
    caller: ChatCaller = Depends(get_chat_caller),
):
    log = _find_or_create_log(db, caller, payload.session_id, payload.widget_source)

    reply_text = _build_reply(db, payload.message)

    if log is not None:
        sender_label = "hmis_widget" if caller.widget_host else "dashboard_user"

        user_msg = ChatMessage(
            chat_log_id=log.id,
            sender=sender_label,
            message=payload.message,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(user_msg)
        db.commit()

        bot_msg = ChatMessage(
            chat_log_id=log.id,
            sender="bot",
            message=reply_text,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(bot_msg)
        db.commit()
        db.refresh(bot_msg)

        message_id = bot_msg.id
    else:
        message_id = None

    return ChatSendResponse(
        session_id=payload.session_id,
        reply=reply_text,
        message_id=message_id,
    )


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history(
    session_id: str,
    db: Session = Depends(get_db),
    caller: ChatCaller = Depends(get_chat_caller),
):
    if caller.is_guest:
        return ChatHistoryResponse(session_id=session_id, messages=[])

    query = db.query(ChatLog).filter(ChatLog.session_id == session_id)

    if caller.user_id is not None:
        query = query.filter(ChatLog.user_id == caller.user_id)
    else:
        query = query.filter(
            ChatLog.user_id.is_(None),
            ChatLog.widget_source == caller.widget_host,
        )

    log = query.first()
    if not log:
        return ChatHistoryResponse(session_id=session_id, messages=[])

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_log_id == log.id)
        .order_by(ChatMessage.timestamp.asc())
        .all()
    )

    return ChatHistoryResponse(session_id=session_id, messages=messages)


@router.put("/messages/{message_id}/feedback")
def give_feedback(
    message_id: int,
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
    caller: ChatCaller = Depends(get_chat_caller),
):
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if caller.user_id and message.chat_log.user_id != caller.user_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    message.helpful = payload.helpful
    db.commit()

    return {"status": "ok"}


@router.post("/chat")
def chat(payload: dict):
    user_message = payload.get("message")
    context = payload.get("context", "")

    reply = generate_reply(user_message, context)

    return {"reply": reply}
