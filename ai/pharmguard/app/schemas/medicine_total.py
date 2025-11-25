"""
약물 관련 Pydantic 모델들
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DrugInfo(BaseModel):
    id: str
    score: float
    productName: Optional[str] = Field(None, description="파싱된 깔끔한 품목명", alias="품목명")
    extraInfo: Optional[str] = Field(None, description="괄호 안 내용", alias="상세내용")
    dosage: Optional[str] = Field(None, description="용량 정보", alias="용량")
    originalProductName: Optional[str] = Field(None, description="원본 품목명", alias="원본품목명")
    manufacturer: Optional[str] = Field(None, description="업소명", alias="업소명")
    appearance: Optional[str] = Field(None, description="성상", alias="성상")
    dosageForm: Optional[str] = Field(None, description="의약품제형", alias="의약품제형")
    metadata: Dict[str, Any]
    
    class Config:
        populate_by_name = True

class DrugInfoBasic(BaseModel):
    """기본 약물 정보 DTO - detect-drug-from-image에서 사용"""
    productName: str = Field(..., description="품목명")
    extraInfo: str = Field(..., description="상세내용")
    dosage: str = Field(..., description="용량")
    manufacturer: str = Field(..., description="업소명")
    appearance: str = Field(..., description="성상")
    dosageForm: str = Field(..., description="의약품제형")
    image: str = Field(..., description="큰제품이미지")
    category: str = Field(..., description="분류명")
    formCodeName: str = Field(..., description="제형코드명")
    thicknessMm: str = Field(..., description="크기두께")

class SearchResponse(BaseModel):
    query: str
    results: List[DrugInfoBasic]
    total_found: int
    
    class Config:
        # 응답 시 영어 필드명(productName, extraInfo 등)을 사용
        by_alias = False

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5

class CollectionInfo(BaseModel):
    name: str
    count: int
    accessible: bool

class HealthCheckResponse(BaseModel):
    status: str
    chromadb_connected: bool
    collections: List[CollectionInfo]
    total_collections: int
    message: str

class CountResponse(BaseModel):
    collection_name: str
    total_count: int

class DrugInfoDetail(BaseModel):
    """상세 약물 정보 DTO - get-all-info-from-image에서 사용"""
    품목명: str = Field(..., description="품목명")
    상세내용: str = Field(..., description="상세내용")
    용량: str = Field(..., description="용량")
    업소명: str = Field(..., description="업소명")
    성상: str = Field(..., description="성상")
    의약품제형: str = Field(..., description="의약품제형")
    큰제품이미지: str = Field(..., description="큰제품이미지")
    분류명: str = Field(..., description="분류명")
    제형코드명: str = Field(..., description="제형코드명")
    크기두께: str = Field(..., description="크기두께")
    노인_위험_약물_결과: Optional[Dict[str, Any]] = Field(None, description="노인 위험 약물 검색 결과")
    노인_위험_성분_결과: Optional[List[Dict[str, Any]]] = Field(None, description="노인 위험 성분 검색 결과")
    의약품_상세_정보: Optional[Dict[str, Any]] = Field(None, description="의약품 상세 정보")

# 하위 호환성을 위해 유지
class MedicineTotalDTO(DrugInfoDetail):
    """기존 DTO - 하위 호환성을 위해 DrugInfoDetail 상속"""
    pass

class DrugSummary(BaseModel):
    """약물 요약 정보"""
    name: str = Field(..., description="약물명")
    capacity: str = Field(..., description="용량")

class OCRDrugDetectionBasicResponse(BaseModel):
    """기본 OCR 약물 탐지 응답"""
    drug_candidates: List[DrugInfoBasic]
    drug_summary: List[DrugSummary] = Field(..., description="탐지된 약물 요약 정보")
    
    class Config:
        # 응답 시 영어 필드명(productName, extraInfo 등)을 사용
        by_alias = False

class DrugSummaryRequest(BaseModel):
    """drug_summary 입력 요청 모델"""
    drug_summary: List[DrugSummary] = Field(..., description="약물명과 용량 목록")

class DrugDetailInfo(BaseModel):
    """약물 상세 정보 응답 모델"""
    의약품_상세_정보: Dict[str, Any] = Field(..., description="의약품 상세 정보")
    노인_위험_약물_결과: Optional[Dict[str, Any]] = Field(None, description="노인 위험 약물 검색 결과")
    노인_위험_성분_결과: Optional[List[Dict[str, Any]]] = Field(None, description="노인 위험 성분 검색 결과")
    
    class Config:
        # null 값인 필드는 응답에서 제외
        exclude_none = True

class GetAllInfoResponse(BaseModel):
    """get-all-info-from-image API 응답 모델"""
    drug_details: List[DrugDetailInfo] = Field(..., description="약물별 상세 정보")

class OCRDrugDetectionDetailResponse(BaseModel):
    """상세 OCR 약물 탐지 응답"""
    ocr_text: str
    drug_candidates: List[DrugInfoDetail]

# 하위 호환성을 위해 유지
class OCRDrugDetectionResponse(OCRDrugDetectionDetailResponse):
    """기존 응답 모델 - 하위 호환성을 위해 유지"""
    pass

