"""
고령자 위험 약물 관련 API 라우터
"""
from fastapi import APIRouter, HTTPException
import re
from typing import List
from app.services.senior_danger_service import get_senior_danger_collection
from app.schemas.senior_danger_medicine import (
    SeniorDangerMedicineSearchRequest,
    SeniorDangerMedicineDto,
    SeniorDangerMedicineSearchResponse,
    SeniorDangerCountResponse,
    SeniorDangerHealthResponse
)

router = APIRouter(prefix="/api/v1/senior-danger", tags=["⚠️ Senior Danger Medicine"])

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


@router.post("/medicine-search", response_model=SeniorDangerMedicineSearchResponse)  
async def search_senior_danger_medicine(request: SeniorDangerMedicineSearchRequest):
    """
    고령자 위험 약물을 검색합니다.
    임계값 0.9 이상인 경우에만 용량으로 추가 검색을 수행하며, 가장 높은 1개의 결과만 반환합니다.
    """
    try:
        collection = get_senior_danger_collection()  # 한국어 임베딩 모델 사용
        
        # 1단계: 품목명으로 벡터 검색
        results = collection.query(
            query_texts=[request.name],
            n_results=20  # 넉넉하게 가져와서 필터링
        )
        
        if not results['ids'][0]:
            return SeniorDangerMedicineSearchResponse(
                found=False,
                data=None
            )
        
        # 2단계: 임계값 필터링 및 용량 매칭
        filtered_results = []
        threshold = 0.9
        
        for i, distance in enumerate(results['distances'][0]):
            similarity = 1 - distance  # 코사인 유사도 계산
            
            if similarity >= threshold:  # 임계값 0.9 이상만
                metadata = results['metadatas'][0][i]
                item_id = results['ids'][0][i]
                
                # 용량 매칭 점수 계산
                dosage_score = 0.0
                if request.capacity and metadata.get('용량'):
                    dosage_score = calculate_dosage_similarity(
                        metadata['용량'], request.capacity
                    )
                
                # 최종 점수 계산 (유사도 70% + 용량 매칭 30%)
                if request.capacity:
                    final_score = similarity * 0.7 + dosage_score * 0.3
                else:
                    final_score = similarity
                
                medicine_dto = SeniorDangerMedicineDto(
                    id=item_id,
                    score=round(final_score, 4),
                    품목명=metadata.get('품목명', ''),
                    상세내용=metadata.get('상세내용', ''),
                    용량=metadata.get('용량', ''),
                    성분명=metadata.get('성분명', ''),
                    성분코드=metadata.get('성분코드', ''),
                    업체명=metadata.get('업체명', ''),
                    공고번호=str(metadata.get('공고번호', '')),
                    급여구분=metadata.get('급여구분', ''),
                    약품상세정보=metadata.get('약품상세정보', '')
                )
                
                filtered_results.append(medicine_dto)
        
        # 0.9 이상인 결과가 없으면
        if not filtered_results:
            return SeniorDangerMedicineSearchResponse(
                found=False,
                data=None
            )
        
        # 최종 점수로 정렬하고 가장 높은 1개만 반환
        filtered_results.sort(key=lambda x: x.score, reverse=True)
        top_result = filtered_results[0]  # 최고 점수 1개만
        
        return SeniorDangerMedicineSearchResponse(
            found=True,
            data=top_result
        )
        
    except Exception as e:
        if "does not exist" in str(e):
            raise HTTPException(
                status_code=404, 
                detail="senior_danger_medicine 컬렉션이 존재하지 않습니다. 먼저 데이터를 삽입해주세요."
            )
        raise HTTPException(status_code=500, detail=f"검색 실패: {str(e)}")

@router.get("/health", response_model=SeniorDangerHealthResponse)
async def health_check():
    """고령자 위험 약물 서비스 상태를 확인합니다."""
    try:
        collection = get_senior_danger_collection()  # 한국어 임베딩 모델 사용
        count = collection.count()
        
        return SeniorDangerHealthResponse(
            status="healthy",
            service="senior_danger_medicine",
            chromadb_connection="success",
            collection_exists=True,
            data_count=count
        )
    except Exception as e:
        return SeniorDangerHealthResponse(
            status="unhealthy",
            service="senior_danger_medicine",
            chromadb_connection="failed", 
            collection_exists=False,
            data_count=0
        )