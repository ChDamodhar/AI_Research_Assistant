"""
AI Research Assistant — Centralized Configuration
Uses pydantic-settings to load from environment variables / .env file.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    app_name: str = "AI Research Assistant"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    # ── Security ─────────────────────────────────────────────────────────────
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # ── Gemini ────────────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # ── SQLite ────────────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./research_assistant.db"

    # ── ChromaDB ─────────────────────────────────────────────────────────────
    chroma_persist_dir: str = "./chroma_db"
    chroma_collection_name: str = "research_papers"

    # ── Embeddings ────────────────────────────────────────────────────────────
    embedding_model: str = "BAAI/bge-small-en-v1.5"

    # ── File Storage ─────────────────────────────────────────────────────────
    upload_dir: str = "./uploads"
    reports_dir: str = "./reports"
    max_file_size_mb: int = 50

    # ── Chunking ─────────────────────────────────────────────────────────────
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # ── RAG ──────────────────────────────────────────────────────────────────
    rag_top_k: int = 5

    # ── Logging ──────────────────────────────────────────────────────────────
    log_level: str = "INFO"
    log_file: str = "./logs/app.log"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
