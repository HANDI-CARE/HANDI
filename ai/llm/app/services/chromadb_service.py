"""
ChromaDB 관련 유틸리티 함수들
"""
import chromadb
from chromadb.utils import embedding_functions
from fastapi import HTTPException
from typing import Optional
import logging
from app.core.config.config import settings
from threading import Lock

logger = logging.getLogger(__name__)

# --- 전역 싱글톤 인스턴스 및 잠금 --- #
_chroma_client_instance: Optional[chromadb.Client] = None
_embedding_function_instance: Optional["KoreanEmbeddingFunction"] = None
_client_lock = Lock()
_embedding_lock = Lock()

class KoreanEmbeddingFunction(embedding_functions.EmbeddingFunction):
    """SentenceTransformer 모델을 로드하고 임베딩을 생성하는 클래스"""
    def __init__(self, model_name: str = settings.EMBEDDING_MODEL_NAME):
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading Korean embedding model '{model_name}'...")
            self.model = SentenceTransformer(model_name)
            logger.info(f"Korean embedding model '{model_name}' loaded successfully")
        except Exception as e:
            logger.error(f"임베딩 모델 '{model_name}' 로드 실패: {e}")
            # 모델 로딩 실패는 심각한 문제이므로 예외를 다시 발생시켜 서버 시작을 중단시킬 수 있습니다.
            raise RuntimeError(f"임베딩 모델 '{model_name}' 로드에 실패했습니다.") from e

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        # 모델이 성공적으로 로드되었다고 가정합니다. __init__에서 실패 시 예외가 발생합니다.
        return self.model.encode(input, convert_to_numpy=True).tolist()

def get_embedding_function() -> KoreanEmbeddingFunction:
    """임베딩 함수 싱글톤 인스턴스를 반환합니다."""
    global _embedding_function_instance
    # 이중 확인 잠금(Double-checked locking)으로 매번 잠금을 잡는 오버헤드를 줄임
    if _embedding_function_instance is None:
        with _embedding_lock:
            if _embedding_function_instance is None:
                logger.info("임베딩 함수 싱글톤 인스턴스를 생성합니다.")
                _embedding_function_instance = KoreanEmbeddingFunction()
    return _embedding_function_instance

def get_chroma_client() -> chromadb.Client:
    """ChromaDB 클라이언트 싱글톤 인스턴스를 반환합니다."""
    global _chroma_client_instance
    if _chroma_client_instance is None:
        with _client_lock:
            if _chroma_client_instance is None:
                try:
                    _chroma_client_instance = chromadb.HttpClient(host=settings.CHROMADB_HOST, port=settings.CHROMADB_PORT)
                    _chroma_client_instance.heartbeat() # 연결 테스트
                    logger.info("ChromaDB client connected successfully.")
                except Exception as e:
                    logger.error(f"Failed to connect to ChromaDB: {e}")
                    raise HTTPException(status_code=500, detail="Could not connect to ChromaDB.")
    return _chroma_client_instance

def get_collection_with_embedding(collection_name: str) -> chromadb.Collection:
    """지정된 컬렉션을 임베딩 함수와 함께 가져옵니다."""
    try:
        client = get_chroma_client()
        embedding_function = get_embedding_function()
        collection = client.get_collection(name=collection_name, embedding_function=embedding_function)
        return collection
    except Exception as e:
        logger.error(f"Failed to get collection '{collection_name}': {e}")
        raise HTTPException(status_code=500, detail=f"Could not get collection '{collection_name}'.")


def init_chromadb():
    """애플리케이션 시작 시 ChromaDB와 임베딩 모델을 명시적으로 초기화합니다."""
    try:
        # ChromaDB 클라이언트 초기화
        get_chroma_client()
        logger.info("ChromaDB client initialized successfully")
        
        # 임베딩 함수 초기화 (여기서 모델이 로드됨)
        get_embedding_function()
        logger.info("Korean embedding function initialized successfully")
        
        return True
    except Exception as e:
        logger.error(f"Failed during ChromaDB/Embedding initialization: {e}")
        # 초기화 실패 시 예외를 다시 발생시켜 startup에서 처리하도록 함
        raise
