from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class RabbitMQMessage(BaseModel):
    timestamp: float
    message: str
    routing_key: str
    delivery_tag: int
    processed_at: str

class RabbitMQStatus(BaseModel):
    is_consuming: bool
    consumed_messages: Dict[str, int]
    connection_status: str

class RabbitMQMessagesResponse(BaseModel):
    messages: List[RabbitMQMessage]

class RabbitMQOperationResponse(BaseModel):
    message: str

class RabbitMQConnectionTestResponse(BaseModel):
    message: str