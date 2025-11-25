"""
고령자 위험 약물 성분 관련 API 라우터
"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.services.senior_danger_service import get_senior_danger_ingredient_collection
from app.schemas.senior_danger_ingredient import (
    SeniorDangerIngredientSearchRequest, 
    SeniorDangerIngredientDto,
    SeniorDangerIngredientSearchResponse,
    SeniorDangerCountResponse,
    SeniorDangerHealthResponse
)

router = APIRouter(prefix="/api/v1/senior-danger-ingredient", tags=["🧪 Senior Danger Ingredient"])


@router.post("/ingredient-search", response_model=SeniorDangerIngredientSearchResponse)  
async def search_senior_danger_ingredient(request: SeniorDangerIngredientSearchRequest):
    """
    고령자 위험 약물 성분을 검색합니다.
    성분 이름으로 임계값 0.9 이상인 경우 가장 높은 점수의 1개 결과만 반환합니다.
    
    입력 예시:
    {
        "name": "퀴누프라민"
    }
    """
    try:
        collection = get_senior_danger_ingredient_collection()
        
        # 성분명으로 벡터 검색
        results = collection.query(
            query_texts=[request.name],
            n_results=20  # 넉넉하게 가져와서 필터링
        )
        
        if not results['ids'][0]:
            return SeniorDangerIngredientSearchResponse(
                found=False,
                data=None
            )
        
        # 임계값 0.9 이상 필터링
        filtered_results = []
        threshold = 0.9
        
        for i, distance in enumerate(results['distances'][0]):
            similarity = 1 - distance  # 코사인 유사도 계산
            
            if similarity >= threshold:  # 임계값 0.9 이상만
                metadata = results['metadatas'][0][i]
                item_id = results['ids'][0][i]
                
                ingredient_dto = SeniorDangerIngredientDto(
                    id=item_id,
                    score=round(similarity, 4),
                    DUR성분명=metadata.get('DUR성분명', ''),
                    DUR성분명영문=metadata.get('DUR성분명영문', ''),
                    복합제=metadata.get('복합제', ''),
                    관계성분=metadata.get('관계성분', ''),
                    금기내용=metadata.get('금기내용', '')
                )
                
                filtered_results.append(ingredient_dto)
        
        # 0.9 이상인 결과가 없으면
        if not filtered_results:
            return SeniorDangerIngredientSearchResponse(
                found=False,
                data=None
            )
        
        # 유사도로 정렬하고 가장 높은 1개만 반환
        filtered_results.sort(key=lambda x: x.score, reverse=True)
        top_result = filtered_results[0]  # 최고 점수 1개만
        
        return SeniorDangerIngredientSearchResponse(
            found=True,
            data=top_result
        )
        
    except Exception as e:
        if "does not exist" in str(e):
            raise HTTPException(
                status_code=404, 
                detail="senior_danger_ingredient 컬렉션이 존재하지 않습니다. 먼저 데이터를 삽입해주세요."
            )
        raise HTTPException(status_code=500, detail=f"성분 검색 실패: {str(e)}")

@router.get("/health", response_model=SeniorDangerHealthResponse)
async def health_check():
    """고령자 위험 약물 성분 서비스 상태를 확인합니다."""
    try:
        collection = get_senior_danger_ingredient_collection()
        count = collection.count()
        
        return SeniorDangerHealthResponse(
            status="healthy",
            service="senior_danger_ingredient",
            chromadb_connection="success",
            collection_exists=True,
            data_count=count
        )
    except Exception as e:
        return SeniorDangerHealthResponse(
            status="unhealthy",
            service="senior_danger_ingredient",
            chromadb_connection="failed", 
            collection_exists=False,
            data_count=0
        )