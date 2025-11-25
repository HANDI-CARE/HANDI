"""
Keep-alive 서비스 - 서버가 sleep 모드로 들어가는 것을 방지
"""
import asyncio
import aiohttp
import logging
import time
from typing import Optional
from app.core.config.config import settings

logger = logging.getLogger(__name__)

class KeepAliveService:
    def __init__(self):
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        self.ping_interval = 50  # 50초마다 ping (60초 timeout 전에)
        self.server_url = self._get_server_url()
    
    def _get_server_url(self) -> str:
        """서버 URL 생성"""
        # 환경변수에서 서버 URL을 가져오거나 기본값 사용
        if hasattr(settings, 'SERVER_URL') and settings.SERVER_URL:
            return settings.SERVER_URL
        
        # 로컬 개발환경
        host = getattr(settings, 'HOST', '0.0.0.0')
        port = getattr(settings, 'PORT', 8000)
        
        if host == '0.0.0.0':
            host = 'localhost'
        
        return f"http://{host}:{port}"
    
    async def _ping_server(self):
        """서버에 ping 요청을 보냄"""
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                ping_url = f"{self.server_url}/health"  # health check endpoint
                async with session.get(ping_url) as response:
                    if response.status == 200:
                        logger.debug(f"Keep-alive ping successful: {response.status}")
                        return True
                    else:
                        logger.warning(f"Keep-alive ping returned status {response.status}")
                        return False
        except Exception as e:
            logger.error(f"Keep-alive ping failed: {str(e)}")
            return False
    
    async def _keep_alive_loop(self):
        """Keep-alive 루프"""
        logger.info(f"Keep-alive service started - pinging {self.server_url} every {self.ping_interval} seconds")
        
        while self.is_running:
            try:
                await asyncio.sleep(self.ping_interval)
                
                if not self.is_running:
                    break
                
                success = await self._ping_server()
                current_time = time.strftime("%Y-%m-%d %H:%M:%S")
                
                if success:
                    logger.info(f"[{current_time}] Keep-alive: Server is awake ✅")
                else:
                    logger.warning(f"[{current_time}] Keep-alive: Ping failed ❌")
                
            except asyncio.CancelledError:
                logger.info("Keep-alive loop cancelled")
                break
            except Exception as e:
                logger.error(f"Keep-alive loop error: {str(e)}")
                await asyncio.sleep(5)  # 에러 시 잠시 대기
    
    async def start(self):
        """Keep-alive 서비스 시작"""
        if self.is_running:
            logger.warning("Keep-alive service is already running")
            return
        
        self.is_running = True
        self.task = asyncio.create_task(self._keep_alive_loop())
        logger.info("Keep-alive service started")
    
    async def stop(self):
        """Keep-alive 서비스 중지"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        
        logger.info("Keep-alive service stopped")
    
    def get_status(self) -> dict:
        """Keep-alive 서비스 상태 반환"""
        return {
            "is_running": self.is_running,
            "server_url": self.server_url,
            "ping_interval": self.ping_interval,
            "task_status": "running" if self.task and not self.task.done() else "stopped"
        }

# 전역 인스턴스
keep_alive_service = KeepAliveService()