"""
Services — Chunking Service
Uses LangChain RecursiveCharacterTextSplitter.
"""

import logging
from dataclasses import dataclass
from typing import Optional

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings

logger = logging.getLogger("app")


@dataclass
class TextChunk:
    """Represents a single document chunk with metadata."""
    text: str
    chunk_index: int
    section_name: str = "general"
    page_number: Optional[int] = None


def chunk_text(
    text: str,
    section_name: str = "general",
    chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None,
) -> list[TextChunk]:
    """
    Split text into chunks using RecursiveCharacterTextSplitter.

    Args:
        text: The full text to split.
        section_name: Label for this section (e.g., 'methodology', 'introduction').
        chunk_size: Override the default chunk size from config.
        chunk_overlap: Override the default overlap from config.

    Returns:
        List of TextChunk objects.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size or settings.chunk_size,
        chunk_overlap=chunk_overlap or settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    raw_chunks = splitter.split_text(text)
    chunks = [
        TextChunk(
            text=chunk,
            chunk_index=i,
            section_name=section_name,
        )
        for i, chunk in enumerate(raw_chunks)
        if chunk.strip()
    ]

    logger.debug(f"Split text into {len(chunks)} chunks (section='{section_name}').")
    return chunks


def chunk_sections(sections: dict[str, str]) -> list[TextChunk]:
    """
    Chunk multiple sections from a paper.

    Args:
        sections: Dict mapping section_name -> section_text.

    Returns:
        Flat list of all TextChunk objects across all sections.
    """
    all_chunks: list[TextChunk] = []
    for section_name, text in sections.items():
        if text and text.strip():
            chunks = chunk_text(text, section_name=section_name)
            all_chunks.extend(chunks)

    logger.info(f"Total chunks from {len(sections)} sections: {len(all_chunks)}")
    return all_chunks
