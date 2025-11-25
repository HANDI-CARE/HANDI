
import pika
import json
import logging
import threading
import time
import asyncio
from typing import Dict, Any, List
from minio import Minio
from minio.error import S3Error
from app.core.config.config import settings
from langsmith import traceable
from app.services.drug_analysis_service import drug_analysis_service
from app.services.chromadb_service import init_chromadb
from app.schemas.drug_analysis import DrugInfoAnalysisRequest, DrugSummaryItem
from app.services.video_analysis_service import VideoAnalysisService
from app.schemas.video_analysis import VideoSummaryRequest
from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

class RabbitMQConfig:
    def __init__(self):
        self.host = settings.RABBITMQ_HOST
        self.port = settings.RABBITMQ_PORT
        self.username = settings.RABBITMQ_USERNAME
        self.password = settings.RABBITMQ_PASSWORD
        self.exchange_name = settings.RABBITMQ_EXCHANGE_NAME
        self.queue_name = settings.RABBITMQ_QUEUE_NAME
        self.routing_key = settings.RABBITMQ_ROUTING_KEY

class RabbitMQConsumer:
    def __init__(self, config: RabbitMQConfig):
        self.config = config
        self.connection = None
        self.channel = None
        self.consumed_messages: List[Dict[str, Any]] = []
        self.is_consuming = False
        # MinIO 클라이언트 초기화
        self.minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        # Video Analysis Service 초기화
        self.video_analysis_service = VideoAnalysisService()
        logger.info(f"MinIO client initialized with endpoint: {settings.MINIO_ENDPOINT}, access_key: {settings.MINIO_ACCESS_KEY[:4]}***")
        
    def connect(self) -> bool:
        try:
            credentials = pika.PlainCredentials(
                self.config.username, 
                self.config.password
            )
            parameters = pika.ConnectionParameters(
                host=self.config.host,
                port=self.config.port,
                credentials=credentials
            )
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            self.channel.exchange_declare(
                exchange=self.config.exchange_name,
                exchange_type='direct',
                durable=True
            )
            
            self.channel.queue_declare(queue=self.config.queue_name, durable=True)
            self.channel.queue_bind(
                exchange=self.config.exchange_name,
                queue=self.config.queue_name,
                routing_key=self.config.routing_key
            )
            
            logger.info("RabbitMQ connection established")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            return False
    
    def disconnect(self):
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            logger.info("RabbitMQ connection closed")

    def _get_existing_medication_schedule_data(self, medication_id: int) -> Dict[str, Any]:
        """PostgreSQL에서 기존 medication_schedule의 description 데이터를 가져옵니다."""
        import psycopg2
        import json
        
        try:
            # PostgreSQL 동기 연결 생성
            conn = psycopg2.connect(
                host=settings.POSTGRES_HOST,
                port=settings.POSTGRES_PORT,
                database=settings.POSTGRES_DB,
                user=settings.POSTGRES_USER,
                password=settings.POSTGRES_PASSWORD
            )
            
            cursor = conn.cursor()
            
            # 기존 description 데이터 조회
            cursor.execute("""
                SELECT description 
                FROM medication_schedules 
                WHERE id = %s
            """, (medication_id,))
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if result and result[0]:
                # JSONB 데이터가 존재하는 경우
                existing_data = result[0]
                print(f"📋 기존 description 데이터 조회 완료: {len(str(existing_data))} characters")
                return existing_data
            else:
                print(f"⚠️ medication_id {medication_id}에 대한 기존 description 데이터가 없음")
                return {"drug_candidates": []}
                
        except Exception as e:
            print(f"❌ 기존 description 데이터 조회 실패: {str(e)}")
            logger.error(f"Failed to get existing medication schedule data for id {medication_id}: {str(e)}")
            return {"drug_candidates": []}

    def _process_drug_summary(self, data: Dict[str, Any], medication_id=None):
        """약물 요약 요청 처리 - 기존 DB 데이터와 LLM 분석 결과 병합 (동기 버전)"""
        try:
            # ChromaDB는 이미 서버 시작시 초기화됨 - 중복 초기화 제거
            # init_chromadb()  # 제거: 이미 메인 스레드에서 초기화됨

            drug_summary_data = data.get('drug_summary', [])
            if not drug_summary_data:
                print("Error: No drug_summary data found")
                return
            
            drug_items = [DrugSummaryItem(**item) for item in drug_summary_data]
            # note 정보 추가
            note = data.get('note', '')
            request = DrugInfoAnalysisRequest(drug_summary=drug_items, note=note)
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # medication_id가 파라미터로 전달되지 않았으면 data에서 추출
            if medication_id is None:
                medication_id = data.get('id', data.get('pk', 'unknown'))
            
            try:
                # 입력 데이터 크기 계산
                total_input_chars = 0
                for drug_item in request.drug_summary:
                    if drug_item.name:
                        total_input_chars += len(drug_item.name)
                    if drug_item.capacity:
                        total_input_chars += len(drug_item.capacity)
                
                print(f"\n--- 약물 분석 처리 시작 (약물 {len(request.drug_summary)}개, medication_id: {medication_id}) ---")
                print(f"   - 입력 데이터 크기: {total_input_chars:,} characters")
                
                # 1. 기존 PostgreSQL에서 description 데이터 조회
                print(f"\n🔍 PostgreSQL에서 기존 약물 기본 정보 조회 시작...")
                existing_data = self._get_existing_medication_schedule_data(medication_id)
                existing_drug_candidates = existing_data.get('drug_candidates', [])
                print(f"   - 기존 약물 수: {len(existing_drug_candidates)}개")
                
                # 2. LangChain 방식으로 LLM 분석 실행 (LangSmith 트레이싱 포함)
                try:
                    langchain_result = loop.run_until_complete(self._analyze_drug_info_with_tracing(request))
                    
                    # 결과 로그 출력
                    print(f"✅ 약물 분석 완료")
                    print(f"   - 데이터 수집 시간: {langchain_result.data_collection_time}s")
                    print(f"   - LLM 처리 시간: {langchain_result.processing_time}s")
                    print(f"   - 총 처리 시간: {langchain_result.data_collection_time + langchain_result.processing_time}s")
                    print(f"   - 결과 크기: {len(langchain_result.analysis_result):,} characters")
                    print(f"\n📋 분석 결과:")
                    print(langchain_result.analysis_result)
                    
                    # 3. LLM 분석 결과를 기존 drug_candidates에 병합
                    print(f"\n🔄 기존 데이터와 LLM 분석 결과 병합 시작...")
                    updated_drug_candidates = []
                    
                    try:
                        import json
                        # LLM 결과가 JSON 형태인지 확인하고 파싱
                        analysis_json = json.loads(langchain_result.analysis_result)
                        
                        # 기존 약물 데이터에 LLM 분석 결과 추가
                        for existing_candidate in existing_drug_candidates:
                            drug_name = existing_candidate.get("productName", "")
                            updated_candidate = existing_candidate.copy()
                            
                            # 약물명으로 LLM 분석 결과 매칭
                            if drug_name in analysis_json:
                                updated_candidate["description"] = analysis_json[drug_name]
                                print(f"   📄 '{drug_name}' LLM 분석 결과 추가 완료")
                            else:
                                # 약물명이 정확히 매치되지 않는 경우 유사한 이름 검색
                                matched_key = None
                                for analysis_key in analysis_json.keys():
                                    if drug_name in analysis_key or analysis_key in drug_name:
                                        matched_key = analysis_key
                                        break
                                
                                if matched_key:
                                    updated_candidate["description"] = analysis_json[matched_key]
                                    print(f"   📄 '{drug_name}' -> '{matched_key}' LLM 분석 결과 매핑 완료")
                                else:
                                    print(f"   ⚠️ '{drug_name}'에 대한 LLM 분석 결과를 찾을 수 없음")
                            
                            updated_drug_candidates.append(updated_candidate)
                    
                    except json.JSONDecodeError as e:
                        logger.error(f"LLM 결과 JSON 파싱 실패: {str(e)}")
                        raise
                    
                    # 4. 최종 결과 구조 생성
                    final_result = {
                        "drug_candidates": updated_drug_candidates
                    }
                    
                    # 5. 데이터베이스 업데이트
                    print(f"\n💾 데이터베이스 업데이트 시작...")
                    print(f"   - 총 약물 수: {len(updated_drug_candidates)}")
                    print(f"   - LLM 분석이 추가된 약물 수: {sum(1 for candidate in updated_drug_candidates if 'description' in candidate)}")
                    print(f"   - 처리 시간: {langchain_result.data_collection_time + langchain_result.processing_time}s")
                    try:
                        self._update_medication_schedule_description_sync(medication_id, json.dumps(final_result, ensure_ascii=False))
                    except Exception as db_error:
                        logger.error(f"Database update failed for medication_schedule id {medication_id}: {str(db_error)}")
                        raise
                
                except Exception as langchain_error:
                    print(f"❌ 약물 분석 실패: {langchain_error}")
                    raise Exception(f"약물 분석 실패: {langchain_error}")
                
                # 최종 업데이트 로그 출력
                current_time = time.strftime("%Y-%m-%d %H:%M:%S")
                print(f"\n🔄 {current_time} - medication_id : {medication_id} summary has been updated")
                
            finally:
                loop.close()
            
        except Exception as e:
            print(f"Error processing drug summary comparison: {str(e)}")
            logger.error(f"Drug summary comparison failed: {str(e)}")
            raise
    
    @traceable(
        name="drug_analysis_langchain_llm_processing",
        tags=["abtest", "B", "rabbitmq"],
        metadata={
            "method": "B",
            "model": settings.LLM_MODEL_NAME,
            "temperature": str(settings.LLM_TEMPERATURE),
            "approach": "map_reduce_chain",
            "processing": "parallel",
            "source": "rabbitmq"
        }
    )
    async def _analyze_drug_info_with_tracing(self, request):
        """RabbitMQ 전용 약물 분석 (LangSmith 트레이싱 포함)"""
        return await drug_analysis_service.analyze_drug_info_langchain(request)
    
    def _process_video_summary(self, data: Dict[str, Any]):
        """video-summary 요청 처리 - MinIO에서 파일 다운로드 후 STT + LLM 처리"""
        try:
            pk = data.get('id', 'unknown')
            link = data.get('link', '')
            
            if not link:
                print(f"❌ Video summary processing failed: No link provided")
                logger.error(f"Video summary processing failed for pk {pk}: No link provided")
                raise Exception("Video summary processing failed: No link provided")
            
            print(f"\n--- 🎥 비디오 요약 처리 시작 (pk: {pk}) ---")
            print(f"파일 경로: {link}")
            
            # MinIO HTTP URL 형식으로 변환: bucket/object -> http://localhost:9000/bucket/object
            if '/' in link:
                bucket_name, object_name = link.split('/', 1)
                # 로컬 환경을 위한 HTTP URL 형식으로 구성
                protocol = "https" if settings.MINIO_SECURE else "http"
                minio_url = f"{protocol}://{settings.MINIO_ENDPOINT}/{bucket_name}/{object_name}"
                print(f"   🔗 변환된 MinIO URL: {minio_url}")
                
                # VideoSummaryRequest 생성
                video_request = VideoSummaryRequest(video_url=minio_url)
                
                # 비동기 루프 생성
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                try:
                    # Video Analysis Service를 통한 STT + LLM 처리
                    result = loop.run_until_complete(
                        self.video_analysis_service.process_video_summary(video_request)
                    )
                    
                    if result.success:
                        print(f"✅ 비디오 요약 처리 완료")
                        print(f"   - MinIO 다운로드: {result.processing_times.minio_download_time}s")
                        print(f"   - STT 처리: {result.processing_times.stt_processing_time}s")  
                        print(f"   - LLM 처리: {result.processing_times.llm_processing_time}s")
                        print(f"   - 총 처리 시간: {result.processing_times.total_processing_time}s")
                        print(f"\n🎤 STT 결과 ({len(result.stt_result)} 문자):")
                        print(f"   {result.stt_result[:200]}..." if len(result.stt_result) > 200 else f"   {result.stt_result}")
                        print(f"\n🤖 LLM 요약 결과 ({len(result.llm_result)} 문자):")
                        print(f"   {result.llm_result[:300]}..." if len(result.llm_result) > 300 else f"   {result.llm_result}")
                        
                        # 데이터베이스 업데이트 (동기 처리)
                        print(f"\n💾 데이터베이스 업데이트 시작...")
                        try:
                            # 별도의 루프에서 데이터베이스 업데이트 실행
                            self._update_meeting_match_content_sync(pk, result.llm_result)
                        except Exception as db_error:
                            logger.error(f"Database update failed for meeting_match id {pk}: {str(db_error)}")
                            raise
                    else:
                        print(f"❌ 비디오 요약 처리 실패: {result.message}")
                        logger.error(f"Video summary processing failed for pk {pk}: {result.message}")
                        raise Exception(f"Video summary processing failed: {result.message}")
                    
                    # 최종 업데이트 로그
                    current_time = time.strftime("%Y-%m-%d %H:%M:%S")
                    print(f"\n🔄 {current_time} - pk : {pk} video summary has been processed")
                    
                finally:
                    loop.close()
            else:
                print(f"❌ Invalid link format: {link}")
                logger.error(f"Invalid link format for pk {pk}: {link}")
                raise Exception(f"Invalid link format for pk {pk}: {link}")
                
        except Exception as e:
            print(f"❌ Error processing video summary: {str(e)}")
            logger.error(f"Video summary processing failed for pk {data.get('id', 'unknown')}: {str(e)}")
            raise
    
    def _update_meeting_match_content_sync(self, meeting_match_id: int, content: str):
        """meeting_matches 테이블의 content를 업데이트 (동기 방식)"""
        import psycopg2
        
        def sync_db_update():
            """동기 방식으로 데이터베이스 업데이트"""
            try:
                # PostgreSQL 동기 연결 생성
                conn = psycopg2.connect(
                    host=settings.POSTGRES_HOST,
                    port=settings.POSTGRES_PORT,
                    database=settings.POSTGRES_DB,
                    user=settings.POSTGRES_USER,
                    password=settings.POSTGRES_PASSWORD
                )
                
                cursor = conn.cursor()
                
                # 문자열 형태로 저장
                cursor.execute("""
                    UPDATE meeting_matches 
                    SET content = %s
                    WHERE id = %s
                """, (content, meeting_match_id))
                
                conn.commit()
                cursor.close()
                conn.close()
                
                return True
                
            except Exception as e:
                logger.error(f"Sync database update error: {e}")
                raise e
        
        try:
            # 동기 방식으로 데이터베이스 업데이트 실행
            sync_db_update()
            print(f"✅ 데이터베이스 업데이트 완료: meeting_match id {meeting_match_id}")
            logger.info(f"Updated meeting_match content for id {meeting_match_id}")
                
        except Exception as e:
            print(f"❌ 데이터베이스 업데이트 실패: {str(e)}")
            logger.error(f"Failed to update meeting_match content for id {meeting_match_id}: {str(e)}")
            raise
    
    def _update_medication_schedule_description_sync(self, medication_schedule_id, description: str):
        """medication_schedules 테이블의 description을 업데이트 (동기 방식)"""
        import psycopg2
        import json
        
        # ID 유효성 검증
        if medication_schedule_id == 'unknown' or medication_schedule_id is None:
            print(f"❌ 잘못된 medication_schedule_id: {medication_schedule_id}")
            logger.error(f"Invalid medication_schedule_id: {medication_schedule_id}")
            raise ValueError(f"Invalid medication_schedule_id: {medication_schedule_id}")
        
        try:
            # 문자열인 경우 정수로 변환 시도
            if isinstance(medication_schedule_id, str):
                medication_schedule_id = int(medication_schedule_id)
        except (ValueError, TypeError) as convert_error:
            print(f"❌ medication_schedule_id를 정수로 변환할 수 없음: {medication_schedule_id}")
            logger.error(f"Cannot convert medication_schedule_id to integer: {medication_schedule_id}")
            raise convert_error
        
        def sync_db_update():
            """동기 방식으로 데이터베이스 업데이트"""
            try:
                # PostgreSQL 동기 연결 생성
                conn = psycopg2.connect(
                    host=settings.POSTGRES_HOST,
                    port=settings.POSTGRES_PORT,
                    database=settings.POSTGRES_DB,
                    user=settings.POSTGRES_USER,
                    password=settings.POSTGRES_PASSWORD
                )
                
                cursor = conn.cursor()
                
                # description이 이미 JSON 문자열인지 확인
                try:
                    # JSON 형태인지 확인
                    json.loads(description)
                    description_json = description  # 이미 JSON 문자열
                except json.JSONDecodeError:
                    # JSON이 아닌 경우 기존 방식으로 감싸기
                    description_json = json.dumps({"llm_analysis": description}, ensure_ascii=False)
                
                # JSONB 형태로 저장
                cursor.execute("""
                    UPDATE medication_schedules 
                    SET description = CAST(%s AS jsonb)
                    WHERE id = %s
                """, (description_json, medication_schedule_id))
                
                conn.commit()
                cursor.close()
                conn.close()
                
                return True
                
            except Exception as e:
                logger.error(f"Sync database update error: {e}")
                raise e
        
        try:
            # 동기 방식으로 데이터베이스 업데이트 실행
            sync_db_update()
            print(f"✅ 데이터베이스 업데이트 완료: medication_schedule id {medication_schedule_id}")
            logger.info(f"Updated medication_schedule description for id {medication_schedule_id}")
                
        except Exception as e:
            print(f"❌ 데이터베이스 업데이트 실패: {str(e)}")
            logger.error(f"Failed to update medication_schedule description for id {medication_schedule_id}: {str(e)}")
            raise
    
    def _check_minio_file_info(self, bucket_name: str, object_name: str) -> Dict[str, Any]:
        """MinIO에서 파일 정보를 확인 (개선된 버전)"""
        try:
            # MinIO 연결 정보 디버깅 (첫 번째 호출에서만 출력)
            if not hasattr(self, '_debug_printed'):
                print(f"🔧 MinIO 연결 정보:")
                print(f"   - 엔드포인트: {settings.MINIO_ENDPOINT}")
                print(f"   - Access Key: {settings.MINIO_ACCESS_KEY}")
                print(f"   - Secret Key: {settings.MINIO_SECRET_KEY[:4]}***")
                print(f"   - Secure: {settings.MINIO_SECURE}")
                self._debug_printed = True
            
            # 1. 먼저 버킷 존재 여부 확인
            bucket_exists = self.minio_client.bucket_exists(bucket_name)
            if not bucket_exists:
                available_buckets = []
                try:
                    buckets = list(self.minio_client.list_buckets())
                    available_buckets = [bucket.name for bucket in buckets]
                except:
                    available_buckets = ["Unable to list buckets"]
                
                return {
                    "exists": False,
                    "bucket_exists": False,
                    "error": f"Bucket '{bucket_name}' does not exist",
                    "available_buckets": available_buckets
                }
            
            # 2. 파일 존재 여부 및 상세 정보 확인
            stat = self.minio_client.stat_object(bucket_name, object_name)
            
            # 3. 파일 크기를 읽기 쉬운 형태로 변환
            size_bytes = stat.size
            if size_bytes == 0:
                size_str = "0 B"
            elif size_bytes < 1024:
                size_str = f"{size_bytes} B"
            elif size_bytes < 1024 * 1024:
                size_str = f"{size_bytes / 1024:.2f} KB"
            elif size_bytes < 1024 * 1024 * 1024:
                size_str = f"{size_bytes / (1024 * 1024):.2f} MB"
            else:
                size_str = f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
            
            # 4. 파일 형태 추측 (확장자 기반)
            file_type = "Unknown"
            if object_name.lower().endswith(('.ogg', '.wav', '.mp3', '.m4a')):
                file_type = "Audio"
            elif object_name.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
                file_type = "Video"
            elif object_name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                file_type = "Image"
            elif object_name.lower().endswith(('.txt', '.log')):
                file_type = "Text"
            
            return {
                "exists": True,
                "bucket_exists": True,
                "bucket_name": bucket_name,
                "object_name": object_name,
                "file_type": file_type,
                "size": size_bytes,
                "size_formatted": size_str,
                "last_modified": stat.last_modified.strftime("%Y-%m-%d %H:%M:%S UTC") if stat.last_modified else "Unknown",
                "etag": stat.etag,
                "content_type": stat.content_type if hasattr(stat, 'content_type') else "Unknown",
                "metadata": stat.metadata if hasattr(stat, 'metadata') else {}
            }
            
        except S3Error as e:
            error_details = {
                "exists": False,
                "bucket_exists": bucket_exists if 'bucket_exists' in locals() else "Unknown",
                "error_code": e.code,
                "error_message": str(e)
            }
            
            if e.code == 'NoSuchKey':
                error_details["error"] = "File not found in bucket"
            elif e.code == 'NoSuchBucket':
                error_details["error"] = "Bucket does not exist"
            elif e.code == 'AccessDenied':
                error_details["error"] = "Access denied - check credentials"
            else:
                error_details["error"] = f"MinIO S3 error: {e.code}"
            
            return error_details
            
        except Exception as e:
            return {
                "exists": False,
                "bucket_exists": "Unknown",
                "error": f"Unexpected error: {str(e)}",
                "error_type": type(e).__name__
            }
    
    def message_callback(self, ch, method, properties, body):
        try:
            message = body.decode('utf-8')
            current_time = time.strftime("%Y-%m-%d %H:%M:%S")
            
            try:
                message_data = json.loads(message)
                message_type = message_data.get("type", "unknown")
                data = message_data.get("data", {})
                
                if message_type == "drug-summary":
                    medication_id = data.get('id', data.get('pk', 'unknown'))
                    print(f"[{current_time}] [127.0.0.1] Type: {message_type} | id: {medication_id}")
                    print(f"🔍 Drug-Summary 데이터 디버깅:")
                    print(f"   - 전체 메시지: {json.dumps(message_data, indent=2, ensure_ascii=False)}")
                    print(f"   - data 내용: {json.dumps(data, indent=2, ensure_ascii=False)}")
                    print(f"   - 추출된 medication_id: {medication_id} (타입: {type(medication_id)})")
                    self._process_drug_summary(data, medication_id)
                elif message_type == "video-summary":
                    pk = data.get('id', 'unknown')
                    link = data.get('link', '')
                    print(f"[{current_time}] [127.0.0.1] Type: {message_type} | pk: {pk}")
                    print(f"📹 Video-Summary 데이터 수신:")
                    print(f"   - 전체 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
                    
                    # MinIO 파일 정보 확인 및 처리
                    if link:
                        # link 형식: openvidu-appdata/1-20250807151225.ogg
                        if '/' in link:
                            bucket_name, object_name = link.split('/', 1)
                            print(f"📁 MinIO 파일 정보 확인:")
                            print(f"   - 요청 경로: {link}")
                            print(f"   - 버킷: {bucket_name}")
                            print(f"   - 파일: {object_name}")
                            
                            file_info = self._check_minio_file_info(bucket_name, object_name)
                            
                            if file_info["exists"]:
                                print(f"   ✅ 파일 존재 확인!")
                                print(f"   - 파일 타입: {file_info['file_type']}")
                                print(f"   - 파일 크기: {file_info['size_formatted']} ({file_info['size']:,} bytes)")
                                print(f"   - 업로드 시간: {file_info['last_modified']}")
                                print(f"   - Content Type: {file_info['content_type']}")
                                print(f"   - ETag: {file_info['etag']}")
                                
                                if file_info.get('metadata'):
                                    print(f"   - 메타데이터: {file_info['metadata']}")
                                
                                # 파일이 존재하면 STT + LLM 처리 시작
                                print(f"\n🚀 STT & LLM 처리 시작...")
                                self._process_video_summary(data)
                                
                            else:
                                print(f"   ❌ 파일 조회 실패")
                                print(f"   - 버킷 존재: {'Yes' if file_info.get('bucket_exists') else 'No' if file_info.get('bucket_exists') == False else 'Unknown'}")
                                print(f"   - 오류: {file_info['error']}")
                                
                                if 'available_buckets' in file_info:
                                    print(f"   - 사용 가능한 버킷: {file_info['available_buckets']}")
                                if 'error_code' in file_info:
                                    print(f"   - 오류 코드: {file_info['error_code']}")
                        else:
                            print(f"   ⚠️ 잘못된 링크 형식: {link}")
                            print(f"      예상 형식: 버킷명/파일명")
                    else:
                        print(f"   ⚠️ 링크 정보 없음")
                        print(f"      데이터에 'link' 필드가 누락되었습니다.")
                    
                    logger.info(f"Video-summary message received for pk: {pk}, link: {link}")
                    logger.info(f"Video-summary data: {json.dumps(data, ensure_ascii=False)}")
                else:
                    logger.warning(f"Unknown message type received: {message_type}")
                    
            except json.JSONDecodeError as e:
                logger.warning(f"Non-JSON message received: {message}")
                raise e
            
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            # 무한 재큐 방지: 바디의 'nacked' 플래그 또는 헤더 'x-nacked'로 2차 실패 드롭
            already_nacked = False
            parsed_json = None
            try:
                parsed_json = json.loads(message)
                if isinstance(parsed_json, dict) and parsed_json.get("nacked") is True:
                    already_nacked = True
            except Exception:
                # 바디가 JSON이 아니면 헤더 기준으로만 판단
                pass
            try:
                msg_headers = getattr(properties, 'headers', None) or {}
                if msg_headers.get('x-nacked') is True:
                    already_nacked = True
            except Exception:
                pass

            if already_nacked:
                # 두 번째 실패: 메시지 드롭(ACK 후 재발행 없음)
                logger.error("Message failed again after being NACKed once. Dropping message (ACK, no republish).")
                ch.basic_ack(delivery_tag=method.delivery_tag)
            else:
                # 첫 번째 실패: 바디에 'nacked': true 추가 또는 헤더에 표기 후 재발행
                try:
                    if isinstance(parsed_json, dict):
                        parsed_json["nacked"] = True
                        new_body = json.dumps(parsed_json, ensure_ascii=False).encode('utf-8')
                        content_type = "application/json"
                    else:
                        # JSON 파싱 실패 시, 원문 바디 유지하고 헤더에만 마킹
                        new_body = body
                        content_type = getattr(properties, 'content_type', None) or "application/octet-stream"

                    # 재발행 (동일 exchange/routing)
                    ch.basic_publish(
                        exchange=self.config.exchange_name,
                        routing_key=self.config.routing_key,
                        body=new_body,
                        properties=pika.BasicProperties(
                            content_type=content_type,
                            headers={"x-nacked": True}
                        )
                    )
                    logger.info("Republished message with nacked flag for retry")
                    # 원본 메시지 ACK (중복 처리 방지)
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as republish_error:
                    logger.error(f"Failed to republish message with nacked flag: {republish_error}")
                    # 재발행까지 실패하면 안전하게 드롭하지 않고 재큐 시도
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
         
    def start_consuming(self):
        if not self.connect():
            raise Exception("Failed to connect to RabbitMQ")
        
        try:
            self.channel.basic_qos(prefetch_count=1)
            self.channel.basic_consume(
                queue=self.config.queue_name,
                on_message_callback=self.message_callback
            )
            self.is_consuming = True
            logger.info("Started consuming messages from RabbitMQ")
            while self.is_consuming:
                self.connection.process_data_events(time_limit=1)
        except Exception as e:
            logger.error(f"Error during message consumption: {str(e)}")
            self.is_consuming = False
        finally:
            self.disconnect()
    
    def stop_consuming(self):
        self.is_consuming = False
        if self.channel:
            self.channel.stop_consuming()

class RabbitMQService:
    def __init__(self):
        self.config = RabbitMQConfig()
        self.consumer = RabbitMQConsumer(self.config)
        self.consumer_thread = None
    
    def start_consuming(self) -> bool:
        if self.consumer_thread and self.consumer_thread.is_alive():
            return False
        
        def run_consumer():
            try:
                self.consumer.start_consuming()
            except Exception as e:
                logger.error(f"Consumer thread error: {str(e)}")
        
        self.consumer_thread = threading.Thread(target=run_consumer, daemon=True)
        self.consumer_thread.start()
        return True
    
    def stop_consuming(self) -> bool:
        if not self.consumer_thread or not self.consumer_thread.is_alive():
            return False
        
        self.consumer.stop_consuming()
        self.consumer_thread.join(timeout=5)
        return True
    
    def get_status(self) -> Dict[str, Any]:
        is_running = (self.consumer_thread and self.consumer_thread.is_alive() and self.consumer.is_consuming)
        return {
            "is_consuming": is_running,
            "consumed_messages_count": len(self.consumer.consumed_messages),
            "connection_status": "connected" if self.consumer.connection and not self.consumer.connection.is_closed else "disconnected"
        }
    
    def test_connection(self) -> bool:
        """RabbitMQ 연결을 테스트합니다."""
        try:
            test_consumer = RabbitMQConsumer(self.config)
            result = test_consumer.connect()
            test_consumer.disconnect()
            return result
        except Exception as e:
            logger.error(f"RabbitMQ connection test failed: {str(e)}")
            return False
    
    def test_minio_connection(self) -> Dict[str, Any]:
        """MinIO 연결을 테스트합니다."""
        try:
            # 버킷 목록 조회로 연결 테스트
            buckets = list(self.consumer.minio_client.list_buckets())
            bucket_names = [bucket.name for bucket in buckets]
            
            return {
                "success": True,
                "message": "MinIO connection successful",
                "endpoint": settings.MINIO_ENDPOINT,
                "access_key": settings.MINIO_ACCESS_KEY,
                "secure": settings.MINIO_SECURE,
                "buckets": bucket_names,
                "bucket_count": len(bucket_names)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "endpoint": settings.MINIO_ENDPOINT,
                "access_key": settings.MINIO_ACCESS_KEY,
                "secure": settings.MINIO_SECURE
            }

rabbitmq_service = RabbitMQService()