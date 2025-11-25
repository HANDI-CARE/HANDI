"""
FastAPI 애플리케이션 메인 파일
"""
import os
import logging
import subprocess
import warnings
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# 환경변수로 transformers 경고 억제
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'

# 전역 경고 억제
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")

from app.core.config.config import PROJECT_NAME, VERSION, DESCRIPTION
from app.core.config.middleware.timing import RequestTimingMiddleware
from app.services.chromadb_service import init_chromadb
from app.services.korean_embedding_service import get_korean_embedding_function
from app.services.document_service import DocumentProcessingService
from app.router.medicine_total_router import router as medicine_total_router
from app.router.drug_detect_router import router as drug_detect_router
from app.router.senior_danger_router import router as senior_danger_router
from app.router.senior_danger_ingredient_router import router as senior_danger_ingredient_router
from app.router.medicine_detail_router import router as medicine_detail_router
from app.router.document_router import router as document_router

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 외부 라이브러리 로깅 레벨 조정
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("chromadb").setLevel(logging.WARNING) 
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
logging.getLogger("transformers").setLevel(logging.WARNING)
logging.getLogger("torch").setLevel(logging.WARNING)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("gliner").setLevel(logging.WARNING)
logging.getLogger("huggingface_hub").setLevel(logging.WARNING)
logging.getLogger("tokenizers").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI 애플리케이션의 생명주기를 관리합니다.
    시작 시 모델을 로드하고, 종료 시 리소스를 정리합니다.
    """
    # 서비스 초기화
    try:
        # ChromaDB 연결
        init_chromadb()
        
        
        # 한국어 임베딩 모델 미리 로드 (싱글톤)
        logger.info("한국어 임베딩 모델 초기화 중...")
        get_korean_embedding_function()
        logger.info("한국어 임베딩 모델 초기화 완료")
        
        # GLiNER 한국어 NER 모델 미리 로드
        logger.info("GLiNER 한국어 NER 모델 초기화 중...")
        DocumentProcessingService()
        logger.info("GLiNER 한국어 NER 모델 초기화 완료")
        
        # 서비스 준비 완료
        logger.info("✅ 통합 서비스 준비 완료 - http://0.0.0.0:5500")
        
    except Exception as e:
        logger.error(f"❌ 서비스 초기화 실패: {e}")
        raise
    
    yield
    
    # 정리 작업
    pass
    logger.info("🛑 통합 서비스 종료 - 리소스 정리 완료")

# FastAPI 앱 생성
app = FastAPI(
    title=f"{PROJECT_NAME}",
    description=DESCRIPTION,
    version=VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 미들웨어 추가
app.add_middleware(RequestTimingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(document_router, prefix="/api/v1/document", tags=["📄 Document OCR & NER"])
app.include_router(drug_detect_router, prefix="/api/v1/drug", tags=["🔍 Drug Detection"])
app.include_router(medicine_total_router, prefix="/api/v1/drug", tags=["💊 Medicine Total"])
app.include_router(senior_danger_router, tags=["⚠️ Senior Danger Medicine"])
app.include_router(senior_danger_ingredient_router, tags=["🧪 Senior Danger Ingredient"])
app.include_router(medicine_detail_router, prefix="/api/v1/medicine-detail", tags=["💊 Medicine Detail Info"])


