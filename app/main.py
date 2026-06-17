"""
AI Research Assistant — FastAPI Application Entry Point

Features:
- Modular router registration
- Lifespan events (DB init, ChromaDB init, directory creation)
- CORS middleware
- Request logging middleware
- Global exception handlers
- OpenAPI / Swagger documentation
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, papers, chat, reports, admin
from app.config import settings
from app.db.chromadb import init_chromadb
from app.db.sqlite import init_db
from app.utils.exceptions import register_exception_handlers
from app.utils.helpers import ensure_directories
from app.utils.logger import logger


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown events."""
    # ── Startup ──
    logger.info("=" * 60)
    logger.info(f"  {settings.app_name} v{settings.app_version} starting up...")
    logger.info("=" * 60)

    # Create required directories
    ensure_directories()
    logger.info("Storage directories verified.")

    # Initialize SQLite database (create tables)
    await init_db()
    logger.info("SQLite database initialized.")

    # Initialize ChromaDB
    init_chromadb()
    logger.info("ChromaDB initialized.")

    logger.info("Application startup complete. Ready to serve requests.")
    logger.info(f"Swagger UI: http://{settings.host}:{settings.port}/docs")
    logger.info(f"ReDoc:      http://{settings.host}:{settings.port}/redoc")

    yield

    # ── Shutdown ──
    logger.info("Application shutting down...")


# ── App Factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="""
## AI Research Assistant API

A production-ready backend for analyzing research papers through:

- 📄 **PDF Upload & Processing** — Extract text, metadata, and citations
- 🤖 **AI Summarization** — Structured summaries via Gemini
- 💬 **RAG Question Answering** — Ask questions about any paper
- 📊 **Report Generation** — Export PDF/DOCX research reports
- 🔍 **Citation Extraction** — Automatically extract references

### Authentication
All endpoints (except `/api/auth/register` and `/api/auth/login`) require a **Bearer JWT token**.

### Workflow
1. Register → Login → Get JWT token
2. Upload PDF → Wait for processing
3. Generate Summary → Ask Questions → Generate Report
        """,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Restrict in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request Logging Middleware ─────────────────────────────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.info(
            f"{request.method} {request.url.path} "
            f"→ {response.status_code} [{duration_ms:.1f}ms]"
        )
        return response

    # ── Exception Handlers ────────────────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(auth.router)
    app.include_router(papers.router)
    app.include_router(chat.router)
    app.include_router(reports.router)
    app.include_router(admin.router)

    # ── Health Check ──────────────────────────────────────────────────────────
    @app.get(
        "/health",
        tags=["Health"],
        summary="Health check endpoint",
    )
    async def health_check() -> dict:
        """Returns API health status."""
        return {
            "status": "healthy",
            "app": settings.app_name,
            "version": settings.app_version,
        }

    # ── Serve Frontend SPA (if available) ─────────────────────────────────────
    import os
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    # Detect frontend build directories
    possible_dirs = [
        # Local development layouts
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../AI_Research_Assistant-frontend/dist")),
        # Docker container layouts (where backend source is copied directly to /app)
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../AI_Research_Assistant-frontend/dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../static")),
    ]
    
    frontend_dist = None
    for p in possible_dirs:
        if os.path.exists(p):
            frontend_dist = p
            break

    if frontend_dist:
        logger.info(f"Frontend static files detected at: {frontend_dist}")
        # Mount static assets if they exist
        if os.path.exists(os.path.join(frontend_dist, "assets")):
            app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
        
        # Catch-all route to serve index.html for SPA routing
        @app.get("/{catchall:path}", include_in_schema=False)
        async def serve_spa(catchall: str):
            # Let API routes and docs be handled natively by FastAPI
            if catchall.startswith("api/") or catchall.startswith("docs") or catchall.startswith("redoc") or catchall == "openapi.json" or catchall == "health":
                return JSONResponse(status_code=404, content={"message": "Not Found"})
            return FileResponse(os.path.join(frontend_dist, "index.html"))
    else:
        logger.warning("Frontend static build directory not found. Serving welcome API JSON root.")
        @app.get("/", tags=["Health"], include_in_schema=False)
        async def root() -> dict:
            return {
                "message": f"Welcome to {settings.app_name} API",
                "version": settings.app_version,
                "docs": "/docs",
                "health": "/health",
            }

    return app


# ── Application Instance ──────────────────────────────────────────────────────
app = create_app()


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
