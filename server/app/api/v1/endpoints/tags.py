import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, require_role_hierarchy
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagResponse

router = APIRouter()


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


@router.post("/", response_model=TagResponse, status_code=http_status.HTTP_201_CREATED,
             dependencies=[Depends(require_role_hierarchy("editor"))])
def create_tag(payload: TagCreate, db: Session = Depends(get_db)):
    existing = db.query(Tag).filter(Tag.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Tag with this name already exists")

    slug = slugify(payload.name)
    tag = Tag(name=payload.name, slug=slug)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.get("/", response_model=List[TagResponse])
def list_tags(db: Session = Depends(get_db)):
    return db.query(Tag).order_by(Tag.name).all()


@router.delete("/{tag_id}", status_code=http_status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_role_hierarchy("admin"))])
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)  # article_tags rows cascade via ondelete="CASCADE" on that FK
    db.commit()