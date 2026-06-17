"""
Models — Citation ORM Model
"""

from sqlalchemy import Column, ForeignKey, Integer, String, Text

from app.db.sqlite import Base


class Citation(Base):
    __tablename__ = "citations"

    id: int = Column(Integer, primary_key=True, autoincrement=True, index=True)
    paper_id: str = Column(String(64), ForeignKey("papers.paper_id"), nullable=False, index=True)
    author: str = Column(Text, nullable=True)
    year: str = Column(String(10), nullable=True)
    title: str = Column(Text, nullable=True)
    raw_text: str = Column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<Citation id={self.id} paper_id={self.paper_id}>"
