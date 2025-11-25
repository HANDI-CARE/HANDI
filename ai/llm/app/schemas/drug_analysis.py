"""
약물 정보 분석 관련 Pydantic 모델들
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# LLM 관련 스키마
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
    note: Optional[str] = Field(None, description="노인 환자 개인정보 (참고용)", example="규칙적인 산책을 즐기심")
    max_tokens: Optional[int] = Field(8192, description="최대 생성 토큰 수")
    temperature: Optional[float] = Field(0.3, description="생성 온도 (0.0-1.0)")

class DrugInfoAnalysisResponse(BaseModel):
    """약물 정보 분석 응답 모델"""
    analysis_result: str = Field(..., description="LLM이 생성한 약물 정보 분석 결과 (JSON 형태)")
    model_used: str = Field(..., description="사용된 모델명")
    tokens_used: int = Field(..., description="사용된 토큰 수")
    processing_time: float = Field(..., description="총 처리 시간 (초)")
    data_collection_time: float = Field(..., description="데이터 수집 시간 (초)")

# 약물 관련 DTO 스키마
class MedicineTotalDTO(BaseModel):
    """약물 종합 정보 DTO"""
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
    노인_위험_약물_결과: Optional[Any] = Field(None, description="노인 위험 약물 검색 결과")
    노인_위험_성분_결과: Optional[List[Any]] = Field(None, description="노인 위험 성분 검색 결과")
    의약품_상세_정보: Optional[Any] = Field(None, description="의약품 상세 정보")

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

class SeniorDangerIngredientDto(BaseModel):
    """고령자 위험 약물 성분 DTO"""
    id: str
    score: float
    DUR성분명: str
    DUR성분명영문: str
    복합제: str
    관계성분: str
    금기내용: str

class MedicineDetailDto(BaseModel):
    """약물 상세 정보 DTO"""
    id: str
    score: float
    제품명: str
    성분: str
    용량: str
    의약품안정성정보: str = Field("", description="의약품안정성정보(DUR)")
    효능및효과: str
    용법및용량: str
    사용상의주의사항: str = Field("", description="사용상의주의사항")
    복약정보: str

# 단일 약물 검색용 스키마
class SingleDrugSearchRequest(BaseModel):
    """단일 약물 검색 요청 모델"""
    name: str = Field(..., description="약품명", example="타가틴정")
    capacity: str = Field(..., description="용량", example="100mg")

class SingleDrugSearchResponse(BaseModel):
    """단일 약물 검색 응답 모델"""
    drug_name: str = Field(..., description="검색된 약품명")
    medicine_detail_info: Optional[MedicineDetailDto] = Field(None, description="의약품 상세 정보")
    senior_danger_medicine: Optional[SeniorDangerMedicineDto] = Field(None, description="노인 위험 약물 정보")
    senior_danger_ingredients: Optional[List[SeniorDangerIngredientDto]] = Field(None, description="노인 위험 성분 정보")
    search_time: float = Field(..., description="검색 시간 (초)")

# 성능 비교 API용 스키마
class PerformanceComparisonRequest(BaseModel):
    """성능 비교 요청 모델"""
    drug_summary: List[DrugSummaryItem] = Field(
        ..., 
        description="비교할 약품 목록",
        example=[
            {"name": "알마겔정", "capacity": ""},
            {"name": "슈가메트서방정", "capacity": "5/1000밀리그램"},
            {"name": "듀비메트서방정", "capacity": "0.5/1000밀리그램"}
        ]
    )

class MethodResult(BaseModel):
    """개별 방식 결과"""
    success: bool = Field(..., description="성공 여부")
    result: Optional[str] = Field(None, description="분석 결과 (성공 시)")
    error: Optional[str] = Field(None, description="오류 메시지 (실패 시)")
    data_collection_time: Optional[float] = Field(None, description="데이터 수집 시간 (초)")
    processing_time: Optional[float] = Field(None, description="LLM 처리 시간 (초)")
    content_length: Optional[int] = Field(None, description="전체 콘텐츠 길이")
    estimated_tokens: Optional[int] = Field(None, description="추정 토큰 수")

class PerformanceComparisonResponse(BaseModel):
    """성능 비교 응답 모델"""
    stuff_result: MethodResult = Field(..., description="Stuff 방식 결과")
    langchain_result: MethodResult = Field(..., description="LangChain 방식 결과")
    comparison: Optional[Dict[str, Any]] = Field(None, description="성능 비교 결과")
    total_processing_time: float = Field(..., description="전체 처리 시간 (초)")
    drug_count: int = Field(..., description="분석된 약물 개수")

# N회 반복 성능 테스트용 스키마
class PerformanceComparisonNRequest(BaseModel):
    """N회 반복 성능 비교 요청 모델 (ChromaDB에서 랜덤 선택)"""
    test_count: int = Field(..., ge=1, le=100, description="테스트 반복 횟수 (1~100) - 매번 ChromaDB에서 2개 약물 랜덤 선택")

class TestRound(BaseModel):
    """개별 테스트 회차 결과"""
    round_number: int = Field(..., description="회차 번호")
    stuff_time: Optional[float] = Field(None, description="Stuff 방식 처리 시간 (초)")
    langchain_time: Optional[float] = Field(None, description="LangChain 방식 처리 시간 (초)")
    stuff_success: bool = Field(False, description="Stuff 방식 성공 여부")
    langchain_success: bool = Field(False, description="LangChain 방식 성공 여부")

class DrugGroundednessResult(BaseModel):
    """개별 약물 근거성 평가 결과"""
    drug_name: str = Field(..., description="약물명")
    groundedness_score: Optional[float] = Field(None, description="근거성 점수 (0-1)")
    evaluation_error: Optional[str] = Field(None, description="평가 중 오류 메시지")

class EvaluationResult(BaseModel):
    """평가 결과 (할루시네이션 방지 중심)"""
    drug_groundedness_scores: Optional[List[DrugGroundednessResult]] = Field(None, description="각 약물별 근거성 점수")
    json_schema_valid: Optional[bool] = Field(None, description="JSON 스키마 유효성")
    evaluation_error: Optional[str] = Field(None, description="평가 중 오류 메시지")

class TestRoundWithEvaluation(BaseModel):
    """근거성 평가가 포함된 테스트 회차 결과"""
    round_number: int = Field(..., description="회차 번호")
    stuff_time: Optional[float] = Field(None, description="Stuff 방식 처리 시간 (초)")
    langchain_time: Optional[float] = Field(None, description="LangChain 방식 처리 시간 (초)")
    stuff_success: bool = Field(False, description="Stuff 방식 성공 여부")
    langchain_success: bool = Field(False, description="LangChain 방식 성공 여부")
    stuff_evaluation: Optional[EvaluationResult] = Field(None, description="Stuff 방식 근거성 평가 결과")
    langchain_evaluation: Optional[EvaluationResult] = Field(None, description="LangChain 방식 근거성 평가 결과")

class PerformanceComparisonNResponse(BaseModel):
    """N회 반복 성능 비교 응답 모델 (평가 포함)"""
    test_rounds: List[TestRoundWithEvaluation] = Field(..., description="각 회차별 테스트 결과")
    test_count: int = Field(..., description="총 테스트 회수")
    drug_count: int = Field(..., description="분석된 약물 개수")
    total_processing_time: float = Field(..., description="전체 처리 시간 (초)")
    performance_summary: Dict[str, Any] = Field(..., description="성능 통계 요약")
    evaluation_summary: Dict[str, Any] = Field(..., description="평가 통계 요약")

# LangSmith 요약 분석용 스키마
class MethodStats(BaseModel):
    """개별 방식 통계"""
    total_requests: int = Field(..., description="총 요청 수")
    avg_latency: float = Field(..., description="평균 레이턴시 (초)")
    min_latency: float = Field(..., description="최소 레이턴시 (초)")
    max_latency: float = Field(..., description="최대 레이턴시 (초)")
    avg_tokens: Optional[float] = Field(None, description="평균 토큰 사용량")
    success_rate: float = Field(..., description="성공률 (%)")

class EvaluationStats(BaseModel):
    """평가 통계"""
    total_evaluations: int = Field(..., description="총 평가 횟수")
    avg_score: float = Field(..., description="평균 점수")
    min_score: float = Field(..., description="최소 점수")
    max_score: float = Field(..., description="최대 점수")
    std_deviation: float = Field(..., description="표준편차")

class LangSmithSummaryResponse(BaseModel):
    """LangSmith 요약 분석 응답 (할루시네이션 방지 중심)"""
    project_name: str = Field(..., description="프로젝트명")
    analysis_period: str = Field(..., description="분석 기간")
    stuff_method_stats: MethodStats = Field(..., description="Stuff 방식 통계")
    langchain_method_stats: MethodStats = Field(..., description="LangChain 방식 통계")
    groundedness_stats: EvaluationStats = Field(..., description="약물별 근거성 평가 통계")
    summary_insights: Dict[str, Any] = Field(..., description="요약 인사이트 (할루시네이션 방지 중심)")