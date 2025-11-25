"""
미들웨어 정의
"""
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 정적 파일과 docs 요청은 로깅하지 않음
        skip_paths = ["/favicon.ico", "/docs", "/redoc", "/openapi.json"]
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        start_time = time.time()
        
        # 요청 처리
        response = await call_next(request)
        
        # 처리 시간 계산
        process_time = time.time() - start_time
        
        # 클라이언트 IP 추출
        client_ip = request.client.host if request.client else "unknown"
        
        # HTTP 메서드와 경로
        method = request.method
        path = request.url.path
        
        # 상태별 로그 레벨 조정
        if response.status_code >= 500:
            log_level = "ERROR"
        elif response.status_code >= 400:
            log_level = "WARNING"
        else:
            log_level = "INFO"
        
        # 처리 시간에 따른 표시
        if process_time < 0.1:
            speed_info = "[F]"  # Fast
        elif process_time < 1.0:
            speed_info = "[N]"  # Normal
        elif process_time < 5.0:
            speed_info = "[S]"  # Slow
        else:
            speed_info = "[X]"  # Very Slow
        
        # 로그 메시지 생성
        log_message = f"{speed_info} {method} {path} - {response.status_code} - {process_time:.3f}s - {client_ip}"
        
        # 로그 출력
        if log_level == "ERROR":
            logger.error(log_message)
        elif log_level == "WARNING":
            logger.warning(log_message)
        else:
            logger.info(log_message)
        
        return response