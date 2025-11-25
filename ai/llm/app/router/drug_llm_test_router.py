"""
약물 LLM 성능 테스트 API 라우터
"""
import time
from fastapi import APIRouter
from app.core.logger import logger
from app.schemas.drug_analysis import (
    PerformanceComparisonRequest, PerformanceComparisonResponse,
    PerformanceComparisonNRequest, PerformanceComparisonNResponse,
    TestRound, LangSmithSummaryResponse
)
from app.services.drug_llm_test_service import drug_llm_test_service
from app.services.langsmith_analysis_service import langsmith_analysis_service

router = APIRouter(prefix="/llm-test")

@router.post("/llm-performance-compare", response_model=PerformanceComparisonResponse)
async def compare_llm_performance(request: PerformanceComparisonRequest):
    """
    Stuff 방식과 LangChain 방식의 성능을 비교합니다.
    
    **기능:**
    - 동일한 약물 목록으로 두 방식 모두 실행
    - 각 방식의 성능 지표 측정 (데이터 수집 시간, LLM 처리 시간)
    - 실패한 경우 오류 정보 포함
    - 두 방식 모두 성공 시 성능 비교 결과 제공
    
    **처리 과정:**
    1. Stuff 방식 실행 (실패해도 계속 진행)
    2. LangChain 방식 실행 (실패해도 계속 진행)
    3. 성능 비교 분석 (둘 다 성공한 경우만)
    
    **입력 형식:**
    ```json
    {
      "drug_summary": [
        {"name": "알마겔정", "capacity": ""},
        {"name": "슈가메트서방정", "capacity": "5/1000밀리그램"},
        {"name": "듀비메트서방정", "capacity": "0.5/1000밀리그램"}
      ]
    }
    ```
    
    **출력 형식:**
    ```json
    {
      "stuff_result": {
        "success": true,
        "result": "...",
        "data_collection_time": 2.5,
        "processing_time": 3.2
      },
      "langchain_result": {
        "success": true,
        "result": "...",
        "data_collection_time": 2.3,
        "processing_time": 4.1
      },
      "comparison": {
        "stuff_llm_time": 3.2,
        "langchain_llm_time": 4.1,
        "faster_method": "Stuff",
        "performance_improvement": 21.9
      },
      "total_processing_time": 7.8,
      "drug_count": 3
    }
    ```
    """
    return await drug_llm_test_service.compare_performance_traced(request)

@router.post("/llm-performance-compare-n", response_model=PerformanceComparisonNResponse)
async def compare_llm_performance_n_times(request: PerformanceComparisonNRequest):
    """
    Stuff 방식과 LangChain 방식의 성능을 N회 반복 비교합니다.
    매번 ChromaDB에서 2개 약물을 랜덤 선택하여 테스트합니다.
    
    **기능:**
    - ChromaDB medicine_detail_info에서 매번 2개 약물 랜덤 선택
    - 각 회차별 성능 측정 및 로그 출력
    - 최종 통계 요약 제공
    - Parallel 방식만 Groundedness 평가 포함 (Claude 3.5 Haiku 사용)
    - Stuff 방식은 성능 측정만 수행
    
    **입력 형식:**
    ```json
    {
      "test_count": 5
    }
    ```
    
    **로그 출력 예시:**
    ```
    (1/5) 회 테스트 진행 완료 - Stuff: 19초 - Parallel: 11초
    (2/5) 회 테스트 진행 완료 - Stuff: 실패 - Parallel: 12초
    (3/5) 회 테스트 진행 완료 - Stuff: 20초 - Parallel: 10초
    ```
    
    **출력 형식:**
    ```json
    {
      "test_rounds": [
        {
          "round_number": 1,
          "stuff_time": 19.2,
          "langchain_time": 11.5,
          "stuff_success": true,
          "langchain_success": true
        }
      ],
      "test_count": 5,
      "drug_count": 2,
      "total_processing_time": 95.7,
      "summary": {
        "stuff_success_rate": 80.0,
        "langchain_success_rate": 100.0,
        "avg_stuff_time": 19.6,
        "avg_langchain_time": 11.2
      }
    }
    ```
    """
    return await drug_llm_test_service.compare_performance_n_times_traced(request)

@router.get("/langsmith-summary", response_model=LangSmithSummaryResponse)
async def get_langsmith_summary():
    """
    LangSmith 프로젝트의 종합 테스트 결과 요약을 제공합니다.
    
    **분석 내용:**
    1. **Stuff 방식 (tags: abtest, A)**
       - 총 요청 수, 평균/최소/최대 레이턴시
       - 평균 토큰 사용량 (약물 2개 기준으로 나누기 2)
       - 성공률
    
    2. **LangChain 방식 (tags: abtest, B)**  
       - 총 요청 수, 평균/최소/최대 레이턴시
       - 평균 토큰 사용량 (약물별 개별 처리)
       - 성공률
    
    3. **약물별 근거성 평가 (tags: evaluation, groundedness, per_drug)**
       - 총 평가 횟수 (각 약물별)
       - 평균/최소/최대 근거성 점수
       - 표준편차 및 환각 위험도
       - RAG 환경 환각 방지 중심 분석
    
    4. **요약 인사이트 (환각 방지 중심)**
       - 더 빠른 방식 및 성능 개선율
       - 더 안정적인 방식 및 성공률 비교
       - 토큰 효율성 비교
       - 약물별 근거성 분석 및 환각 위험도 평가
    
    **사용 예시:**
    ```bash
    curl -X GET "/api/v1/llm-test/langsmith-summary"
    ```
    
    **응답 예시:**
    ```json
    {
      "project_name": "handiSmith",
      "analysis_period": "최근 7일 (분석 시점: 2025-08-09 15:30)",
      "stuff_method_stats": {
        "total_requests": 15,
        "avg_latency": 18.5,
        "min_latency": 14.2,
        "max_latency": 25.1,
        "avg_tokens": 8420.5,
        "success_rate": 100.0
      },
      "langchain_method_stats": {
        "total_requests": 15,
        "avg_latency": 11.3,
        "min_latency": 8.7,
        "max_latency": 15.9,
        "avg_tokens": 4210.3,
        "success_rate": 100.0
      },
      "groundedness_stats": {
        "total_evaluations": 45,
        "avg_score": 0.823,
        "min_score": 0.650,
        "max_score": 0.950,
        "std_deviation": 0.089
      },
      "summary_insights": {
        "performance": {
          "faster_method": "LangChain",
          "improvement_percentage": 38.9,
          "latency_difference": 7.2
        },
        "reliability": {
          "more_stable_method": "Both",
          "stuff_success_rate": 100.0,
          "langchain_success_rate": 100.0
        },
        "token_efficiency": {
          "more_efficient_method": "LangChain", 
          "stuff_avg_tokens": 8420.5,
          "langchain_avg_tokens": 4210.3
        },
        "hallucination_prevention": {
          "grounding_level": "높음",
          "consistency_level": "일관적",
          "avg_grounding_score": 0.823,
          "grounding_variance": 0.089,
          "hallucination_risk": "낮음",
          "per_drug_evaluation": true,
          "focus": "RAG 환경 환각 방지"
        }
      }
    }
    ```
    """
    return await langsmith_analysis_service.get_langsmith_summary()