from fastapi import APIRouter, HTTPException
from app.schemas.llm import LlmRequest, LlmResponse
from app.services.llm_service import llm_service
from app.core.logger import log_api_timing
import datetime

router = APIRouter(prefix="/api/v1")

@router.post("/llm-stuff", response_model=LlmResponse)
async def llm_stuff_endpoint(request: LlmRequest):
    """LLM only (Direct Stuffing) - Summarizes text and returns results with timing."""
    
    start_time = datetime.datetime.now()
    
    if not request.text.strip():
        total_time = (datetime.datetime.now() - start_time).total_seconds()
        log_api_timing("/api/v1/llm-stuff", total_time, llm=0.0)
        return LlmResponse(
            summary="(No text provided)",
            llm_duration=0.0
        )
    
    summary_result, llm_duration = await llm_service.summarize_direct(request.text)
    
    total_time = (datetime.datetime.now() - start_time).total_seconds()
    log_api_timing("/api/v1/llm-stuff", total_time, llm=llm_duration)
    
    return LlmResponse(
        summary=summary_result,
        llm_duration=llm_duration
    )

@router.post("/llm-langchain", response_model=LlmResponse)
async def llm_langchain_endpoint(request: LlmRequest):
    """LLM only (LangChain Map-Reduce) - Summarizes text and returns results with timing."""
    
    start_time = datetime.datetime.now()
    
    if not request.text.strip():
        total_time = (datetime.datetime.now() - start_time).total_seconds()
        log_api_timing("/api/v1/llm-langchain", total_time, preprocessing=0.0, llm=0.0)
        return LlmResponse(
            summary="(No text provided)",
            preprocessing_duration=0.0,
            llm_duration=0.0
        )
    
    summary_result, preprocessing_duration, llm_duration = await llm_service.summarize_with_langchain(request.text)
    
    total_time = (datetime.datetime.now() - start_time).total_seconds()
    log_api_timing("/api/v1/llm-langchain", total_time, preprocessing=preprocessing_duration, llm=llm_duration)
    
    return LlmResponse(
        summary=summary_result,
        preprocessing_duration=preprocessing_duration,
        llm_duration=llm_duration
    )

@router.post("/llm-chaining", response_model=LlmResponse)
async def llm_chaining_endpoint(request: LlmRequest):
    """LLM only (Map-Reduce-Chaining) - 순차적으로 이전 결과를 다음 입력에 활용하여 재귀적 요약"""
    
    start_time = datetime.datetime.now()
    
    if not request.text.strip():
        total_time = (datetime.datetime.now() - start_time).total_seconds()
        log_api_timing("/api/v1/llm-chaining", total_time, preprocessing=0.0, llm=0.0)
        return LlmResponse(
            summary="(No text provided)",
            preprocessing_duration=0.0,
            llm_duration=0.0
        )
    
    summary_result, preprocessing_duration, llm_duration = await llm_service.summarize_with_chaining(request.text)
    
    total_time = (datetime.datetime.now() - start_time).total_seconds()
    log_api_timing("/api/v1/llm-chaining", total_time, preprocessing=preprocessing_duration, llm=llm_duration)
    
    return LlmResponse(
        summary=summary_result,
        preprocessing_duration=preprocessing_duration,
        llm_duration=llm_duration
    )