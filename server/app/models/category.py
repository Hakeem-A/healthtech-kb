from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)

    # Relationships
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    articles = relationship("Article", back_populates="category")
