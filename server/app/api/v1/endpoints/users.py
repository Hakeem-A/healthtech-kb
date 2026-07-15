from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import hash_password
from app.db.session import get_db
from app.models import User as UserModel
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter()


# ✅ CREATE USER (Public signup OR admin-controlled)
@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = UserModel(
        full_name=user.full_name,
        email=str(user.email),
        hashed_password=hash_password(user.password),
        role="staff",
        is_active=True,
        is_verified=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ✅ GET ALL USERS (Admin only)
@router.get("/", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if str(current_user.role) != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    return db.query(UserModel).all()


# ✅ GET CURRENT USER
@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserModel = Depends(get_current_user)):
    return current_user


# ✅ UPDATE USER
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_admin = str(getattr(current_user, "role", "")) == "admin"
    is_owner = getattr(current_user, "id", None) == user.id
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    if user_update.full_name is not None:
        setattr(user, "full_name", user_update.full_name)

    if user_update.email is not None:
        setattr(user, "email", str(user_update.email))

    if user_update.password is not None:
        setattr(user, "hashed_password", hash_password(user_update.password))

    db.commit()
    db.refresh(user)
    return user


# ✅ DELETE USER
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(current_user.role) != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(user)
    db.commit()
    return None