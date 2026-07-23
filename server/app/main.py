import os
from dotenv import load_dotenv

load_dotenv()


from fastapi import FastAPI

from app.api.v1.endpoints import auth, users, chat, articles, categories, tags
from app.core.cors import DualOriginCORSMiddleware, assert_no_origin_overlap

API_PREFIX = "/api/v1"

assert_no_origin_overlap()  # crash at boot, not later, if config is contradictory

app = FastAPI(
    title="HealthTech API",
    version="1.0.0",
    description="Production-ready HealthTech backend with JWT auth",
)

app.add_middleware(DualOriginCORSMiddleware)

app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(users.router, prefix=f"{API_PREFIX}/users", tags=["Users"])
app.include_router(chat.router, prefix=f"{API_PREFIX}/chat", tags=["Chat"])
app.include_router(articles.router, prefix=f"{API_PREFIX}/articles", tags=["Articles"])
app.include_router(categories.router, prefix=f"{API_PREFIX}/categories", tags=["Categories"])
app.include_router(tags.router, prefix=f"{API_PREFIX}/tags", tags=["Tags"])

@app.get("/", tags=["Root"])
def root():
    return {"message": "HealthTech API is running 🚀"}


@app.get("/health", tags=["Root"])
def health_check():
    return {"status": "ok"}