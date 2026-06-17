"""
API — Authentication Routes
POST /api/auth/register
POST /api/auth/login
GET  /api/profile
PUT  /api/profile
PUT  /api/change-password
"""

import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.auth_service import (
    create_access_token,
    get_token_expiry_seconds,
    hash_password,
    verify_password,
)
from app.utils.dependencies import get_current_user, get_db
from app.utils.exceptions import BadRequestException, ConflictException, UnauthorizedException

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger("app")


# ── POST /api/auth/register ───────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    """Register a new user account."""
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise ConflictException(f"An account with email '{payload.email}' already exists.")

    hashed = hash_password(payload.password)
    user = User(name=payload.name, email=payload.email, password_hash=hashed)
    db.add(user)
    await db.flush()
    await db.refresh(user)

    logger.info(f"New user registered: {user.email} (id={user.id})")
    return RegisterResponse(
        message="Registration successful. You can now log in.",
        user=UserResponse.model_validate(user),
    )


# ── POST /api/auth/login ──────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login and receive JWT token",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """Authenticate user and return a JWT access token."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password.")

    token = create_access_token(subject=user.id, role=user.role)
    logger.info(f"User logged in: {user.email}")

    return LoginResponse(
        token=TokenResponse(
            access_token=token,
            expires_in=get_token_expiry_seconds(),
        ),
        user=UserResponse.model_validate(user),
    )


# ── GET /api/profile ──────────────────────────────────────────────────────────

@router.get(
    "/profile",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


# ── PUT /api/profile ──────────────────────────────────────────────────────────

@router.put(
    "/profile",
    response_model=UserResponse,
    summary="Update user profile",
)
async def update_profile(
    payload: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Update the authenticated user's display name."""
    if payload.name:
        current_user.name = payload.name.strip()
        await db.flush()
        await db.refresh(current_user)
        logger.info(f"Profile updated for user id={current_user.id}")
    return UserResponse.model_validate(current_user)


# ── PUT /api/change-password ──────────────────────────────────────────────────

@router.put(
    "/change-password",
    summary="Change user password",
)
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Change the authenticated user's password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise BadRequestException("Current password is incorrect.")

    current_user.password_hash = hash_password(payload.new_password)
    await db.flush()
    logger.info(f"Password changed for user id={current_user.id}")
    return {"success": True, "message": "Password changed successfully."}
