"""
LLM 관련 Pydantic 모델들
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.core.config.config import MAX_TOKENS_DEFAULT, TEMPERATURE_DEFAULT


class HealthResponse(BaseModel):
    """상태 확인 응답 모델"""
    status: str = Field(..., description="서비스 상태")
    model_loaded: bool = Field(..., description="모델 로드 상태")
    model_name: str = Field(..., description="로드된 모델명")
    model_path: Optional[str] = Field(None, description="모델 파일 경로")
    config: Dict[str, Any] = Field(..., description="현재 설정 정보")

class DrugAnalysisRequest(BaseModel):
    """약물 분석 요청 모델"""
    drug_data: List[Dict[str, Any]] = Field(
        ..., 
        description="탐지된 약물 데이터 배열",
        example=[
            {
                "id": "202106092",
                "score": 0.8716,
                "품목명": "타이레놀정",
                "상세내용": "아세트아미노펜",
                "용량": "500밀리그람",
                "원본품목명": "타이레놀정500밀리그람(아세트아미노펜)",
                "업소명": "한국존슨앤드존슨판매(유)",
                "성상": "흰색의장방형필름코팅정제",
                "의약품제형": "장방형"
            }
        ]
    )

class WarningResponse(BaseModel):
    """약물 경고 응답 모델"""
    warning_text: str = Field(..., description="생성된 약물 복용 주의사항")
    model_used: str = Field(..., description="사용된 모델명")
    tokens_used: int = Field(..., description="사용된 토큰 수")

class ServiceInfo(BaseModel):
    """서비스 정보 모델"""
    service_name: str
    version: str
    model: str
    endpoints: List[str]
    documentation: Dict[str, str]

class DrugSummaryItem(BaseModel):
    """약품 요약 항목 모델"""
    name: str = Field(..., description="약품명")
    capacity: str = Field(..., description="용량")

class DrugInfoAnalysisRequest(BaseModel):
    """약물 정보 분석 요청 모델"""
    drug_summary: List[DrugSummaryItem] = Field(
        ..., 
        description="분석할 약품 목록",
        example=[
            {
                "name": "타가틴정",
                "capacity": "100mg"
            },
            {
                "name": "팜시버정",
                "capacity": "250mg"
            }
        ]
    )
    max_tokens: Optional[int] = Field(8192, description="최대 생성 토큰 수")
    temperature: Optional[float] = Field(0.3, description="생성 온도 (0.0-1.0)")

class DrugInfoAnalysisResponse(BaseModel):
    """약물 정보 분석 응답 모델"""
    analysis_result: str = Field(..., description="LLM이 생성한 약물 정보 분석 결과 (JSON 형태)")
    model_used: str = Field(..., description="사용된 모델명")
    tokens_used: int = Field(..., description="사용된 토큰 수")
    processing_time: float = Field(..., description="처리 시간 (초)")

class DrugInfoAnalysisFromImageResponse(BaseModel):
    """이미지에서 약물 정보 분석 응답 모델"""
    drug_candidates: List[Dict[str, Any]] = Field(..., description="탐지된 약물 후보들 (Spring 호환 형태)")
    analysis_result: str = Field(..., description="LLM이 생성한 약물 정보 분석 결과 (JSON 형태)")
    model_used: str = Field(..., description="사용된 모델명")
    tokens_used: int = Field(..., description="사용된 토큰 수")
    processing_time: float = Field(..., description="처리 시간 (초)")

class IndividualDrugResult(BaseModel):
    """개별 약물 처리 결과"""
    drug_name: str = Field(..., description="약물명")
    success: bool = Field(..., description="처리 성공 여부")
    tokens_used: int = Field(..., description="사용된 토큰 수")
    processing_time: float = Field(..., description="개별 처리 시간 (초)")
    thread_id: Optional[str] = Field(None, description="처리한 쓰레드 ID")
    analysis_result: Optional[str] = Field(None, description="개별 LLM 분석 결과 (JSON)")
    error: Optional[str] = Field(None, description="오류 메시지 (실패 시)")

class DrugInfoAnalysisMultiResponse(BaseModel):
    """멀티 쓰레드 약물 정보 분석 응답 모델"""
    analysis_result: str = Field(..., description="통합된 약물 정보 분석 결과 (JSON 형태)")
    model_used: str = Field(..., description="사용된 모델명")
    total_tokens_used: int = Field(..., description="전체 사용된 토큰 수")
    processing_time: float = Field(..., description="전체 처리 시간 (초)")
    thread_count: int = Field(..., description="사용된 쓰레드 수")
    success_count: int = Field(..., description="성공한 약물 수")
    failed_count: int = Field(..., description="실패한 약물 수")
    individual_results: List[IndividualDrugResult] = Field(..., description="각 약물별 상세 처리 결과")

