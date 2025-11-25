import logging
import sys
from datetime import datetime

def setup_logger():
    """로거 설정"""
    logger = logging.getLogger("banchan_llm")
    
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.INFO)
    
    # 콘솔 핸들러
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    # 포맷터
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    
    return logger

# 전역 로거 인스턴스
logger = setup_logger()

def log_api_timing(endpoint: str, total_time: float, **kwargs):
    """API 처리 시간 로그"""
    log_msg = f"[{endpoint}] Total: {total_time:.3f}s"
    
    if kwargs:
        details = ", ".join([f"{k}: {v:.3f}s" for k, v in kwargs.items() if isinstance(v, (int, float))])
        if details:
            log_msg += f" | {details}"
    
    logger.info(log_msg)