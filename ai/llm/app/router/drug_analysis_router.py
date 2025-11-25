"""
약물 정보 분석 API 라우터
"""
from fastapi import APIRouter
from app.schemas.drug_analysis import (
    DrugInfoAnalysisRequest, DrugInfoAnalysisResponse,
    SingleDrugSearchRequest, SingleDrugSearchResponse
)
from app.services.drug_analysis_service import drug_analysis_service

router = APIRouter(prefix="/llm")

@router.post("/llm-drug-summary", response_model=DrugInfoAnalysisResponse)
async def analyze_drug_info(request: DrugInfoAnalysisRequest):
    """
    약품 목록을 받아 GMS API를 사용하여 노인 환자를 위한 정보를 생성합니다. (Stuff 방식)
    
    **기능:**
    - 약품명과 용량 또는 함량 배열을 받아 처리
    - 각 약물에 대해 모든 관련 정보 수집 (노인 위험 약물, 성분, 상세 정보)
    - 각 약물별 노인 환자 관점에서 핵심 정보 요약
    - 키워드 + 상세 구조로 총 6개 정보 반환
    - **GMS API(GPT-4o-mini) 사용으로 더 정확하고 자연스러운 응답 생성**
    
    **처리 과정:**
    1. 약품명과 용량으로 데이터베이스 검색
    2. 노인 위험 약물/성분 검색
    3. 의약품 상세 정보 검색
    4. GMS API를 통한 노인 환자 맞춤 정보 생성 (한번에 처리)
    
    **입력 형식:**
    ```json
    {
      "drug_summary": [
        {"name": "타가틴정", "capacity": "100mg"},
        {"name": "팜시버정", "capacity": "250mg"}
      ]
    }
    ```
    
    **출력 형식:**
    각 약물별로 다음 구조의 JSON 객체 생성:
    ```json
    {
      "약물명": {
        "키워드": {
          "효능 및 효과": "핵심 키워드 형태",
          "용법 및 용량": "투여 방법 키워드",
          "복약 정보": "주의사항 키워드"
        },
        "상세": {
          "효능 및 효과": "상세 설명",
          "용법 및 용량": "상세 용법",
          "복약 정보": "상세 주의사항"
        }
      }
    }
    ```
    """
    return await drug_analysis_service.analyze_drug_info(request)

@router.post("/llm-drug-summary-langchain", response_model=DrugInfoAnalysisResponse)
async def analyze_drug_info_langchain(request: DrugInfoAnalysisRequest):
    """
    약품 목록을 LangChain 방식으로 각 약물별 멀티태스킹 병렬 처리합니다.
    
    **기능:**
    - 약품명과 용량 또는 함량 배열을 받아 처리
    - 각 약물을 개별적으로 LangChain 병렬 처리
    - 멀티쓰레드 비동기로 동시에 처리하여 성능 향상
    - 키워드 + 상세 구조로 총 6개 정보 반환
    - **각 약물별 독립적 처리로 안정성과 속도 개선**
    
    **처리 과정:**
    1. 약품명과 용량으로 데이터베이스 검색 (병렬)
    2. 노인 위험 약물/성분 검색 (병렬)
    3. 의약품 상세 정보 검색 (병렬)
    4. 각 약물별 개별 GMS API 호출 (병렬)
    5. 결과 통합
    
    **입력 형식:**
    ```json
    {
      "drug_summary": [
        {"name": "타가틴정", "capacity": "100mg"},
        {"name": "팜시버정", "capacity": "250mg"}
      ]
    }
    ```
    
    **출력 형식:**
    각 약물별로 다음 구조의 JSON 객체 생성:
    ```json
    {
      "약물명": {
        "키워드": {
          "효능 및 효과": "위산과다 완화, 소화불량 개선",
          "용법 및 용량": "1회 250mg, 하루 2회, 식후 30분",
          "복약 정보": "졸음 주의, 알코올 금지, 조심히 일어서기"
        },
        "상세": {
          "효능 및 효과": "노인 환자에게 해당하는 효능 및 효과를 자세히 설명",
          "용법 및 용량": "노인 환자를 위한 용법 및 용량을 자세히 설명",
          "복약 정보": "노인 환자가 이해하기 쉽도록 복용 시 주의사항을 자세히 설명"
        }
      }
    }
    ```
    """
    return await drug_analysis_service.analyze_drug_info_langchain(request)

@router.post("/drug-analysis", response_model=SingleDrugSearchResponse)
async def search_single_drug(request: SingleDrugSearchRequest):
    """
    단일 약물의 상세 정보를 검색합니다.
    
    **기능:**
    - 약품명과 용량으로 각 컬렉션에서 검색
    - medicine_detail_info: 의약품 상세 정보
    - senior_danger_medicine: 노인 위험 약물 정보
    - senior_danger_ingredient: 노인 위험 성분 정보
    
    **입력 형식:**
    ```json
    {
      "name": "타가틴정",
      "capacity": "100mg"
    }
    ```
    
    **출력 형식:**
    ```json
    {
      "drug_name": "타가틴정",
      "medicine_detail_info": {
        "제품명": "...",
        "성분": "...",
        "용량": "...",
        "의약품안정성정보(DUR)": "...",
        "효능및효과": "...",
        "용법및용량": "...",
        "사용상의주의사항": "...",
        "복약정보": "..."
      },
      "senior_danger_medicine": {...},
      "senior_danger_ingredients": [...],
      "search_time": 0.25
    }
    ```
    """
    return await drug_analysis_service.search_single_drug(request)

