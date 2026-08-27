import os
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()


from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.endpoints import (
    auth,
    users,
    chat,
    articles,
    categories,
    tags,
    analytics,
    admin,
)
from app.core.cors import DualOriginCORSMiddleware, assert_no_origin_overlap
from app.core.limiter import limiter
from app.db.session import engine

API_PREFIX = "/api/v1"

assert_no_origin_overlap()  # crash at boot, not later, if config is contradictory

app = FastAPI(
    title="HealthTech API",
    version="1.0.0",
    description="Production-ready HealthTech backend with JWT auth",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(DualOriginCORSMiddleware)

app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(users.router, prefix=f"{API_PREFIX}/users", tags=["Users"])
app.include_router(chat.router, prefix=f"{API_PREFIX}/chat", tags=["Chat"])
app.include_router(articles.router, prefix=f"{API_PREFIX}/articles", tags=["Articles"])
app.include_router(
    analytics.router, prefix=f"{API_PREFIX}/admin/analytics", tags=["Analytics"]
)
app.include_router(admin.router, prefix=f"{API_PREFIX}/admin", tags=["Admin"])
app.include_router(
    categories.router, prefix=f"{API_PREFIX}/categories", tags=["Categories"]
)
app.include_router(tags.router, prefix=f"{API_PREFIX}/tags", tags=["Tags"])


@app.get("/", tags=["Root"])
def root():
    return {"message": "HealthTech API is running 🚀"}


@app.get("/health", tags=["Root"])
@app.get(f"{API_PREFIX}/health", tags=["Root"])
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "details": str(e),
        }