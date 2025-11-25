from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.schemas.stt import SttResponse, WhisperModelSize
from app.services.whisper_service import whisper_service
import httpx
import datetime
from typing import Optional
from app.core.config.config import settings

router = APIRouter(prefix="/api/v1")

@router.post("/stt", response_model=SttResponse)
async def stt_endpoint(
    file: UploadFile = File(...),
    model: Optional[WhisperModelSize] = Form(WhisperModelSize.small)
):
    """STT only - Transcribes audio and returns full text with timing."""
    
    full_text, stt_duration, used_model = await whisper_service.transcribe_audio(file, model.value if model else None)
    
    return SttResponse(
        full_text=full_text,
        stt_duration=stt_duration,
        model_used=used_model
    )

@router.post("/stt-gms", response_model=SttResponse)
async def stt_gms_endpoint(
    file: UploadFile = File(...),
    model: Optional[str] = Form("whisper-1")
):
    """STT using OpenAI Whisper via GMS API."""
    
    if not settings.GMS_KEY:
        raise HTTPException(status_code=500, detail="GMS_KEY is not configured")
    
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
        
        return SttResponse(
            full_text=result.get("text", ""),
            stt_duration=stt_duration,
            model_used=model or "whisper-1"
        )
    
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request to GMS API failed: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"GMS API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")