from fastapi import APIRouter
from app.core.database import test_connection

router = APIRouter()

@router.get("/health", summary="데이터베이스 연결 상태 확인")
async def database_health():
    """데이터베이스 연결 상태를 확인합니다."""
    is_connected = await test_connection()
    return {
        "database_status": "connected" if is_connected else "disconnected",
        "message": "Database connection is healthy" if is_connected else "Database connection failed"
    }