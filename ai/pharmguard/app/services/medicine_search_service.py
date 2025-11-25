"""
의약품 검색 통합 서비스
API 호출 없이 직접 ChromaDB 검색을 수행하는 서비스 함수들
"""
from typing import Optional, Dict, Any, List
from app.services.chromadb_service import get_collection_with_embedding
from app.services.korean_embedding_service import get_korean_embedding_function
from app.core.config.config import SENIOR_DANGER_THRESHOLD, CHROMADB_HOST, CHROMADB_PORT
import chromadb


def get_senior_danger_collection():
    """노인 위험 약물 컬렉션 가져오기"""
    try:
        client = chromadb.HttpClient(host=CHROMADB_HOST, port=CHROMADB_PORT)
        embedding_function = get_korean_embedding_function()
        collection = client.get_collection(
            name="senior_danger_medicine",
            embedding_function=embedding_function
        )
        return collection
    except Exception as e:
        print(f"노인 위험 약물 컬렉션 연결 실패: {e}")
        return None


def get_senior_danger_ingredient_collection():
    """노인 위험 성분 컬렉션 가져오기"""
    try:
        client = chromadb.HttpClient(host=CHROMADB_HOST, port=CHROMADB_PORT)
        embedding_function = get_korean_embedding_function()
        collection = client.get_collection(
            name="senior_danger_ingredient",
            embedding_function=embedding_function
        )
        return collection
    except Exception as e:
        print(f"노인 위험 성분 컬렉션 연결 실패: {e}")
        return None


def get_medicine_detail_collection():
    """의약품 상세 정보 컬렉션 가져오기"""
    try:
        client = chromadb.HttpClient(host=CHROMADB_HOST, port=CHROMADB_PORT)
        embedding_function = get_korean_embedding_function()
        collection = client.get_collection(
            name="medicine_detail_info",
            embedding_function=embedding_function
        )
        return collection
    except Exception as e:
        print(f"의약품 상세 정보 컬렉션 연결 실패: {e}")
        return None


def search_senior_danger_medicine_direct(name: str, capacity: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """노인 위험 약물 직접 검색"""
    try:
        collection = get_senior_danger_collection()
        if not collection:
            return None
        
        # 1단계: 품목명으로 벡터 검색
        results = collection.query(
            query_texts=[name],
            n_results=5,
            include=['documents', 'metadatas', 'distances']
        )
        
        if not results['ids'] or len(results['ids'][0]) == 0:
            return None
        
        # 결과를 점수별로 정렬하여 처리
        scored_results = []
        for i in range(len(results['ids'][0])):
            distance = results['distances'][0][i]
            score = 1 - distance
            metadata = results['metadatas'][0][i]
            
            scored_results.append({
                'id': results['ids'][0][i],
                'score': score,
                'metadata': metadata
            })
        
        # 점수별로 정렬 (높은 점수 우선)
        scored_results.sort(key=lambda x: x['score'], reverse=True)
        
        # 임계값 0.9 이상인 결과만 고려
        high_score_results = [r for r in scored_results if r['score'] >= SENIOR_DANGER_THRESHOLD]
        
        if not high_score_results:
            return None
        
        # 용량이 제공된 경우 용량 매칭 시도
        if capacity:
            for result in high_score_results:
                metadata = result['metadata']
                if metadata.get('용량') == capacity:
                    return {
                        'id': result['id'],
                        'score': result['score'],
                        **metadata
                    }
        
        # 용량 매칭이 안되거나 용량이 없는 경우 가장 높은 점수 반환
        best_result = high_score_results[0]
        return {
            'id': best_result['id'],
            'score': best_result['score'],
            **best_result['metadata']
        }
        
    except Exception as e:
        print(f"노인 위험 약물 검색 실패: {e}")
        return None


def search_senior_danger_ingredients_direct(component_text: str) -> List[Dict[str, Any]]:
    """노인 위험 성분 직접 검색"""
    try:
        collection = get_senior_danger_ingredient_collection()
        if not collection:
            return []
        
        ingredients = [ingredient.strip() for ingredient in component_text.split('/') if ingredient.strip()]
        ingredient_results = []
        
        for ingredient in ingredients:
            results = collection.query(
                query_texts=[ingredient],
                n_results=3,
                include=['documents', 'metadatas', 'distances']
            )
            
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    distance = results['distances'][0][i]
                    score = 1 - distance
                    
                    # 임계값 0.9 이상인 경우만 포함
                    if score >= SENIOR_DANGER_THRESHOLD:
                        metadata = results['metadatas'][0][i]
                        ingredient_results.append({
                            'id': results['ids'][0][i],
                            'score': score,
                            'search_ingredient': ingredient,
                            **metadata
                        })
        
        # 점수별로 정렬
        ingredient_results.sort(key=lambda x: x['score'], reverse=True)
        return ingredient_results
        
    except Exception as e:
        print(f"노인 위험 성분 검색 실패: {e}")
        return []


def search_medicine_detail_direct(name: str, capacity: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """의약품 상세 정보 직접 검색"""
    try:
        collection = get_medicine_detail_collection()
        if not collection:
            return None
        
        # 벡터 검색 수행
        results = collection.query(
            query_texts=[name],
            n_results=10,
            include=['documents', 'metadatas', 'distances']
        )
        
        if not results['ids'] or len(results['ids'][0]) == 0:
            return None
        
        # 결과를 점수별로 정렬하여 처리
        scored_results = []
        for i in range(len(results['ids'][0])):
            distance = results['distances'][0][i]
            score = 1 - distance
            metadata = results['metadatas'][0][i]
            
            # 임계값 0.9 이상인 결과만 고려
            if score >= 0.9:
                scored_results.append({
                    'id': results['ids'][0][i],
                    'score': score,
                    'metadata': metadata
                })
        
        if not scored_results:
            return None
        
        # 용량이 제공된 경우 용량 매칭 및 복합 점수 계산
        if capacity:
            for result in scored_results:
                metadata = result['metadata']
                capacity_score = 0.0
                
                # 용량 매칭 점수 계산
                if metadata.get('용량') == capacity:
                    capacity_score = 1.0
                elif capacity in str(metadata.get('용량', '')):
                    capacity_score = 0.7
                
                # 복합 점수 계산 (품목명 점수 70% + 용량 점수 30%)
                result['composite_score'] = result['score'] * 0.7 + capacity_score * 0.3
            
            # 복합 점수로 정렬
            scored_results.sort(key=lambda x: x['composite_score'], reverse=True)
        else:
            # 용량이 없는 경우 벡터 점수로만 정렬
            scored_results.sort(key=lambda x: x['score'], reverse=True)
        
        # 가장 높은 점수의 결과 반환
        best_result = scored_results[0]
        return {
            'id': best_result['id'],
            'score': best_result['score'],
            **best_result['metadata']
        }
        
    except Exception as e:
        print(f"의약품 상세 정보 검색 실패: {e}")
        return None