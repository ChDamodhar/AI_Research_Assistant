"""
API — Research Paper Routes
POST /api/papers/upload
GET  /api/papers
GET  /api/papers/{paper_id}
GET  /api/papers/{paper_id}/citations
GET  /api/papers/{paper_id}/summary
POST /api/papers/{paper_id}/report
"""

import asyncio
import logging
import math

from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.citation import Citation
from app.models.user import User
from app.schemas.paper import (
    CitationResponse,
    CitationsListResponse,
    PaperDetailResponse,
    PaperResponse,
    PaperUploadResponse,
    PapersListResponse,
    SummaryAPIResponse,
    SummaryResponse,
)
from app.schemas.report import GenerateReportResponse, ReportRequest
from app.services import paper_service, summary_service, report_service
from app.utils.dependencies import get_current_user, get_db
from app.utils.exceptions import BadRequestException, NotFoundException
from app.utils.helpers import validate_pdf_file, validate_file_size

router = APIRouter(prefix="/api/papers", tags=["Research Papers"])
logger = logging.getLogger("app")


# ── POST /api/papers/upload ───────────────────────────────────────────────────

@router.post(
    "/upload",
    response_model=PaperUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload a research paper PDF",
)
async def upload_paper(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF file to upload"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaperUploadResponse:
    """
    Upload a PDF research paper. Triggers the processing pipeline asynchronously.
    
    Workflow: Validate → Save → Create DB Record → Background Processing
    """
    # Validate file type
    validate_pdf_file(file)

    # Read and validate file size
    content = await validate_file_size(file)

    # Create paper record and save file
    paper = await paper_service.create_paper(
        db=db,
        user_id=current_user.id,
        filename=file.filename or "paper.pdf",
        file_content=content,
    )

    # Trigger background processing pipeline
    # We use BackgroundTasks to run it after response is sent.
    # We create a new DB session for the background task since the request session will be closed.
    from app.db.sqlite import AsyncSessionLocal

    async def run_pipeline(paper_id: str) -> None:
        async with AsyncSessionLocal() as bg_session:
            try:
                await paper_service.process_paper_pipeline(bg_session, paper_id)
                await bg_session.commit()
            except Exception as e:
                await bg_session.rollback()
                logger.error(f"Background pipeline failed for {paper_id}: {e}")

    background_tasks.add_task(run_pipeline, paper.paper_id)

    logger.info(f"Paper upload accepted: {paper.paper_id} by user {current_user.id}")
    return PaperUploadResponse(
        message="Paper uploaded successfully. Processing has started in the background.",
        paper_id=paper.paper_id,
        filename=paper.filename,
        status=paper.status,
    )


# ── POST /api/papers/{paper_id}/reprocess ────────────────────────────────────

@router.post(
    "/{paper_id}/reprocess",
    summary="Reprocess a paper (retry pipeline)",
    status_code=status.HTTP_202_ACCEPTED,
)
async def reprocess_paper(
    paper_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Re-trigger the processing pipeline for a paper stuck in 'pending' or 'failed' state.
    Useful after a server bug is fixed.
    """
    paper = await paper_service.get_paper_by_id_and_user(db, paper_id, current_user.id)

    if paper.status == "ready":
        return {"success": True, "message": "Paper is already processed (status=ready). No action taken."}

    # Reset status to pending so pipeline re-runs
    paper.status = "pending"
    await db.flush()
    await db.commit()

    from app.db.sqlite import AsyncSessionLocal

    async def run_pipeline(pid: str) -> None:
        async with AsyncSessionLocal() as bg_session:
            try:
                await paper_service.process_paper_pipeline(bg_session, pid)
                await bg_session.commit()
            except Exception as e:
                await bg_session.rollback()
                logger.error(f"Reprocess pipeline failed for {pid}: {e}")

    background_tasks.add_task(run_pipeline, paper_id)
    logger.info(f"Reprocess triggered for paper_id={paper_id} by user {current_user.id}")
    return {
        "success": True,
        "message": "Reprocessing started in the background.",
        "paper_id": paper_id,
        "status": "pending",
    }


# ── GET /api/papers ───────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=PapersListResponse,
    summary="List all papers for the current user",
)
async def list_papers(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    search: str = Query(default="", description="Search by title, authors, or abstract"),
    sort_by: str = Query(default="upload_date", description="Sort field"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$", description="Sort order"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PapersListResponse:
    """Return paginated list of papers for the authenticated user."""
    papers, total = await paper_service.list_papers(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        search=search or None,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    total_pages = math.ceil(total / page_size) if page_size else 1

    return PapersListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        papers=[PaperResponse.model_validate(p) for p in papers],
    )


# ── GET /api/papers/{paper_id} ────────────────────────────────────────────────

@router.get(
    "/{paper_id}",
    response_model=PaperDetailResponse,
    summary="Get paper details",
)
async def get_paper(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaperDetailResponse:
    """Return full details of a specific paper."""
    paper = await paper_service.get_paper_by_id_and_user(db, paper_id, current_user.id)
    return PaperDetailResponse.model_validate(paper)


# ── GET /api/papers/{paper_id}/citations ──────────────────────────────────────

@router.get(
    "/{paper_id}/citations",
    response_model=CitationsListResponse,
    summary="Get extracted citations for a paper",
)
async def get_citations(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CitationsListResponse:
    """Return all extracted citations for the specified paper."""
    # Verify paper ownership
    await paper_service.get_paper_by_id_and_user(db, paper_id, current_user.id)

    result = await db.execute(
        select(Citation).where(Citation.paper_id == paper_id).order_by(Citation.id)
    )
    citations = list(result.scalars().all())

    return CitationsListResponse(
        paper_id=paper_id,
        total_citations=len(citations),
        citations=[CitationResponse.model_validate(c) for c in citations],
    )


# ── GET /api/papers/{paper_id}/summary ───────────────────────────────────────

@router.get(
    "/{paper_id}/summary",
    response_model=SummaryAPIResponse,
    summary="Get or generate summary for a paper",
)
async def get_summary(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SummaryAPIResponse:
    """
    Get the AI-generated summary for a paper.
    If no summary exists, generates one via Gemini and caches it.
    """
    # Verify paper ownership
    await paper_service.get_paper_by_id_and_user(db, paper_id, current_user.id)

    summary = await summary_service.generate_summary(db, paper_id)
    return SummaryAPIResponse(
        paper_id=paper_id,
        summary=SummaryResponse.model_validate(summary),
    )


# ── POST /api/papers/{paper_id}/report ───────────────────────────────────────

@router.post(
    "/{paper_id}/report",
    response_model=GenerateReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate PDF or DOCX report for a paper",
)
async def generate_report(
    paper_id: str,
    payload: ReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GenerateReportResponse:
    """
    Generate a comprehensive research report in PDF or DOCX format.
    
    The report includes: Executive Summary, Objective, Methodology,
    Key Findings, Citation Analysis, Future Scope, and Conclusion.
    """
    # Verify paper ownership
    await paper_service.get_paper_by_id_and_user(db, paper_id, current_user.id)

    report = await report_service.generate_report(db, paper_id, fmt=payload.format)

    return GenerateReportResponse(
        message=f"Report generated successfully in {payload.format.upper()} format.",
        paper_id=paper_id,
        report_id=report.id,
        format=report.format,
        download_url=f"/api/reports/{report.id}/download",
    )
