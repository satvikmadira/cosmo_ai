from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Cosmo AI"
    ENV: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "change-me-in-production-please"
    ENCRYPTION_KEY: str = "changemechangemechangemechangeme"  # 32 bytes, for Fernet-derived key
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://cosmo:cosmo@localhost:5432/cosmo_ai"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Vector store (Chroma - embedded, zero external infra needed for demo)
    CHROMA_PERSIST_DIR: str = "./chroma_data"

    # AI provider defaults
    DEFAULT_PROVIDER: str = "anthropic"
    DEFAULT_MODEL: str = "claude-sonnet-4-6"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_DEFAULT_MODEL: str = "llama3.1"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Uploads
    MAX_UPLOAD_MB: int = 25
    UPLOAD_DIR: str = "./uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
