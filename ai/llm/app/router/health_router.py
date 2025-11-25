"""
Health check 및 keep-alive 관련 라우터
"""
from fastapi import APIRouter
from app.services.keep_alive_service import keep_alive_service
from app.services.rabbitmq_service import rabbitmq_service
import time

router = APIRouter()

@router.get("/health")
async def health_check():
    """서버 상태 확인 (keep-alive용)"""
    return {
        "status": "healthy",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "message": "Server is running"
    }

@router.get("/keep-alive/status")
async def get_keep_alive_status():
    """Keep-alive 서비스 상태 조회"""
    return keep_alive_service.get_status()

@router.post("/keep-alive/start")
async def start_keep_alive():
    """Keep-alive 서비스 시작"""
    await keep_alive_service.start()
    return {"message": "Keep-alive service started", "status": keep_alive_service.get_status()}

@router.post("/keep-alive/stop")
async def stop_keep_alive():
    """Keep-alive 서비스 중지"""
    await keep_alive_service.stop()
    return {"message": "Keep-alive service stopped", "status": keep_alive_service.get_status()}

@router.get("/system/status")
async def get_system_status():
    """전체 시스템 상태 조회"""
    rabbitmq_status = rabbitmq_service.get_status()
    keep_alive_status = keep_alive_service.get_status()
    
    return {
        "server_time": time.strftime("%Y-%m-%d %H:%M:%S"),
        "rabbitmq": rabbitmq_status,
        "keep_alive": keep_alive_status,
        "system_status": "running"
    }