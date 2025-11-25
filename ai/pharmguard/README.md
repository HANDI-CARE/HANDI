# PharmGuard AI (FastAPI)

이미지 기반 약품 분석과 약물 정보 검색을 통합 제공하는 RAG 기반 FastAPI 서비스입니다. OCR로 텍스트를 추출하고, 한국어 임베딩 + ChromaDB로 의미 검색을 수행하여 약품 기본/상세/노인 위험 정보를 제공합니다. 문서 내 민감 정보는 NER로 탐지 후 마스킹할 수 있습니다.

## 주요 기능
- 약품 의미 검색: 한국어 임베딩(`upskyy/bge-m3-korean`) + ChromaDB 기반 유사도 검색
- 약품 상세 정보: 이름(+용량) 입력 시 임계값/복합 점수로 최적 결과 반환
- 노인 위험 약물/성분: 임계값(0.9) 이상 결과만 선별 제공
- 이미지 → 약품 탐지: Google Vision OCR → 단어 단위 후보 탐지/요약
- 문서 NER/마스킹: GLiNER-ko로 엔티티 탐지, 지정 영역 이미지 마스킹
- 상태/헬스체크: ChromaDB 연결 및 컬렉션 접근 상태 확인

## API 개요(요약)
- 약품/OCR
  - POST `/api/v1/drug/search`
  - POST `/api/v1/drug/detect-drug-from-image`
- 상세 정보
  - POST `/api/v1/medicine-detail/search`
  - GET `/api/v1/medicine-detail/health`
- 노인 위험
  - POST `/api/v1/senior-danger/medicine-search`
  - GET `/api/v1/senior-danger/health`
  - POST `/api/v1/senior-danger-ingredient/ingredient-search`
  - GET `/api/v1/senior-danger-ingredient/health`
- 문서 처리
  - POST `/api/v1/document/detect-all-from-image`
  - POST `/api/v1/document/detect-entities-from-image`
  - POST `/api/v1/document/mask-image`

## 빠른 시작
### 1) 환경 변수 (`.env`)
```
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
CHROMADB_COLLECTION_NAME=medicine_total_info
EMBEDDING_MODEL_NAME=upskyy/bge-m3-korean
GOOGLE_VISION_API_KEY=your_google_vision_api_key
DRUG_DETECTION_THRESHOLD=0.7
SENIOR_DANGER_THRESHOLD=0.9
```

### 2) 로컬 실행
```
pip install -r requirements.txt
python main.py
```
- 서버: http://localhost:5500
- 문서: http://localhost:5500/docs

### 3) Docker 실행
```
docker build -t pharmguard:lean .
docker run --rm -p 5500:5500 --env-file .env pharmguard:lean
```
모델 캐시 외부화:
```
docker run --rm -p 5500:5500 --env-file .env \
  -v pharm_hf:/tmp/hf_cache -v pharm_torch:/tmp/torch_cache \
  pharmguard:lean
```

## 데이터/컬렉션 준비
다음 ChromaDB 컬렉션이 준비되어야 검색이 동작합니다.
- `medicine_total_info`, `medicine_detail_info`
- `senior_danger_medicine`, `senior_danger_ingredient`

## 기술 스택
FastAPI, Uvicorn, ChromaDB, sentence-transformers(BGE-Korean), Google Cloud Vision, GLiNER-ko, Pydantic v2
