from pydantic import BaseModel
from enum import Enum
from typing import Optional

class WhisperModelSize(str, Enum):
    tiny = "tiny"
    base = "base"
    small = "small"
    medium = "medium"
    large = "large"
    large_v2 = "large-v2"
    large_v3 = "large-v3"

class Timings(BaseModel):
    stt_duration: float
    preprocessing_duration: float
    total_llm_duration: float

class SttLlmResponse(BaseModel):
    full_text: str
    summary: str
    timings: Timings
    model_used: Optional[str] = None

class SttResponse(BaseModel):
    full_text: str
    stt_duration: float
    model_used: Optional[str] = None