from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base
from app.models.tag import article_tags

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Let's make it nullable in case author is deleted, or RESTRICT depending on preferences. Nullable with SET NULL is safer.
    status = Column(String, default="draft")  # draft, under_review, published, archived
    tags = Column(String, nullable=True)       # Varchar column for easy display/fallback
    views = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    category = relationship("Category", back_populates="articles")
    author = relationship("User")
    feedbacks = relationship("Feedback", back_populates="article", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="article", cascade="all, delete-orphan")
    tags_rel = relationship("Tag", secondary=article_tags, back_populates="articles")
