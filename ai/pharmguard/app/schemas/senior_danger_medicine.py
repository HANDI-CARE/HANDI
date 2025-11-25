"""
고령자 위험 약물 관련 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional

class SeniorDangerMedicineSearchRequest(BaseModel):
    """고령자 위험 약물 검색 요청"""
    name: str = Field(..., description="검색할 약물명", example="자이프렉사정")
    capacity: Optional[str] = Field(None, description="용량 (선택사항)", example="2.5밀리그램")

class SeniorDangerMedicineDto(BaseModel):
    """고령자 위험 약물 DTO"""
    id: str
    score: float
    품목명: str
    상세내용: str
    용량: str
    성분명: str
    성분코드: str
    업체명: str
    공고번호: str
    급여구분: str
    약품상세정보: str

class SeniorDangerMedicineSearchResponse(BaseModel):
    """고령자 위험 약물 검색 응답"""
    found: bool
    data: Optional[SeniorDangerMedicineDto] = None

class SeniorDangerCountResponse(BaseModel):
    """고령자 위험 약물 개수 응답"""
    status: str = Field(..., description="응답 상태")
    collection_name: str = Field(..., description="컬렉션 이름")
    count: int = Field(..., description="데이터 개수")

class SeniorDangerHealthResponse(BaseModel):
    """고령자 위험 약물 서비스 상태 응답"""
    status: str = Field(..., description="서비스 상태")
    service: str = Field(..., description="서비스 이름")
    chromadb_connection: str = Field(..., description="ChromaDB 연결 상태")
    collection_exists: bool = Field(..., description="컬렉션 존재 여부")
    data_count: int = Field(..., description="데이터 개수")