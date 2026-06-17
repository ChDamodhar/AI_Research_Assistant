"""
Models — Report ORM Model
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func

from app.db.sqlite import Base


class Report(Base):
    __tablename__ = "reports"

    id: int = Column(Integer, primary_key=True, autoincrement=True, index=True)
    paper_id: str = Column(String(64), ForeignKey("papers.paper_id"), nullable=False, index=True)
    report_path: str = Column(Text, nullable=False)
    format: str = Column(String(10), nullable=False)  # 'pdf' or 'docx'
    created_at: datetime = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Report id={self.id} paper_id={self.paper_id} format={self.format}>"
