from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_email: Optional[str] = "System"
    action: str
    target_type: str
    target_id: Optional[int] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)