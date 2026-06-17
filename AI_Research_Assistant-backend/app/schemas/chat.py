"""
Schemas — Chat / RAG Pydantic Models
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    paper_id: str = Field(..., examples=["abc123def456"])
    question: str = Field(..., min_length=3, max_length=2000, examples=["What dataset was used?"])


class ChatResponse(BaseModel):
    success: bool = True
    paper_id: str
    question: str
    answer: str
    sources: list[str] = []  # chunk snippets used as context


class ChatHistoryItem(BaseModel):
    id: int
    paper_id: str
    question: str
    answer: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class ChatHistoryResponse(BaseModel):
    success: bool = True
    paper_id: str
    total: int
    history: list[ChatHistoryItem]
