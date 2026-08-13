from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db, require_role_hierarchy
from app.models.user import Role, User as UserModel
from app.models.audit_log import AuditLog
from app.models.chat import ChatMessage
from app.schemas.audit_log import AuditLogResponse
from app.schemas.chat import AssistantLogResponse

router = APIRouter()

@router.get(
    "/audit-logs",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_role_hierarchy(Role.ADMIN))],
)
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).options(joinedload(AuditLog.actor)).order_by(AuditLog.timestamp.desc()).all()
    
    response = []
    for log in logs:
        response.append(
            AuditLogResponse(
                id=log.id,
                actor_id=log.actor_id,
                actor_email=log.actor.email,
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
    logs = db.query(ChatMessage).order_by(ChatMessage.timestamp.desc()).all()
    
    response = []
    for i in range(0, len(logs) - 1, 2):
        if logs[i].sender == 'user' and logs[i+1].sender == 'bot':
            response.append(
                AssistantLogResponse(
                    id=logs[i].id,
                    session_id=logs[i].chat_log.session_id,
                    message=logs[i].message,
                    reply=logs[i+1].message,
                    created_at=logs[i].timestamp,
                )
            )
    return response