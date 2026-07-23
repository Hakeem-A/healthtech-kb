from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Role hierarchy: higher number = more privileges
ROLE_RANK = {
    "viewer": 1,
    "editor": 2,
    "admin": 3,
}


def get_role_rank(role: str) -> int:
    """Return the rank of a role. Unknown roles default to 0 (no access)."""
    return ROLE_RANK.get(role, 0)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=60)
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return encoded_jwt

def resolve_widget_host(api_key: str) -> str | None:
    """
    Returns the host-app name (e.g. "hmis_mock") for a valid widget API key,
    or None if unknown. Requires settings.WIDGET_API_KEYS -- see the
    question below about your actual core/config.py before wiring this in.
    """
    for host, key in settings.widget_api_keys_map.items():
        if key == api_key:
            return host
    return None
