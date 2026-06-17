"""
API — Admin Routes
GET /api/admin/stats
"""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.dashboard_service import get_admin_stats
from app.utils.dependencies import get_admin_user, get_db

router = APIRouter(prefix="/api/admin", tags=["Admin"])
logger = logging.getLogger("app")


# ── GET /api/admin/stats ──────────────────────────────────────────────────────

@router.get(
    "/stats",
    summary="Get platform-wide admin statistics",
)
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
) -> dict:
    """
    Return platform-wide aggregate statistics.
    Requires admin role.

    Returns:
    - Total users
    - Total papers
    - Total reports
    - Total Q&A interactions
    - Papers by status breakdown
    - New users this week
    """
    stats = await get_admin_stats(db)
    return {"success": True, "data": stats}
