# PharmGuard AI API

FastAPI 기반의 AI 약품 및 문서 관리 서비스로, OCR, NER, LLM, 벡터 데이터베이스 등 다양한 AI 기술이 통합된 RAG(검색 증강 생성) 기반 약품 정보 요약 서비스입니다. (Pharmacy + Guard)

## 주요 기능

- **이미지 OCR**: Google Vision API를 통한 텍스트 인식
- **개체명 인식(NER)**: GLiNER-ko 모델을 이용한 한국어 개체명 인식
- **약품 검색**: ChromaDB 벡터 데이터베이스를 이용한 의미적 유사도 검색
- **LLM 요약**: Gemma 3 1B 모델을 이용한 약품 정보 요약
- **노인 위험 약물 검색**: 노인에게 위험한 약물 및 성분 검색
- **문서 마스킹**: 개인정보 보호를 위한 문서 마스킹

## 환경 요구사항

- Python 3.8 이상
- CUDA 12.4 지원 GPU (PyTorch CUDA 지원)
- 최소 8GB RAM 권장
- 약 3GB 디스크 공간 (모델 파일 포함)

## 설치 가이드

### Windows 환경

1. **가상환경 생성:**
   ```shell
   python -m venv pharm-guard-env
   ```

2. **가상환경 활성화:**
   ```shell
   .\pharm-guard-env\Scripts\activate
   ```

3. **종속성 설치:**
   ```shell
   pip install -r requirements.txt
   ```

### macOS / Linux 환경

1. **가상환경 생성:**
   ```shell
   python3 -m venv pharm-guard-env
   ```

2. **가상환경 활성화:**
   ```shell
   source pharm-guard-env/bin/activate
   ```

3. **종속성 설치:**
   ```shell
   pip install -r requirements.txt
   ```

## 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경변수를 설정하세요:

```env
# ChromaDB 설정
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
CHROMADB_COLLECTION_NAME=medicine_total_info
EMBEDDING_MODEL_NAME=upskyy/bge-m3-korean

# Google Vision API 설정
GOOGLE_VISION_API_KEY=your_google_vision_api_key

# GMS API 설정 (선택사항)
GMS_KEY=your_gms_api_key


# LLM 모델 설정 (선택사항)
MAX_GPU_LAYERS=-1
CONTEXT_SIZE=4096
N_BATCH=512
N_THREADS=8

# 임계값 설정 (선택사항)
DRUG_DETECTION_THRESHOLD=0.7
SENIOR_DANGER_THRESHOLD=0.9
```

## 데이터베이스 초기 설정

ChromaDB 벡터 데이터베이스를 초기화하려면 다음 중 하나를 실행하세요:

### Windows:
```shell
cd vector-db
setup_chromadb.bat
```

### macOS / Linux:
```shell
cd vector-db
chmod +x setup_chromadb.sh
./setup_chromadb.sh
```

또는 개별 Python 스크립트를 실행:
```shell
cd vector-db
python medicine_total_info_ingestor.py
python medicine_detail_info_ingestor.py
python senior_danger_medicine_ingestor.py
python senior_danger_ingredient_ingestor.py
```

## 서버 실행

### 기본 실행 (권장)
```shell
python main.py
```

### 또는 uvicorn으로 직접 실행
```shell
uvicorn app.main:app --host 0.0.0.0 --port 5500 --reload
```

서버가 성공적으로 시작되면 다음 주소에서 접근할 수 있습니다:
- **서버**: http://localhost:5500
- **API 문서**: http://localhost:5500/docs
- **ReDoc**: http://localhost:5500/redoc

## API 엔드포인트

### 💊 약품 검색 및 정보 APIs (`/api/v1/drug`)

#### 1. `/api/v1/drug/search`
- **Method**: POST
- **Description**: 품목명을 기반으로 유사도가 높은 약제 정보 검색
- **Request**:
  ```json
  {
    "query": "타이레놀",
    "limit": 5
  }
  ```
- **Response**: 유사도 기반 약물 검색 결과

#### 2. `/api/v1/drug/ocr-detection-basic`
- **Method**: POST
- **Description**: 이미지에서 약품명 OCR 탐지 (기본 정보)
- **Request**: `file` (multipart/form-data)
- **Response**: 탐지된 약품 기본 정보

#### 3. `/api/v1/drug/ocr-detection-detail`
- **Method**: POST
- **Description**: 이미지에서 약품명 OCR 탐지 (상세 정보)
- **Request**: `file` (multipart/form-data)
- **Response**: 탐지된 약품 상세 정보

#### 4. `/api/v1/drug/summary`
- **Method**: POST
- **Description**: 약품 정보 LLM 요약
- **Request**:
  ```json
  {
    "drug_info": "약품 정보 텍스트"
  }
  ```
- **Response**: LLM 생성 약품 정보 요약

### 🤖 LLM APIs (`/api/v1/llm`)

#### 1. `/api/v1/llm/generate` (Gemma)
- **Method**: POST
- **Description**: Gemma 3 1B 모델을 이용한 텍스트 생성
- **Request**:
  ```json
  {
    "prompt": "입력 프롬프트",
    "max_tokens": 512,
    "temperature": 0.7
  }
  ```

#### 2. `/api/v1/llm/gms-generate` (GMS)
- **Method**: POST
- **Description**: GMS API를 통한 텍스트 생성
- **Request**:
  ```json
  {
    "prompt": "입력 프롬프트",
    "max_tokens": 512,
    "temperature": 0.7
  }
  ```

### 📄 문서 처리 APIs (`/api/v1/document`)

#### 1. `/api/v1/document/detect-all-from-image`
- **Method**: POST
- **Description**: 이미지에서 모든 텍스트와 개체명 탐지
- **Request**: `file` (multipart/form-data)
- **Response**: OCR 결과 + NER 결과

#### 2. `/api/v1/document/masking`
- **Method**: POST
- **Description**: 문서 개인정보 마스킹
- **Request**:
  ```json
  {
    "file_url": "암호화된 파일 URL",
    "entities": ["PERSON", "LOCATION"]
  }
  ```

### ⚠️ 노인 위험 약물 APIs

#### 1. `/api/v1/senior-danger/search-medicine`
- **Method**: POST
- **Description**: 노인 위험 약물 검색
- **Request**:
  ```json
  {
    "query": "약물명",
    "limit": 5
  }
  ```

#### 2. `/api/v1/senior-danger/search-ingredient`
- **Method**: POST
- **Description**: 노인 위험 성분 검색
- **Request**:
  ```json
  {
    "query": "성분명",
    "limit": 5
  }
  ```

### 💊 약물 상세 정보 APIs (`/api/v1/medicine-detail`)

#### 1. `/api/v1/medicine-detail/search`
- **Method**: POST
- **Description**: 약물 상세 정보 검색
- **Request**:
  ```json
  {
    "query": "약물명",
    "limit": 5
  }
  ```

### 🐰 RabbitMQ APIs (`/api/v1/rabbitmq`)

#### 1. `/api/v1/rabbitmq/health`
- **Method**: GET
- **Description**: RabbitMQ 연결 상태 확인

## 모델 정보

### Gemma 3 1B 모델
- **모델**: MaziyarPanahi/gemma-3-1b-it-GGUF
- **파일**: gemma-3-1b-it.Q4_K_M.gguf
- **크기**: 약 700MB (Q4 양자화)
- **성능**: 빠른 추론 속도, 적당한 메모리 사용량

### GLiNER-ko (한국어 NER)
- **모델**: GLiNER Korean
- **지원 개체**: PERSON, LOCATION, ARTIFACTS, QUANTITY
- **언어**: 한국어 특화

### 한국어 임베딩 모델
- **모델**: upskyy/bge-m3-korean
- **용도**: 의미적 유사도 검색을 위한 벡터 임베딩

## 문제해결

### 1. CUDA 관련 오류
```
RuntimeError: CUDA error: no kernel image is available for execution on the device
```
**해결책**: requirements.txt의 PyTorch 버전을 시스템의 CUDA 버전에 맞게 수정

### 2. 메모리 부족 오류
```
OutOfMemoryError: CUDA out of memory
```
**해결책**: 
- `MAX_GPU_LAYERS` 환경변수를 줄이거나 -1로 설정 (CPU 사용)
- 더 작은 모델 사용 (Q4_K_M → Q2_K)

### 3. ChromaDB 연결 오류
```
Connection refused: ChromaDB server not running
```
**해결책**: 
- `vector_db/setup_chromadb.sh` 실행
- ChromaDB 서버 상태 확인

### 4. Google Vision API 오류
```
Google Vision API authentication failed
```
**해결책**: 
- `GOOGLE_VISION_API_KEY` 환경변수 설정 확인
- Google Cloud Console에서 Vision API 활성화

## 성능 최적화

### GPU 사용 최적화
```env
# GPU 사용량 조절
MAX_GPU_LAYERS=20        # GPU에 올릴 레이어 수
N_BATCH=256             # 배치 크기 줄이기
CONTEXT_SIZE=2048       # 컨텍스트 크기 줄이기
```

### CPU 사용 최적화
```env
# CPU 전용 모드
MAX_GPU_LAYERS=0
N_THREADS=8             # CPU 스레드 수
```

## 라이센스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 지원

문제가 발생하면 프로젝트 이슈 트래커에 문의하세요.