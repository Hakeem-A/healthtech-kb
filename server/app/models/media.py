from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=True) # Can be null if uploaded but not yet attached to an article
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)
    type = Column(String, nullable=False)  # image, pdf, video, etc.
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    article = relationship("Article", back_populates="media")
    uploader = relationship("User")
