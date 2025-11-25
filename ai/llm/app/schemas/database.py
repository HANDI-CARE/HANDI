from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Union
from datetime import datetime, time, date

class UserBase(BaseModel):
    """사용자 기본 스키마"""
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    """사용자 생성 스키마"""
    pass

class UserUpdate(BaseModel):
    """사용자 업데이트 스키마"""
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    """사용자 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UpdateResult(BaseModel):
    """업데이트 결과 스키마"""
    success: bool
    message: str
    updated_count: int
    data: Optional[UserResponse] = None

class MedicationScheduleUpdateRequest(BaseModel):
    """복약 일정 업데이트 요청 스키마"""
    id: int
    description: Union[Dict[str, Any], str] = Field(
        ..., 
        description="JSON 객체 또는 LLM 약물 분석 결과 문자열"
    )
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "id": 1,
                    "description": {
                        "medication": "약품명",
                        "dosage": "복용량",
                        "instructions": "복용 방법"
                    }
                },
                {
                    "id": 1,
                    "description": {
                        "타가틴정": {
                            "키워드": {
                                "효능 및 효과": "위염 개선, 궤양 치료, 역류성 식도염 완화",
                                "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                                "복약 시 주의 사항": "졸음 주의, 신장 기능 저하 시 감량, 유당불내증 주의"
                            },
                            "상세": {
                                "효능 및 효과": "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 완화하는 효과가 있습니다.",
                                "용법 및 용량": "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여하되, 신장 기능에 따라 용량을 조절해야 합니다. 최대 1일 2.4g을 초과하지 않도록 주의합니다.",
                                "복약 시 주의 사항": "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 줄여야 하며, 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 항응고제와 함께 복용할 경우 주의가 필요합니다."
                            }
                        },
                        "팜시버정": {
                            "키워드": {
                                "효능 및 효과": "대상포진 치료, 생식기포진 치료, 재발 억제",
                                "용법 및 용량": "1회 250mg, 하루 3회, 7일간 (대상포진), 5일간 (생식기포진)",
                                "복약 시 주의 사항": "졸음 주의, 신장장애 환자 주의, 유당불내증 주의"
                            },
                            "상세": {
                                "효능 및 효과": "팜시버정은 대상포진 바이러스 감염증과 생식기포진 감염증의 치료에 효과적입니다. 특히, 재발성 생식기포진의 억제에도 사용됩니다.",
                                "용법 및 용량": "대상포진 감염증의 경우, 성인은 1회 250mg을 하루 3회, 7일간 복용합니다. 초발성 생식기포진의 경우, 1회 250mg을 하루 3회, 5일간 복용합니다. 신장장애가 있는 경우에는 용량 조절이 필요하므로 주의해야 합니다.",
                                "복약 시 주의 사항": "복용 중 어지러움이나 졸음을 경험할 수 있으므로 주의가 필요합니다. 신장장애 환자는 용량 조절이 필수적이며, 유당을 포함하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 또한, 두통, 구역, 구토 등의 부작용이 나타날 수 있으니 주의 깊게 관찰해야 합니다."
                            }
                        },
                        "울트라셋정": {
                            "키워드": {
                                "효능 및 효과": "중등도-중증 통증 완화",
                                "용법 및 용량": "1회 2정, 하루 최대 8정, 6시간 간격",
                                "복약 시 주의 사항": "졸음 주의, 알코올 금지, 간기능 이상 주의"
                            },
                            "상세": {
                                "효능 및 효과": "울트라셋정은 중등도에서 중증의 급성 및 만성 통증을 완화하는 데 사용됩니다. 노인 환자에게도 효과적이며, 통증 관리에 도움을 줄 수 있습니다.",
                                "용법 및 용량": "12세 이상의 환자에게는 통증 정도에 따라 용량을 조절할 수 있으며, 초회 용량으로 2정을 투여하고 이후 최소 6시간 간격으로 복용합니다. 하루 최대 8정을 초과하지 않도록 하며, 75세 이상의 노인에게는 트라마돌의 반감기가 증가하므로 최소 6시간 간격을 유지해야 합니다. 신부전 환자는 크레아티닌 청소율에 따라 투여 간격을 조정해야 합니다.",
                                "복약 시 주의 사항": "이 약을 복용할 때 졸음이 올 수 있으므로 운전이나 위험한 기계 조작 시 주의해야 합니다. 또한, 정기적으로 술을 마시는 경우 반드시 전문가와 상의해야 하며, 간기능 이상 징후가 나타날 경우 즉시 전문가와 상담해야 합니다. 아세트아미노펜과 다른 해열진통제를 병용하지 않도록 주의해야 하며, 간장애 환자에게는 사용을 권장하지 않습니다."
                            }
                        }
                    }
                }
            ]
        }

class MedicationScheduleResponse(BaseModel):
    """복약 일정 응답 스키마"""
    id: int
    user_id: int
    medication_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    schedule_time: Optional[time] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MeetingMatchUpdateRequest(BaseModel):
    """미팅 매치 업데이트 요청 스키마"""
    content: str = Field(
        ..., 
        description="문자열 형태의 content"
    )
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "content": "미팅 매치가 완료되었습니다. 2025년 8월 7일 오후 2시에 서울시 강남구에서 상담이 예정되어 있습니다."
                }
            ]
        }

class MeetingMatchResponse(BaseModel):
    """미팅 매치 응답 스키마"""
    id: int
    user_id: int
    match_type: Optional[str] = None
    status: Optional[str] = None
    content: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True