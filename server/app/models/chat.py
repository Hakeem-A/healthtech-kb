from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.session import Base


class ChatLog(Base):
    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String, index=True, nullable=False)

    # Optional widget metadata
    widget_source = Column(String, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    messages = relationship(
        "ChatMessage",
        back_populates="chat_log",
        cascade="all, delete-orphan",
        order_by="ChatMessage.timestamp",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_log_id = Column(Integer, ForeignKey("chat_logs.id", ondelete="CASCADE"), nullable=False)

    sender = Column(String, nullable=False)  # e.g., "user" | "hmis_widget" | "bot"
    message = Column(Text, nullable=False)

    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    chat_log = relationship("ChatLog", back_populates="messages")

