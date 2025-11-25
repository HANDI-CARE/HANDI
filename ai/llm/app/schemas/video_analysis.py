"""
비디오 분석 관련 Pydantic 모델들
"""
from typing import Optional
from pydantic import BaseModel, Field


class VideoSummaryRequest(BaseModel):
    """비디오 요약 요청 모델"""
    video_url: str = Field(
        ..., 
        description="MinIO에서 제공된 비디오/오디오 파일 URL",
        example="http://localhost:9000/bucket-name/audio-file.wav"
    )


class ProcessingTimes(BaseModel):
    """처리 시간 정보"""
    minio_download_time: float = Field(..., description="MinIO 파일 다운로드 시간 (초)")
    stt_processing_time: float = Field(..., description="STT 처리 시간 (초)")
    llm_processing_time: float = Field(..., description="LLM 요약 처리 시간 (초)")
    total_processing_time: float = Field(..., description="전체 처리 시간 (초)")


class VideoSummaryResponse(BaseModel):
    """비디오 요약 응답 모델"""
    stt_result: str = Field(..., description="음성 전사 결과")
    llm_result: str = Field(..., description="LLM 요약 결과")
    processing_times: ProcessingTimes = Field(..., description="각 단계별 처리 시간")
    success: bool = Field(..., description="처리 성공 여부")
    message: str = Field(..., description="처리 결과 메시지")


class VideoSummaryTestRequest(BaseModel):
    """비디오 요약 테스트 요청 모델"""
    test_id: str = Field(..., description="테스트 ID", example="test_001")


class VideoSummaryTestResponse(BaseModel):
    """비디오 요약 테스트 응답 모델"""
    test_id: str = Field(..., description="테스트 ID")
    stt_result: str = Field(..., description="음성 전사 결과")
    llm_result: str = Field(..., description="LLM 요약 결과") 
    processing_times: ProcessingTimes = Field(..., description="각 단계별 처리 시간")
    success: bool = Field(..., description="처리 성공 여부")
    message: str = Field(..., description="처리 결과 메시지")
    stt_method_used: str = Field(..., description="사용된 STT 방법", example="GMS_API" or "faster_whisper")
    fallback_occurred: bool = Field(..., description="폴백이 발생했는지 여부")