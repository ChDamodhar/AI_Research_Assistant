"""
Services — RAG Service (Retrieval-Augmented Generation)
Question → Embedding → ChromaDB Search → Context → Gemini → Answer → Store
"""

import asyncio
import logging

import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.chromadb import get_collection
from app.models.chat import ChatHistory
from app.models.paper import Paper
from app.prompts.qa import QA_SYSTEM_PROMPT, QA_USER_PROMPT
from app.services import embedding_service
from app.utils.exceptions import BadRequestException, NotFoundException, ServiceException
from sqlalchemy import select

logger = logging.getLogger("app")

genai.configure(api_key=settings.gemini_api_key)


def _get_gemini_model():
    return genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=QA_SYSTEM_PROMPT,
    )


async def answer_question(
    db: AsyncSession,
    paper_id: str,
    user_id: int,
    question: str,
) -> tuple[str, list[str]]:
    """
    Full RAG pipeline:
    1. Validate paper exists and is ready.
    2. Embed the question.
    3. Search ChromaDB for top-K relevant chunks.
    4. Build context.
    5. Call Gemini.
    6. Store chat history.

    Returns:
        (answer_text, source_chunks)
    """
    # Validate paper
    paper_result = await db.execute(
        select(Paper).where(Paper.paper_id == paper_id)
    )
    paper = paper_result.scalar_one_or_none()
    if not paper:
        raise NotFoundException("Paper")

    if paper.status != "ready":
        raise BadRequestException(
            f"Paper is not ready for Q&A (status='{paper.status}'). "
            "Please wait for processing to complete."
        )

    logger.info(f"RAG query: paper_id={paper_id} | question='{question[:80]}'")

    # Step 1: Embed question
    loop = asyncio.get_event_loop()
    question_embedding = await loop.run_in_executor(
        None, embedding_service.generate_embedding, question
    )

    # Step 2: ChromaDB similarity search
    collection = get_collection()
    search_results = collection.query(
        query_embeddings=[question_embedding],
        n_results=settings.rag_top_k,
        where={"paper_id": paper_id},
    )

    # Step 3: Build context from retrieved chunks
    retrieved_docs: list[str] = search_results.get("documents", [[]])[0]
    retrieved_meta: list[dict] = search_results.get("metadatas", [[]])[0]

    if not retrieved_docs:
        logger.warning(f"No chunks found in ChromaDB for paper_id={paper_id}")
        answer = "Information not found in paper."
        await _store_chat(db, paper_id, user_id, question, answer)
        return answer, []

    # Format context with section labels
    context_parts = []
    for doc, meta in zip(retrieved_docs, retrieved_meta):
        section = meta.get("section_name", "unknown")
        context_parts.append(f"[Section: {section}]\n{doc}")
    context = "\n\n---\n\n".join(context_parts)

    # Step 4: Build prompt
    prompt = QA_USER_PROMPT.format(context=context, question=question)

    # Step 5: Call Gemini
    try:
        model = _get_gemini_model()
        response = await loop.run_in_executor(
            None, lambda: model.generate_content(prompt)
        )
        answer = response.text.strip()
    except Exception as e:
        logger.error(f"Gemini QA failed: {e}", exc_info=True)
        raise ServiceException(f"Question answering failed: {str(e)}")

    logger.info(f"RAG answer generated for paper_id={paper_id}")

    # Step 6: Store chat history
    await _store_chat(db, paper_id, user_id, question, answer)

    # Return source snippets (first 200 chars each)
    source_snippets = [doc[:200] + "..." if len(doc) > 200 else doc for doc in retrieved_docs]
    return answer, source_snippets


async def _store_chat(
    db: AsyncSession,
    paper_id: str,
    user_id: int,
    question: str,
    answer: str,
) -> None:
    """Persist a Q&A pair to chat_history."""
    chat = ChatHistory(
        paper_id=paper_id,
        user_id=user_id,
        question=question,
        answer=answer,
    )
    db.add(chat)
    await db.flush()


async def get_chat_history(
    db: AsyncSession, paper_id: str, user_id: int
) -> list[ChatHistory]:
    """Retrieve all chat history for a paper."""
    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.paper_id == paper_id, ChatHistory.user_id == user_id)
        .order_by(ChatHistory.timestamp.asc())
    )
    return list(result.scalars().all())
