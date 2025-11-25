"""
약물 분석 결과 평가 서비스
"""
import json
import re
import os
import httpx
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.schema.messages import HumanMessage, SystemMessage
from langchain_anthropic import ChatAnthropic
from langsmith import traceable, Client
from app.core.config.config import settings
from app.core.logger import logger
from app.schemas.drug_analysis import EvaluationResult, DrugGroundednessResult


class GeminiFlashLLM:
    """Gemini 2.0 Flash 직접 호출 + LangSmith 수동 기록"""
    
    def __init__(self):
        self.gms_key = settings.GMS_KEY
        if not self.gms_key:
            raise ValueError("GMS_KEY is not configured")
        self.api_url = f"https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gms_key}"
        
        # LangSmith 클라이언트 초기화
        self.langsmith_client = None
        if settings.LANGCHAIN_TRACING_V2.lower() == "true" and settings.LANGCHAIN_API_KEY:
            try:
                self.langsmith_client = Client(api_key=settings.LANGCHAIN_API_KEY)
            except Exception as e:
                logger.warning(f"LangSmith 클라이언트 초기화 실패: {e}")
    
    async def ainvoke(self, messages, run_name="gemini_evaluation", tags=None, metadata=None):
        """Gemini API 호출 + LangSmith 수동 기록"""
        # 기본값 설정
        if tags is None:
            tags = ["evaluation", "gemini", "groundedness"]
        if metadata is None:
            metadata = {"model": "gemini-2.0-flash", "temperature": 0}
        
        run_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        # LangSmith 시작 기록
        if self.langsmith_client:
            try:
                # 메시지를 문자열로 변환
                input_messages = []
                for msg in messages:
                    if isinstance(msg, SystemMessage):
                        input_messages.append({"role": "system", "content": msg.content})
                    elif isinstance(msg, HumanMessage):
                        input_messages.append({"role": "human", "content": msg.content})
                
                self.langsmith_client.create_run(
                    id=run_id,
                    name=run_name,
                    project_name=settings.LANGCHAIN_PROJECT,
                    run_type="llm",
                    inputs={"messages": input_messages},
                    tags=tags,
                    extra=metadata,
                    start_time=start_time
                )
            except Exception as e:
                logger.warning(f"LangSmith 시작 기록 실패: {e}")
        
        try:
            # Gemini API 호출
            contents = []
            for msg in messages:
                if isinstance(msg, SystemMessage):
                    if not contents:
                        contents.append({
                            "parts": [{
                                "text": f"System: {msg.content}\n\nUser: "
                            }]
                        })
                    else:
                        contents[0]["parts"][0]["text"] += f"System: {msg.content}\n\n"
                elif isinstance(msg, HumanMessage):
                    if contents and contents[0]["parts"][0]["text"].endswith("User: "):
                        contents[0]["parts"][0]["text"] += msg.content
                    else:
                        contents.append({
                            "parts": [{
                                "text": msg.content
                            }]
                        })
            
            request_data = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    headers={'Content-Type': 'application/json'},
                    json=request_data
                )
                
                if response.status_code != 200:
                    error_msg = f"Gemini API call failed: {response.status_code} - {response.text}"
                    
                    # LangSmith 오류 기록
                    if self.langsmith_client:
                        try:
                            self.langsmith_client.update_run(
                                run_id=run_id,
                                end_time=datetime.now(),
                                error=error_msg
                            )
                        except Exception:
                            pass
                    
                    raise Exception(error_msg)
                
                result = response.json()
                
                # 응답에서 텍스트 추출
                if 'candidates' in result and len(result['candidates']) > 0:
                    content = result['candidates'][0].get('content', {})
                    parts = content.get('parts', [])
                    if parts and 'text' in parts[0]:
                        response_text = parts[0]['text']
                        
                        # LangSmith 성공 기록
                        if self.langsmith_client:
                            try:
                                self.langsmith_client.update_run(
                                    run_id=run_id,
                                    end_time=datetime.now(),
                                    outputs={"content": response_text}
                                )
                            except Exception as e:
                                logger.warning(f"LangSmith 완료 기록 실패: {e}")
                        
                        # 응답 객체 생성
                        class GeminiResponse:
                            def __init__(self, content):
                                self.content = content
                        
                        return GeminiResponse(response_text)
                
                error_msg = "Failed to extract content from Gemini response"
                
                # LangSmith 오류 기록
                if self.langsmith_client:
                    try:
                        self.langsmith_client.update_run(
                            run_id=run_id,
                            end_time=datetime.now(),
                            error=error_msg
                        )
                    except Exception:
                        pass
                
                raise Exception(error_msg)
                
        except Exception as e:
            # LangSmith 예외 기록
            if self.langsmith_client:
                try:
                    self.langsmith_client.update_run(
                        run_id=run_id,
                        end_time=datetime.now(),
                        error=str(e)
                    )
                except Exception:
                    pass
            raise e

class DrugAnalysisEvaluationService:
    def __init__(self):
        self.llm = self._get_llm()
        self.drug_analysis_schema = self._get_drug_analysis_schema()
    
    def _get_llm(self):
        """평가용 LLM 인스턴스 생성 (Claude 3.5 Haiku via langchain-anthropic)"""
        if not settings.GMS_KEY:
            logger.warning("GMS_KEY가 설정되지 않음")
            return None
        
        try:
            # langchain-anthropic를 통해 Claude 3.5 Haiku 호출 (표준 Anthropic Messages API)
            return ChatAnthropic(
                model="claude-3-5-haiku-latest",
                api_key=settings.GMS_KEY,
                base_url="https://gms.ssafy.io/gmsapi/api.anthropic.com",
                max_tokens=4096,
                temperature=0.0,  # 평가의 일관성을 위해 0으로 설정
                max_retries=2,
                default_headers={"anthropic-version": "2023-06-01"}
            )
        except Exception as e:
            logger.warning(f"Claude 3.5 Haiku LLM 초기화 실패: {e}")
            # 실패 시 GPT-4o-mini로 폴백 (기존 방식)
            try:
                logger.info("GPT-4o-mini로 폴백합니다.")
                return ChatOpenAI(
                    model_name=settings.LLM_MODEL_NAME,
                    openai_api_key=settings.GMS_KEY,
                    openai_api_base=settings.GMS_API_URL,
                    temperature=0.0,  # 평가의 일관성을 위해 0으로 설정
                )
            except Exception as e2:
                logger.warning(f"GPT-4o-mini 폴백도 실패: {e2}")
                return None
    
    def _get_drug_analysis_schema(self):
        """약물 분석 결과 JSON 스키마 정의"""
        return {
            "type": "object",
            "patternProperties": {
                "^.+$": {  # 약물명 (동적 키)
                    "type": "object",
                    "properties": {
                        "키워드": {
                            "type": "object",
                            "properties": {
                                "효능 및 효과": {"type": "string"},
                                "용법 및 용량": {"type": "string"}, 
                                "복약 시 주의 사항": {"type": "string"}
                            },
                            "required": ["효능 및 효과", "용법 및 용량", "복약 시 주의 사항"]
                        },
                        "상세": {
                            "type": "object", 
                            "properties": {
                                "효능 및 효과": {"type": "string"},
                                "용법 및 용량": {"type": "string"},
                                "복약 시 주의 사항": {"type": "string"}
                            },
                            "required": ["효능 및 효과", "용법 및 용량", "복약 시 주의 사항"]
                        }
                    },
                    "required": ["키워드", "상세"]
                }
            }
        }
    
    @traceable(
        name="drug_hallucination_prevention_evaluation",
        tags=["evaluation", "hallucination_prevention"],
        metadata={
            "model": "claude-3-5-haiku-latest",
            "focus": "rag_hallucination_prevention"
        }
    )
    async def evaluate_drug_analysis(
        self, 
        drug_summary: list, 
        analysis_result: str,
        context_data: Optional[str] = None,
        note: Optional[str] = None
    ) -> EvaluationResult:
        """약물 분석 결과에 대한 환각 방지 중심 평가 (각 약물별 근거성 평가)"""
        evaluation = EvaluationResult()
        
        try:
            # 1. JSON 스키마 검증
            evaluation.json_schema_valid = self._validate_json_schema(analysis_result)
            
            # 2. 각 약물별 Groundedness 평가 (LLM과 컨텍스트가 있을 때만, note 포함)
            if self.llm and context_data:
                evaluation.drug_groundedness_scores = await self._per_drug_groundedness_evaluation(
                    drug_summary, analysis_result, context_data, note
                )
            
        except Exception as e:
            evaluation.evaluation_error = str(e)
            logger.warning(f"평가 중 오류 발생: {e}")
        
        return evaluation
    
    def _validate_json_schema(self, analysis_result: str) -> bool:
        """JSON 스키마 검증"""
        try:
            # JSON 파싱 시도
            parsed = json.loads(analysis_result)
            
            # 기본 구조 검증
            if not isinstance(parsed, dict):
                return False
            
            # 각 약물별 검증
            for drug_name, drug_data in parsed.items():
                if not isinstance(drug_data, dict):
                    return False
                
                # 키워드/상세 구조 확인
                if "키워드" not in drug_data or "상세" not in drug_data:
                    return False
                
                # 필수 필드 확인
                required_fields = ["효능 및 효과", "용법 및 용량", "복약 시 주의 사항"]
                
                for section in ["키워드", "상세"]:
                    if not isinstance(drug_data[section], dict):
                        return False
                    
                    for field in required_fields:
                        if field not in drug_data[section]:
                            return False
                        if not isinstance(drug_data[section][field], str):
                            return False
            
            return True
            
        except json.JSONDecodeError:
            return False
        except Exception:
            return False
    
    async def _get_single_drug_context(self, drug_item, all_context_data: str) -> str:
        """전체 컨텍스트에서 특정 약물의 컨텍스트만 추출"""
        try:
            # 약물명으로 해당 약물의 컨텍스트 섹션을 찾음
            drug_name = drug_item.name
            
            # === 약물명 === 으로 구분된 섹션 찾기
            sections = all_context_data.split("=== ")
            
            for section in sections:
                if section.startswith(drug_name):
                    # 해당 약물 섹션만 반환 (=== 포함해서 재구성)
                    return f"=== {section}"
            
            # 찾지 못한 경우 빈 문자열 반환
            logger.warning(f"약물 {drug_name}의 컨텍스트를 찾을 수 없음")
            return ""
            
        except Exception as e:
            logger.warning(f"약물별 컨텍스트 추출 실패: {e}")
            return ""

    async def _per_drug_groundedness_evaluation(
        self, 
        drug_summary: list, 
        analysis_result: str, 
        context_data: str,
        note: Optional[str] = None
    ) -> Optional[list[DrugGroundednessResult]]:
        """각 약물별 근거성 평가 (환각 방지)"""
        try:
            # 분석 결과를 JSON으로 파싱
            parsed_result = json.loads(analysis_result)
            drug_results = []
            
            # 각 약물별로 개별 근거성 평가
            for drug_item in drug_summary:
                drug_name = drug_item.name
                
                # 해당 약물의 분석 정보 추출
                drug_analysis = parsed_result.get(drug_name, {})
                if not drug_analysis:
                    drug_results.append(DrugGroundednessResult(
                        drug_name=drug_name,
                        groundedness_score=None,
                        evaluation_error=f"분석 결과에서 {drug_name} 정보를 찾을 수 없음"
                    ))
                    continue
                
                # 해당 약물의 개별 컨텍스트 추출
                single_drug_context = await self._get_single_drug_context(drug_item, context_data)
                
                # 개별 약물 근거성 평가 수행 (개별 컨텍스트 + note 사용)
                evaluation_result = await self._single_drug_groundedness_evaluation(
                    drug_name, drug_analysis, single_drug_context, note
                )
                
                # 딕셔너리에서 점수 추출
                if evaluation_result and isinstance(evaluation_result, dict):
                    score = evaluation_result.get('score')
                    error = evaluation_result.get('error')
                else:
                    score = None
                    error = "평가 결과를 받지 못함"
                
                drug_results.append(DrugGroundednessResult(
                    drug_name=drug_name,
                    groundedness_score=score,
                    evaluation_error=error if error else None
                ))
            
            return drug_results
            
        except Exception as e:
            logger.warning(f"약물별 근거성 평가 실패: {e}")
            return None
    
    @traceable(
        name="single_drug_groundedness_evaluation",
        tags=["evaluation", "groundedness", "per_drug"],
        metadata={
            "model": "claude-3-5-haiku-latest",
            "temperature": 0.0
        }
    )
    async def _single_drug_groundedness_evaluation(
        self, 
        drug_name: str, 
        drug_analysis: dict, 
        context_data: str,
        note: Optional[str] = None
    ) -> Optional[float]:
        """단일 약물에 대한 근거성 평가 (환각 방지)"""
        try:
            system_message = SystemMessage(content="""
당신은 의약품 정보의 근거성을 평가하는 전문가입니다.
특정 약물에 대한 분석이 제공된 컨텍스트 정보에만 기반하여 작성되었는지 0.0~1.0 점수로 평가하세요:

평가 기준:
1. 사실 근거성 (0.4): 컨텍스트에 명시된 약물 정보만 사용했는가?
2. 정보 일치성 (0.3): 컨텍스트와 모순되는 내용이 없는가?
3. 환각 방지 (0.3): 컨텍스트에 없는 정보를 임의로 추가하지 않았는가?

**중요한 출력 규칙:**
- 반드시 JSON 형식만 출력하세요
- JSON 외의 다른 텍스트나 설명은 절대 추가하지 마세요
- 점수는 반드시 소수점 2자리까지만 표시하세요
- reason은 50자 이내로 간단히 작성하세요

올바른 출력 형식:
{"score": 0.92, "reason": "효능은 정확하지만 용법에서 컨텍스트에 없는 정보가 포함됨"}

잘못된 출력 형식 (하지 마세요):
{"score": 0.92, "reason": "..."}

추가 설명이나 분석...
""")
            
            # 약물 분석 내용을 문자열로 변환
            drug_analysis_str = json.dumps(drug_analysis, ensure_ascii=False, indent=2)
            
            # note 정보가 있는 경우 추가
            note_section = ""
            if note and note.strip():
                note_section = f"""

환자 개인정보 (참고용):
{note.strip()}
(이 정보는 복약 지도에서 참고로 활용될 수 있으나, 컨텍스트 정보에 없는 새로운 약물 정보를 만들어내면 안 됩니다.)
"""

            user_content = f"""
평가 대상 약물: {drug_name}

컨텍스트 정보:
{context_data}{note_section}

해당 약물의 분석 결과:
{drug_analysis_str}

위 분석 결과가 컨텍스트에 근거하여 작성되었는지 평가해주세요.
특히 환각(hallucination)이 발생하지 않았는지 중점적으로 확인해주세요.
"""
            
            user_message = HumanMessage(content=user_content)
            
            # ChatAnthropic을 통한 호출 - 원래 방식
            response = await self.llm.ainvoke([system_message, user_message])
            
            # JSON 파싱
            result_text = response.content.strip()
            logger.debug(f"[{drug_name}] 원본 응답: {result_text}")
            
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            
            clean_text = result_text.strip()
            
            # JSON 부분만 추출 (첫 번째 }까지만)
            # Claude가 JSON 뒤에 추가 설명을 붙이는 경우가 있음
            try:
                # JSON이 시작하는 위치 찾기
                json_start = clean_text.find('{')
                if json_start != -1:
                    # 중괄호 균형을 맞춰서 JSON 끝 찾기
                    brace_count = 0
                    json_end = -1
                    for i, char in enumerate(clean_text[json_start:], json_start):
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                json_end = i + 1
                                break
                    
                    if json_end != -1:
                        clean_text = clean_text[json_start:json_end]
                        logger.debug(f"[{drug_name}] JSON 부분만 추출: {clean_text}")
            except Exception as extract_err:
                logger.debug(f"[{drug_name}] JSON 추출 중 오류 (원본 사용): {extract_err}")
            
            logger.debug(f"[{drug_name}] 최종 파싱할 텍스트: {clean_text}")
            
            try:
                result = json.loads(clean_text)
                score = float(result.get('score', 0.0))
            except json.JSONDecodeError as json_err:
                logger.error(f"[{drug_name}] JSON 파싱 실패!")
                logger.error(f"[{drug_name}] 에러: {json_err}")
                logger.error(f"[{drug_name}] 파싱 시도한 텍스트: {repr(clean_text)}")
                logger.error(f"[{drug_name}] 텍스트 길이: {len(clean_text)}")
                raise json_err
            
            # LangSmith outputs에 저장될 수 있도록 딕셔너리로 반환
            return {
                "score": score,
                "reason": result.get('reason', ''),
                "drug_name": drug_name
            }
            
        except Exception as e:
            logger.warning(f"약물 {drug_name} 근거성 평가 실패: {e}")
            return {
                "score": 0.0,
                "error": str(e),
                "drug_name": drug_name
            }

# 전역 평가 서비스 인스턴스
evaluation_service = DrugAnalysisEvaluationService()