from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Time, Date
from sqlalchemy.sql import func
from app.core.database import Base

class MedicationSchedule(Base):
    """복약 일정 테이블 모델"""
    __tablename__ = "medication_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    medication_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=True)
    frequency = Column(String(50), nullable=True)  # 복용 빈도 (하루 몇 번)
    schedule_time = Column(Time, nullable=True)  # 복용 시간
    start_date = Column(Date, nullable=True)  # 복용 시작일
    end_date = Column(Date, nullable=True)  # 복용 종료일
    notes = Column(Text, nullable=True)  # 메모
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<MedicationSchedule(id={self.id}, user_id={self.user_id}, medication_name='{self.medication_name}')>"