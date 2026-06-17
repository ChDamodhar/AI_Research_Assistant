"""
Schemas — Common / Shared Pydantic Models
"""

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """Generic success response wrapper."""
    success: bool = True
    message: str = "OK"
    data: Optional[T] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated list response wrapper."""
    success: bool = True
    total: int
    page: int
    page_size: int
    total_pages: int
    data: list[T]


class ErrorResponse(BaseModel):
    success: bool = False
    error_code: str
    detail: str


class MessageResponse(BaseModel):
    success: bool = True
    message: str
