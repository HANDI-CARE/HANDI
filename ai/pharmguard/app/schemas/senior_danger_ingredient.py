"""
고령자 위험 약물 성분 관련 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional

class SeniorDangerIngredientSearchRequest(BaseModel):
    """고령자 위험 약물 성분 검색 요청"""
    name: str = Field(..., description="검색할 성분명", example="퀴누프라민")

class SeniorDangerIngredientDto(BaseModel):
    """고령자 위험 약물 성분 DTO"""
    id: str
    score: float
    DUR성분명: str
    DUR성분명영문: str
    복합제: str
    관계성분: str
    금기내용: str

class SeniorDangerIngredientSearchResponse(BaseModel):
    """고령자 위험 약물 성분 검색 응답"""
    found: bool
    data: Optional[SeniorDangerIngredientDto] = None

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