from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models import User as UserModel
from app.schemas.user import UserCreate, UserResponse
from app.core.security import hash_password

router = APIRouter()

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = UserModel(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="staff",
        is_active=True,
        is_verified=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user