"""
Schemas — Auth Pydantic Models (Register, Login, Token, Profile)
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Request Schemas ───────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["Bharath Kumar"],
        alias="name",
    )
    email: EmailStr = Field(..., examples=["bharath@gmail.com"])
    password: str = Field(..., min_length=6, max_length=128, examples=["secure123"])

    model_config = {"populate_by_name": True}

    @field_validator("name", mode="before")
    @classmethod
    def accept_full_name_alias(cls, v: str) -> str:
        return v

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be blank.")
        return v.strip()

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Allow full_name as a fallback alias at dict level
        if isinstance(obj, dict) and "full_name" in obj and "name" not in obj:
            obj = {**obj, "name": obj.pop("full_name")}
        return super().model_validate(obj, *args, **kwargs)


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["bharath@gmail.com"])
    password: str = Field(..., examples=["secure123"])


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., examples=["old_password"])
    new_password: str = Field(..., min_length=6, max_length=128, examples=["new_secure_password"])


# ── Response Schemas ──────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RegisterResponse(BaseModel):
    success: bool = True
    message: str
    user: UserResponse


class LoginResponse(BaseModel):
    success: bool = True
    message: str = "Login successful."
    token: TokenResponse
    user: UserResponse
