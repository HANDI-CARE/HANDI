from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class MeetingMatch(Base):
    """미팅 매치 테이블 모델"""
    __tablename__ = "meeting_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    match_type = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True)
    content = Column(Text, nullable=True)  # 단순 텍스트로 content 저장
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<MeetingMatch(id={self.id}, user_id={self.user_id}, status='{self.status}')>"