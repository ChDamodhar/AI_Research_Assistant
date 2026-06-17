"""
DB — SQLAlchemy Async Engine and Session Factory for SQLite
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# ── Engine ────────────────────────────────────────────────────────────────────

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ── Base Model ────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ── Init DB ───────────────────────────────────────────────────────────────────

async def init_db() -> None:
    """Create all tables defined in ORM models."""
    # Import all models so SQLAlchemy registers them before create_all
    from app.models import user, paper, citation, summary, chat, report  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ── Session Dependency ────────────────────────────────────────────────────────

async def get_db() -> AsyncSession:  # type: ignore[override]
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
