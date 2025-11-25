from pydantic import BaseModel
from typing import Optional

class LlmRequest(BaseModel):
    text: str

class LlmResponse(BaseModel):
    summary: str
    preprocessing_duration: Optional[float] = None
    llm_duration: float