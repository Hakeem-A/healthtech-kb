from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role_hierarchy
from app.core.security import hash_password
from app.db.session import get_db
from app.models import User as UserModel
from app.models import AuditLog
from app.models.user import Role
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter()


# CREATE USER (Admin only — creates staff accounts)
@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role_hierarchy(Role.ADMIN))],
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    existing_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    assigned_role = user.role if user.role is not None else Role.VIEWER

    new_user = UserModel(
        full_name=user.full_name,
        email=str(user.email),
        hashed_password=hash_password(user.password),
        role=assigned_role,
        is_active=True,
        is_verified=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit_entry = AuditLog(
        actor_id=current_user.id,
        action=f"create_user: {new_user.email} (role={new_user.role})",
        target_type="user",
        target_id=new_user.id,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(audit_entry)
    db.commit()

    return new_user


# GET ALL USERS (Admin only)
@router.get(
    "/",
    response_model=List[UserResponse],
    dependencies=[Depends(require_role_hierarchy(Role.ADMIN))],
)
def get_users(
    db: Session = Depends(get_db),
):
    return db.query(UserModel).all()


# GET CURRENT USER
@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserModel = Depends(get_current_user)):
    return current_user


# UPDATE USER
# Self-service (non-admin editing their own account): password only.
# Admin editing any account: full_name, password, role (and email).
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

    is_admin = getattr(current_user, "role", None) == Role.ADMIN
    is_owner = getattr(current_user, "id", None) == user.id

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Self-service (owner, not admin) may only change their own password.
    if is_owner and not is_admin:
        if user_update.full_name is not None:
            raise HTTPException(
                status_code=403,
                detail="Only admins can change full name",
            )
        if user_update.email is not None:
            raise HTTPException(
                status_code=403,
                detail="Only admins can change email",
            )
        if user_update.role is not None:
            raise HTTPException(
                status_code=403,
                detail="Only admins can change user roles",
            )

    # Track role changes for audit logging
    role_changed = False
    old_role = None

    if user_update.full_name is not None:
        # Reachable only for admins per the guard above (or an admin
        # editing themselves, which is fine).
        setattr(user, "full_name", user_update.full_name)

    if user_update.email is not None:
        setattr(user, "email", str(user_update.email))

    if user_update.password is not None:
        setattr(user, "hashed_password", hash_password(user_update.password))

    if user_update.role is not None:
        old_role = user.role
        setattr(user, "role", user_update.role)
        role_changed = True

    db.commit()
    db.refresh(user)

    # Audit log for role changes
    if role_changed and is_admin:
        audit_entry = AuditLog(
            actor_id=current_user.id,
            action=f"update_role: {old_role} → {user.role}",
            target_type="user",
            target_id=user.id,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(audit_entry)
        db.commit()

    return user


# DELETE USER (Admin only)
@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role_hierarchy(Role.ADMIN))],
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    audit_entry = AuditLog(
        actor_id=current_user.id,
        action="delete_user",
        target_type="user",
        target_id=user.id,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(audit_entry)

    db.delete(user)
    db.commit()
    return None