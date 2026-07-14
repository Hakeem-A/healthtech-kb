from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer

from app.api.v1.endpoints import auth, users
from app.db.session import engine, Base


API_PREFIX = "/api/v1"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{API_PREFIX}/auth/login")


app = FastAPI(
    title="HealthTech API",
    version="1.0.0",
    description="Production-ready HealthTech backend with JWT auth",
)


@app.on_event("startup")
def on_startup():
    # ⚠️ Dev only — replace with Alembic in production
    Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(users.router, prefix=f"{API_PREFIX}/users", tags=["Users"])


@app.get("/", tags=["Root"])
def root():
    return {"message": "HealthTech API is running 🚀"}