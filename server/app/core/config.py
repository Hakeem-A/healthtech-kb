from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "super-secret-key-change-this"
    ALGORITHM: str = "HS256"


settings = Settings()