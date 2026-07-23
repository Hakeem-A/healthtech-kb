import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, require_role_hierarchy
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter()


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def unique_slug(db: Session, base_slug: str, exclude_id: Optional[int] = None) -> str:
    slug = base_slug
    counter = 2
    query = db.query(Category).filter(Category.slug == slug)
    if exclude_id:
        query = query.filter(Category.id != exclude_id)
    while query.first() is not None:
        slug = f"{base_slug}-{counter}"
        counter += 1
        query = db.query(Category).filter(Category.slug == slug)
        if exclude_id:
            query = query.filter(Category.id != exclude_id)
    return slug


@router.post("/", response_model=CategoryResponse, status_code=http_status.HTTP_201_CREATED,
             dependencies=[Depends(require_role_hierarchy("editor"))])
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    if payload.parent_id is not None:
        parent = db.query(Category).filter(Category.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")

    slug = unique_slug(db, slugify(payload.name))
    category = Category(
        name=payload.name,
        slug=slug,
        description=payload.description,
        icon=payload.icon,
        parent_id=payload.parent_id,
        sort_order=payload.sort_order,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    # Readable by anyone (viewer included) — needed to browse/filter articles by category.
    return db.query(Category).order_by(Category.sort_order, Category.name).all()


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/{category_id}", response_model=CategoryResponse,
            dependencies=[Depends(require_role_hierarchy("editor"))])
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if payload.parent_id is not None:
        if payload.parent_id == category_id:
            raise HTTPException(status_code=400, detail="A category cannot be its own parent")
        parent = db.query(Category).filter(Category.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")

    if payload.name is not None:
        category.name = payload.name
        category.slug = unique_slug(db, slugify(payload.name), exclude_id=category.id)
    if payload.description is not None:
        category.description = payload.description
    if payload.icon is not None:
        category.icon = payload.icon
    if payload.parent_id is not None:
        category.parent_id = payload.parent_id
    if payload.sort_order is not None:
        category.sort_order = payload.sort_order

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=http_status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_role_hierarchy("admin"))])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    try:
        db.delete(category)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Cannot delete category: it still has articles or subcategories referencing it",
        )