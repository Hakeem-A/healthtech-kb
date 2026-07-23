from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import oauth2_scheme
from app.core.security import get_role_rank, resolve_widget_host
from app.db.session import get_db
from app.models import User


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject:
            raise credentials_exception

        email = subject
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise credentials_exception

    # If the JWT doesn't have a role claim (old token), sync it from the DB
    # so that role-hierarchy checks still work without requiring re-login.
    if "role" not in payload and hasattr(user, "role"):
        payload["role"] = user.role

    return user


def require_role_hierarchy(min_role: str):
    """
    Dependency factory that enforces role hierarchy.

    Uses ROLE_RANK (viewer=1, editor=2, admin=3) to check that
    the current user's role rank is >= the minimum required rank.
    This means admin inherits editor and viewer permissions, and
    editor inherits viewer permissions.

    Usage:
        @router.get("/users", dependencies=[Depends(require_role_hierarchy("admin"))])
        @router.post("/articles", dependencies=[Depends(require_role_hierarchy("editor"))])
        @router.get("/articles", dependencies=[Depends(require_role_hierarchy("viewer"))])
    """

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        user_rank = get_role_rank(current_user.role)
        min_rank = get_role_rank(min_role)

        if user_rank < min_rank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Requires at least '{min_role}' role. "
                    f"Your role is '{current_user.role}'."
                ),
            )
        return current_user

    return dependency


def require_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Separate from role checks on purpose — being deactivated isn't a
    role question, and stacking both checks under one dependency would make
    a 403 ambiguous about which condition actually failed."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    return current_user


def require_widget_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> str:
    """
    Widget identity is a host-app name, never a User and never a role.
    A widget call is always treated as the most restricted access level by
    whatever the service layer does next — nothing the host page sends can
    change that.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header",
        )

    host = resolve_widget_host(x_api_key)
    if host is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return host
