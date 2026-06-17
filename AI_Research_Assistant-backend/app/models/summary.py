"""
Models — Summary ORM Model
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func

from app.db.sqlite import Base


class Summary(Base):
    __tablename__ = "summaries"

    id: int = Column(Integer, primary_key=True, autoincrement=True, index=True)
    paper_id: str = Column(String(64), ForeignKey("papers.paper_id"), nullable=False, index=True)
    summary: str = Column(Text, nullable=False)
    created_at: datetime = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Summary id={self.id} paper_id={self.paper_id}>"
