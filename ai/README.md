## Handi - AI 서비스 (AI)

핸디(Handi)의 AI 서브시스템입니다. 이미지/문서 기반 약품 탐지, 노인 위험 약물/성분 검색, 의약품 상세정보 조회, STT 기반 회의 요약, RAG+LLM 약물 요약을 제공합니다.

## 🚀 핵심 기능

- **이미지 약품 탐지**: Google Vision OCR → 단어 단위 의미검색 → 약품 후보 리스트 반환
- **노인 위험 약물/성분 검색**: 고령자 금기 성분/약물 컬렉션 기반 벡터 검색
- **의약품 상세정보 검색**: 효능·용법·주의·DUR·복약정보 등 상세 정보 조회
- **문서 OCR + NER + 마스킹**: GLiNER-ko로 엔티티 추출, 선택 영역 마스킹 이미지 반환
- **STT + 회의 요약**: faster-whisper 또는 GMS(Whisper)로 전사, Stuff/Map-Reduce/Chaining 요약
- **다약제 RAG+LLM 요약**: 약물 컨텍스트 수집 후 LLM으로 간호사용 JSON 요약 생성

## 🛠 기술 스택

- **임베딩/벡터DB**: Sentence-Transformers(`upskyy/bge-m3-korean`), ChromaDB(HttpClient, HNSW+Cosine)
- **OCR/NER/이미지**: Google Vision API, GLiNER-ko, Pillow
- **LLM/STT**: LangChain(OpenAI 호환 GMS), faster-whisper
- **서버**: FastAPI(Uvicorn), httpx
- **언어/런타임**: Python 3.10+

## 📁 디렉터리 구조

```
ai/
├─ llm/                # STT + 회의요약 + RAG+LLM API
│  └─ app/
│     ├─ services/     # whisper, llm, chromadb, drug_analysis 등
│     ├─ router/       # stt_llm_router, drug_analysis_router 등
│     └─ core/         # config, logger, database
├─ pharmguard/         # OCR + 약품탐지 + RAG 검색 + 문서처리 API
│  └─ app/
│     ├─ services/     # ocr, korean_embedding, chromadb, document, senior_danger, ...
│     ├─ router/       # drug_detect, medicine_total, senior_danger(_ingredient), document
│     └─ core/         # config, middleware, model
├─ vectordb/           # CSV → 벡터 인제스터 스크립트/데이터
│  ├─ data/            # medicine_total/detail/senior_danger_*.csv
│  └─ script/          # *_ingestor.py, crawl_drug.py
└─ docker-compose.yml  # (필요 시) 공통 서비스 기동
```

## 🔌 API 엔드포인트(요약)

- **pharmguard**
  - `POST /drug-detect/detect-drug-from-image`: 이미지 약품 탐지(OCR→후보 리스트)
  - `POST /medicine-total/search` / `GET /medicine-total/health-chromadb` 
  - `POST /api/v1/senior-danger/medicine-search` (노인 위험 약물)
  - `POST /api/v1/senior-danger-ingredient/ingredient-search` (노인 위험 성분)
  - `POST /document/detect-all-from-image` / `POST /document/detect-entities-from-image`
  - `POST /document/mask-image` (선택 박스 마스킹)
- **llm**
  - `POST /api/v1/stt-langchain`, `POST /api/v1/stt-langchain-gms` (STT+요약)
  - `POST /llm/llm-drug-summary`, `POST /llm/llm-drug-summary-langchain` (다약제 RAG+LLM)
  - `POST /llm/drug-analysis` (단일 약물 상세/노인 위험/성분 통합)

## 🧪 데이터 파이프라인

1) `vectordb`: CSV 파싱(괄호→상세, 용량 패턴 인식) → 한국어 임베딩 → ChromaDB 컬렉션 구축

2) `pharmguard`: 이미지 OCR → 단어별 의미검색(유사도=1-거리) → 임계값(+용량 가중)으로 후보 선별 → 상세/노인 위험 조회

3) `llm`: 공통 컬렉션(`medicine_detail_info`, `senior_danger_medicine`, `senior_danger_ingredient`)에서 컨텍스트 수집 → LLM 요약(JSON)

- 임계값(기본): 탐지 0.7, 상세/노인 위험 0.9
- 용량 가중: 단일제 70:30, 복합제 50:50 (품목명:용량)
- 임베딩/Chroma/STT 싱글톤 로딩으로 성능 최적화

## ⚙️ 환경 변수(.env 예시)

```bash
# 공통
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
EMBEDDING_MODEL_NAME=upskyy/bge-m3-korean

# pharmguard
GOOGLE_VISION_API_KEY=YOUR_API_KEY_OR_JSON_PATH
DRUG_DETECTION_THRESHOLD=0.7
SENIOR_DANGER_THRESHOLD=0.9

# llm
GMS_KEY=YOUR_GMS_KEY
GMS_API_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1
```

## ▶️ 실행 방법(예시)

사전 요구: Docker(권장) 또는 Python 3.10+

```bash
# 1) ChromaDB 등 공통 서비스 기동 (필요 시)
cd ai
docker compose up -d   # 또는 docker-compose -f docker-compose.yml up -d

# 2) 벡터 인제스트 (Windows PowerShell)
python .\vectordb\script\medicine_total_info_ingestor.py
python .\vectordb\script\medicine_detail_info_ingestor.py
python .\vectordb\script\senior_danger_medicine_ingestor.py
python .\vectordb\script\senior_danger_ingredient_ingestor.py

# 3) 서비스 기동(로컬 개발)
# pharmguard
uvicorn app.main:app --reload --port 5500  # (작업 디렉토리: ai/pharmguard)
# llm
uvicorn app.main:app --reload --port 5600  # (작업 디렉토리: ai/llm)
```

## 📚 문서

- `ai/vectordb/README.md` – 컬렉션/인제스터 상세
- `ai/pharmguard/README.md` – OCR/탐지/문서처리 API 상세
- `ai/llm/README.md` – STT/요약/RAG+LLM API 상세

## 🤝 기여

1) 브랜치 생성: `git checkout -b feat/JIRA-ISSUE-your-feature`
2) 커밋: `git commit -m "feat: add your feature"` (JIRA ISSUE 번호 포함 권장)
3) PR 오픈 및 코드리뷰
