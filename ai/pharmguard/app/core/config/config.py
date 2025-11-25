"""
애플리케이션 설정 및 환경변수 관리
"""
import os
from typing import Optional
from dotenv import load_dotenv

# 환경 변수 로드 (조용히)
load_dotenv()

# ChromaDB 설정
CHROMADB_HOST = os.getenv("CHROMADB_HOST", "localhost")
CHROMADB_PORT = int(os.getenv("CHROMADB_PORT", "8000"))
CHROMADB_COLLECTION_NAME = os.getenv("CHROMADB_COLLECTION_NAME", "medicine_total_info")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "upskyy/bge-m3-korean")

# Google Vision API 설정
GOOGLE_VISION_API_KEY = os.getenv("GOOGLE_VISION_API_KEY")
DRUG_DETECTION_THRESHOLD = float(os.getenv("DRUG_DETECTION_THRESHOLD", 0.7))

# 노인 위험 약물 관련 설정
SENIOR_DANGER_THRESHOLD = float(os.getenv("SENIOR_DANGER_THRESHOLD", 0.9))






# 프로젝트 메타데이터
PROJECT_NAME = "RAG 기반 이미지 약품 정보 요약 서비스"
VERSION = "1.0.0"
DESCRIPTION = "이미지 속 약품을 RAG(검색 증강 생성) 기술로 분석하여, 복용법과 주의사항을 자동으로 요약해주는 지능형 약품 정보 서비스"