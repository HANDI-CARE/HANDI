from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.schemas.stt import SttLlmResponse, Timings, WhisperModelSize
from app.services.whisper_service import whisper_service
from app.services.llm_service import llm_service
from app.core.logger import log_api_timing
import httpx
import datetime
from typing import Optional
from app.core.config.config import settings

router = APIRouter(prefix="/api/v1", tags=["STT & LLM"])

@router.post("/stt-langchain", response_model=SttLlmResponse)
async def stt_langchain_endpoint(
    file: UploadFile = File(...),
    model: Optional[WhisperModelSize] = Form(WhisperModelSize.small)
):
    """(Stuff 우선, 실패시 Map-Reduce) Transcribes, summarizes, and returns results with timings."""
    
    start_time = datetime.datetime.now()
    
    full_text, stt_duration, used_model = await whisper_service.transcribe_audio(file, model.value if model else None)
    
    if not full_text.strip():
        total_time = (datetime.datetime.now() - start_time).total_seconds()
        log_api_timing("/api/v1/stt-langchain", total_time, stt=stt_duration, preprocessing=0.0, llm=0.0)
        return SttLlmResponse(
            full_text="",
            summary="(음성이 감지되지 않았습니다)",
            timings=Timings(stt_duration=stt_duration, preprocessing_duration=0, total_llm_duration=0),
            model_used=used_model
        )
    
    # 1. 먼저 Stuff 방식 시도
    try:
        summary_result, llm_duration = await llm_service.summarize_direct(full_text)
        preprocessing_duration = 0.0
        
        # context_length_exceeded 에러 메시지 체크
        if "context_length_exceeded" in summary_result or "입력 텍스트가 모델이 한 번에 처리하기에는 너무 깁니다" in summary_result:
            raise Exception("Context length exceeded, fallback to Map-Reduce")
            
    except Exception:
        # 2. Stuff 실패시 Map-Reduce로 폴백
        summary_result, preprocessing_duration, llm_duration = await llm_service.summarize_with_langchain(full_text)
    
    total_time = (datetime.datetime.now() - start_time).total_seconds()
    log_api_timing("/api/v1/stt-langchain", total_time, stt=stt_duration, preprocessing=preprocessing_duration, llm=llm_duration)
    
    return SttLlmResponse(
        full_text=full_text,
        summary=summary_result,
        timings=Timings(
            stt_duration=stt_duration,
            preprocessing_duration=preprocessing_duration,
            total_llm_duration=llm_duration
        ),
        model_used=used_model
    )

@router.post("/stt-langchain-gms", response_model=SttLlmResponse)
async def stt_langchain_gms_endpoint(
    file: UploadFile = File(...),
    model: Optional[str] = Form("whisper-1")
):
    """STT via GMS + LLM (Stuff 우선, 실패시 Map-Reduce) - Transcribes via GMS, summarizes and returns results with timings."""
    
    start_time = datetime.datetime.now()
    
    if not settings.GMS_KEY:
        raise HTTPException(status_code=500, detail="GMS_KEY is not configured")
    
    # STT via GMS
    stt_start_time = datetime.datetime.now()
    
    url = f"{settings.GMS_API_URL}/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {settings.GMS_KEY}"
    }
    
    file_content = await file.read()
    await file.seek(0)
    
    files = {
        "file": (file.filename, file_content, file.content_type)
    }
    data = {
        "model": model or "whisper-1"
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, files=files, data=data)
            response.raise_for_status()
            result = response.json()
            
        stt_duration = (datetime.datetime.now() - stt_start_time).total_seconds()
        full_text = result.get("text", "")
        used_model = model or "whisper-1"
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request to GMS API failed: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"GMS API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
    
    if not full_text.strip():
        total_time = (datetime.datetime.now() - start_time).total_seconds()
        log_api_timing("/api/v1/stt-langchain-gms", total_time, stt=stt_duration, preprocessing=0.0, llm=0.0)
        return SttLlmResponse(
            full_text="",
            summary="(음성이 감지되지 않았습니다)",
            timings=Timings(stt_duration=stt_duration, preprocessing_duration=0, total_llm_duration=0),
            model_used=used_model
        )
    
    # 1. 먼저 Stuff 방식 시도
    try:
        summary_result, llm_duration = await llm_service.summarize_direct(full_text)
        preprocessing_duration = 0.0
        
        # context_length_exceeded 에러 메시지 체크
        if "context_length_exceeded" in summary_result or "입력 텍스트가 모델이 한 번에 처리하기에는 너무 깁니다" in summary_result:
            raise Exception("Context length exceeded, fallback to Map-Reduce")
            
    except Exception:
        # 2. Stuff 실패시 Map-Reduce로 폴백
        summary_result, preprocessing_duration, llm_duration = await llm_service.summarize_with_langchain(full_text)
    
    total_time = (datetime.datetime.now() - start_time).total_seconds()
    log_api_timing("/api/v1/stt-langchain-gms", total_time, stt=stt_duration, preprocessing=preprocessing_duration, llm=llm_duration)
    
    return SttLlmResponse(
        full_text=full_text,
        summary=summary_result,
        timings=Timings(
            stt_duration=stt_duration,
            preprocessing_duration=preprocessing_duration,
            total_llm_duration=llm_duration
        ),
        model_used=used_model
    )