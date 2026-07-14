from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, nullable=False)
    results_count = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Nullable for anonymous/non-logged queries
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User")
