from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
import os
import warnings

# FutureWarning 숨기기 (transformers 라이브러리 관련)
warnings.filterwarnings("ignore", category=FutureWarning)
from app.router.stt_only_router import router as stt_only_router
from app.router.llm_only_router import router as llm_only_router
from app.router.stt_llm_router import router as stt_llm_router
from app.router.rabbitmq_router import router as rabbitmq_router
from app.router.drug_analysis_router import router as drug_analysis_router
from app.router.drug_llm_test_router import router as drug_llm_test_router
from app.router.video_analysis_router import router as video_analysis_router
from app.router.database_router import router as database_router
from app.router.medication_schedule_router import router as medication_schedule_router
from app.router.meeting_match_router import router as meeting_match_router
from app.router.minio_router import router as minio_router
from app.router.health_router import router as health_router
from app.router.video_test_router import router as video_test_router
from app.core.logger import logger
from app.services.chromadb_service import init_chromadb
from app.services.rabbitmq_service import RabbitMQService
from app.services.keep_alive_service import keep_alive_service
from app.core.database import init_database, test_connection

app = FastAPI(
    title="Banchan STT & LLM API",
    description="Speech-to-Text, Language Model summarization, and Drug Analysis service",
    version="1.0.0",
    openapi_version="3.0.2",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# 전역 RabbitMQ 서비스 인스턴스
rabbitmq_service = RabbitMQService()

# 정적 파일 서빙 추가
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 커스텀 스타일 적용을 위한 헤더 추가
@app.middleware("http")
async def add_custom_header(request, call_next):
    response = await call_next(request)
    if request.url.path == "/docs":
        # Swagger UI에 커스텀 CSS 추가
        response.headers["X-Custom-Style"] = "enabled"
    return response

# 깔끔한 favicon 설정 (투명한 1x1 픽셀)
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {"message": "No favicon"}

# 서버 시작 시 초기화
@app.on_event("startup")
async def startup_event():
    """서버 시작 시 실행되는 초기화 작업"""
    logger.info("Banchan STT & LLM API server starting...")
    
    # PostgreSQL 데이터베이스 초기화
    logger.info("Initializing PostgreSQL database...")
    try:
        db_connected = await test_connection()
        if db_connected:
            await init_database()
            logger.info("PostgreSQL database initialized successfully")
        else:
            logger.warning("PostgreSQL connection failed - database operations may fail")
    except Exception as e:
        logger.error(f"PostgreSQL initialization failed: {e}")
    
    # ChromaDB 및 임베딩 모델 초기화
    logger.info("Loading Korean embedding model...")
    try:
        # ChromaDB 초기화 (임베딩 모델도 함께 로드됨)
        init_chromadb()
        logger.info("Korean embedding model 'upskyy/bge-m3-korean' loaded successfully")
        logger.info("ChromaDB connection established")
    except Exception as e:
        logger.error(f"ChromaDB/embedding model initialization failed: {e}")
        logger.warning("ChromaDB connection failed - will retry on API calls")
    
    # LangSmith 프로젝트 초기화 (Drug LLM Test용)
    logger.info("Initializing LangSmith projects...")
    try:
        from app.services.langsmith_config import langsmith_manager
        langsmith_manager.ensure_project_exists("api")  # Drug LLM Test용 프로젝트
        logger.info("LangSmith projects initialized successfully")
    except Exception as e:
        logger.warning(f"LangSmith project initialization failed: {e}")
    
    # RabbitMQ consuming 시작
    logger.info("Starting RabbitMQ consumer...")
    try:
        rabbitmq_started = rabbitmq_service.start_consuming()
        if rabbitmq_started:
            logger.info("RabbitMQ consumer started successfully")
        else:
            logger.warning("RabbitMQ consumer failed to start - may already be running")
    except Exception as e:
        logger.warning(f"RabbitMQ consumer startup failed: {e}")
    
    # Keep-alive 서비스 시작
    logger.info("Starting Keep-alive service...")
    try:
        await keep_alive_service.start()
        logger.info("Keep-alive service started successfully")
    except Exception as e:
        logger.warning(f"Keep-alive service startup failed: {e}")
    
    logger.info("Banchan STT & LLM API server ready")

@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 정리 작업"""
    logger.info("Banchan STT & LLM API server shutting down")
    
    # Keep-alive 서비스 중지
    logger.info("Stopping Keep-alive service...")
    try:
        await keep_alive_service.stop()
        logger.info("Keep-alive service stopped successfully")
    except Exception as e:
        logger.warning(f"Error stopping Keep-alive service: {e}")
    
    # RabbitMQ consuming 중지
    logger.info("Stopping RabbitMQ consumer...")
    try:
        rabbitmq_stopped = rabbitmq_service.stop_consuming()
        if rabbitmq_stopped:
            logger.info("RabbitMQ consumer stopped successfully")
        else:
            logger.info("RabbitMQ consumer was not running")
    except Exception as e:
        logger.warning(f"Error stopping RabbitMQ consumer: {e}")
    
    logger.info("Server shutdown complete")

# API 라우터 등록
app.include_router(stt_only_router, tags=["STT Only"])
app.include_router(llm_only_router, tags=["LLM Only"])
app.include_router(stt_llm_router, tags=["STT & LLM"])
app.include_router(drug_analysis_router, prefix="/api/v1", tags=["Drug Analysis"])
app.include_router(drug_llm_test_router, prefix="/api/v1", tags=["Drug LLM Test"])
app.include_router(video_analysis_router, prefix="/api/v1", tags=["Video Analysis"])
app.include_router(rabbitmq_router, prefix="/api/v1", tags=["RabbitMQ"])
app.include_router(database_router, prefix="/api/v1/database", tags=["Database"])
app.include_router(medication_schedule_router, prefix="/api/v1", tags=["Medication Schedule"])
app.include_router(meeting_match_router, prefix="/api/v1", tags=["Meeting Matches"])
app.include_router(minio_router, prefix="/api/v1/minio", tags=["MinIO"])
app.include_router(health_router, prefix="/api/v1", tags=["Health & Keep-alive"])
app.include_router(video_test_router, prefix="/api/v1", tags=["Video Test"])


# 기본 루트 엔드포인트
@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "Banchan STT & LLM API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "rabbitmq_status": rabbitmq_service.get_status() if 'rabbitmq_service' in globals() else "not_initialized",
        "endpoints": {
            "STT Only": "/api/v1/stt",
            "LLM Only": "/api/v1/llm-*",
            "STT & LLM": "/api/v1/stt-*",
            "Drug Analysis": "/api/v1/llm-drug-summary*",
            "Drug LLM Test": "/api/v1/llm-test/*",
            "Video Analysis": "/api/v1/video-summary",
            "RabbitMQ": "/api/v1/rabbitmq/*",
            "Database": "/api/v1/database/*"
        },
        "embedding_model": "upskyy/bge-m3-korean",
        "features": [
            "Speech-to-Text (Whisper)",
            "Text Summarization (GPT-4o-mini)",
            "Drug Information Analysis",
            "Video/Audio Analysis via MinIO",
            "Korean Embedding Search",
            "PostgreSQL Database Operations",
            "Parallel Processing"
        ]
    }

# 헬스 체크
@app.get("/health", include_in_schema=False)
async def health_check():
    rabbitmq_status = rabbitmq_service.get_status() if 'rabbitmq_service' in globals() else {"status": "not_initialized"}
    return {
        "status": "healthy", 
        "service": "banchan-llm",
        "rabbitmq": rabbitmq_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",
        access_log=True
    )