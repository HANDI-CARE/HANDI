"""
약물 관련 API 엔드포인트들
"""
from fastapi import APIRouter, HTTPException
from typing import List
import asyncio
import json
import httpx

from app.schemas.medicine_total import (
    SearchRequest, SearchResponse, DrugInfo,
    HealthCheckResponse, CollectionInfo, CountResponse, 
    OCRDrugDetectionBasicResponse, OCRDrugDetectionDetailResponse,
    DrugInfoBasic, DrugInfoDetail, MedicineTotalDTO, DrugSummary,
    DrugSummaryRequest, DrugDetailInfo, GetAllInfoResponse
)
from app.services.chromadb_service import get_collection_with_embedding, chroma_client, collection
from app.core.config.config import CHROMADB_COLLECTION_NAME, DRUG_DETECTION_THRESHOLD, CHROMADB_HOST, CHROMADB_PORT
import chromadb

router = APIRouter()

@router.post("/search", response_model=SearchResponse)
async def search_drugs_by_name(request: SearchRequest):
    """
    1. 품목명을 기반으로 유사도가 높은 약제 정보 5개를 검색합니다.
    
    - **query**: 검색할 품목명 (예: "타이레놀", "감기약")
    - **limit**: 검색 결과 개수 (기본값: 5, 최대 20)
    
    **검색 방식:**
    - 한국어 임베딩 모델을 사용한 의미적 유사도 검색
    - 코사인 유사도 기반 벡터 검색
    - 유사도 점수와 함께 결과 반환
    """
    try:
        # 검색 결과 개수 제한
        limit = min(request.limit, 20) if request.limit else 5
        
        # ChromaDB 컬렉션 가져오기
        search_collection = get_collection_with_embedding(CHROMADB_COLLECTION_NAME)
        
        # 벡터 검색 수행
        results = search_collection.query(
            query_texts=[request.query],
            n_results=limit,
            include=['documents', 'metadatas', 'distances']
        )
        
        # 검색 결과를 DrugInfoBasic 객체로 변환
        drug_results = []
        if results['ids'] and len(results['ids'][0]) > 0:
            for i in range(len(results['ids'][0])):
                distance = results['distances'][0][i]
                similarity_score = 1 - distance  # 거리를 유사도로 변환
                metadata = results['metadatas'][0][i]
                
                drug_info = DrugInfoBasic(
                    productName=metadata.get('품목명', ''),
                    extraInfo=metadata.get('상세내용', ''),
                    dosage=metadata.get('용량', ''),
                    manufacturer=metadata.get('업소명', ''),
                    appearance=metadata.get('성상', ''),
                    dosageForm=metadata.get('의약품제형', ''),
                    image=metadata.get('큰제품이미지', ''),
                    category=metadata.get('분류명', ''),
                    formCodeName=metadata.get('제형코드명', ''),
                    thicknessMm=metadata.get('크기두께', '')
                )
                drug_results.append(drug_info)
        
        return {
            "query": request.query,
            "results": drug_results,
            "total_found": len(drug_results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"검색 중 오류 발생: {str(e)}")

@router.get("/health-chromadb", response_model=HealthCheckResponse)
async def healthcheck():
    """
    3. ChromaDB 헬스체크 API - ChromaDB 연결 상태와 모든 컬렉션의 정보를 확인합니다.
    
    **확인 항목:**
    - ChromaDB 서버 연결 상태
    - 모든 컬렉션 목록 및 각 컬렉션의 데이터 개수
    - 각 컬렉션의 접근 가능 여부
    
    **응답 예시:**
    ```json
    {
        "status": "healthy",
        "chromadb_connected": true,
        "collections": [
            {"name": "medicine_total_info", "count": 25518, "accessible": true},
            {"name": "senior_danger_medicine", "count": 1205, "accessible": true}
        ],
        "total_collections": 2,
        "message": "ChromaDB 정상 작동 중. 총 2개 컬렉션 발견"
    }
    ```
    """
    try:
        # ChromaDB 연결 상태 확인 - 전역 클라이언트가 없으면 직접 연결 시도
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
            # 모든 컬렉션 목록 조회
            collection_list = client.list_collections()
            collection_names = [col.name for col in collection_list]
            
            if not collection_names:
                return HealthCheckResponse(
                    status="warning",
                    chromadb_connected=True,
                    collections=[],
                    total_collections=0,
                    message="ChromaDB 연결됨. 하지만 컬렉션이 존재하지 않음"
                )
            
            # 각 컬렉션의 정보 수집
            collection_info_list = []
            total_accessible = 0
            
            for col_name in collection_names:
                try:
                    # 컬렉션 접근 및 카운트 조회
                    col = client.get_collection(col_name)
                    count = col.count()
                    collection_info_list.append(CollectionInfo(
                        name=col_name,
                        count=count,
                        accessible=True
                    ))
                    total_accessible += 1
                except Exception as col_error:
                    # 접근할 수 없는 컬렉션
                    collection_info_list.append(CollectionInfo(
                        name=col_name,
                        count=0,
                        accessible=False
                    ))
            
            # 상태 결정
            if total_accessible == len(collection_names):
                status = "healthy"
                message = f"ChromaDB 정상 작동 중. 총 {len(collection_names)}개 컬렉션 발견, 모든 컬렉션 접근 가능"
            elif total_accessible > 0:
                status = "warning"
                message = f"ChromaDB 연결됨. 총 {len(collection_names)}개 컬렉션 중 {total_accessible}개만 접근 가능"
            else:
                status = "error"
                message = f"ChromaDB 연결됨. 총 {len(collection_names)}개 컬렉션이 존재하지만 모두 접근 불가"
            
            return HealthCheckResponse(
                status=status,
                chromadb_connected=True,
                collections=collection_info_list,
                total_collections=len(collection_names),
                message=message
            )
            
        except Exception as collection_error:
            return HealthCheckResponse(
                status="error",
                chromadb_connected=True,
                collections=[],
                total_collections=0,
                message=f"ChromaDB 컬렉션 조회 실패: {str(collection_error)}"
            )
    
    except Exception as e:
        return HealthCheckResponse(
            status="error",
            chromadb_connected=False,
            collections=[],
            total_collections=0,
            message=f"ChromaDB 연결 확인 실패: {str(e)}"
        )




async def search_senior_danger_medicine_detail(client: httpx.AsyncClient, detail_dto: DrugInfoDetail):
    """노인 위험 약물 검색 - Detail용"""
    try:
        search_data = {
            "name": detail_dto.품목명,
            "capacity": detail_dto.용량 if detail_dto.용량 else None
        }
        
        response = await client.post(
            "http://localhost:5500/api/v1/senior-danger/medicine-search",
            json=search_data,
            timeout=10.0
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("found"):
                detail_dto.노인_위험_약물_결과 = result.get("data")
                
    except Exception as e:
        # 검색 실패 시에도 계속 진행
        print(f"노인 위험 약물 검색 실패: {e}")

async def search_senior_danger_ingredients_detail(client: httpx.AsyncClient, detail_dto: DrugInfoDetail):
    """노인 위험 성분 검색 - Detail용"""
    try:
        ingredient_results = []
        
        # 상세내용에서 성분명 추출 (/ 기준으로 분할)
        if detail_dto.상세내용:
            ingredients = [ingredient.strip() for ingredient in detail_dto.상세내용.split('/')]
            
            for ingredient in ingredients:
                if ingredient:  # 빈 문자열이 아닌 경우만
                    search_data = {"name": ingredient}
                    
                    response = await client.post(
                        "http://localhost:5500/api/v1/senior-danger-ingredient/ingredient-search",
                        json=search_data,
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get("found"):
                            ingredient_results.append(result.get("data"))
        
        if ingredient_results:
            detail_dto.노인_위험_성분_결과 = ingredient_results
            
    except Exception as e:
        # 검색 실패 시에도 계속 진행
        print(f"노인 위험 성분 검색 실패: {e}")

async def search_medicine_detail_detail(client: httpx.AsyncClient, detail_dto: DrugInfoDetail):
    """의약품 상세 정보 검색 - Detail용"""
    try:
        search_data = {
            "name": detail_dto.품목명,
            "capacity": detail_dto.용량 if detail_dto.용량 else None
        }
        
        response = await client.post(
            "http://localhost:5500/api/v1/medicine-detail/search",
            json=search_data,
            timeout=10.0
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("found"):
                detail_dto.의약품_상세_정보 = result.get("data")
                
    except Exception as e:
        # 검색 실패 시에도 계속 진행
        print(f"의약품 상세 정보 검색 실패: {e}")

# 기존 함수들은 하위 호환성을 위해 유지
async def search_senior_danger_medicine(client: httpx.AsyncClient, medicine_dto: MedicineTotalDTO):
    """노인 위험 약물 검색 - 하위 호환성용"""
    try:
        search_data = {
            "name": medicine_dto.품목명,
            "capacity": medicine_dto.용량 if medicine_dto.용량 else None
        }
        
        response = await client.post(
            "http://localhost:5500/api/v1/senior-danger/medicine-search",
            json=search_data,
            timeout=10.0
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("found"):
                medicine_dto.노인_위험_약물_결과 = result.get("data")
                
    except Exception as e:
        print(f"노인 위험 약물 검색 실패: {e}")

async def search_senior_danger_ingredients(client: httpx.AsyncClient, medicine_dto: MedicineTotalDTO):
    """노인 위험 성분 검색 - 하위 호환성용"""
    try:
        ingredient_results = []
        
        if medicine_dto.상세내용:
            ingredients = [ingredient.strip() for ingredient in medicine_dto.상세내용.split('/')]
            
            for ingredient in ingredients:
                if ingredient:
                    search_data = {"name": ingredient}
                    
                    response = await client.post(
                        "http://localhost:5500/api/v1/senior-danger-ingredient/ingredient-search",
                        json=search_data,
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get("found"):
                            ingredient_results.append(result.get("data"))
        
        if ingredient_results:
            medicine_dto.노인_위험_성분_결과 = ingredient_results
            
    except Exception as e:
        print(f"노인 위험 성분 검색 실패: {e}")

# 새로운 검색 함수들 (drug_summary 전용)
async def search_medicine_detail_by_name_capacity(client: httpx.AsyncClient, name: str, capacity: str):
    """약물명과 용량으로 의약품 상세 정보 검색"""
    try:
        search_data = {
            "name": name,
            "capacity": capacity if capacity else None
        }
        
        response = await client.post(
            "http://localhost:5500/api/v1/medicine-detail/search",
            json=search_data,
            timeout=10.0
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("found"):
                return result.get("data")
        return None
                
    except Exception as e:
        print(f"의약품 상세 정보 검색 실패: {e}")
        return None

async def search_senior_danger_medicine_by_name_capacity(client: httpx.AsyncClient, name: str, capacity: str):
    """약물명과 용량으로 노인 위험 약물 검색"""
    try:
        search_data = {
            "name": name,
            "capacity": capacity if capacity else None
        }
        
        response = await client.post(
            "http://localhost:5500/api/v1/senior-danger/medicine-search",
            json=search_data,
            timeout=10.0
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("found"):
                return result.get("data")
        return None
                
    except Exception as e:
        print(f"노인 위험 약물 검색 실패: {e}")
        return None

async def search_senior_danger_ingredients_by_component(client: httpx.AsyncClient, component_text: str):
    """성분 텍스트로 노인 위험 성분 검색"""
    try:
        ingredient_results = []
        
        if component_text:
            # 성분명을 / 기준으로 분할
            ingredients = [ingredient.strip() for ingredient in component_text.split('/')]
            
            for ingredient in ingredients:
                if ingredient:
                    search_data = {"name": ingredient}
                    
                    response = await client.post(
                        "http://localhost:5500/api/v1/senior-danger-ingredient/ingredient-search",
                        json=search_data,
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get("found"):
                            ingredient_results.append(result.get("data"))
        
        return ingredient_results if ingredient_results else None
            
    except Exception as e:
        print(f"노인 위험 성분 검색 실패: {e}")
        return None

# 기존 함수들 (하위 호환성용)
async def search_medicine_detail(client: httpx.AsyncClient, medicine_dto: MedicineTotalDTO):
    """의약품 상세 정보 검색 - 하위 호환성용"""
    try:
        search_data = {
            "name": medicine_dto.품목명,
            "capacity": medicine_dto.용량 if medicine_dto.용량 else None
        }
        
        response = await client.post(
            "http://localhost:5500/api/v1/medicine-detail/search",
            json=search_data,
            timeout=10.0
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("found"):
                medicine_dto.의약품_상세_정보 = result.get("data")
                
    except Exception as e:
        print(f"의약품 상세 정보 검색 실패: {e}")