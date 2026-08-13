from datetime import datetime
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    actor_id: int
    actor_email: str
    action: str
    target_type: str
    target_id: int
    timestamp: datetime

    class Config:
        from_attributes = True