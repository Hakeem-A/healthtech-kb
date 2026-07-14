from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import auth
from app.api.v1.endpoints import users  # (you will move users here)

from app.db.session import engine, Base

app = FastAPI(title="HealthTech API", version="1.0.0")

# Create tables
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "HealthTech API is running"}