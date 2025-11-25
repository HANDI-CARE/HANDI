"""
문서 OCR 및 NER 관련 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class BoundingBox(BaseModel):
    """바운딩박스 좌표"""
    x1: int = Field(..., description="좌상단 X 좌표")
    y1: int = Field(..., description="좌상단 Y 좌표") 
    x2: int = Field(..., description="우하단 X 좌표")
    y2: int = Field(..., description="우하단 Y 좌표")

class DetectedEntity(BaseModel):
    """탐지된 엔티티 정보"""
    word: str = Field(..., description="탐지된 단어")
    entity: str = Field(..., description="엔티티 타입 (영문)")
    entity_type: str = Field(..., description="엔티티 타입 (영문)")
    entity_type_ko: str = Field(..., description="엔티티 타입 (한국어)")
    score: float = Field(..., description="신뢰도 점수", ge=0.0, le=1.0)

class WordBox(BaseModel):
    """단어와 바운딩박스 정보"""
    text: str = Field(..., description="인식된 텍스트")
    bounding_box: BoundingBox = Field(..., description="바운딩박스 좌표")
    detected_entity: Optional[DetectedEntity] = Field(None, description="탐지된 엔티티 정보 (있는 경우)")

class MaskingRequest(BaseModel):
    """마스킹 요청"""
    word_boxes: List[WordBox] = Field(..., description="마스킹할 단어 박스 목록")

class DocumentDetectionResponse(BaseModel):
    """문서 탐지 응답"""
    word_boxes: List[WordBox] = Field(..., description="탐지된 단어 박스 목록")

class MaskingResponse(BaseModel):
    """마스킹 응답"""
    file_url: str = Field(..., description="마스킹된 이미지 URL")

class ErrorResponse(BaseModel):
    """에러 응답"""
    error: str = Field(..., description="에러 메시지")