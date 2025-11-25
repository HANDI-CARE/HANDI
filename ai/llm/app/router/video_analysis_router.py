"""
비디오 분석 API 라우터
"""
from fastapi import APIRouter
from app.schemas.video_analysis import VideoSummaryRequest, VideoSummaryResponse
from app.services.video_analysis_service import video_analysis_service

router = APIRouter(prefix="/video")

@router.post("/video-summary", response_model=VideoSummaryResponse)
async def analyze_video_summary(request: VideoSummaryRequest):
    """
    MinIO에서 비디오/오디오 파일을 다운받아 STT + LLM 요약 처리
    
    **기능:**
    - MinIO URL에서 비디오/오디오 파일 다운로드
    - GMS API Whisper-1을 사용한 음성 전사 (STT)
    - Stuff 우선 처리, 실패시 Map-Reduce 폴백으로 LLM 요약
    - 각 단계별 처리 시간 측정 및 반환
    
    **처리 과정:**
    1. MinIO에서 파일 다운로드
    2. GMS API Whisper-1로 STT 처리 (/api/v1/stt-langchain-gms와 동일)
    3. Stuff 방식으로 LLM 요약 시도, 실패시 Map-Reduce로 폴백
    4. 임시 파일 정리
    
    **입력 형식:**
    ```json
    {
      "video_url": "http://localhost:9000/bucket-name/audio-file.wav"
    }
    ```
    
    **출력 형식:**
    ```json
    {
      "stt_result": "음성 전사된 텍스트 내용...",
      "llm_result": "요약된 텍스트 내용...",
      "processing_times": {
        "minio_download_time": 1.23,
        "stt_processing_time": 5.67,
        "llm_processing_time": 2.34,
        "total_processing_time": 9.24
      },
      "success": true,
      "message": "비디오 요약이 성공적으로 완료되었습니다."
    }
    ```
    
    **지원 파일 형식:**
    - 오디오: WAV, MP3, M4A, FLAC 등
    - 비디오: MP4, AVI, MOV 등 (음성 트랙 추출)
    
    **MinIO URL 형식:**
    - http://localhost:9000/bucket-name/file-name.wav
    - https://your-minio-server.com/bucket-name/audio.mp3
    """
    return await video_analysis_service.process_video_summary(request)