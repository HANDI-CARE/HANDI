"""
LangSmith 데이터 분석 서비스
"""
import json
import statistics
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from langsmith import Client
from app.core.config.config import settings
from app.core.logger import logger
from app.schemas.drug_analysis import (
    MethodStats, EvaluationStats, LangSmithSummaryResponse
)

class LangSmithAnalysisService:
    def __init__(self):
        self.client = None
        if settings.LANGCHAIN_TRACING_V2.lower() == "true" and settings.LANGCHAIN_API_KEY:
            try:
                self.client = Client(api_key=settings.LANGCHAIN_API_KEY)
                logger.info("LangSmith 분석 클라이언트 초기화 완료")
            except Exception as e:
                logger.warning(f"LangSmith 클라이언트 초기화 실패: {e}")

    async def get_langsmith_summary(self) -> LangSmithSummaryResponse:
        """LangSmith 프로젝트의 종합 분석 요약을 생성합니다."""
        if not self.client:
            raise Exception("LangSmith 클라이언트가 초기화되지 않았습니다.")
        
        try:
            project_name = settings.LANGCHAIN_PROJECT
            logger.info(f"🔍 LangSmith 분석 대상 프로젝트: {project_name}")
            
            # 1. Stuff 방식 통계
            stuff_stats = await self._analyze_method_runs(["abtest", "A"])
            
            # 2. LangChain 방식 통계  
            langchain_stats = await self._analyze_method_runs(["abtest", "B"])
            
            # 3. 약물별 Groundedness 근거성 평가 통계 (환각 방지 중심)
            groundedness_stats = await self._analyze_evaluation_runs(["evaluation", "groundedness", "per_drug"])
            
            # 4. 요약 인사이트 생성 (환각 방지 중심)
            insights = self._generate_insights(stuff_stats, langchain_stats, groundedness_stats)
            
            # 한국시간(KST) 기준으로 시간 표시
            kst = timezone(timedelta(hours=9))
            current_kst = datetime.now(kst)
            
            return LangSmithSummaryResponse(
                project_name=project_name,
                analysis_period=f"최근 7일 (분석 시점: {current_kst.strftime('%Y-%m-%d %H:%M')} KST) - 환각 방지 중심 분석",
                stuff_method_stats=stuff_stats,
                langchain_method_stats=langchain_stats,
                groundedness_stats=groundedness_stats,
                summary_insights=insights
            )
            
        except Exception as e:
            logger.error(f"LangSmith 분석 중 오류 발생: {e}")
            raise Exception(f"LangSmith 분석 실패: {str(e)}")

    async def _analyze_method_runs(self, tags: List[str]) -> MethodStats:
        """특정 태그의 메서드 실행 통계를 분석합니다."""
        try:
            # 최근 7일간 모든 데이터 조회 (KST 기준)
            kst = timezone(timedelta(hours=9))
            current_kst = datetime.now(kst)
            start_time_kst = current_kst - timedelta(days=7)
            start_time_utc = start_time_kst.astimezone(timezone.utc).replace(tzinfo=None)  # LangSmith는 UTC naive 필요
            
            # 일반적인 방식으로 모든 데이터 가져오기
            all_runs = list(self.client.list_runs(
                project_name=settings.LANGCHAIN_PROJECT,
                start_time=start_time_utc
            ))
            
            # 클라이언트 사이드에서 태그 필터링
            runs = []
            
            for run in all_runs:
                run_tags = getattr(run, 'tags', []) or []
                
                if run_tags:
                    # 모든 요구 태그가 있는지 확인
                    tag_matches = [tag in run_tags for tag in tags]
                    if all(tag_matches):
                        # LLM 처리 함수만 카운트 (수정된 함수명)
                        if run.name in ['drug_analysis_stuff_llm_processing', 'drug_analysis_langchain_llm_processing']:
                            runs.append(run)
            
            if not runs:
                return MethodStats(
                    total_requests=0,
                    avg_latency=0.0,
                    min_latency=0.0,
                    max_latency=0.0,
                    avg_tokens=None,
                    success_rate=0.0
                )
            
            # 레이턴시 계산 (밀리초 → 초 변환)
            latencies = []
            token_counts = []
            successful_runs = 0
            
            for run in runs:
                if run.end_time and run.start_time:
                    # 레이턴시 계산 (초 단위)
                    latency = (run.end_time - run.start_time).total_seconds()
                    latencies.append(latency)
                    
                    # 성공 여부 확인
                    if not run.error and run.status == "success":
                        successful_runs += 1
            
            # 토큰 정보 별도 수집 (ChatOpenAI 호출에서)
            token_counts = await self._collect_token_usage(tags, all_runs)
            
            # 통계 계산
            avg_latency = statistics.mean(latencies) if latencies else 0.0
            min_latency = min(latencies) if latencies else 0.0
            max_latency = max(latencies) if latencies else 0.0
            avg_tokens = statistics.mean(token_counts) if token_counts else None
            success_rate = (successful_runs / len(runs) * 100) if runs else 0.0
            
            return MethodStats(
                total_requests=len(runs),
                avg_latency=round(avg_latency, 3),
                min_latency=round(min_latency, 3),
                max_latency=round(max_latency, 3),
                avg_tokens=round(avg_tokens, 1) if avg_tokens else None,
                success_rate=round(success_rate, 1)
            )
            
        except Exception as e:
            logger.error(f"메서드 분석 실패 (태그: {tags}): {e}")
            raise

    async def _collect_token_usage(self, tags: List[str], all_runs: List) -> List[float]:
        """ChatOpenAI 호출에서 토큰 사용량 수집"""
        token_counts = []
        
        for run in all_runs:
            run_tags = getattr(run, 'tags', []) or []
            
            # 태그 매칭하고 ChatOpenAI인 경우에만 처리
            if run_tags and all(tag in run_tags for tag in tags) and run.name == 'ChatOpenAI':
                # 토큰 정보 추출
                if hasattr(run, 'outputs') and isinstance(run.outputs, dict):
                    llm_output = run.outputs.get('llm_output', {})
                    if isinstance(llm_output, dict):
                        token_usage = llm_output.get('token_usage', {})
                        if isinstance(token_usage, dict):
                            total_tokens = token_usage.get('total_tokens')
                            if total_tokens:
                                # Stuff 방식은 약물 2개씩 처리하므로 2로 나누기
                                if "A" in tags:  # Stuff 방식
                                    token_counts.append(total_tokens / 2)
                                else:  # LangChain 방식은 개별 약물별 처리
                                    token_counts.append(total_tokens)
                
        return token_counts

    async def _analyze_evaluation_runs(self, tags: List[str]) -> EvaluationStats:
        """평가 실행 통계를 분석합니다."""
        try:
            # 최근 7일간 모든 데이터 조회 (KST 기준)
            kst = timezone(timedelta(hours=9))
            current_kst = datetime.now(kst)
            start_time_kst = current_kst - timedelta(days=7)
            start_time_utc = start_time_kst.astimezone(timezone.utc).replace(tzinfo=None)
            
            # 일반적인 방식으로 모든 데이터 가져오기
            all_runs = list(self.client.list_runs(
                project_name=settings.LANGCHAIN_PROJECT,
                start_time=start_time_utc
            ))
            
            # 클라이언트 사이드에서 태그 필터링
            runs = []
            
            for run in all_runs:
                run_tags = getattr(run, 'tags', []) or []
                
                if run_tags:
                    # 모든 요구 태그가 있는지 확인
                    tag_matches = [tag in run_tags for tag in tags]
                    if all(tag_matches):
                        # single_drug_groundedness_evaluation 함수만 카운트 (개별 약물 평가만)
                        if run.name == 'single_drug_groundedness_evaluation':
                            runs.append(run)
            
            if not runs:
                return EvaluationStats(
                    total_evaluations=0,
                    avg_score=0.0,
                    min_score=0.0,
                    max_score=0.0,
                    std_deviation=0.0
                )
            
            # 평가 점수 추출
            scores = []
            
            for run in runs:
                if run.outputs:
                    try:
                        # outputs에서 점수 추출 (디버깅 로그 추가)
                        logger.debug(f"Run {run.name} outputs 구조: {type(run.outputs)} - {run.outputs}")
                        
                        if isinstance(run.outputs, dict):
                            score = run.outputs.get('score')
                            if isinstance(score, (int, float)):
                                scores.append(float(score))
                                # 0.0인 경우 전체 정보 출력
                                if float(score) == 0.0:
                                    logger.error(f"★ 0점 발견! Run ID: {getattr(run, 'id', 'N/A')}")
                                    logger.error(f"★ 0점 Run 이름: {run.name}")
                                    logger.error(f"★ 0점 Run 전체 outputs: {run.outputs}")
                                    logger.error(f"★ 0점 Run 태그: {getattr(run, 'tags', [])}")
                                    logger.error(f"★ 0점 Run 시작시간: {getattr(run, 'start_time', 'N/A')}")
                                    logger.error(f"★ 0점 Run 종료시간: {getattr(run, 'end_time', 'N/A')}")
                                    logger.error(f"★ 0점 Run 에러: {getattr(run, 'error', 'N/A')}")
                                    logger.error(f"★ 0점 Run 상태: {getattr(run, 'status', 'N/A')}")
                                else:
                                    logger.debug(f"정상 점수 추가됨: {score}")
                            else:
                                # 'score' 키가 없거나 값이 올바르지 않은 경우 전체 구조 확인
                                logger.debug(f"점수를 찾을 수 없음 - outputs 키들: {list(run.outputs.keys())}")
                        elif isinstance(run.outputs, str):
                            # JSON 문자열인 경우 파싱 시도
                            try:
                                output_data = json.loads(run.outputs)
                                if isinstance(output_data, dict) and 'score' in output_data:
                                    score = float(output_data['score'])
                                    scores.append(score)
                                    # 0.0인 경우 전체 정보 출력
                                    if score == 0.0:
                                        logger.error(f"★ JSON에서 0점 발견! Run ID: {getattr(run, 'id', 'N/A')}")
                                        logger.error(f"★ JSON 0점 Run 이름: {run.name}")
                                        logger.error(f"★ JSON 0점 전체 outputs: {run.outputs}")
                                        logger.error(f"★ JSON 0점 파싱된 데이터: {output_data}")
                                        logger.error(f"★ JSON 0점 Run 에러: {getattr(run, 'error', 'N/A')}")
                                    else:
                                        logger.debug(f"JSON에서 정상 점수 추가됨: {score}")
                            except json.JSONDecodeError:
                                logger.debug(f"JSON 파싱 실패: {run.outputs}")
                                continue
                    except Exception as e:
                        logger.debug(f"점수 추출 중 오류: {e}")
                        continue
            
            # 통계 계산
            if not scores:
                logger.warning(f"점수를 추출할 수 없음. 총 run 개수: {len(runs)}")
                return EvaluationStats(
                    total_evaluations=len(runs),
                    avg_score=0.0,
                    min_score=0.0,
                    max_score=0.0,
                    std_deviation=0.0
                )
            
            avg_score = statistics.mean(scores)
            min_score = min(scores)
            max_score = max(scores)
            std_dev = statistics.stdev(scores) if len(scores) > 1 else 0.0
            
            logger.info(f"계산된 통계: avg={avg_score:.2f}, min={min_score:.2f}, max={max_score:.2f}, std={std_dev:.2f}")
            
            return EvaluationStats(
                total_evaluations=len(runs),
                avg_score=round(avg_score, 2),
                min_score=round(min_score, 2),
                max_score=round(max_score, 2),
                std_deviation=round(std_dev, 2)
            )
            
        except Exception as e:
            logger.error(f"평가 분석 실패 (태그: {tags}): {e}")
            raise

    def _generate_insights(self, stuff_stats: MethodStats, langchain_stats: MethodStats, groundedness_stats: EvaluationStats) -> Dict[str, Any]:
        """분석 결과를 바탕으로 환각 방지 중심 인사이트를 생성합니다."""
        insights = {}
        
        # 성능 비교
        if stuff_stats.avg_latency > 0 and langchain_stats.avg_latency > 0:
            if stuff_stats.avg_latency < langchain_stats.avg_latency:
                faster_method = "Stuff"
                improvement = ((langchain_stats.avg_latency - stuff_stats.avg_latency) / langchain_stats.avg_latency) * 100
            else:
                faster_method = "LangChain"
                improvement = ((stuff_stats.avg_latency - langchain_stats.avg_latency) / stuff_stats.avg_latency) * 100
            
            insights["performance"] = {
                "faster_method": faster_method,
                "improvement_percentage": round(improvement, 1),
                "latency_difference": round(abs(stuff_stats.avg_latency - langchain_stats.avg_latency), 3)
            }
        
        # 안정성 비교
        insights["reliability"] = {
            "more_stable_method": "Stuff" if stuff_stats.success_rate >= langchain_stats.success_rate else "LangChain",
            "stuff_success_rate": stuff_stats.success_rate,
            "langchain_success_rate": langchain_stats.success_rate
        }
        
        # 토큰 효율성
        if stuff_stats.avg_tokens and langchain_stats.avg_tokens:
            insights["token_efficiency"] = {
                "more_efficient_method": "Stuff" if stuff_stats.avg_tokens <= langchain_stats.avg_tokens else "LangChain",
                "stuff_avg_tokens": stuff_stats.avg_tokens,
                "langchain_avg_tokens": langchain_stats.avg_tokens
            }
        
        # 약물별 근거성 평가 (환각 방지 중심)
        if groundedness_stats.total_evaluations > 0:
            grounding_level = "높음" if groundedness_stats.avg_score >= 0.8 else "보통" if groundedness_stats.avg_score >= 0.6 else "낮음"
            grounding_consistency = "일관적" if groundedness_stats.std_deviation <= 0.1 else "보통" if groundedness_stats.std_deviation <= 0.2 else "불안정"
            
            insights["hallucination_prevention"] = {
                "grounding_level": grounding_level,
                "consistency_level": grounding_consistency,
                "avg_grounding_score": groundedness_stats.avg_score,
                "grounding_variance": groundedness_stats.std_deviation,
                "hallucination_risk": "낮음" if groundedness_stats.avg_score >= 0.8 else "보통" if groundedness_stats.avg_score >= 0.6 else "높음",
                "per_drug_evaluation": True,
                "focus": "RAG 환경 환각 방지"
            }
        
        return insights

# 전역 서비스 인스턴스
langsmith_analysis_service = LangSmithAnalysisService()