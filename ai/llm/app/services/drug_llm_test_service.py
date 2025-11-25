"""
Drug LLM Test Router 전용 LangSmith 트레이싱 서비스
기존 drug_analysis_service의 메서드들을 복사하되 LangSmith 트레이싱만 추가
"""
import time
import json
import random
from typing import Dict, Any
from langsmith import traceable
from app.core.config.config import settings
from app.core.logger import logger
from app.services.drug_analysis_service import drug_analysis_service
from app.services.langsmith_config import langsmith_manager
from app.services.evaluation_service import evaluation_service
from app.schemas.drug_analysis import (
    DrugInfoAnalysisRequest, PerformanceComparisonRequest, 
    PerformanceComparisonResponse, PerformanceComparisonNRequest, 
    PerformanceComparisonNResponse
)

class DrugLLMTestService:
    """Drug LLM Test Router 전용 서비스 - LangSmith 트레이싱 포함"""
    
    def __init__(self):
        # 기존 drug_analysis_service를 래핑
        self.base_service = drug_analysis_service
        # 랜덤 노인 환자 노트 샘플 데이터
        self.elderly_notes = [
            "규칙적인 산책을 즐기심",
            "혈압약을 장기 복용 중이시며 어지러움을 자주 호소하심",
            "당뇨가 있어 혈당 관리가 필요하시며 단 음식을 피하려 노력하심", 
            "관절염으로 무릎 통증이 심하여 계단 이용이 어려우심",
            "치매 초기 증상으로 기억력 저하와 혼동이 종종 있으심",
            "위장이 약하여 매운 음식과 찬 음식을 피하시고 소화제를 자주 복용하심",
            "불면증으로 밤에 잠들기 어려워하시며 수면제 복용 경험이 있으심",
            "심장질환으로 격한 운동을 피하시고 정기 검진을 받고 계심",
            "낙상 경험이 있어 보행 시 조심스러우시며 지팡이를 사용하심",
            "우울감을 자주 호소하시며 가족과의 대화를 선호하심"
        ]
    
    @traceable(
        name="drug_analysis_stuff_llm_processing",
        tags=["abtest", "A"],
        metadata={
            "method": "A",
            "model": settings.LLM_MODEL_NAME,
            "temperature": str(settings.LLM_TEMPERATURE),
            "approach": "stuff_documents",
            "processing": "sequential"
        }
    )
    async def analyze_drug_info_stuff_traced(self, request: DrugInfoAnalysisRequest):
        """Stuff 방식 약물 분석 (LangSmith 트레이싱 포함)"""
        return await self.base_service.analyze_drug_info(request)
    
    @traceable(
        name="drug_analysis_langchain_llm_processing", 
        tags=["abtest", "B"],
        metadata={
            "method": "B",
            "model": settings.LLM_MODEL_NAME,
            "temperature": str(settings.LLM_TEMPERATURE),
            "approach": "map_reduce_chain",
            "processing": "parallel"
        }
    )
    async def analyze_drug_info_langchain_traced(self, request: DrugInfoAnalysisRequest):
        """LangChain 방식 약물 분석 (LangSmith 트레이싱 포함)"""
        return await self.base_service.analyze_drug_info_langchain(request)
    
    @traceable(
        name="drug_analysis_performance_comparison",
        tags=["abtest", "comparison"],
        metadata={
            "method": "comparison",
            "model": settings.LLM_MODEL_NAME,
            "temperature": str(settings.LLM_TEMPERATURE),
            "approach": "performance_analysis",
            "comparison_type": "A_vs_B"
        }
    )
    async def compare_performance_traced(self, request: PerformanceComparisonRequest) -> PerformanceComparisonResponse:
        """성능 비교 (LangSmith 트레이싱 포함)"""
        # 기존 서비스의 compare_performance 로직을 복사하되 트레이싱된 메서드 사용
        try:
            total_start_time = time.time()
            
            # DrugInfoAnalysisRequest로 변환 (note 정보 포함)
            current_note = getattr(self, '_current_note', None)
            analysis_request = DrugInfoAnalysisRequest(drug_summary=request.drug_summary, note=current_note)
            
            from app.schemas.drug_analysis import MethodResult
            stuff_result = MethodResult(success=False)
            langchain_result = MethodResult(success=False)
            
            # 1. Stuff 방식 실행 (트레이싱 포함)
            try:
                stuff_response = await self.analyze_drug_info_stuff_traced(analysis_request)
                stuff_result = MethodResult(
                    success=True,
                    result=stuff_response.analysis_result,
                    data_collection_time=stuff_response.data_collection_time,
                    processing_time=stuff_response.processing_time,
                    error=None
                )
            except Exception as e:
                stuff_result = MethodResult(
                    success=False,
                    result=None,
                    data_collection_time=0.0,
                    processing_time=0.0,
                    error=str(e)
                )
            
            # 2. LangChain 방식 실행 (트레이싱 포함)
            try:
                langchain_response = await self.analyze_drug_info_langchain_traced(analysis_request)
                langchain_result = MethodResult(
                    success=True,
                    result=langchain_response.analysis_result,
                    data_collection_time=langchain_response.data_collection_time,
                    processing_time=langchain_response.processing_time,
                    error=None
                )
            except Exception as e:
                langchain_result = MethodResult(
                    success=False,
                    result=None,
                    data_collection_time=0.0,
                    processing_time=0.0,
                    error=str(e)
                )
            
            # 3. 성능 비교 분석
            comparison = None
            if stuff_result.success and langchain_result.success:
                stuff_llm_time = stuff_result.processing_time
                langchain_llm_time = langchain_result.processing_time
                
                if stuff_llm_time < langchain_llm_time:
                    faster_method = "Stuff"
                    performance_improvement = ((langchain_llm_time - stuff_llm_time) / langchain_llm_time) * 100
                else:
                    faster_method = "LangChain"  
                    performance_improvement = ((stuff_llm_time - langchain_llm_time) / stuff_llm_time) * 100
                
                comparison = {
                    "stuff_llm_time": round(stuff_llm_time, 2),
                    "langchain_llm_time": round(langchain_llm_time, 2),
                    "time_difference": round(abs(stuff_llm_time - langchain_llm_time), 2),
                    "faster_method": faster_method,
                    "performance_improvement": round(performance_improvement, 1),
                    "stuff_data_collection": stuff_result.data_collection_time,
                    "langchain_data_collection": langchain_result.data_collection_time
                }
                
            
            total_processing_time = round(time.time() - total_start_time, 2)
            
            return PerformanceComparisonResponse(
                stuff_result=stuff_result,
                langchain_result=langchain_result,
                comparison=comparison,
                total_processing_time=total_processing_time,
                drug_count=len(request.drug_summary)
            )
            
        except Exception as e:
            logger.error(f"성능 비교 중 전체적인 오류 발생: {e}")
            raise e
    
    async def compare_performance_n_times_traced(self, request: PerformanceComparisonNRequest) -> PerformanceComparisonNResponse:
        """N회 반복 성능 비교 (LangSmith 트레이싱 포함)"""
        # N회 반복에서는 각 round마다 트레이싱된 메서드들을 사용해야 하므로
        # 기존 서비스의 로직을 복사하되 트레이싱된 메서드 호출
        try:
            total_start_time = time.time()
            test_rounds = []
            
            logger.info(f"🎲 [랜덤 선택 모드] N회 테스트 시작 - {request.test_count}회, 매번 2개씩 랜덤 선택")
            
            for round_num in range(1, request.test_count + 1):
                
                # ChromaDB에서 랜덤으로 2개 약물 선택
                random_drugs = await self.base_service._get_random_drugs(2)
                from app.schemas.drug_analysis import DrugSummaryItem
                drug_items = [DrugSummaryItem(name=drug['name'], capacity=drug['capacity']) for drug in random_drugs]
                
                # 랜덤 노인 환자 노트 선택 (50% 확률로 추가)
                random_note = random.choice(self.elderly_notes) if random.random() < 0.5 else None
                
                # 성능 비교 요청 생성 (note는 내부적으로 처리)
                from app.schemas.drug_analysis import PerformanceComparisonRequest
                test_request = PerformanceComparisonRequest(drug_summary=drug_items)
                
                # note 정보를 임시로 저장하여 성능 비교 시 사용
                self._current_note = random_note
                
                # 트레이싱된 성능 비교 실행
                comparison_result = await self.compare_performance_traced(test_request)
                
                # 결과 기록 (groundedness 평가 포함)
                from app.schemas.drug_analysis import TestRoundWithEvaluation
                test_round = TestRoundWithEvaluation(
                    round_number=round_num,
                    stuff_time=comparison_result.stuff_result.processing_time if comparison_result.stuff_result.success else None,
                    langchain_time=comparison_result.langchain_result.processing_time if comparison_result.langchain_result.success else None,
                    stuff_success=comparison_result.stuff_result.success,
                    langchain_success=comparison_result.langchain_result.success,
                    stuff_evaluation=None,  # Stuff 방식은 성능 측정만
                    langchain_evaluation=None  # 초기값
                )
                
                # LangChain 방식이 성공한 경우 groundedness 평가 실행 (note 포함)
                if comparison_result.langchain_result.success:
                    try:
                        # drug_analysis_service의 컨텍스트 수집 함수 사용 (note 포함)
                        from app.schemas.drug_analysis import DrugInfoAnalysisRequest
                        eval_request = DrugInfoAnalysisRequest(drug_summary=drug_items, note=random_note)
                        context_data = await self.base_service._collect_context_for_evaluation(eval_request)
                        
                        # evaluation_service를 직접 호출 (이미 @traceable 설정됨, note 포함)
                        test_round.langchain_evaluation = await evaluation_service.evaluate_drug_analysis(
                            drug_summary=drug_items,
                            analysis_result=comparison_result.langchain_result.result,
                            context_data=context_data,
                            note=random_note
                        )
                    except Exception as eval_error:
                        test_round.langchain_evaluation = None
                test_rounds.append(test_round)
                
                # 깔끔한 한 줄 로그 출력 (note 정보 포함)
                drug_names = [f"{drug['name']}({drug['capacity']})" for drug in random_drugs]
                stuff_time_str = f"{test_round.stuff_time:.0f}초" if test_round.stuff_success else "실패"
                langchain_time_str = f"{test_round.langchain_time:.0f}초" if test_round.langchain_success else "실패"
                note_info = f" (환자노트: {random_note[:15]}...)" if random_note else ""
                logger.info(f"[ {round_num:2d} / {request.test_count} ] : {drug_names}{note_info} | Stuff: {stuff_time_str} | Parallel: {langchain_time_str}")
            
            # 통계 계산
            successful_stuff_times = [r.stuff_time for r in test_rounds if r.stuff_success and r.stuff_time is not None]
            successful_langchain_times = [r.langchain_time for r in test_rounds if r.langchain_success and r.langchain_time is not None]
            
            stuff_success_rate = (sum(1 for r in test_rounds if r.stuff_success) / len(test_rounds)) * 100
            langchain_success_rate = (sum(1 for r in test_rounds if r.langchain_success) / len(test_rounds)) * 100
            
            avg_stuff_time = sum(successful_stuff_times) / len(successful_stuff_times) if successful_stuff_times else None
            avg_langchain_time = sum(successful_langchain_times) / len(successful_langchain_times) if successful_langchain_times else None
            
            summary = {
                "stuff_success_rate": round(stuff_success_rate, 1),
                "langchain_success_rate": round(langchain_success_rate, 1),
                "avg_stuff_time": round(avg_stuff_time, 1) if avg_stuff_time else None,
                "avg_langchain_time": round(avg_langchain_time, 1) if avg_langchain_time else None,
                "stuff_faster_count": sum(1 for r in test_rounds if r.stuff_success and r.langchain_success and r.stuff_time and r.langchain_time and r.stuff_time < r.langchain_time)
            }
            
            total_processing_time = round(time.time() - total_start_time, 2)
            
            # 최종 요약 로그 
            logger.info(f"🏁 [N회 평가 테스트] 완료 - 총 {total_processing_time}초")
            logger.info(f"   성공률: Stuff {summary['stuff_success_rate']}% | Parallel {summary['langchain_success_rate']}%")
            if summary['avg_stuff_time'] and summary['avg_langchain_time']:
                faster = "Stuff" if summary['avg_stuff_time'] < summary['avg_langchain_time'] else "Parallel"
                logger.info(f"   평균시간: Stuff {summary['avg_stuff_time']}초 | Parallel {summary['avg_langchain_time']}초 ({faster} 더 빠름)")
            
            # 평가 요약 계산
            evaluation_summary = self._calculate_evaluation_summary(test_rounds)
            
            return PerformanceComparisonNResponse(
                test_rounds=test_rounds,
                test_count=request.test_count,
                drug_count=2,  # 항상 2개 약물 사용
                total_processing_time=total_processing_time,
                performance_summary=summary,
                evaluation_summary=evaluation_summary
            )
            
        except Exception as e:
            logger.error(f"N회 반복 성능 비교 중 오류 발생: {e}")
            raise e
    
    def _calculate_evaluation_summary(self, test_rounds) -> Dict[str, Any]:
        """테스트 라운드 결과를 바탕으로 평가 요약 계산"""
        stats = {}
        
        # Groundedness 점수 수집
        langchain_groundedness_results = []
        
        for r in test_rounds:
            # Stuff는 groundedness 평가하지 않음 (성능 측정만)
            if r.langchain_evaluation and r.langchain_evaluation.drug_groundedness_scores:
                for drug_result in r.langchain_evaluation.drug_groundedness_scores:
                    if drug_result.groundedness_score is not None:
                        langchain_groundedness_results.append(drug_result.groundedness_score)
        
        if langchain_groundedness_results:
            avg_langchain_score = sum(langchain_groundedness_results) / len(langchain_groundedness_results)
            stats["per_drug_groundedness"] = {
                "stuff_avg_score": None,  # Stuff는 성능 측정만
                "langchain_avg_score": round(avg_langchain_score, 2),
                "stuff_total_evaluations": 0,  # Stuff는 성능 측정만
                "langchain_total_evaluations": len(langchain_groundedness_results),
                "hallucination_risk_assessment": {
                    "stuff": "N/A",  # Stuff는 성능 측정만
                    "langchain": "Low" if avg_langchain_score >= 0.8 else "Medium" if avg_langchain_score >= 0.6 else "High"
                }
            }
            
            # 평가 요약 로그 출력 (환각 방지 중심) - 기존 로그와 연결
            logger.info(f"   근거성: Parallel {avg_langchain_score:.2f} (환각 위험: {stats['per_drug_groundedness']['hallucination_risk_assessment']['langchain']}) - Stuff는 성능 측정만")
        else:
            stats["per_drug_groundedness"] = None
        
        # JSON validity는 제거 - Claude groundedness 평가만 수행
        
        stats["overall_groundedness"] = None  # 전체적인 groundedness는 별도로 계산하지 않음
        
        return stats

# 전역 서비스 인스턴스
drug_llm_test_service = DrugLLMTestService()