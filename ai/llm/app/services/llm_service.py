import datetime
import asyncio
from fastapi import HTTPException
from langchain_openai import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema.messages import HumanMessage, SystemMessage
from app.core.config.config import settings
from app.core.logger import logger

class LLMService:
    def __init__(self):
        self.llm = self._get_llm()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        
        # 통일된 시스템 메시지
        self.system_message = "당신은 노인 관련 화상 회의 전문 요약가입니다. 항상 한국어로 답변하며, 노인의 건강과 상담 내용을 중심으로 요약합니다."
        
        # 통일된 기본 프롬프트 템플릿
        self.base_prompt_template = """당신은 노인 관련 화상 회의를 10년간 요약해온 전문 요약 전문가입니다.
아래 화상 회의 내용을 체계적으로 요약해주세요.

특히 다음 사항들에 주의하여 요약해주세요:

1. **주요 변경사항**: 노인의 건강상태, 치료방법, 처방약 등의 변화
2. **상담 및 진료 내용**: 의료진과의 상담, 증상 논의, 진단 결과
3. **중요 일정**: 다음 진료 예약, 검사 일정, 치료 계획
4. **기타 주목사항**: 가족 상담, 생활 지침, 주의사항 등

**반드시 한국어로 답변하고, 노인의 상태와 상황을 중심으로 요약해주세요.**

---
회의 내용:
{text}
---

화상 회의 요약:"""
    
    def _get_llm(self):
        if not settings.GMS_KEY:
            raise HTTPException(status_code=500, detail="GMS_KEY is not configured in .env file.")
        
        return ChatOpenAI(
            model_name=settings.LLM_MODEL_NAME,
            openai_api_key=settings.GMS_KEY,
            openai_api_base=settings.GMS_API_URL,
            temperature=settings.LLM_TEMPERATURE,
        )
    
    async def summarize_direct(self, text: str) -> tuple[str, float]:
        """Stuff 방식: 전체 텍스트를 한 번에 처리"""
        if not text.strip():
            return "(음성이 감지되지 않았습니다)", 0.0
        
        llm_start_time = datetime.datetime.now()
        try:
            prompt = self.base_prompt_template.format(text=text)
            messages = [
                SystemMessage(content=self.system_message),
                HumanMessage(content=prompt)
            ]
            response = await self.llm.ainvoke(messages)
            summary_result = response.content
            
        except Exception as e:
            if "context_length_exceeded" in str(e):
                summary_result = "(오류: 입력 텍스트가 모델이 한 번에 처리하기에는 너무 깁니다.)"
            else:
                raise HTTPException(status_code=500, detail=f"요약 중 오류가 발생했습니다: {e}")
        
        llm_duration = (datetime.datetime.now() - llm_start_time).total_seconds()
        return summary_result, llm_duration
    
    async def _summarize_chunk(self, chunk_text: str, chunk_index: int = 0) -> str:
        """단일 청크 요약 (병렬 처리용)"""
        chunk_start_time = datetime.datetime.now()
        
        chunk_prompt = f"""당신은 노인 관련 화상 회의를 10년간 요약해온 전문 요약 전문가입니다.
아래 화상 회의 내용의 일부를 간결하게 요약하되, 다음 사항들에 주의하여 요약해주세요:

1. **주요 변경사항**: 노인의 건강상태, 치료방법, 처방약 등의 변화
2. **상담 및 진료 내용**: 의료진과의 상담, 증상 논의, 진단 결과
3. **중요 일정**: 다음 진료 예약, 검사 일정, 치료 계획
4. **기타 주목사항**: 가족 상담, 생활 지침, 주의사항 등

**반드시 한국어로 답변하세요.**

---
회의 내용:
{chunk_text}
---

부분 요약:"""
        
        messages = [
            SystemMessage(content=self.system_message),
            HumanMessage(content=chunk_prompt)
        ]
        response = await self.llm.ainvoke(messages)
        
        chunk_duration = (datetime.datetime.now() - chunk_start_time).total_seconds()
        logger.info(f"Map-Reduce: Chunk {chunk_index + 1} processed in {chunk_duration:.3f}s")
        
        return response.content
    
    async def summarize_with_langchain(self, text: str) -> tuple[str, float, float]:
        """Map-Reduce 방식: 진짜 병렬 처리로 구현"""
        if not text.strip():
            return "(음성이 감지되지 않았습니다)", 0.0, 0.0
        
        preprocessing_start_time = datetime.datetime.now()
        docs = self.text_splitter.create_documents([text])
        preprocessing_duration = (datetime.datetime.now() - preprocessing_start_time).total_seconds()
        
        if not docs:
            return "(처리할 텍스트가 없습니다)", preprocessing_duration, 0.0
        
        llm_start_time = datetime.datetime.now()
        
        try:
            # Map 단계: 진짜 병렬 처리
            chunk_tasks = [self._summarize_chunk(doc.page_content) for doc in docs]
            chunk_summaries = await asyncio.gather(*chunk_tasks)
            
            # Reduce 단계: 부분 요약들을 통합
            combined_summaries = "\n\n".join([f"부분 {i+1}: {summary}" for i, summary in enumerate(chunk_summaries)])
            
            reduce_prompt = f"""당신은 노인 관련 화상 회의를 10년간 요약해온 전문 요약 전문가입니다.
여러 부분으로 나뉜 화상 회의 요약들을 하나의 완전한 요약으로 통합해주세요.

특히 다음 사항들에 주의하여 체계적으로 정리해주세요:

1. **주요 변경사항**: 노인의 건강상태, 치료방법, 처방약 등의 변화
2. **상담 및 진료 내용**: 의료진과의 상담, 증상 논의, 진단 결과
3. **중요 일정**: 다음 진료 예약, 검사 일정, 치료 계획
4. **기타 주목사항**: 가족 상담, 생활 지침, 주의사항 등

**반드시 한국어로 답변하세요.**

---
부분 요약들:
{combined_summaries}
---

최종 통합 요약:"""
            
            messages = [
                SystemMessage(content=self.system_message),
                HumanMessage(content=reduce_prompt)
            ]
            response = await self.llm.ainvoke(messages)
            summary_result = response.content
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"요약 중 오류가 발생했습니다: {e}")
        
        llm_duration = (datetime.datetime.now() - llm_start_time).total_seconds()
        return summary_result, preprocessing_duration, llm_duration
    
    async def summarize_with_chaining(self, text: str) -> tuple[str, float, float]:
        """Map-Reduce-Chaining 방식: 순차적으로 이전 결과를 다음 입력에 활용"""
        if not text.strip():
            return "(음성이 감지되지 않았습니다)", 0.0, 0.0
        
        preprocessing_start_time = datetime.datetime.now()
        docs = self.text_splitter.create_documents([text])
        preprocessing_duration = (datetime.datetime.now() - preprocessing_start_time).total_seconds()
        
        if not docs:
            return "(처리할 텍스트가 없습니다)", preprocessing_duration, 0.0
        
        llm_start_time = datetime.datetime.now()
        
        try:
            # 첫 번째 청크의 초기 요약
            first_prompt = self.base_prompt_template.format(text=docs[0].page_content)
            messages = [
                SystemMessage(content=self.system_message),
                HumanMessage(content=first_prompt)
            ]
            response = await self.llm.ainvoke(messages)
            accumulated_summary = response.content
            
            # 나머지 청크들을 순차적으로 처리 (체이닝)
            for i in range(1, len(docs)):
                chain_start_time = datetime.datetime.now()
                
                chaining_prompt = f"""당신은 노인 관련 화상 회의를 10년간 요약해온 전문 요약 전문가입니다.

이전까지의 회의 요약:
{accumulated_summary}

새로운 회의 내용:
{docs[i].page_content}

위의 이전 요약과 새로운 내용을 통합하여, 전체적으로 일관성 있는 하나의 요약을 만들어주세요.
특히 다음 사항들에 주의하여 체계적으로 정리해주세요:

1. **주요 변경사항**: 노인의 건강상태, 치료방법, 처방약 등의 변화
2. **상담 및 진료 내용**: 의료진과의 상담, 증상 논의, 진단 결과
3. **중요 일정**: 다음 진료 예약, 검사 일정, 치료 계획
4. **기타 주목사항**: 가족 상담, 생활 지침, 주의사항 등

**반드시 한국어로 답변하세요.**

통합 요약:"""
                
                messages = [
                    SystemMessage(content=self.system_message),
                    HumanMessage(content=chaining_prompt)
                ]
                response = await self.llm.ainvoke(messages)
                accumulated_summary = response.content
                
                chain_duration = (datetime.datetime.now() - chain_start_time).total_seconds()
                logger.info(f"Chaining: Chunk {i+1}/{len(docs)} processed in {chain_duration:.3f}s")
            
            logger.info(f"Chaining: All {len(docs)} chunks processed sequentially")
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"체이닝 요약 중 오류가 발생했습니다: {e}")
        
        llm_duration = (datetime.datetime.now() - llm_start_time).total_seconds()
        return accumulated_summary, preprocessing_duration, llm_duration

llm_service = LLMService()