"""
Utils — Custom Exception Classes and FastAPI Exception Handlers
"""

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


# ── Custom Exception Classes ──────────────────────────────────────────────────

class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = "APP_ERROR",
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        super().__init__(detail)


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found.",
            error_code="NOT_FOUND",
        )


class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad request.") -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BAD_REQUEST",
        )


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Authentication required.") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Access denied.") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="FORBIDDEN",
        )


class ConflictException(AppException):
    def __init__(self, detail: str = "Conflict.") -> None:
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="CONFLICT",
        )


class ServiceException(AppException):
    def __init__(self, detail: str = "Internal service error.") -> None:
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="SERVICE_ERROR",
        )


# ── Error Response Builder ────────────────────────────────────────────────────

def error_response(
    status_code: int,
    detail: str,
    error_code: str = "ERROR",
) -> dict[str, Any]:
    return {
        "success": False,
        "error_code": error_code,
        "detail": detail,
    }


# ── Exception Handlers ────────────────────────────────────────────────────────

def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(exc.status_code, exc.detail, exc.error_code),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        import logging
        logging.getLogger("app").error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                500,
                "An unexpected error occurred. Please try again later.",
                "INTERNAL_SERVER_ERROR",
            ),
        )
