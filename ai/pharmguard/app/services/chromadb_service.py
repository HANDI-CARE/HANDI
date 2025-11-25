"""
ChromaDB 관련 유틸리티 함수들
"""
import chromadb
from fastapi import HTTPException
from typing import Optional
import logging

from app.core.config.config import CHROMADB_HOST, CHROMADB_PORT, CHROMADB_COLLECTION_NAME
from app.services.korean_embedding_service import get_korean_embedding_function

logger = logging.getLogger(__name__)

# 전역 변수
chroma_client = None
collection = None

def get_collection_with_embedding(collection_name: str):
    """컬렉션을 가져오는 헬퍼 함수 - 싱글톤 임베딩 함수 사용"""
    global chroma_client
    
    if not chroma_client:
        # ChromaDB 클라이언트 재연결 시도
        try:
            logger.debug(f"ChromaDB 클라이언트 재연결 시도: {CHROMADB_HOST}:{CHROMADB_PORT}")
            chroma_client = chromadb.HttpClient(host=CHROMADB_HOST, port=CHROMADB_PORT)
        except Exception as conn_error:
            raise HTTPException(status_code=500, detail=f"ChromaDB 클라이언트 연결 실패: {str(conn_error)}")
    
    # 싱글톤 임베딩 함수 가져오기
    embedding_function = get_korean_embedding_function()
    
    try:
        # 먼저 컬렉션이 존재하는지 확인
        collections = chroma_client.list_collections()
        available_collections = [col.name for col in collections]
        logger.debug(f"사용 가능한 컬렉션: {available_collections}")
        
        if collection_name not in available_collections:
            raise HTTPException(
                status_code=404, 
                detail=f"컬렉션 '{collection_name}'이 존재하지 않습니다. 사용 가능한 컬렉션: {available_collections}"
            )
        
        # 컬렉션 가져오기
        retrieved_collection = chroma_client.get_collection(
            name=collection_name,
            embedding_function=embedding_function
        )
        
        return retrieved_collection
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"컬렉션 조회 중 오류 발생: {str(e)}")

def init_chromadb():
    """ChromaDB 초기화 - 싱글톤 임베딩 함수 사용"""
    global chroma_client, collection
    
    try:
        chroma_client = chromadb.HttpClient(host=CHROMADB_HOST, port=CHROMADB_PORT)
        
        # 연결 테스트를 위해 컬렉션 목록 조회
        collections = chroma_client.list_collections()
        collection_names = [col.name for col in collections]
        
        # 탐지된 컬렉션 로깅
        if collection_names:
            logger.info(f"ChromaDB 연결 테스트 완료 - 탐지된 컬렉션: {', '.join(collection_names)}")
        else:
            logger.info("ChromaDB 연결 테스트 완료 - 컬렉션 없음")
        
        # ChromaDB 연결 테스트만 수행 (임베딩 모델은 main.py에서 로드)
        # 실제 컬렉션 연결은 필요할 때 get_collection_with_embedding()을 통해 수행
        collection = None
            
        return True
        
    except Exception as e:
        logger.warning(f"ChromaDB 연결 실패: {e}")
        chroma_client = None
        collection = None
        return False