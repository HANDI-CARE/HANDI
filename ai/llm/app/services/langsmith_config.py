"""
LangSmith 단일 프로젝트 태그 기반 설정 및 관리
"""
import os
from typing import Dict, List, Optional
from contextlib import contextmanager
from langsmith import Client
from app.core.config.config import settings

class LangSmithTagManager:
    """LangSmith 태그 기반 관리 클래스"""
    
    def __init__(self):
        self.client = None
        self.project_name = settings.LANGCHAIN_PROJECT  # API 비교용 프로젝트
        self.rabbitmq_project_name = "RabbitMQ"  # RabbitMQ 전용 프로젝트
        
        # LangSmith가 활성화된 경우에만 클라이언트 초기화
        if settings.LANGCHAIN_TRACING_V2.lower() == "true" and settings.LANGCHAIN_API_KEY:
            try:
                self.client = Client(api_key=settings.LANGCHAIN_API_KEY)
            except Exception as e:
                print(f"Warning: LangSmith client initialization failed: {e}")
    
    def get_tags_and_metadata(self, method_type: str, context: str = "api") -> tuple[List[str], Dict[str, str]]:
        """메서드 타입과 컨텍스트에 따른 태그 및 메타데이터 반환"""
        
        # RabbitMQ 컨텍스트의 경우
        if context == "rabbitmq":
            if method_type == "drug_analysis":
                tags = ["rabbitmq", "drug_analysis", "async"]
                metadata = {
                    "context": "rabbitmq",
                    "message_type": "drug-summary",
                    "model": settings.LLM_MODEL_NAME,
                    "temperature": str(settings.LLM_TEMPERATURE),
                    "processing": "async_queue"
                }
            elif method_type == "video_analysis":
                tags = ["rabbitmq", "video_analysis", "async"]
                metadata = {
                    "context": "rabbitmq",
                    "message_type": "video-summary", 
                    "model": settings.LLM_MODEL_NAME,
                    "temperature": str(settings.LLM_TEMPERATURE),
                    "processing": "async_queue"
                }
            else:
                tags = ["rabbitmq", "unknown"]
                metadata = {"context": "rabbitmq", "method": "unknown"}
        
        # API 비교 컨텍스트의 경우 (기존 로직)
        else:
            if method_type == "stuff":
                tags = ["abtest", "A"]
                metadata = {
                    "context": "api_comparison",
                    "method": "A",
                    "model": settings.LLM_MODEL_NAME,
                    "temperature": str(settings.LLM_TEMPERATURE),
                    "approach": "stuff_documents",
                    "processing": "sequential"
                }
            elif method_type == "langchain":
                tags = ["abtest", "B"]
                metadata = {
                    "context": "api_comparison",
                    "method": "B", 
                    "model": settings.LLM_MODEL_NAME,
                    "temperature": str(settings.LLM_TEMPERATURE),
                    "approach": "map_reduce_chain",
                    "processing": "parallel"
                }
            elif method_type == "comparison":
                tags = ["abtest", "comparison"]
                metadata = {
                    "context": "api_comparison",
                    "method": "comparison",
                    "model": settings.LLM_MODEL_NAME,
                    "temperature": str(settings.LLM_TEMPERATURE),
                    "approach": "performance_analysis"
                }
            else:
                tags = ["general"]
                metadata = {"context": "api", "method": "unknown"}
        
        return tags, metadata
    
    def ensure_project_exists(self, project_type: str = "api"):
        """프로젝트 타입에 따라 해당 프로젝트가 존재하는지 확인하고 없으면 생성"""
        if not self.client:
            print(f"LangSmith client not initialized - project check skipped")
            return
        
        try:
            existing_projects = [p.name for p in self.client.list_projects()]
            
            if project_type == "rabbitmq":
                target_project = self.rabbitmq_project_name
                description = "RabbitMQ async processing traces"
                purpose = "for RabbitMQ async processing"
            else:
                target_project = self.project_name  
                description = "Drug analysis A/B testing with tags"
                purpose = "for Drug LLM Test A/B comparison"
            
            if target_project not in existing_projects:
                self.client.create_project(
                    project_name=target_project,
                    description=description
                )
                print(f"LangSmith project created: '{target_project}' ({purpose})")
            else:
                print(f"LangSmith project connected: '{target_project}' ({purpose})")
        except Exception as e:
            print(f"Failed to initialize LangSmith project: {e}")
    
    def get_project_name(self, context: str = "api") -> str:
        """컨텍스트에 따른 프로젝트명 반환"""
        if context == "rabbitmq":
            return self.rabbitmq_project_name
        else:
            return self.project_name
    
    @contextmanager
    def project_context(self, context: str = "api"):
        """프로젝트 컨텍스트 매니저 - 스레드 안전"""
        target_project = self.get_project_name(context)
        original_project = os.environ.get("LANGCHAIN_PROJECT")
        
        try:
            # 임시로 프로젝트 변경
            os.environ["LANGCHAIN_PROJECT"] = target_project
            print(f"LangSmith project context switched to: {target_project}")
            yield target_project
        finally:
            # 원래 프로젝트로 복원
            if original_project:
                os.environ["LANGCHAIN_PROJECT"] = original_project
            elif "LANGCHAIN_PROJECT" in os.environ:
                del os.environ["LANGCHAIN_PROJECT"]

# 전역 인스턴스 (태그 기반 관리로 변경)
langsmith_manager = LangSmithTagManager()