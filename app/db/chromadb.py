"""
DB — ChromaDB Client Initialization
Persistent local storage with the 'research_papers' collection.
Compatible with chromadb 0.4.x API.
"""

import logging
from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

logger = logging.getLogger("app")

_chroma_client: Optional[chromadb.Client] = None
_collection = None


def get_chroma_client() -> chromadb.Client:
    """Return (or lazily initialize) the ChromaDB persistent client."""
    global _chroma_client
    if _chroma_client is None:
        from app.config import settings
        _chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        logger.info(f"ChromaDB client initialized at '{settings.chroma_persist_dir}'")
    return _chroma_client


def get_collection():
    """Return (or lazily create) the research_papers collection."""
    global _collection
    if _collection is None:
        from app.config import settings
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"ChromaDB collection '{settings.chroma_collection_name}' ready.")
    return _collection


def init_chromadb() -> None:
    """Eagerly initialize ChromaDB on startup."""
    get_collection()
