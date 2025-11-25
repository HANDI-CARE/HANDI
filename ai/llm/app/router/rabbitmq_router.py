from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, List
from app.services.rabbitmq_service import rabbitmq_service

router = APIRouter(prefix="/rabbitmq")

@router.post("/start-consuming")
async def start_consuming(background_tasks: BackgroundTasks):
    """RabbitMQ 메시지 소비를 시작합니다."""
    
    if not rabbitmq_service.start_consuming():
        raise HTTPException(status_code=400, detail="Consumer is already running")
    
    return {"message": "Started consuming messages from RabbitMQ queues"}

@router.post("/stop-consuming")
async def stop_consuming():
    """RabbitMQ 메시지 소비를 중지합니다."""
    
    if not rabbitmq_service.stop_consuming():
        raise HTTPException(status_code=400, detail="Consumer is not running")
    
    return {"message": "Stopped consuming messages from RabbitMQ queues"}

@router.get("/status")
async def get_status() -> Dict[str, Any]:
    """RabbitMQ 소비자의 현재 상태를 반환합니다."""
    
    return rabbitmq_service.get_status()

@router.get("/messages")
async def get_consumed_messages() -> Dict[str, List[Dict[str, Any]]]:
    """소비한 메시지 목록을 반환합니다."""
    
    return {
        "messages": rabbitmq_service.get_messages()
    }

@router.delete("/messages")
async def clear_consumed_messages():
    """소비한 메시지 목록을 삭제합니다."""
    
    rabbitmq_service.clear_messages()
    return {"message": "Consumed messages cleared"}

@router.post("/test-connection")
async def test_connection():
    """RabbitMQ 연결을 테스트합니다."""
    
    if rabbitmq_service.test_connection():
        return {"message": "RabbitMQ connection test successful"}
    else:
        raise HTTPException(status_code=500, detail="Failed to connect to RabbitMQ")

@router.get("/test-minio")
async def test_minio():
    """MinIO 연결을 테스트합니다."""
    
    result = rabbitmq_service.test_minio_connection()
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=500, detail=result["error"])