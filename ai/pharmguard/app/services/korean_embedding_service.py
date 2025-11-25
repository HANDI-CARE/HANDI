"""
한국어 임베딩 모델 싱글톤 서비스
모든 곳에서 동일한 임베딩 모델 인스턴스를 재사용하여 중복 로드를 방지합니다.
"""
import logging
import chromadb
from chromadb.utils import embedding_functions
from app.core.config.config import EMBEDDING_MODEL_NAME

logger = logging.getLogger(__name__)

class KoreanEmbeddingFunction(embedding_functions.EmbeddingFunction):
    """한국어 최적화 임베딩 함수"""
    
    def __init__(self, model_name: str):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            self.model_name = model_name
        except Exception as e:
            logger.error(f"임베딩 모델 로드 실패: {e}")
            raise Exception(f"임베딩 모델 로드 실패: {e}")

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        embeddings = self.model.encode(input, convert_to_numpy=True).tolist()
        return embeddings

class KoreanEmbeddingService:
    """한국어 임베딩 서비스 싱글톤 클래스"""
    
    _instance = None
    _embedding_function = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(KoreanEmbeddingService, cls).__new__(cls)
        return cls._instance
    
    def get_embedding_function(self) -> KoreanEmbeddingFunction:
        """임베딩 함수를 반환합니다. 처음 호출 시에만 모델을 로드합니다."""
        if self._embedding_function is None:
            self._embedding_function = KoreanEmbeddingFunction(EMBEDDING_MODEL_NAME)
        return self._embedding_function
    
    def is_loaded(self) -> bool:
        """임베딩 모델이 로드되었는지 확인합니다."""
        return self._embedding_function is not None

# 전역 함수로 쉽게 접근할 수 있도록 제공
def get_korean_embedding_function() -> KoreanEmbeddingFunction:
    """
    한국어 임베딩 함수를 반환합니다.
    싱글톤 패턴으로 구현되어 여러 번 호출해도 한 번만 로드됩니다.
    """
    service = KoreanEmbeddingService()
    return service.get_embedding_function()

def is_korean_embedding_loaded() -> bool:
    """한국어 임베딩 모델이 이미 로드되었는지 확인합니다."""
    service = KoreanEmbeddingService()
    return service.is_loaded()