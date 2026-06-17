"""
Models — User ORM Model
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, func

from app.db.sqlite import Base


class User(Base):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name: str = Column(String(255), nullable=False)
    email: str = Column(String(255), unique=True, nullable=False, index=True)
    password_hash: str = Column(String(255), nullable=False)
    role: str = Column(String(50), nullable=False, default="user")
    created_at: datetime = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
