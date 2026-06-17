"""
API — Chat / RAG Routes
POST /api/chat
GET  /api/chat/{paper_id}/history
"""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.chat import ChatHistoryItem, ChatHistoryResponse, ChatRequest, ChatResponse
from app.services import rag_service
from app.utils.dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/chat", tags=["Chat & Q&A"])
logger = logging.getLogger("app")


# ── POST /api/chat ────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ChatResponse,
    summary="Ask a question about a research paper (RAG)",
)
async def ask_question(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    """
    Ask a question about a research paper using Retrieval-Augmented Generation.

    Workflow:
    1. Embed the question using BAAI/bge-small-en-v1.5
    2. Retrieve top-5 relevant chunks from ChromaDB
    3. Construct context from retrieved chunks
    4. Generate answer using Gemini API
    5. Store Q&A in chat history
    """
    answer, sources = await rag_service.answer_question(
        db=db,
        paper_id=payload.paper_id,
        user_id=current_user.id,
        question=payload.question,
    )

    return ChatResponse(
        paper_id=payload.paper_id,
        question=payload.question,
        answer=answer,
        sources=sources,
    )


# ── GET /api/chat/{paper_id}/history ─────────────────────────────────────────

@router.get(
    "/{paper_id}/history",
    response_model=ChatHistoryResponse,
    summary="Get Q&A history for a paper",
)
async def get_chat_history(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatHistoryResponse:
    """Retrieve the full Q&A conversation history for a specific paper."""
    history = await rag_service.get_chat_history(db, paper_id, current_user.id)
    return ChatHistoryResponse(
        paper_id=paper_id,
        total=len(history),
        history=[ChatHistoryItem.model_validate(h) for h in history],
    )
