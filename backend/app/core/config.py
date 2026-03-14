from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://localhost/asha_ai"
    DATABASE_URL_SYNC: str = "postgresql://localhost/asha_ai"
    
    # JWT Settings
    JWT_SECRET: str = "your-super-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Mistral AI
    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-large-latest"
    
    # Whisper STT Settings
    WHISPER_MODEL: str = "base"      # Options: tiny, base, small, medium, large
    WHISPER_DEVICE: str = "cpu"      # Options: cpu, cuda (if GPU available)
    WHISPER_PRELOAD: bool = True     # Pre-load model at startup for fast first request
    
    # App Settings
    DEBUG: bool = True
    SQL_ECHO: bool = False  # Set to True to see SQL queries
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance for dependency injection"""
    return Settings()
