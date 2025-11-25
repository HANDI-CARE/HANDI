"""
비디오 분석 서비스 - MinIO에서 파일을 다운받아 STT + LLM 처리
"""
import os
import time
import uuid
import tempfile
import httpx
from urllib.parse import urlparse
from minio import Minio
from minio.error import S3Error
from fastapi import HTTPException
from app.core.config.config import settings
from app.core.logger import logger
from app.schemas.video_analysis import VideoSummaryRequest, VideoSummaryResponse, ProcessingTimes
from app.services.whisper_service import whisper_service
from app.services.llm_service import llm_service


class VideoAnalysisService:
    def __init__(self):
        self.minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        logger.info(f"MinIO client initialized: {settings.MINIO_ENDPOINT}")
    
    async def process_video_summary(self, request: VideoSummaryRequest) -> VideoSummaryResponse:
        """
        MinIO에서 비디오/오디오 파일을 다운받아 STT + LLM 요약 처리
        """
        total_start_time = time.time()
        temp_file_path = None
        
        try:
            logger.info(f"🎥 비디오 요약 처리 시작: {request.video_url}")
            
            # 1. MinIO에서 파일 다운로드
            download_start_time = time.time()
            temp_file_path = await self._download_from_minio(request.video_url)
            minio_download_time = time.time() - download_start_time
            logger.info(f"📥 MinIO 다운로드 완료: {minio_download_time:.2f}s")
            
            # 2. STT 처리 (GMS API 우선, 실패시 faster-whisper 폴백)
            stt_start_time = time.time()
            stt_result, _, _ = await self._process_stt_with_fallback(temp_file_path)
            stt_processing_time = time.time() - stt_start_time
            logger.info(f"🎤 STT 처리 완료: {stt_processing_time:.2f}s")
            
            if not stt_result.strip():
                return VideoSummaryResponse(
                    stt_result="",
                    llm_result="(음성이 감지되지 않았습니다)",
                    processing_times=ProcessingTimes(
                        minio_download_time=round(minio_download_time, 2),
                        stt_processing_time=round(stt_processing_time, 2),
                        llm_processing_time=0.0,
                        total_processing_time=round(time.time() - total_start_time, 2)
                    ),
                    success=True,
                    message="음성이 감지되지 않았습니다."
                )
            
            # 3. LLM 요약 처리 (Stuff 우선, 실패시 Map-Reduce)
            llm_start_time = time.time()
            llm_result, preprocessing_time = await self._process_llm_with_fallback(stt_result)
            llm_processing_time = time.time() - llm_start_time
            logger.info(f"🤖 LLM 요약 완료: {llm_processing_time:.2f}s")
            
            # 4. 처리 시간 계산
            total_processing_time = time.time() - total_start_time
            
            processing_times = ProcessingTimes(
                minio_download_time=round(minio_download_time, 2),
                stt_processing_time=round(stt_processing_time, 2), 
                llm_processing_time=round(llm_processing_time, 2),
                total_processing_time=round(total_processing_time, 2)
            )
            
            logger.info(f"✅ 비디오 요약 완료 (전체 시간: {total_processing_time:.2f}s)")
            
            return VideoSummaryResponse(
                stt_result=stt_result,
                llm_result=llm_result,
                processing_times=processing_times,
                success=True,
                message="비디오 요약이 성공적으로 완료되었습니다."
            )
            
        except Exception as e:
            logger.error(f"❌ 비디오 요약 처리 실패: {e}")
            
            # 실패한 경우라도 처리 시간 정보 제공
            total_processing_time = time.time() - total_start_time
            processing_times = ProcessingTimes(
                minio_download_time=0.0,
                stt_processing_time=0.0,
                llm_processing_time=0.0,
                total_processing_time=round(total_processing_time, 2)
            )
            
            return VideoSummaryResponse(
                stt_result="",
                llm_result="",
                processing_times=processing_times,
                success=False,
                message=f"비디오 요약 처리 중 오류가 발생했습니다: {str(e)}"
            )
            
        finally:
            # 임시 파일 정리
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info(f"🗑️ 임시 파일 삭제: {temp_file_path}")
                except Exception as cleanup_error:
                    logger.warning(f"⚠️ 임시 파일 삭제 실패: {cleanup_error}")
    
    async def _download_from_minio(self, url: str) -> str:
        """MinIO URL에서 파일을 다운로드하여 임시 파일로 저장"""
        try:
            # URL 파싱하여 버킷명과 객체명 추출
            parsed_url = urlparse(url)
            path_parts = parsed_url.path.strip('/').split('/', 1)
            
            if len(path_parts) != 2:
                raise ValueError(f"올바르지 않은 MinIO URL 형식: {url}")
            
            bucket_name, object_name = path_parts
            logger.info(f"📂 MinIO에서 다운로드: {bucket_name}/{object_name}")
            
            # 임시 파일 경로 생성
            file_extension = os.path.splitext(object_name)[1]
            temp_file_path = os.path.join(
                tempfile.gettempdir(), 
                f"video_analysis_{uuid.uuid4()}{file_extension}"
            )
            
            # MinIO에서 파일 다운로드
            self.minio_client.fget_object(bucket_name, object_name, temp_file_path)
            
            # 파일 크기 확인
            file_size = os.path.getsize(temp_file_path)
            logger.info(f"📁 파일 다운로드 완료: {file_size:,} bytes")
            
            return temp_file_path
            
        except S3Error as e:
            logger.error(f"MinIO S3 오류: {e}")
            raise HTTPException(status_code=404, detail=f"MinIO에서 파일을 찾을 수 없습니다: {e}")
        except Exception as e:
            logger.error(f"MinIO 다운로드 오류: {e}")
            raise HTTPException(status_code=500, detail=f"파일 다운로드 실패: {e}")
    
    async def _process_stt_gms(self, file_path: str) -> str:
        """GMS API whisper-1을 사용한 STT 처리 (/api/v1/stt-langchain-gms와 동일)"""
        try:
            if not settings.GMS_KEY:
                raise HTTPException(status_code=500, detail="GMS_KEY is not configured")
            
            url = f"{settings.GMS_API_URL}/audio/transcriptions"
            headers = {
                "Authorization": f"Bearer {settings.GMS_KEY}"
            }
            
            # 파일 읽기
            with open(file_path, 'rb') as audio_file:
                file_content = audio_file.read()
                filename = os.path.basename(file_path)
                
                files = {
                    "file": (filename, file_content, "audio/wav")
                }
                data = {
                    "model": "whisper-1"
                }
                
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(url, headers=headers, files=files, data=data)
                    response.raise_for_status()
                    result = response.json()
                    
                return result.get("text", "")
                
        except httpx.RequestError as e:
            logger.error(f"GMS STT 요청 오류: {e}")
            raise HTTPException(status_code=500, detail=f"GMS API 요청 실패: {e}")
        except httpx.HTTPStatusError as e:
            logger.error(f"GMS STT HTTP 오류: {e}")
            raise HTTPException(status_code=e.response.status_code, detail=f"GMS API 오류: {e.response.text}")
        except Exception as e:
            logger.error(f"GMS STT 처리 오류: {e}")
            raise HTTPException(status_code=500, detail=f"STT 처리 실패: {e}")
    
    async def _process_stt_with_fallback(self, file_path: str) -> tuple[str, str, bool]:
        """STT 처리 - GMS API 우선 시도, 실패시 faster-whisper로 폴백"""
        try:
            # 1. 먼저 GMS API whisper-1 시도
            logger.info("🎤 GMS API Whisper-1으로 STT 처리 시도...")
            result = await self._process_stt_gms(file_path)
            return result, "GMS_API", False
            
        except Exception as gms_error:
            logger.warning(f"⚠️ GMS API STT 실패, faster-whisper로 폴백: {str(gms_error)}")
            
            try:
                # 2. GMS 실패시 faster-whisper로 폴백
                logger.info("🔄 faster-whisper small 모델로 STT 처리...")
                result = await self._process_stt_faster_whisper(file_path)
                return result, "faster_whisper", True
                
            except Exception as fallback_error:
                logger.error(f"❌ faster-whisper STT 폴백도 실패: {str(fallback_error)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"STT 처리 실패 (GMS: {str(gms_error)}, faster-whisper: {str(fallback_error)})"
                )
    
    async def _process_stt_faster_whisper(self, file_path: str) -> str:
        """faster-whisper를 사용한 STT 처리"""
        try:
            from app.services.whisper_service import whisper_service
            from fastapi import UploadFile
            from io import BytesIO
            
            # 파일을 동기적으로 읽기 (aiofiles 없이)
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # UploadFile 객체 생성
            file_obj = UploadFile(
                file=BytesIO(file_content),
                filename=os.path.basename(file_path),
                headers={"content-type": "audio/wav"}
            )
            
            # whisper_service의 transcribe_audio 메서드 사용
            transcribed_text, duration, used_model = await whisper_service.transcribe_audio(file_obj, "small")
            logger.info(f"✅ faster-whisper STT 완료 (모델: {used_model}, 시간: {duration:.2f}s)")
            
            return transcribed_text
            
        except Exception as e:
            logger.error(f"faster-whisper STT 처리 오류: {e}")
            raise HTTPException(status_code=500, detail=f"faster-whisper STT 처리 실패: {e}")

    async def _process_llm_with_fallback(self, text: str) -> tuple[str, float]:
        """LLM 처리 (Stuff 우선, 실패시 Map-Reduce) (/api/v1/stt-langchain-gms와 동일)"""
        try:
            # 1. 먼저 Stuff 방식 시도
            try:
                summary_result, llm_duration = await llm_service.summarize_direct(text)
                preprocessing_time = 0.0
                
                # context_length_exceeded 에러 메시지 체크
                if "context_length_exceeded" in summary_result or "입력 텍스트가 모델이 한 번에 처리하기에는 너무 깁니다" in summary_result:
                    raise Exception("Context length exceeded, fallback to Map-Reduce")
                    
                return summary_result, preprocessing_time
                
            except Exception:
                # 2. Stuff 실패시 Map-Reduce로 폴백
                logger.info("🔄 Stuff 방식 실패, Map-Reduce로 폴백 처리")
                summary_result, preprocessing_duration, llm_duration = await llm_service.summarize_with_langchain(text)
                return summary_result, preprocessing_duration
                
        except Exception as e:
            logger.error(f"LLM 요약 처리 오류: {e}")
            raise HTTPException(status_code=500, detail=f"LLM 요약 처리 실패: {e}")

    async def process_video_summary_test(self, file: "UploadFile", test_id: str) -> "VideoSummaryTestResponse":
        """
        테스트용 비디오 요약 처리 - DB 저장 없이 결과만 반환
        """
        from app.schemas.video_analysis import VideoSummaryTestResponse, ProcessingTimes
        
        total_start_time = time.time()
        temp_file_path = None
        stt_method_used = "unknown"
        fallback_occurred = False
        
        try:
            logger.info(f"🧪 테스트용 비디오 요약 처리 시작 - test_id: {test_id}, file: {file.filename}")
            
            # 1. 업로드된 파일을 임시 파일로 저장
            download_start_time = time.time()
            temp_file_path = await self._save_uploaded_file_to_temp(file)
            minio_download_time = time.time() - download_start_time
            logger.info(f"📥 파일 저장 완료: {minio_download_time:.2f}s")
            
            # 2. STT 처리 (GMS API 우선, 실패시 faster-whisper 폴백)
            stt_start_time = time.time()
            stt_result, stt_method_used, fallback_occurred = await self._process_stt_with_fallback(temp_file_path)
            stt_processing_time = time.time() - stt_start_time
            logger.info(f"🎤 STT 처리 완료: {stt_processing_time:.2f}s (방법: {stt_method_used})")
            
            if not stt_result.strip():
                return VideoSummaryTestResponse(
                    test_id=test_id,
                    stt_result="",
                    llm_result="(음성이 감지되지 않았습니다)",
                    processing_times=ProcessingTimes(
                        minio_download_time=round(minio_download_time, 2),
                        stt_processing_time=round(stt_processing_time, 2),
                        llm_processing_time=0.0,
                        total_processing_time=round(time.time() - total_start_time, 2)
                    ),
                    success=True,
                    message="음성이 감지되지 않았습니다.",
                    stt_method_used=stt_method_used,
                    fallback_occurred=fallback_occurred
                )
            
            # 3. LLM 요약 처리 (Stuff 우선, 실패시 Map-Reduce)
            llm_start_time = time.time()
            llm_result, preprocessing_time = await self._process_llm_with_fallback(stt_result)
            llm_processing_time = time.time() - llm_start_time
            logger.info(f"🤖 LLM 요약 완료: {llm_processing_time:.2f}s")
            
            # 4. 처리 시간 계산
            total_processing_time = time.time() - total_start_time
            
            processing_times = ProcessingTimes(
                minio_download_time=round(minio_download_time, 2),
                stt_processing_time=round(stt_processing_time, 2), 
                llm_processing_time=round(llm_processing_time, 2),
                total_processing_time=round(total_processing_time, 2)
            )
            
            logger.info(f"✅ 테스트용 비디오 요약 완료 (전체 시간: {total_processing_time:.2f}s)")
            
            return VideoSummaryTestResponse(
                test_id=test_id,
                stt_result=stt_result,
                llm_result=llm_result,
                processing_times=processing_times,
                success=True,
                message="비디오 요약이 성공적으로 완료되었습니다.",
                stt_method_used=stt_method_used,
                fallback_occurred=fallback_occurred
            )
            
        except Exception as e:
            logger.error(f"❌ 테스트용 비디오 요약 처리 실패: {e}")
            
            # 실패한 경우라도 처리 시간 정보 제공
            total_processing_time = time.time() - total_start_time
            processing_times = ProcessingTimes(
                minio_download_time=0.0,
                stt_processing_time=0.0,
                llm_processing_time=0.0,
                total_processing_time=round(total_processing_time, 2)
            )
            
            return VideoSummaryTestResponse(
                test_id=test_id,
                stt_result="",
                llm_result="",
                processing_times=processing_times,
                success=False,
                message=f"비디오 요약 처리 중 오류가 발생했습니다: {str(e)}",
                stt_method_used=stt_method_used,
                fallback_occurred=fallback_occurred
            )
            
        finally:
            # 임시 파일 정리
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info(f"🗑️ 임시 파일 삭제: {temp_file_path}")
                except Exception as cleanup_error:
                    logger.warning(f"⚠️ 임시 파일 삭제 실패: {cleanup_error}")

    async def _save_uploaded_file_to_temp(self, file: "UploadFile") -> str:
        """업로드된 파일을 임시 파일로 저장"""
        try:
            import uuid
            import tempfile
            
            # 임시 파일 경로 생성
            file_extension = os.path.splitext(file.filename)[1] if file.filename else '.tmp'
            temp_file_path = os.path.join(
                tempfile.gettempdir(), 
                f"video_test_{uuid.uuid4()}{file_extension}"
            )
            
            # 파일 내용 저장
            with open(temp_file_path, 'wb') as temp_file:
                content = await file.read()
                temp_file.write(content)
            
            # 파일 크기 확인
            file_size = os.path.getsize(temp_file_path)
            logger.info(f"📁 테스트 파일 저장 완료: {file_size:,} bytes")
            
            return temp_file_path
            
        except Exception as e:
            logger.error(f"테스트 파일 저장 오류: {e}")
            raise HTTPException(status_code=500, detail=f"파일 저장 실패: {e}")


# 전역 서비스 인스턴스
video_analysis_service = VideoAnalysisService()