import os
from dotenv import load_dotenv

load_dotenv()
print("DATABASE_URL seen:", os.getenv("DATABASE_URL"))

from fastapi import FastAPI
from sqlalchemy import text

from app.api.v1.endpoints import auth, users, chat
from app.core.cors import DualOriginCORSMiddleware, assert_no_origin_overlap
from app.db.session import engine, Base

API_PREFIX = "/api/v1"



assert_no_origin_overlap()  # crash at boot, not later, if config is contradictory

app = FastAPI(
    title="HealthTech API",
    version="1.0.0",
    description="Production-ready HealthTech backend with JWT auth",
)


@app.on_event("startup")
def on_startup():
    # ⚠️ Dev only — replace with Alembic in production
    Base.metadata.create_all(bind=engine)

    # TODO: Replace with Alembic migration in production
    # Migrate any existing "staff" role rows to "viewer" for RBAC
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        result = db.execute(
            text("UPDATE users SET role = 'viewer' WHERE role = 'staff'")
        )
        if result.rowcount:
            print(f"Migrated {result.rowcount} user(s) from role 'staff' to 'viewer'")
        db.commit()
    finally:
        db.close()



app.add_middleware(DualOriginCORSMiddleware)


app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(users.router, prefix=f"{API_PREFIX}/users", tags=["Users"])
app.include_router(chat.router, prefix=f"{API_PREFIX}/chat", tags=["Chat"])


@app.get("/", tags=["Root"])
def root():
    return {"message": "HealthTech API is running 🚀"}