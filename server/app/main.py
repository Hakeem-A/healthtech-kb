from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from app.db.session import engine

app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

users_db = []


class User(BaseModel):
    id: int
    name: str
    age: int


@app.get("/test-db")
def test_db():
    try:
        connection = engine.connect()
        connection.close()
        return {"message": "DB connected successfully"}
    except Exception as e:
        return {"error": str(e)}    

@app.get("/users", response_model=List[User])
def get_users():
    return users_db


@app.post("/users")
def create_user(user: User):
    for u in users_db:
        if u.id == user.id:
            return {"error": "User with this ID already exists"}

    users_db.append(user)
    return {
        "message": "User created successfully",
        "user": user
    }
 
@app.get("/users/{user_id}")
def get_user(user_id: int):
    for user in users_db:
        if user.id == user_id:
            return user
    raise HTTPException(status_code=404,detail="User not found")

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    for user in users_db:
        if user.id == user_id:
            users_db.remove(user)
            return {
                "message": "User deleted successfully"
            }
    raise HTTPException(status_code=404,detail="User not found")
    



@app.get("/")
def read_root():
    return {
        "message": "HealthTech API is running",
        "version": "1.0.0"            
    }

@app.get("/desk")
def desk():
    return {"message": "Welcome to desk"}    
