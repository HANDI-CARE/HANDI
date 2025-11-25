"""
약물 상세 정보 관련 API 엔드포인트들
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import re

from app.schemas.medicine_detail import (
    MedicineDetailSearchRequest,
    MedicineDetailSearchResponse, 
    MedicineDetailDto
)
from app.schemas.medicine_total import (
    HealthCheckResponse, CollectionInfo, CountResponse
)
from app.services.chromadb_service import get_collection_with_embedding, chroma_client
from app.core.config.config import CHROMADB_HOST, CHROMADB_PORT
import chromadb

# 약물 상세 정보 컬렉션 이름
MEDICINE_DETAIL_COLLECTION_NAME = "medicine_detail_info"

router = APIRouter()

def extract_dosage_number(dosage_str: str) -> float:
    """
    용량 문자열에서 숫자 부분을 추출합니다.
    예: "300밀리그램" -> 300.0, "5mg" -> 5.0
    """
    if not dosage_str:
        return 0.0
    
    # 숫자 패턴 찾기 (소수점 포함)
    pattern = r'([0-9]+(?:\.[0-9]+)?)'
    match = re.search(pattern, dosage_str)
    
    if match:
        return float(match.group(1))
    return 0.0

def normalize_dosage_unit(dosage_str: str) -> str:
    """
    용량 단위를 정규화합니다.
    예: "밀리그람", "밀리그램", "mg" -> "mg"
    """
    if not dosage_str:
        return ""
    
    dosage_lower = dosage_str.lower()
    
    # 밀리그램 계열
    if any(unit in dosage_lower for unit in ['밀리그람', '밀리그램', '미리그람', 'mg']):
        return "mg"
    # 그램 계열  
    elif any(unit in dosage_lower for unit in ['그람', '그램', 'g']):
        return "g"
    # 마이크로그램 계열
    elif any(unit in dosage_lower for unit in ['마이크로그람', '마이크로그램', 'mcg', 'μg']):
        return "mcg"
    # 액체 단위
    elif any(unit in dosage_lower for unit in ['ml', 'ml']):
        return "ml"
    
    return dosage_str

def calculate_dosage_similarity(drug_dosage: str, target_dosage: str) -> float:
    """
    두 용량 간의 유사도를 계산합니다.
    같은 단위의 경우 숫자 비율로 계산, 다른 단위의 경우 0점
    """
    if not drug_dosage or not target_dosage:
        return 0.0
    
    # 숫자 추출
    drug_num = extract_dosage_number(drug_dosage)
    target_num = extract_dosage_number(target_dosage)
    
    # 단위 정규화
    drug_unit = normalize_dosage_unit(drug_dosage)
    target_unit = normalize_dosage_unit(target_dosage)
    
    # 단위가 다르면 유사도 0
    if drug_unit != target_unit:
        return 0.0
    
    # 숫자가 없으면 0
    if drug_num == 0 or target_num == 0:
        return 0.0
    
    # 비율 계산 (작은 값 / 큰 값)
    ratio = min(drug_num, target_num) / max(drug_num, target_num)
    
    return ratio

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    ChromaDB 헬스체크 API - medicine_detail_info 컬렉션의 연결 상태를 확인합니다.
    
    **확인 항목:**
    - ChromaDB 서버 연결 상태
    - medicine_detail_info 컬렉션 접근 가능 여부
    - 컬렉션의 데이터 개수
    
    **응답 예시:**
    ```json
    {
        "status": "healthy",
        "chromadb_connected": true,
        "collections": [
            {"name": "medicine_detail_info", "count": 15823, "accessible": true}
        ],
        "total_collections": 1,
        "message": "medicine_detail_info 컬렉션 정상 작동 중"
    }
    ```
    """
    try:
        # ChromaDB 연결 상태 확인
        client = chroma_client
        if not client:
            try:
                client = chromadb.HttpClient(host=CHROMADB_HOST, port=CHROMADB_PORT)
            except Exception as connect_error:
                return HealthCheckResponse(
                    status="error",
                    chromadb_connected=False,
                    collections=[],
                    total_collections=0,
                    message=f"ChromaDB 연결 실패: {str(connect_error)}"
                )
        
        try:
            # medicine_detail_info 컬렉션 접근 및 카운트 조회
            col = client.get_collection(MEDICINE_DETAIL_COLLECTION_NAME)
            count = col.count()
            
            collection_info = CollectionInfo(
                name=MEDICINE_DETAIL_COLLECTION_NAME,
                count=count,
                accessible=True
            )
            
            return HealthCheckResponse(
                status="healthy",
                chromadb_connected=True,
                collections=[collection_info],
                total_collections=1,
                message=f"medicine_detail_info 컬렉션 정상 작동 중 (총 {count}개 데이터)"
            )
            
        except Exception as col_error:
            return HealthCheckResponse(
                status="error",
                chromadb_connected=True,
                collections=[CollectionInfo(
                    name=MEDICINE_DETAIL_COLLECTION_NAME,
                    count=0,
                    accessible=False
                )],
                total_collections=1,
                message=f"medicine_detail_info 컬렉션 접근 실패: {str(col_error)}"
            )
    
    except Exception as e:
        return HealthCheckResponse(
            status="error",
            chromadb_connected=False,
            collections=[],
            total_collections=0,
            message=f"헬스체크 중 오류 발생: {str(e)}"
        )

@router.post("/search", response_model=MedicineDetailSearchResponse)
async def search_medicine_by_name_and_dosage(request: MedicineDetailSearchRequest):
    """
    이름과 용량으로 약물 상세 정보를 검색합니다.
    임계값 0.9 이상인 결과 중 복합 점수가 가장 높은 1개만 반환합니다.
    
    입력 예시:
    {
        "name": "타가틴정",
        "capacity": "200mg"
    }
    
    **검색 방식:**
    - 한국어 임베딩 모델을 사용한 이름 기반 벡터 검색
    - 임계값 0.9 이상인 결과만 필터링
    - 용량 매칭 점수 계산 (용량 입력 시)
    - 복합 점수: 이름 유사도 70% + 용량 매칭 30%
    """
    try:
        # ChromaDB 컬렉션 가져오기
        search_collection = get_collection_with_embedding(MEDICINE_DETAIL_COLLECTION_NAME)
        
        # 벡터 검색 수행 (넉넉하게 가져와서 필터링)
        results = search_collection.query(
            query_texts=[request.name],
            n_results=20,
            include=['documents', 'metadatas', 'distances']
        )
        
        if not results['ids'][0]:
            return MedicineDetailSearchResponse(
                found=False,
                data=None
            )
        
        # 임계값 0.9 이상 필터링 및 복합 점수 계산
        filtered_results = []
        threshold = 0.9
        
        for i, distance in enumerate(results['distances'][0]):
            similarity = 1 - distance  # 코사인 유사도 계산
            
            if similarity >= threshold:  # 임계값 0.9 이상만
                metadata = results['metadatas'][0][i]
                item_id = results['ids'][0][i]
                
                # 용량 매칭 점수 계산
                dosage_score = 0.0
                if request.capacity and metadata.get('함량'):
                    dosage_score = calculate_dosage_similarity(
                        metadata['함량'], request.capacity
                    )
                
                # 최종 점수 계산 (이름 유사도 70% + 용량 매칭 30%)
                if request.capacity:
                    final_score = similarity * 0.7 + dosage_score * 0.3
                else:
                    final_score = similarity
                
                medicine_dto = MedicineDetailDto(
                    id=item_id,
                    score=round(final_score, 4),
                    품목명=metadata.get('제품명', ''),
                    용량=metadata.get('함량', ''),
                    제품명=metadata.get('제품명', ''),
                    용법및용량=metadata.get('용법및용량', ''),
                    함량=metadata.get('함량', ''),
                    성분=metadata.get('성분', ''),
                    복약정보=metadata.get('복약정보', ''),
                    효능및효과=metadata.get('효능및효과', '')
                )
                
                filtered_results.append(medicine_dto)
        
        # 0.9 이상인 결과가 없으면
        if not filtered_results:
            return MedicineDetailSearchResponse(
                found=False,
                data=None
            )
        
        # 최종 점수로 정렬하고 가장 높은 1개만 반환
        filtered_results.sort(key=lambda x: x.score, reverse=True)
        top_result = filtered_results[0]
        
        return MedicineDetailSearchResponse(
            found=True,
            data=top_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"검색 중 오류 발생: {str(e)}")

