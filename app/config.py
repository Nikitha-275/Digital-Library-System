import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database Configuration (PRD Section 5)
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=3306)
    DB_NAME: str = Field(default="library_db")
    DB_USER: str = Field(default="library_user")
    DB_PASSWORD: str = Field(default="library_password")
    MYSQL_ROOT_PASSWORD: str = Field(default="root_password")

    # Application Configuration (PRD Section 5)
    APP_ENV: str = Field(default="development")
    UPLOAD_DIR: str = Field(default="./uploads")

    # Auth & Security (PRD Section 5)
    JWT_SECRET: str = Field(default="supersecret-demo-jwt-key-for-local-development")
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_EXPIRE_HOURS: int = Field(default=24)

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )


settings = Settings()

# Ensure upload directory exists locally
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
