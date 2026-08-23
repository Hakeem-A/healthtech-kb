from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db, require_role_hierarchy
from app.models.user import Role
from app.models.audit_log import AuditLog
from app.models.chat import ChatLog, ChatMessage
from app.schemas.audit_log import AuditLogResponse
from app.schemas.chat import AssistantLogResponse

router = APIRouter()


@router.get(
    "/audit-logs",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_role_hierarchy(Role.ADMIN))],
)
def get_audit_logs(db: Session = Depends(get_db)):
    logs = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.actor))
        .order_by(AuditLog.timestamp.desc())
        .all()
    )

    response = []
    for log in logs:
        actor_email = log.actor.email if log.actor else "System"
        response.append(
            AuditLogResponse(
                id=log.id,
                actor_id=log.actor_id,
                actor_email=actor_email,
                action=log.action,
                target_type=log.target_type,
                target_id=log.target_id,
                timestamp=log.timestamp,
            )
        )
    return response


@router.get(
    "/assistant-logs",
    response_model=List[AssistantLogResponse],
    dependencies=[Depends(require_role_hierarchy(Role.ADMIN))],
)
def get_assistant_logs(db: Session = Depends(get_db)):
    chat_logs = (
        db.query(ChatLog)
        .options(joinedload(ChatLog.messages), joinedload(ChatLog.user))
        .order_by(ChatLog.created_at.desc())
        .all()
    )

    response = []
    for log in chat_logs:
        user_email = log.user.email if log.user else (log.widget_source or "Guest")
        # messages sorted by timestamp
        msgs = sorted(log.messages, key=lambda m: m.timestamp)
        i = 0
        while i < len(msgs):
            m = msgs[i]
            if m.sender != "bot":
                # Look for bot reply immediately after
                bot_reply = None
                if i + 1 < len(msgs) and msgs[i + 1].sender == "bot":
                    bot_reply = msgs[i + 1]
                    i += 2
                else:
                    i += 1

                response.append(
                    AssistantLogResponse(
                        id=m.id,
                        session_id=log.session_id,
                        user_id=log.user_id,
                        user_email=user_email,
                        widget_source=log.widget_source,
                        message=m.message,
                        reply=bot_reply.message if bot_reply else "(No response)",
                        status=bot_reply.status if bot_reply else "no_response",
                        confidence=bot_reply.confidence if bot_reply else "none",
                        helpful=bot_reply.helpful if bot_reply and bot_reply.helpful is not None else m.helpful,
                        response_time_ms=bot_reply.response_time_ms if bot_reply else None,
                        created_at=m.timestamp,
                    )
                )
            else:
                # Standalone bot message (rare)
                response.append(
                    AssistantLogResponse(
                        id=m.id,
                        session_id=log.session_id,
                        user_id=log.user_id,
                        user_email=user_email,
                        widget_source=log.widget_source,
                        message="(Initial Prompt)",
                        reply=m.message,
                        status=m.status,
                        confidence=m.confidence,
                        helpful=m.helpful,
                        response_time_ms=m.response_time_ms,
                        created_at=m.timestamp,
                    )
                )
                i += 1

    # Order newest interactions first
    response.sort(key=lambda item: item.created_at, reverse=True)
    return response