"""
Services — Paper Service
CRUD operations for papers, pagination, search, sort.
Repository pattern over SQLAlchemy async sessions.
"""

import asyncio
import logging
import math
from pathlib import Path
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.chromadb import get_collection
from app.models.citation import Citation
from app.models.paper import Paper
from app.models.summary import Summary
from app.services import chunking_service, embedding_service
from app.services.citation_service import extract_citations
from app.services.pdf_service import extract_pdf
from app.utils.exceptions import NotFoundException, ServiceException
from app.utils.helpers import generate_paper_id, get_upload_path, sanitize_filename

logger = logging.getLogger("app")


# ── Create Paper Record ───────────────────────────────────────────────────────

async def create_paper(
    db: AsyncSession,
    user_id: int,
    filename: str,
    file_content: bytes,
) -> Paper:
    """
    Save the uploaded PDF and create a paper record in SQLite.
    Returns the Paper object with status='pending'.
    """
    paper_id = generate_paper_id()
    safe_filename = sanitize_filename(filename)
    file_path = get_upload_path(paper_id, safe_filename)

    # Ensure upload directory exists
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

    # Write file to disk
    file_path.write_bytes(file_content)
    logger.info(f"PDF saved: {file_path}")

    paper = Paper(
        paper_id=paper_id,
        user_id=user_id,
        filename=safe_filename,
        file_path=str(file_path),
        status="pending",
    )
    db.add(paper)
    await db.flush()
    await db.refresh(paper)
    logger.info(f"Paper record created: paper_id={paper_id}")
    return paper


# ── Get Paper ─────────────────────────────────────────────────────────────────

async def get_paper_by_id(db: AsyncSession, paper_id: str) -> Paper:
    result = await db.execute(select(Paper).where(Paper.paper_id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise NotFoundException("Paper")
    return paper


async def get_paper_by_id_and_user(
    db: AsyncSession, paper_id: str, user_id: int
) -> Paper:
    result = await db.execute(
        select(Paper).where(Paper.paper_id == paper_id, Paper.user_id == user_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise NotFoundException("Paper")
    return paper


# ── List Papers (paginated, search, sort) ────────────────────────────────────

async def list_papers(
    db: AsyncSession,
    user_id: int,
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    sort_by: str = "upload_date",
    sort_order: str = "desc",
) -> tuple[list[Paper], int]:
    """
    Return paginated papers for a user with optional search and sort.

    Returns:
        (papers_list, total_count)
    """
    query = select(Paper).where(Paper.user_id == user_id)

    # Search filter
    if search:
        query = query.where(
            or_(
                Paper.title.ilike(f"%{search}%"),
                Paper.filename.ilike(f"%{search}%"),
                Paper.authors.ilike(f"%{search}%"),
                Paper.abstract.ilike(f"%{search}%"),
            )
        )

    # Count total
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar_one()

    # Sort
    sort_col = getattr(Paper, sort_by, Paper.upload_date)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    papers = list(result.scalars().all())
    return papers, total


# ── Processing Pipeline ───────────────────────────────────────────────────────

async def process_paper_pipeline(db: AsyncSession, paper_id: str) -> None:
    """
    Full paper processing pipeline:
    1. Extract PDF text + sections
    2. Extract metadata (title, authors, abstract)
    3. Extract citations
    4. Chunk text
    5. Generate embeddings
    6. Store in ChromaDB

    This runs as a background task after upload.
    """
    logger.info(f"[Pipeline] Starting for paper_id={paper_id}")

    # Mark as processing
    paper = await get_paper_by_id(db, paper_id)
    paper.status = "processing"
    await db.flush()

    try:
        # Step 1 & 2: PDF Extraction + Metadata
        logger.info(f"[Pipeline] Step 1/5: Extracting PDF")
        sections = extract_pdf(paper.file_path)

        paper.title = sections.title or paper.filename
        paper.authors = sections.authors or ""
        paper.abstract = sections.abstract or ""
        paper.full_text = sections.full_text
        await db.flush()

        # Step 3: Citation Extraction
        logger.info(f"[Pipeline] Step 2/5: Extracting citations")
        citations = extract_citations(sections.references)
        for c in citations:
            citation_obj = Citation(
                paper_id=paper_id,
                author=c.author,
                year=c.year,
                title=c.title,
                raw_text=c.raw_text,
            )
            db.add(citation_obj)
        await db.flush()
        logger.info(f"[Pipeline] {len(citations)} citations stored.")

        # Step 4: Chunking
        logger.info(f"[Pipeline] Step 3/5: Chunking")
        sections_dict = sections.to_sections_dict()
        chunks = chunking_service.chunk_sections(sections_dict)
        logger.info(f"[Pipeline] {len(chunks)} chunks generated.")

        # Step 5 & 6: Embeddings + ChromaDB
        logger.info(f"[Pipeline] Step 4/5: Generating embeddings and storing in ChromaDB")
        chunk_texts = [c.text for c in chunks]

        if chunk_texts:
            # Run embedding in thread pool (CPU-bound)
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                None, embedding_service.generate_embeddings_batch, chunk_texts
            )

            collection = get_collection()
            ids = [f"{paper_id}_chunk_{i}" for i in range(len(chunks))]
            metadatas = [
                {
                    "paper_id": paper_id,
                    "section_name": c.section_name,
                    "chunk_index": c.chunk_index,
                    "page_number": c.page_number or 0,
                }
                for c in chunks
            ]

            # Store in ChromaDB (batch upsert)
            collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=chunk_texts,
                metadatas=metadatas,
            )
            logger.info(f"[Pipeline] {len(chunks)} chunks stored in ChromaDB.")

        # Mark as ready
        paper.status = "ready"
        await db.flush()
        logger.info(f"[Pipeline] COMPLETE for paper_id={paper_id}")

    except Exception as e:
        logger.error(f"[Pipeline] FAILED for paper_id={paper_id}: {e}", exc_info=True)
        paper.status = "failed"
        await db.flush()
        raise
