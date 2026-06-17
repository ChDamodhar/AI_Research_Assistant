"""
Utils — FastAPI Dependency Injection
get_db, get_current_user, get_admin_user
"""

import logging
from typing import AsyncGenerator

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.sqlite import AsyncSessionLocal
from app.models.user import User
from app.services.auth_service import decode_access_token
from app.utils.exceptions import ForbiddenException, UnauthorizedException

logger = logging.getLogger("app")

security = HTTPBearer()


# ── DB Dependency ─────────────────────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async SQLAlchemy session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Auth Dependency ───────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validate Bearer JWT token and return the authenticated User.
    Raises UnauthorizedException on invalid/expired tokens.
    """
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub", 0))
    except (JWTError, ValueError, TypeError):
        raise UnauthorizedException("Invalid or expired authentication token.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("User account not found.")

    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Require admin role. Raises ForbiddenException if user is not admin.
    """
    if current_user.role != "admin":
        raise ForbiddenException("Administrator access required.")
    return current_user
