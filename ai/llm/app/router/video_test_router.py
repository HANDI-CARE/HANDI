"""
비디오 요약 STT 폴백 테스트용 라우터
GMS API와 faster-whisper 폴백 로직을 테스트하기 위한 엔드포인트
"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.services.video_analysis_service import video_analysis_service
from app.schemas.video_analysis import VideoSummaryTestResponse
from app.core.logger import logger

router = APIRouter(prefix="/video-test")

@router.post("/stt-fallback-test", response_model=VideoSummaryTestResponse)
async def test_stt_fallback(
    file: UploadFile = File(..., description="테스트할 음성/비디오 파일"),
    test_id: str = Form(..., description="테스트 ID")
):
    """
    STT 폴백 로직 테스트 API
    
    - GMS API를 먼저 시도하고, 실패시 faster-whisper로 폴백
    - DB에 저장하지 않고 결과만 반환
    - GMS_KEY 환경변수를 제거하여 폴백 테스트 가능
    
    Args:
        file: 음성/비디오 파일 (ogg, wav, mp3, mp4 등)
        test_id: 테스트 식별용 ID
        
    Returns:
        VideoSummaryTestResponse: STT/LLM 결과 및 폴백 정보
    """
    try:
        logger.info(f"🧪 STT 폴백 테스트 시작 - test_id: {test_id}, file: {file.filename}")
        
        # video_analysis_service의 테스트용 메서드 호출
        result = await video_analysis_service.process_video_summary_test(file, test_id)
        
        return result
        
    except Exception as e:
        logger.error(f"❌ STT 폴백 테스트 실패 - test_id: {test_id}, error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"STT 폴백 테스트 실패: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """테스트 라우터 상태 확인"""
    return {
        "status": "healthy",
        "message": "Video STT fallback test router is running",
        "test_endpoint": "/video-test/stt-fallback-test"
    }