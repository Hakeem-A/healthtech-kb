from datetime import timezone, datetime 
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.db.session import engine, Base, get_db
from app.models import User as UserModel, Category, Article, Tag, Feedback, Media, SearchLog
from pydantic import BaseModel, EmailStr
from app.core.security import hash_password
from app.routes.auth import router as auth_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    full_name:str
    email:EmailStr
    password:str


class UserResponse(BaseModel):
    id:int
    full_name:str
    email:EmailStr
    role:str
    is_active:bool
    is_verified:bool
    total_queries:int
    created_at:datetime
    updated_at:datetime

    class Config:
        from_attributes = True


@app.get("/test-db")
def test_db():
    try:
        connection = engine.connect()
        connection.close()
        return {"message": "DB connected successfully"}
    except Exception as e:
        return {"error": str(e)}    

@app.post("/users", response_model=UserResponse)
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
        total_queries=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    
    return new_user

@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(UserModel).all()
    return users

 
@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db:Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404,detail="User not found")

    return user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}
    



@app.get("/")
def read_root():
    return {
        "message": "HealthTech API is running",
        "version": "1.0.0"            
    }

@app.get("/desk")
def desk():
    return {"message": "Welcome to desk"}    
