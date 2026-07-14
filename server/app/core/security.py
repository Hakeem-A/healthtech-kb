from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
   
    hashed = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(hashed)

def verify_password(plain_password, hashed_password):
    hashed = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(hashed, hashed_password)