"""
애플리케이션 진입점
"""
import uvicorn
import logging
from app.main import app

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5500,
        reload=False,
        log_level="info"
    )