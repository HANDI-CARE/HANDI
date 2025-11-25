"""
약물 상세 정보 관련 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional

class MedicineDetailSearchRequest(BaseModel):
    """약물 상세 정보 검색 요청"""
    name: str = Field(..., description="검색할 약물명", example="타가틴정")
    capacity: Optional[str] = Field(None, description="용량 (선택사항)", example="200mg")

class MedicineDetailDto(BaseModel):
    """약물 상세 정보 DTO"""
    id: str
    score: float
    품목명: str
    용량: str
    제품명: str
    용법및용량: str
    함량: str
    성분: str
    복약정보: str
    효능및효과: str

class MedicineDetailSearchResponse(BaseModel):
    """약물 상세 정보 검색 응답"""
    found: bool
    data: Optional[MedicineDetailDto] = None