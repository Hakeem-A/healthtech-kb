import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-this")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")


settings = Settings()