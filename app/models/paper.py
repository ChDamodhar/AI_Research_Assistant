"""
Models — Paper ORM Model
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func

from app.db.sqlite import Base


class Paper(Base):
    __tablename__ = "papers"

    paper_id: str = Column(String(64), primary_key=True, index=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename: str = Column(String(512), nullable=False)
    file_path: str = Column(String(1024), nullable=True)
    title: str = Column(String(1024), nullable=True)
    authors: str = Column(Text, nullable=True)
    abstract: str = Column(Text, nullable=True)
    full_text: str = Column(Text, nullable=True)
    status: str = Column(String(50), nullable=False, default="pending")
    # status values: pending | processing | ready | failed
    upload_date: datetime = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Paper paper_id={self.paper_id} title={self.title}>"
