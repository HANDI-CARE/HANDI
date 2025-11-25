"""
약물 정보 분석 서비스 - GMS API를 사용한 약물 정보 분석
"""
import time
import json
import re
import asyncio
import datetime
import os
import random
from fastapi import HTTPException
from typing import List, Tuple, Optional, Dict, Any
from langchain_openai import ChatOpenAI
from langchain.schema.messages import HumanMessage, SystemMessage
from app.core.config.config import settings
from app.core.logger import logger
from app.schemas.drug_analysis import (
    DrugInfoAnalysisRequest, DrugInfoAnalysisResponse,
    SingleDrugSearchRequest, SingleDrugSearchResponse,
    PerformanceComparisonRequest, PerformanceComparisonResponse, MethodResult,
    PerformanceComparisonNRequest, PerformanceComparisonNResponse, TestRoundWithEvaluation,
    MedicineTotalDTO, SeniorDangerMedicineDto, 
    SeniorDangerIngredientDto, MedicineDetailDto
)
from app.services.senior_danger_service import (
    get_senior_danger_collection, get_senior_danger_ingredient_collection
)
from app.services.chromadb_service import get_collection_with_embedding
from app.services.evaluation_service import evaluation_service

class DrugAnalysisService:
    def __init__(self):
        self.llm = self._get_llm()
        self._cached_drugs = None  # 캐시된 약물 데이터
    
    async def _get_all_drugs_from_chromadb(self) -> List[Dict[str, str]]:
        """ChromaDB medicine_detail_info 컬렉션에서 모든 약물 데이터 가져오기"""
        try:
            # 캐시된 데이터가 있으면 반환
            if self._cached_drugs is not None:
                return self._cached_drugs
            
            # ChromaDB에서 medicine_detail_info 컬렉션 가져오기
            collection = get_collection_with_embedding("medicine_detail_info")
            if not collection:
                raise HTTPException(status_code=500, detail="ChromaDB medicine_detail_info 컬렉션을 찾을 수 없습니다.")
            
            # 모든 데이터 가져오기 (25개 정도)
            results = collection.get()
            
            if not results['documents'] or not results['metadatas']:
                raise HTTPException(status_code=500, detail="ChromaDB에서 약물 데이터를 찾을 수 없습니다.")
            
            # 제품명과 용량 추출
            drugs = []
            for i, metadata in enumerate(results['metadatas']):
                if metadata and '제품명' in metadata and '용량' in metadata:
                    drugs.append({
                        'name': metadata['제품명'],
                        'capacity': metadata['용량']
                    })
            
            if len(drugs) < 2:
                raise HTTPException(status_code=500, detail=f"충분한 약물 데이터가 없습니다. (발견: {len(drugs)}개)")
            
            # 캐시에 저장
            self._cached_drugs = drugs
            logger.info(f"ChromaDB에서 {len(drugs)}개의 약물 데이터를 로드했습니다.")
            
            return drugs
            
        except Exception as e:
            logger.error(f"ChromaDB에서 약물 데이터 가져오기 실패: {e}")
            raise HTTPException(status_code=500, detail=f"약물 데이터 로드 실패: {str(e)}")
    
    async def _get_random_drugs(self, count: int = 2) -> List[Dict[str, str]]:
        """ChromaDB에서 랜덤으로 약물 선택"""
        all_drugs = await self._get_all_drugs_from_chromadb()
        return random.sample(all_drugs, min(count, len(all_drugs)))
    
    def _get_llm(self):
        if not settings.GMS_KEY:
            raise HTTPException(status_code=500, detail="GMS_KEY is not configured in .env file.")
        
        return ChatOpenAI(
            model_name=settings.LLM_MODEL_NAME,
            openai_api_key=settings.GMS_KEY,
            openai_api_base=settings.GMS_API_URL,
            temperature=0.0,
        )
    
    async def analyze_drug_info(self, request: DrugInfoAnalysisRequest) -> DrugInfoAnalysisResponse:
        """
        약품 목록을 받아 GMS API를 사용하여 노인 환자를 위한 정보를 생성합니다. (Stuff 방식)
        """
        try:
            # 1. 입력 데이터 검증
            if not request.drug_summary:
                raise HTTPException(status_code=400, detail="약품 목록이 비어있습니다")

            # 2. 약품별 정보 수집
            collection_start_time = time.time()
            medicine_total_dtos = []
            for drug_item in request.drug_summary:
                medicine_dto = MedicineTotalDTO(
                    품목명=drug_item.name,
                    상세내용="",
                    용량=drug_item.capacity,
                    업소명="", 성상="", 의약품제형="", 큰제품이미지="", 분류명="", 제형코드명="", 크기두께="",
                    노인_위험_약물_결과=None, 노인_위험_성분_결과=None, 의약품_상세_정보=None
                )
                await self._collect_drug_info(medicine_dto)
                medicine_total_dtos.append(medicine_dto)
            data_collection_time = time.time() - collection_start_time

            # 3. GMS API용 프롬프트 생성 및 호출
            llm_start_time = time.time()
            drug_info_text = self._build_drug_info_text(medicine_total_dtos)
            analysis_result = await self._call_gms_api_stuff(drug_info_text, request)
            llm_processing_time = time.time() - llm_start_time

            return DrugInfoAnalysisResponse(
                analysis_result=analysis_result,
                model_used="GPT-4o-mini (via GMS)",
                tokens_used=0, # 토큰 정보가 없으므로 0으로 설정
                processing_time=round(llm_processing_time, 2),
                data_collection_time=round(data_collection_time, 2)
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"GMS 약물 정보 분석 중 오류 발생: {str(e)}")
    
    def _clean_text(self, text):
        """텍스트에서 제어 문자 및 특수 문자를 정리"""
        if not text or text == '정보 없음':
            return '정보 없음'
        cleaned = str(text).replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ')
        cleaned = ' '.join(cleaned.split())
        return cleaned if cleaned.strip() else '정보 없음'
    
    def _build_drug_info_text(self, medicine_total_dtos: List[MedicineTotalDTO]) -> str:
        """약물 정보를 텍스트로 구성"""
        drug_info_text = ""
        
        for i, drug in enumerate(medicine_total_dtos, 1):
            drug_name = self._clean_text(drug.품목명 or f'약물{i}')
            
            drug_info_text += f"\n=== {drug_name} ===\n"
            
            # 의약품 상세 정보가 있는 경우 추가 (정보 없음 제외)
            if drug.의약품_상세_정보:
                detail_info = drug.의약품_상세_정보
                
                # 각 필드별로 정보가 있을 때만 추가
                제품명 = self._clean_text(detail_info.제품명)
                if 제품명 != '정보 없음':
                    drug_info_text += f"상세정보_제품명: {제품명}\n"
                
                성분 = self._clean_text(detail_info.성분)
                if 성분 != '정보 없음':
                    drug_info_text += f"상세정보_성분: {성분}\n"
                
                용량 = self._clean_text(detail_info.용량)
                if 용량 != '정보 없음':
                    drug_info_text += f"상세정보_용량: {용량}\n"
                
                의약품안정성정보 = self._clean_text(detail_info.의약품안정성정보)
                if 의약품안정성정보 != '정보 없음':
                    drug_info_text += f"의약품안정성정보(DUR): {의약품안정성정보}\n"
                
                효능및효과 = self._clean_text(detail_info.효능및효과)
                if 효능및효과 != '정보 없음':
                    drug_info_text += f"효능및효과: {효능및효과}\n"
                
                용법및용량 = self._clean_text(detail_info.용법및용량)
                if 용법및용량 != '정보 없음':
                    drug_info_text += f"용법및용량: {용법및용량}\n"
                
                사용상의주의사항 = self._clean_text(detail_info.사용상의주의사항)
                if 사용상의주의사항 != '정보 없음':
                    drug_info_text += f"사용상의주의사항: {사용상의주의사항}\n"
                
                복약정보 = self._clean_text(detail_info.복약정보)
                if 복약정보 != '정보 없음':
                    drug_info_text += f"복약정보: {복약정보}\n"
            
            # 노인 위험 약물 정보가 있는 경우 추가
            if drug.노인_위험_약물_결과:
                drug_info_text += f"노인 위험 약물 정보: {self._clean_text(drug.노인_위험_약물_결과)}\n"
            
            # 노인 위험 성분 정보가 있는 경우 추가
            if drug.노인_위험_성분_결과:
                drug_info_text += f"노인 위험 성분 정보: {self._clean_text(drug.노인_위험_성분_결과)}\n"
            
            drug_info_text += "\n"
        
        return drug_info_text
    
    async def _collect_drug_info(self, medicine_dto: MedicineTotalDTO):
        """단일 약물의 모든 정보를 수집 (병렬 처리용)"""
        await asyncio.gather(
            self._search_senior_danger_medicine_direct(medicine_dto),
            self._search_senior_danger_ingredients_direct(medicine_dto),
            self._search_medicine_detail_direct(medicine_dto)
        )
    
    async def _analyze_single_drug(self, medicine_dto: MedicineTotalDTO, drug_index: int) -> dict:
        """단일 약물에 대한 LangChain 분석 처리"""
        drug_start_time = datetime.datetime.now()
        
        # 약물 정보 텍스트 생성
        drug_info_text = self._build_single_drug_info_text(medicine_dto)
        
        # GMS API 호출
        analysis_result = await self._call_gms_api_for_single_drug(drug_info_text, medicine_dto.품목명)
        
        drug_duration = (datetime.datetime.now() - drug_start_time).total_seconds()
        logger.info(f"Drug Analysis: Drug {drug_index + 1} ({medicine_dto.품목명}) processed in {drug_duration:.3f}s")
        
        return analysis_result
    
    def _build_single_drug_info_text(self, medicine_dto: MedicineTotalDTO) -> str:
        """단일 약물 정보를 텍스트로 구성"""
        drug_name = self._clean_text(medicine_dto.품목명 or '약물')
        
        drug_info_text = f"=== {drug_name} ===\n"
        
        # 의약품 상세 정보가 있는 경우 추가 (정보 없음 제외)
        if medicine_dto.의약품_상세_정보:
            detail_info = medicine_dto.의약품_상세_정보
            
            # 각 필드별로 정보가 있을 때만 추가
            제품명 = self._clean_text(detail_info.제품명)
            if 제품명 != '정보 없음':
                drug_info_text += f"상세정보_제품명: {제품명}\n"
            
            성분 = self._clean_text(detail_info.성분)
            if 성분 != '정보 없음':
                drug_info_text += f"상세정보_성분: {성분}\n"
            
            용량 = self._clean_text(detail_info.용량)
            if 용량 != '정보 없음':
                drug_info_text += f"상세정보_용량: {용량}\n"
            
            의약품안정성정보 = self._clean_text(detail_info.의약품안정성정보)
            if 의약품안정성정보 != '정보 없음':
                drug_info_text += f"의약품안정성정보(DUR): {의약품안정성정보}\n"
            
            효능및효과 = self._clean_text(detail_info.효능및효과)
            if 효능및효과 != '정보 없음':
                drug_info_text += f"효능및효과: {효능및효과}\n"
            
            용법및용량 = self._clean_text(detail_info.용법및용량)
            if 용법및용량 != '정보 없음':
                drug_info_text += f"용법및용량: {용법및용량}\n"
            
            사용상의주의사항 = self._clean_text(detail_info.사용상의주의사항)
            if 사용상의주의사항 != '정보 없음':
                drug_info_text += f"사용상의주의사항: {사용상의주의사항}\n"
            
            복약정보 = self._clean_text(detail_info.복약정보)
            if 복약정보 != '정보 없음':
                drug_info_text += f"복약정보: {복약정보}\n"
        
        # 노인 위험 약물 정보가 있는 경우 추가
        if medicine_dto.노인_위험_약물_결과:
            drug_info_text += f"노인 위험 약물 정보: {self._clean_text(medicine_dto.노인_위험_약물_결과)}\n"
        
        # 노인 위험 성분 정보가 있는 경우 추가
        if medicine_dto.노인_위험_성분_결과:
            drug_info_text += f"노인 위험 성분 정보: {self._clean_text(medicine_dto.노인_위험_성분_결과)}\n"
        
        return drug_info_text
    
    async def analyze_drug_info_langchain(self, request: DrugInfoAnalysisRequest) -> DrugInfoAnalysisResponse:
        """
        약품 목록을 LangChain 방식으로 각 약물별 멀티태스킹 병렬 처리합니다. (API용)
        """
        return await self._analyze_drug_info_langchain_internal(request)
    
    async def _analyze_drug_info_langchain_internal(self, request: DrugInfoAnalysisRequest) -> DrugInfoAnalysisResponse:
        """
        약품 목록을 LangChain 방식으로 각 약물별 멀티태스킹 병렬 처리합니다.
        """
        try:
            # 1. 입력 데이터 검증
            if not request.drug_summary:
                raise HTTPException(status_code=400, detail="약품 목록이 비어있습니다")

            # 2. 약품별 정보 수집 (병렬 처리)
            collection_start_time = time.time()
            medicine_total_dtos = []
            for drug_item in request.drug_summary:
                medicine_dto = MedicineTotalDTO(
                    품목명=drug_item.name,
                    상세내용="",
                    용량=drug_item.capacity,
                    업소명="", 성상="", 의약품제형="", 큰제품이미지="", 분류명="", 제형코드명="", 크기두께="",
                    노인_위험_약물_결과=None, 노인_위험_성분_결과=None, 의약품_상세_정보=None
                )
                medicine_total_dtos.append(medicine_dto)
            
            search_tasks = [self._collect_drug_info(dto) for dto in medicine_total_dtos]
            await asyncio.gather(*search_tasks)
            data_collection_time = time.time() - collection_start_time

            # 3. 각 약물별 개별 LangChain 처리 (병렬)
            llm_start_time = time.time()
            # note 정보를 각 약물 분석에 전달
            note = getattr(request, 'note', None)
            drug_analysis_tasks = [self._analyze_single_drug_langchain(dto, i, note) for i, dto in enumerate(medicine_total_dtos)]
            drug_analyses = await asyncio.gather(*drug_analysis_tasks)
            
            # 4. 결과 통합
            combined_result = {}
            for analysis in drug_analyses:
                combined_result.update(analysis)
            llm_processing_time = time.time() - llm_start_time

            return DrugInfoAnalysisResponse(
                analysis_result=json.dumps(combined_result, ensure_ascii=False, indent=2),
                model_used="GPT-4o-mini (via GMS) - LangChain",
                tokens_used=0, # 토큰 정보가 없으므로 0으로 설정
                processing_time=round(llm_processing_time, 2),
                data_collection_time=round(data_collection_time, 2)
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LangChain 약물 정보 분석 중 오류 발생: {str(e)}")
    
    async def _analyze_single_drug_langchain(self, medicine_dto: MedicineTotalDTO, drug_index: int, note: Optional[str] = None) -> dict:
        """단일 약물에 대한 LangChain 분석 처리 (키워드 + 상세 구조)"""
        drug_start_time = datetime.datetime.now()
        
        # 약물 정보 텍스트 생성
        drug_info_text = self._build_single_drug_info_text(medicine_dto)
        
        # GMS API 호출 (note 정보 포함)
        analysis_result = await self._call_gms_api_for_single_drug_langchain(drug_info_text, medicine_dto.품목명, note)
        
        # 불필요한 개별 약물 처리 시간 로그 제거
        
        return analysis_result
    
    async def _call_gms_api_for_single_drug_langchain(self, drug_info_text: str, drug_name: str, note: Optional[str] = None) -> dict:
        """단일 약물에 대한 GMS API 호출 (LangChain - 키워드 + 상세 구조)"""
        system_message = SystemMessage(content='''당신은 시니어 환자를 전문으로 하는 약사 또는 의약품 정보 전문가입니다. 당신은 노인 요양 시설에서 근무하는 간호사를 위한 약물 투약 지침을 작성하는 전문 약사입니다.
제공된 약품 정보를 바탕으로, 간호사가 노인에게 약을 투약할 때 반드시 알아야 할 핵심 정보를 요약해 주세요.
이 요약 정보는 실제 투약 과정에서 참고 자료로 사용되므로, 매우 정확하고 명료해야 합니다.
답변은 반드시 제공된 텍스트 내용에만 근거해야 하며, 특히 '사용상의 주의사항' 항목에 있는 노인 관련 내용을 주의 깊게 살펴보고 답변에 반영하세요.''')
        
        # 노인 환자 개인정보가 있는 경우 추가
        patient_note_section = ""
        if note and note.strip():
            patient_note_section = f"\r\n**환자 개인정보 (참고용)**: {note.strip()}\r\n이 정보는 해당 노인 환자의 특성을 나타내므로, 관련이 있을 경우 복약 지도에 참고하시기 바랍니다.\r\n"

        user_content = f"""아래는 분석해야 할 약물 정보입니다.\r
\r
{drug_info_text}\r
{patient_note_section}\r
위 약물 정보 분석을 바탕으로, 해당 약물에 대한 JSON 객체를 생성해 주세요. 
약물 이름을 최상위 키로 사용하고, '키워드'와 '상세' 두 개의 하위 객체를 가져야 하며, 각각 3가지 정보(효능 및 효과, 용법 및 용량, 복약 시 주의 사항)를 포함해야 합니다.

**각 항목별 데이터 소스**:
- 효능 및 효과: '효능및효과' 정보 기반
- 용법 및 용량: '용법및용량' 정보 기반 + '사용상의주의사항' 참고
- 복약 시 주의 사항: '복약정보' 기반 + '사용상의주의사항' 참고 (예: 유당불내증 환자 복용 주의 등)

**키워드**: 한눈에 파악 가능한 핵심 키워드 형태
**상세**: 노인 환자가 이해하기 쉬운 문맥 형태의 자세한 설명

다른 설명 없이, 오직 아래 명시된 구조의 JSON 형식으로만 출력해 주세요.

{{
  \"{drug_name}\": {{
    \"키워드\": {{
      \"효능 및 효과\": \"핵심 효능을 키워드 형태로 간결하게 (예: 위산과다 완화, 소화불량 개선, 통증 완화)\",\r
      \"용법 및 용량\": \"투여 방법을 키워드 형태로 명확히 (예: 1회 250mg, 하루 2회, 식후 30분, 6시간 간격)\",\r
      \"복약 시 주의 사항\": \"주요 주의사항을 키워드 형태로 (예: 졸음 주의, 알코올 금지, 유당불내증 주의, 조심히 일어서기)\" 
    }},
    \"상세\": {{
      \"효능 및 효과\": \"'효능및효과' 정보를 바탕으로 노인 환자에게 해당하는 효능 및 효과를 이해하기 쉽게 자세히 설명\",\r
      \"용법 및 용량\": \"'용법및용량' 정보를 기반으로 하되, '사용상의주의사항'의 노인 투여 관련 내용을 반드시 참고하여 노인 환자를 위한 용법 및 용량을 자세히 설명\",\r
      \"복약 시 주의 사항\": \"'복약정보'와 '사용상의주의사항'을 종합하여 노인 환자에게 약을 투여할 때 조심해야 할 정보를 자세히 설명 (복용 시 주의사항, 주요 부작용, 상호작용, 특정 환자군 주의사항 등)\"
    }}
  }}
}}"""
        
        user_message = HumanMessage(content=user_content)
        
        try:
            messages = [system_message, user_message]
            response = await self.llm.ainvoke(messages)
            analysis_result = response.content.strip()
            
            # 마크다운 문법 제거
            if analysis_result.startswith('```json'):
                analysis_result = analysis_result[7:]
            elif analysis_result.startswith('```'):
                analysis_result = analysis_result[3:]
            
            if analysis_result.endswith('```'):
                analysis_result = analysis_result[:-3]
            
            analysis_result = analysis_result.strip()
            
            # JSON으로 파싱하여 반환
            return json.loads(analysis_result)
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed for {drug_name}: {e}")
            return {drug_name: {"error": "JSON 파싱 실패"}}
        except Exception as e:
            logger.error(f"GMS API call failed for {drug_name}: {e}")
            return {drug_name: {"error": f"API 호출 실패: {str(e)}"}}
    
    async def _call_gms_api_stuff(self, drug_info_text: str, request: DrugInfoAnalysisRequest) -> str:
        """GMS API 호출"""
        system_message = SystemMessage(content='''당신은 시니어 환자를 전문으로 하는 약사 또는 의약품 정보 전문가입니다. 당신은 노인 요양 시설에서 근무하는 간호사를 위한 약물 투약 지침을 작성하는 전문 약사입니다.
제공된 약품 정보를 바탕으로, 간호사가 노인에게 약을 투약할 때 반드시 알아야 할 핵심 정보를 요약해 주세요.
이 요약 정보는 실제 투약 과정에서 참고 자료로 사용되므로, 매우 정확하고 명료해야 합니다.
답변은 반드시 제공된 텍스트 내용에만 근거해야 하며, 특히 '사용상의 주의사항' 항목에 있는 노인 관련 내용을 주의 깊게 살펴보고 답변에 반영하세요.''')
        
        # 노인 환자 개인정보가 있는 경우 추가 (Stuff 방식)
        patient_note_section = ""
        if hasattr(request, 'note') and request.note and request.note.strip():
            patient_note_section = f"\r\n**환자 개인정보 (참고용)**: {request.note.strip()}\r\n이 정보는 해당 노인 환자의 특성을 나타내므로, 관련이 있을 경우 복약 지도에 참고하시기 바랍니다.\r\n"

        user_content = f"""아래는 분석해야 할 약물 정보입니다.\r
\r
{drug_info_text}\r
{patient_note_section}\r
위 약물 정보 분석을 바탕으로, 각 약물의 이름을 최상위 키로 사용하는 JSON 객체를 생성해 주세요. 
각 약물 객체는 '키워드'와 '상세' 두 개의 하위 객체를 가져야 하며, 각각 3가지 정보(효능 및 효과, 용법 및 용량, 복약 시 주의 사항)를 포함해야 합니다.

**각 항목별 데이터 소스**:
- 효능 및 효과: '효능및효과' 정보 기반
- 용법 및 용량: '용법및용량' 정보 기반 + '사용상의주의사항' 참고
- 복약 시 주의 사항: '복약정보' 기반 + '사용상의주의사항' 참고 (예: 유당불내증 환자 복용 주의 등)

**키워드**: 한눈에 파악 가능한 핵심 키워드 형태
**상세**: 노인 환자가 이해하기 쉬운 문맥 형태의 자세한 설명

다른 설명 없이, 오직 아래 명시된 구조의 JSON 형식으로만 출력해 주세요.

{{
  "약물 이름 1": {{
    "키워드": {{
      "효능 및 효과": "핵심 효능을 키워드 형태로 간결하게 (예: 위산과다 완화, 소화불량 개선, 통증 완화)",
      "용법 및 용량": "투여 방법을 키워드 형태로 명확히 (예: 1회 250mg, 하루 2회, 식후 30분, 6시간 간격)",
      "복약 시 주의 사항": "주요 주의사항을 키워드 형태로 (예: 졸음 주의, 알코올 금지, 유당불내증 주의, 조심히 일어서기)"
    }},
    "상세": {{
      "효능 및 효과": "'효능및효과' 정보를 바탕으로 노인 환자에게 해당하는 효능 및 효과를 이해하기 쉽게 자세히 설명",
      "용법 및 용량": "'용법및용량' 정보를 기반으로 하되, '사용상의주의사항'의 노인 투여 관련 내용을 반드시 참고하여 노인 환자를 위한 용법 및 용량을 자세히 설명",
      "복약 시 주의 사항": "'복약정보'와 '사용상의주의사항'을 종합하여 노인 환자에게 약을 투여할 때 조심해야 할 정보를 자세히 설명 (복용 시 주의사항, 주요 부작용, 상호작용, 특정 환자군 주의사항 등)"
    }}
  }},
  "약물 이름 2": {{
    "키워드": {{
      "효능 및 효과": "핵심 효능을 키워드 형태로 간결하게",
      "용법 및 용량": "투여 방법을 키워드 형태로 명확히",
      "복약 시 주의 사항": "주요 주의사항을 키워드 형태로"
    }},
    "상세": {{
      "효능 및 효과": "'효능및효과' 정보를 바탕으로 노인 환자에게 해당하는 효능 및 효과를 이해하기 쉽게 자세히 설명",
      "용법 및 용량": "'용법및용량' 정보를 기반으로 하되, '사용상의주의사항'의 노인 투여 관련 내용을 반드시 참고하여 노인 환자를 위한 용법 및 용량을 자세히 설명",
      "복약 시 주의 사항": "'복약정보'와 '사용상의주의사항'을 종합하여 노인 환자에게 약을 투여할 때 조심해야 할 정보를 자세히 설명 (복용 시 주의사항, 주요 부작용, 상호작용, 특정 환자군 주의사항 등)"
    }}
  }}
}}"""
        
        user_message = HumanMessage(content=user_content)
        
        
        try:
            messages = [system_message, user_message]
            response = await self.llm.ainvoke(messages)
            analysis_result = response.content.strip()
            
            # 마크다운 문법 제거
            if analysis_result.startswith('```json'):
                analysis_result = analysis_result[7:]
            elif analysis_result.startswith('```'):
                analysis_result = analysis_result[3:]
            
            if analysis_result.endswith('```'):
                analysis_result = analysis_result[:-3]
            
            analysis_result = analysis_result.strip()
            
            return analysis_result
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"GMS API 호출 실패: {str(e)}")
    
    def _extract_dosage_numbers(self, dosage_str: str) -> list:
        """용량 문자열에서 모든 숫자를 추출합니다 (복합제 대응)."""
        if not dosage_str:
            return []
        pattern = r'([0-9]+(?:\.[0-9]+)?)'
        matches = re.findall(pattern, dosage_str)
        return [float(match) for match in matches]
    
    def _extract_dosage_number(self, dosage_str: str) -> float:
        """용량 문자열에서 첫 번째 숫자 부분을 추출합니다 (하위 호환성 유지)."""
        numbers = self._extract_dosage_numbers(dosage_str)
        return numbers[0] if numbers else 0.0
    
    def _normalize_dosage_unit(self, dosage_str: str) -> str:
        """용량 단위를 정규화합니다."""
        if not dosage_str:
            return ""
        dosage_lower = dosage_str.lower()
        if any(unit in dosage_lower for unit in ['밀리그람', '밀리그램', '미리그람', 'mg']):
            return "mg"
        elif any(unit in dosage_lower for unit in ['그람', '그램', 'g']):
            return "g"
        elif any(unit in dosage_lower for unit in ['마이크로그람', '마이크로그램', 'mcg', 'μg']):
            return "mcg"
        elif any(unit in dosage_lower for unit in ['ml', 'ml']):
            return "ml"
        return dosage_str
    
    def _calculate_dosage_similarity(self, drug_dosage: str, target_dosage: str) -> float:
        """두 용량 간의 유사도를 계산합니다 (복합제 대응)."""
        if not drug_dosage or not target_dosage:
            return 0.0
            
        drug_numbers = self._extract_dosage_numbers(drug_dosage)
        target_numbers = self._extract_dosage_numbers(target_dosage)
        
        # 단위 확인
        drug_unit = self._normalize_dosage_unit(drug_dosage)
        target_unit = self._normalize_dosage_unit(target_dosage)
        if drug_unit != target_unit:
            return 0.0
            
        if not drug_numbers or not target_numbers:
            return 0.0
        
        # 복합제 여부 확인
        drug_is_combination = len(drug_numbers) > 1
        target_is_combination = len(target_numbers) > 1
        
        # 둘 다 복합제인 경우
        if drug_is_combination and target_is_combination:
            if len(drug_numbers) != len(target_numbers):
                return 0.0  # 성분 개수가 다르면 0
            
            # 각 성분별 유사도 계산
            similarities = []
            for drug_num, target_num in zip(sorted(drug_numbers), sorted(target_numbers)):
                if drug_num == 0 or target_num == 0:
                    similarities.append(0.0)
                else:
                    ratio = min(drug_num, target_num) / max(drug_num, target_num)
                    # 개별 성분 유사도가 0.8 미만이면 전체를 0으로 처리 (더 엄격한 기준)
                    if ratio < 0.8:
                        return 0.0
                    similarities.append(ratio)
            
            # 모든 성분이 0.8 이상 유사해야만 평균 계산
            return sum(similarities) / len(similarities)
        
        # 하나는 복합제, 하나는 단일제인 경우
        elif drug_is_combination != target_is_combination:
            return 0.0  # 복합제와 단일제는 매칭하지 않음
        
        # 둘 다 단일제인 경우 (기존 로직)
        else:
            drug_num = drug_numbers[0]
            target_num = target_numbers[0]
            if drug_num == 0 or target_num == 0:
                return 0.0
            ratio = min(drug_num, target_num) / max(drug_num, target_num)
            return ratio
    
    async def _search_senior_danger_medicine_direct(self, medicine_dto: MedicineTotalDTO):
        """노인 위험 약물 직접 검색"""
        try:
            collection = get_senior_danger_collection()
            
            results = collection.query(
                query_texts=[medicine_dto.품목명],
                n_results=20
            )
            
            if not results['ids'][0]:
                return
            
            filtered_results = []
            threshold = 0.9
            
            for i, distance in enumerate(results['distances'][0]):
                similarity = 1 - distance
                
                if similarity >= threshold:
                    metadata = results['metadatas'][0][i]
                    item_id = results['ids'][0][i]
                    
                    dosage_score = 0.0
                    if medicine_dto.용량 and metadata.get('용량'):
                        dosage_score = self._calculate_dosage_similarity(
                            metadata['용량'], medicine_dto.용량
                        )
                    
                    if medicine_dto.용량:
                        # 복합제의 경우 용량 가중치를 더 높게 설정 (부정확한 매칭 방지)
                        drug_numbers = self._extract_dosage_numbers(medicine_dto.용량)
                        is_combination = len(drug_numbers) > 1
                        
                        if is_combination:
                            final_score = similarity * 0.5 + dosage_score * 0.5  # 복합제는 용량 중요도 증가
                        else:
                            final_score = similarity * 0.7 + dosage_score * 0.3  # 단일제는 기존 비율
                    else:
                        final_score = similarity
                    
                    medicine_result = SeniorDangerMedicineDto(
                        id=item_id,
                        score=round(final_score, 4),
                        품목명=metadata.get('품목명', ''),
                        상세내용=metadata.get('상세내용', ''),
                        용량=metadata.get('용량', ''),
                        성분명=metadata.get('성분명', ''),
                        성분코드=metadata.get('성분코드', ''),
                        업체명=metadata.get('업체명', ''),
                        공고번호=str(metadata.get('공고번호', '')),
                        급여구분=metadata.get('급여구분', ''),
                        약품상세정보=metadata.get('약품상세정보', '')
                    )
                    
                    filtered_results.append(medicine_result)
            
            if filtered_results:
                filtered_results.sort(key=lambda x: x.score, reverse=True)
                medicine_dto.노인_위험_약물_결과 = filtered_results[0]
                    
        except Exception as e:
            print(f"노인 위험 약물 검색 실패: {e}")
    
    async def _search_senior_danger_ingredients_direct(self, medicine_dto: MedicineTotalDTO):
        """노인 위험 성분 직접 검색"""
        try:
            collection = get_senior_danger_ingredient_collection()
            ingredient_results = []
            
            if medicine_dto.상세내용:
                ingredients = [ingredient.strip() for ingredient in medicine_dto.상세내용.split('/')]
                
                for ingredient in ingredients:
                    if ingredient:
                        results = collection.query(
                            query_texts=[ingredient],
                            n_results=20
                        )
                        
                        if results['ids'][0]:
                            threshold = 0.9
                            
                            for i, distance in enumerate(results['distances'][0]):
                                similarity = 1 - distance
                                
                                if similarity >= threshold:
                                    metadata = results['metadatas'][0][i]
                                    item_id = results['ids'][0][i]
                                    
                                    ingredient_dto = SeniorDangerIngredientDto(
                                        id=item_id,
                                        score=round(similarity, 4),
                                        DUR성분명=metadata.get('DUR성분명', ''),
                                        DUR성분명영문=metadata.get('DUR성분명영문', ''),
                                        복합제=metadata.get('복합제', ''),
                                        관계성분=metadata.get('관계성분', ''),
                                        금기내용=metadata.get('금기내용', '')
                                    )
                                    
                                    ingredient_results.append(ingredient_dto)
                                    break  # 가장 높은 점수 1개만
            
            if ingredient_results:
                medicine_dto.노인_위험_성분_결과 = ingredient_results
                
        except Exception as e:
            print(f"노인 위험 성분 검색 실패: {e}")
    
    async def _search_medicine_detail_direct(self, medicine_dto: MedicineTotalDTO):
        """의약품 상세 정보 직접 검색"""
        try:
            MEDICINE_DETAIL_COLLECTION_NAME = "medicine_detail_info"
            search_collection = get_collection_with_embedding(MEDICINE_DETAIL_COLLECTION_NAME)
            
            results = search_collection.query(
                query_texts=[medicine_dto.품목명],
                n_results=20,
                include=['documents', 'metadatas', 'distances']
            )
            
            if not results['ids'][0]:
                return
            
            filtered_results = []
            threshold = 0.9
            
            for i, distance in enumerate(results['distances'][0]):
                similarity = 1 - distance
                
                if similarity >= threshold:
                    metadata = results['metadatas'][0][i]
                    item_id = results['ids'][0][i]
                    
                    dosage_score = 0.0
                    if medicine_dto.용량 and metadata.get('용량'):
                        dosage_score = self._calculate_dosage_similarity(
                            metadata['용량'], medicine_dto.용량
                        )
                    
                    if medicine_dto.용량:
                        # 복합제의 경우 용량 가중치를 더 높게 설정 (부정확한 매칭 방지)
                        drug_numbers = self._extract_dosage_numbers(medicine_dto.용량)
                        is_combination = len(drug_numbers) > 1
                        
                        if is_combination:
                            final_score = similarity * 0.5 + dosage_score * 0.5  # 복합제는 용량 중요도 증가
                        else:
                            final_score = similarity * 0.7 + dosage_score * 0.3  # 단일제는 기존 비율
                    else:
                        final_score = similarity
                    
                    medicine_detail = MedicineDetailDto(
                        id=item_id,
                        score=round(final_score, 4),
                        제품명=metadata.get('제품명', ''),
                        성분=metadata.get('성분', ''),
                        용량=metadata.get('용량', ''),
                        의약품안정성정보=metadata.get('의약품안정성정보(DUR)', ''),
                        효능및효과=metadata.get('효능및효과', ''),
                        용법및용량=metadata.get('용법및용량', ''),
                        사용상의주의사항=metadata.get('사용상의주의사항', ''),
                        복약정보=metadata.get('복약정보', '')
                    )
                    
                    filtered_results.append(medicine_detail)
            
            if filtered_results:
                filtered_results.sort(key=lambda x: x.score, reverse=True)
                medicine_dto.의약품_상세_정보 = filtered_results[0]
                    
        except Exception as e:
            print(f"의약품 상세 정보 검색 실패: {e}")

    async def search_single_drug(self, request: SingleDrugSearchRequest) -> SingleDrugSearchResponse:
        """
        단일 약물의 상세 정보를 검색합니다.
        medicine_detail_info, senior_danger_medicine, senior_danger_ingredient에서 검색
        """
        try:
            search_start_time = time.time()
            
            # MedicineTotalDTO 생성
            medicine_dto = MedicineTotalDTO(
                품목명=request.name,
                상세내용="",
                용량=request.capacity,
                업소명="", 성상="", 의약품제형="", 큰제품이미지="", 분류명="", 제형코드명="", 크기두께="",
                노인_위험_약물_결과=None, 노인_위험_성분_결과=None, 의약품_상세_정보=None
            )
            
            # 병렬로 모든 검색 수행
            await asyncio.gather(
                self._search_senior_danger_medicine_direct(medicine_dto),
                self._search_senior_danger_ingredients_direct(medicine_dto),
                self._search_medicine_detail_direct(medicine_dto)
            )
            
            search_time = time.time() - search_start_time
            
            return SingleDrugSearchResponse(
                drug_name=request.name,
                medicine_detail_info=medicine_dto.의약품_상세_정보,
                senior_danger_medicine=medicine_dto.노인_위험_약물_결과,
                senior_danger_ingredients=medicine_dto.노인_위험_성분_결과,
                search_time=round(search_time, 2)
            )
            
        except Exception as e:
            logger.error(f"단일 약물 검색 중 오류 발생 ({request.name}): {e}")
            raise HTTPException(status_code=500, detail=f"약물 검색 중 오류 발생: {str(e)}")

    async def compare_performance(self, request: PerformanceComparisonRequest) -> PerformanceComparisonResponse:
        """
        Stuff 방식과 LangChain 방식의 성능을 비교합니다.
        """
        try:
            total_start_time = time.time()
            
            # DrugInfoAnalysisRequest로 변환
            analysis_request = DrugInfoAnalysisRequest(drug_summary=request.drug_summary)
            
            stuff_result = MethodResult(success=False)
            langchain_result = MethodResult(success=False)
            
            logger.info(f"🔄 [API] 성능 비교 시작 - 약물 {len(request.drug_summary)}개")
            
            # 1. Stuff 방식 실행
            try:
                stuff_response = await self.analyze_drug_info(analysis_request)
                stuff_result = MethodResult(
                    success=True,
                    result=stuff_response.analysis_result,
                    data_collection_time=stuff_response.data_collection_time,
                    processing_time=stuff_response.processing_time
                )
                logger.info(f"✅ [API] Stuff 방식 성공 (데이터: {stuff_response.data_collection_time}s, LLM: {stuff_response.processing_time}s)")
            except Exception as stuff_error:
                stuff_result = MethodResult(
                    success=False,
                    error=str(stuff_error)
                )
                logger.warning(f"⚠️ [API] Stuff 방식 실패: {str(stuff_error)[:100]}...")
            
            # 2. LangChain 방식 실행
            try:
                langchain_response = await self.analyze_drug_info_langchain(analysis_request)
                langchain_result = MethodResult(
                    success=True,
                    result=langchain_response.analysis_result,
                    data_collection_time=langchain_response.data_collection_time,
                    processing_time=langchain_response.processing_time
                )
                logger.info(f"✅ [API] LangChain 방식 성공 (데이터: {langchain_response.data_collection_time}s, LLM: {langchain_response.processing_time}s)")
            except Exception as langchain_error:
                langchain_result = MethodResult(
                    success=False,
                    error=str(langchain_error)
                )
                logger.error(f"❌ [API] LangChain 방식 실패: {str(langchain_error)[:100]}...")
            
            # 3. 성능 비교 분석
            comparison = None
            if stuff_result.success and langchain_result.success:
                stuff_time = stuff_result.processing_time
                langchain_time = langchain_result.processing_time
                
                comparison = {
                    "stuff_llm_time": stuff_time,
                    "langchain_llm_time": langchain_time,
                    "time_difference": round(abs(stuff_time - langchain_time), 2),
                    "faster_method": "Stuff" if stuff_time < langchain_time else "LangChain",
                    "performance_improvement": round(abs(stuff_time - langchain_time) / max(stuff_time, langchain_time) * 100, 1) if max(stuff_time, langchain_time) > 0 else 0,
                    "stuff_data_collection": stuff_result.data_collection_time,
                    "langchain_data_collection": langchain_result.data_collection_time
                }
            
            total_time = time.time() - total_start_time
            
            # 최종 결과 로그
            if comparison:
                logger.info(f"🏁 [API] 성능 비교 완료 - 더 빠른 방식: {comparison['faster_method']} ({comparison['performance_improvement']}% 향상)")
            else:
                logger.info(f"🏁 [API] 성능 비교 완료 - 전체 처리 시간: {total_time:.2f}s")
            
            return PerformanceComparisonResponse(
                stuff_result=stuff_result,
                langchain_result=langchain_result,
                comparison=comparison,
                total_processing_time=round(total_time, 2),
                drug_count=len(request.drug_summary)
            )
            
        except Exception as e:
            logger.error(f"성능 비교 중 오류 발생: {e}")
            raise HTTPException(status_code=500, detail=f"성능 비교 중 오류 발생: {str(e)}")

    async def compare_performance_n_times(self, request: PerformanceComparisonNRequest) -> PerformanceComparisonNResponse:
        """
        Stuff 방식과 LangChain 방식의 성능을 N회 반복 비교하고 평가합니다.
        매번 ChromaDB에서 2개씩 랜덤 선택합니다.
        """
        try:
            total_start_time = time.time()
            test_rounds = []
            
            logger.info(f"🎲 [랜덤 선택 모드] N회 테스트 시작 - {request.test_count}회, 매번 2개씩 랜덤 선택")
            # ChromaDB에서 약물 데이터를 미리 로드 (캐싱)
            await self._get_all_drugs_from_chromadb()
            
            for round_num in range(1, request.test_count + 1):
                test_round = TestRoundWithEvaluation(round_number=round_num)
                
                # 매번 새로운 약물 랜덤 선택
                random_drugs = await self._get_random_drugs(2)
                from app.schemas.drug_analysis import DrugSummaryItem
                current_drug_summary = [
                    DrugSummaryItem(name=drug['name'], capacity=drug['capacity']) 
                    for drug in random_drugs
                ]
                drug_names = [f"{drug.name}({drug.capacity})" for drug in current_drug_summary]
                
                # DrugInfoAnalysisRequest로 변환
                analysis_request = DrugInfoAnalysisRequest(drug_summary=current_drug_summary)
                
                # 약물 정보 수집 (컨텍스트용)
                context_data = await self._collect_context_for_evaluation(analysis_request)
                
                # Stuff 방식 실행 (성능 측정만, groundedness 평가 없음)
                stuff_response = None
                try:
                    stuff_response = await self.analyze_drug_info(analysis_request)
                    test_round.stuff_time = stuff_response.processing_time
                    test_round.stuff_success = True
                    # Stuff는 groundedness 평가 없음 (성능 측정용)
                    test_round.stuff_evaluation = None
                except Exception as e:
                    test_round.stuff_success = False
                    logger.debug(f"Stuff 방식 실패 (회차 {round_num}): {str(e)[:100]}")
                
                # LangChain 방식 실행 및 평가 (groundedness 평가 포함)
                langchain_response = None
                try:
                    langchain_response = await self.analyze_drug_info_langchain(analysis_request)
                    test_round.langchain_time = langchain_response.processing_time
                    test_round.langchain_success = True
                    
                    # Parallel(LangChain) 방식만 groundedness 평가 실행
                    test_round.langchain_evaluation = await evaluation_service.evaluate_drug_analysis(
                        drug_summary=current_drug_summary,
                        analysis_result=langchain_response.analysis_result,
                        context_data=context_data
                    )
                except Exception as e:
                    test_round.langchain_success = False
                    logger.debug(f"LangChain 방식 실패 (회차 {round_num}): {str(e)[:100]}")
                
                test_rounds.append(test_round)
                
                # 1줄 통합 로그 출력
                stuff_result = f"{test_round.stuff_time:.0f}초" if test_round.stuff_success else "실패"
                langchain_result = f"{test_round.langchain_time:.0f}초" if test_round.langchain_success else "실패"
                
                logger.info(f"[ {round_num:2} / {request.test_count} ] : {drug_names} | Stuff: {stuff_result} | Parallel: {langchain_result}")
            
            # 성능 통계 계산
            successful_stuff_times = [r.stuff_time for r in test_rounds if r.stuff_success and r.stuff_time]
            successful_langchain_times = [r.langchain_time for r in test_rounds if r.langchain_success and r.langchain_time]
            
            stuff_success_count = sum(1 for r in test_rounds if r.stuff_success)
            langchain_success_count = sum(1 for r in test_rounds if r.langchain_success)
            
            performance_summary = {
                "stuff_success_rate": round((stuff_success_count / request.test_count) * 100, 1),
                "langchain_success_rate": round((langchain_success_count / request.test_count) * 100, 1),
                "avg_stuff_time": round(sum(successful_stuff_times) / len(successful_stuff_times), 1) if successful_stuff_times else None,
                "avg_langchain_time": round(sum(successful_langchain_times) / len(successful_langchain_times), 1) if successful_langchain_times else None,
                "stuff_faster_count": sum(1 for r in test_rounds if r.stuff_success and r.langchain_success and r.stuff_time < r.langchain_time)
            }
            
            # 평가 통계 계산
            evaluation_summary = self._calculate_evaluation_stats(test_rounds)
            
            total_time = time.time() - total_start_time
            
            # 최종 요약 로그
            logger.info(f"🏁 [N회 평가 테스트] 완료 - 총 {total_time:.1f}초")
            logger.info(f"   성공률: Stuff {performance_summary['stuff_success_rate']}% | Parallel {performance_summary['langchain_success_rate']}%")
            if performance_summary['avg_stuff_time'] and performance_summary['avg_langchain_time']:
                faster = "Stuff" if performance_summary['avg_stuff_time'] < performance_summary['avg_langchain_time'] else "Parallel"
                logger.info(f"   평균시간: Stuff {performance_summary['avg_stuff_time']}초 | Parallel {performance_summary['avg_langchain_time']}초 ({faster} 더 빠름)")
            
            # 평가 요약 로그 (환각 방지 중심) - Parallel만
            if evaluation_summary.get("per_drug_groundedness"):
                groundedness = evaluation_summary["per_drug_groundedness"]
                if groundedness.get("langchain_avg_score") is not None:
                    logger.info(f"   근거성: Parallel {groundedness['langchain_avg_score']:.2f} (환각 위험: {groundedness['hallucination_risk_assessment']['langchain']}) - Stuff는 성능 측정만")
            if evaluation_summary.get("json_validity"):
                logger.info(f"   JSON유효: Stuff {evaluation_summary['json_validity']['stuff']}% | Parallel {evaluation_summary['json_validity']['langchain']}%")
            
            return PerformanceComparisonNResponse(
                test_rounds=test_rounds,
                test_count=request.test_count,
                drug_count=2,  # 항상 2개 약물 랜덤 선택
                total_processing_time=round(total_time, 2),
                performance_summary=performance_summary,
                evaluation_summary=evaluation_summary
            )
            
        except Exception as e:
            logger.error(f"N회 반복 성능 비교 중 오류 발생: {e}")
            raise HTTPException(status_code=500, detail=f"N회 반복 성능 비교 중 오류 발생: {str(e)}")
    
    def _calculate_evaluation_stats(self, test_rounds) -> Dict[str, Any]:
        """평가 통계 계산 (환각 방지 중심)"""
        stats = {}
        
        # JSON 유효성 통계
        stuff_json_valid = [r.stuff_evaluation.json_schema_valid for r in test_rounds 
                           if r.stuff_evaluation and r.stuff_evaluation.json_schema_valid is not None]
        langchain_json_valid = [r.langchain_evaluation.json_schema_valid for r in test_rounds 
                               if r.langchain_evaluation and r.langchain_evaluation.json_schema_valid is not None]
        
        if stuff_json_valid or langchain_json_valid:
            stats["json_validity"] = {
                "stuff": round(sum(stuff_json_valid) / len(stuff_json_valid) * 100, 1) if stuff_json_valid else None,
                "langchain": round(sum(langchain_json_valid) / len(langchain_json_valid) * 100, 1) if langchain_json_valid else None
            }
        
        # 약물별 근거성 평가 통계 (환각 방지) - LangChain 방식만
        langchain_groundedness_results = []
        
        for r in test_rounds:
            # Stuff는 더 이상 groundedness 평가를 하지 않음
            if r.langchain_evaluation and r.langchain_evaluation.drug_groundedness_scores:
                for drug_result in r.langchain_evaluation.drug_groundedness_scores:
                    if drug_result.groundedness_score is not None:
                        langchain_groundedness_results.append(drug_result.groundedness_score)
        
        if langchain_groundedness_results:
            stats["per_drug_groundedness"] = {
                "stuff_avg_score": None,  # Stuff는 groundedness 평가하지 않음
                "langchain_avg_score": round(sum(langchain_groundedness_results) / len(langchain_groundedness_results), 2),
                "stuff_total_evaluations": 0,  # Stuff는 groundedness 평가하지 않음
                "langchain_total_evaluations": len(langchain_groundedness_results),
                "hallucination_risk_assessment": {
                    "stuff": "N/A",  # Stuff는 groundedness 평가하지 않음
                    "langchain": "Low" if sum(langchain_groundedness_results) / len(langchain_groundedness_results) >= 0.8 else "Medium" if sum(langchain_groundedness_results) / len(langchain_groundedness_results) >= 0.6 else "High"
                }
            }
        
        return stats

    async def _collect_context_for_evaluation(self, request: DrugInfoAnalysisRequest) -> str:
        """평가용 컨텍스트 데이터를 수집합니다."""
        try:
            # 약품별 정보 수집
            medicine_total_dtos = []
            for drug_item in request.drug_summary:
                medicine_dto = MedicineTotalDTO(
                    품목명=drug_item.name,
                    상세내용="",
                    용량=drug_item.capacity,
                    업소명="", 성상="", 의약품제형="", 큰제품이미지="", 분류명="", 제형코드명="", 크기두께="",
                    노인_위험_약물_결과=None, 노인_위험_성분_결과=None, 의약품_상세_정보=None
                )
                await self._collect_drug_info(medicine_dto)
                medicine_total_dtos.append(medicine_dto)
            
            # 컨텍스트 텍스트 생성 (Stuff 방식과 동일한 방식)
            context_text = self._build_drug_info_text(medicine_total_dtos)
            return context_text
            
        except Exception as e:
            logger.warning(f"컨텍스트 수집 실패: {e}")
            return ""

# 전역 서비스 인스턴스
drug_analysis_service = DrugAnalysisService()