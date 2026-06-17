"""
Schemas — Report Pydantic Models
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ReportRequest(BaseModel):
    format: Literal["pdf", "docx"] = Field(default="pdf", examples=["pdf"])


class ReportResponse(BaseModel):
    id: int
    paper_id: str
    report_path: str
    format: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerateReportResponse(BaseModel):
    success: bool = True
    message: str
    paper_id: str
    report_id: int
    format: str
    download_url: str


class ReportsListResponse(BaseModel):
    success: bool = True
    total: int
    reports: list[ReportResponse]
