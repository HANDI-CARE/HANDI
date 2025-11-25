# ChromaDB 자동 설정 및 데이터 초기화

이 디렉토리에는 ChromaDB를 자동으로 설정하고 초기 데이터를 로드하는 스크립트들이 포함되어 있습니다.

## 파일 구성

- `setup_chromadb.sh` - Linux/Mac용 자동 설정 스크립트
- `setup_chromadb.bat` - Windows용 자동 설정 스크립트
- `data/` - CSV 데이터 파일들
  - `medicine_total_info.csv` - 의약품 정보 데이터
  - `medicine_detail_info.csv` - 의약품 상세 정보 데이터
  - `senior_danger_medicine.csv` - 노인 위험 약물 데이터
  - `senior_danger_ingredient.csv` - 노인 위험 성분 데이터
- `script/` - Python 데이터 로더 스크립트들
  - `medicine_total_info_ingestor.py` - 의약품 정보 데이터 로더
  - `medicine_detail_info_ingestor.py` - 의약품 상세 정보 데이터 로더
  - `senior_danger_medicine_ingestor.py` - 노인 위험 약물 데이터 로더
  - `senior_danger_ingredient_ingestor.py` - 노인 위험 성분 데이터 로더

## 사용 방법

### Windows
```bash
# vectordb 디렉토리로 이동
cd vectordb

# 배치 파일 실행
setup_chromadb.bat
```

### Linux/Mac
```bash
# vectordb 디렉토리로 이동
cd vectordb

# 실행 권한 부여
chmod +x setup_chromadb.sh

# 쉘 스크립트 실행
./setup_chromadb.sh
```

## 자동 실행 과정

1. **기존 컨테이너 정리**: 기존에 실행 중인 ChromaDB 컨테이너를 중지하고 제거
2. **볼륨 디렉토리 생성**: `./chroma_db_path` 디렉토리 생성
3. **ChromaDB 컨테이너 실행**: Docker로 ChromaDB 서버를 8000포트에 실행
4. **서버 준비 대기**: ChromaDB 서버가 완전히 시작될 때까지 대기
5. **파일 확인**: 필요한 CSV 파일과 Python 스크립트 파일 존재 여부 확인
6. **데이터 로드**: 
   - `data/medicine_total_info.csv` → `medicine_total_info` 컬렉션
   - `data/medicine_detail_info.csv` → `medicine_detail_info` 컬렉션
   - `data/senior_danger_medicine.csv` → `senior_danger_medicine` 컬렉션
   - `data/senior_danger_ingredient.csv` → `senior_danger_ingredient` 컬렉션

## 필요한 파일들

스크립트 실행 전에 다음 파일들이 `vectordb` 디렉토리에 있어야 합니다:

### CSV 데이터 파일들 (`data/` 디렉토리)
- `data/medicine_total_info.csv` - 의약품 정보 데이터
- `data/medicine_detail_info.csv` - 의약품 상세 정보 데이터
- `data/senior_danger_medicine.csv` - 노인 위험 약물 데이터
- `data/senior_danger_ingredient.csv` - 노인 위험 성분 데이터

### Python 스크립트들 (`script/` 디렉토리)
- `script/medicine_total_info_ingestor.py`
- `script/medicine_detail_info_ingestor.py`
- `script/senior_danger_medicine_ingestor.py`
- `script/senior_danger_ingredient_ingestor.py`

파일이 없으면 해당 데이터 로드 과정을 건너뜁니다.

## 완료 후 확인

스크립트 완료 후 다음과 같이 확인할 수 있습니다:

```bash
# ChromaDB 서버 상태 확인
curl http://localhost:8000/api/v1/heartbeat

# 컨테이너 상태 확인
docker ps -f name=chromadb

# 컨테이너 로그 확인
docker logs chromadb
```

## 컨테이너 관리

```bash
# 컨테이너 중지
docker stop chromadb

# 컨테이너 재시작 (데이터는 보존됨)
docker run -d --rm --name chromadb -p 8000:8000 -v ./chroma_db_path:/chroma/chroma -e IS_PERSISTENT=TRUE -e ANONYMIZED_TELEMETRY=TRUE chromadb/chroma:latest
```

## API 엔드포인트

### 의약품 상세 정보
- **GET** `/api/v1/medicine-detail/count` - 데이터 개수 조회
- **POST** `/api/v1/medicine-detail/search` - 약물명과 용량으로 검색
- **GET** `/api/v1/medicine-detail/health` - 서비스 상태 확인

### 노인 위험 약물
- **GET** `/api/v1/senior-danger/count` - 데이터 개수 조회
- **POST** `/api/v1/senior-danger/medicine-search` - 약물명과 용량으로 검색
- **GET** `/api/v1/senior-danger/health` - 서비스 상태 확인

### 노인 위험 성분  
- **GET** `/api/v1/senior-danger-ingredient/count` - 성분 데이터 개수 조회
- **POST** `/api/v1/senior-danger-ingredient/ingredient-search` - 성분명으로 검색
- **GET** `/api/v1/senior-danger-ingredient/health` - 서비스 상태 확인

검색 요청 예시:
```json
{
  "name": "타가틴정",
  "capacity": "200mg"
}
```

성분 검색 요청 예시:
```json
{
  "name": "퀴누프라민"
}
```

## 데이터 출처 및 정보

### 1. medicine_detail_info.csv (의약품 상세 정보)
- **출처**: [약학정보원](https://www.health.kr/main.asp)
- **제공기관**: 식품의약품안전처
- **내용**: 약품별 효능 및 주의사항, 복약 지도 데이터
- **특징**: 공공데이터로 제공되는 의약품 상세 정보

### 2. medicine_total_info.csv (의약품 통합 정보)
- **출처**: [의약품 안전나라](https://nedrug.mfds.go.kr/pbp/CCBGA01/getItem?limit=10&totalPages=8&page=2&&openDataInfoSeq=11)
- **제공기관**: 대한민국 공식 전자정부 누리집 의약품통합정보시스템
- **데이터 세트**: 공공데이터 공개 → 의약품 낱알식별
- **규모**: 약 25,000건의 의약품 통합 데이터

### 3. senior_danger_medicine.csv (노인 위험 약물)
- **출처**: [의약품 안전나라](https://nedrug.mfds.go.kr/pbp/CCBGA01/getItem?limit=10&totalPages=8&page=1&&openDataInfoSeq=1)
- **제공기관**: 대한민국 공식 전자정부 누리집 의약품통합정보시스템
- **데이터 세트**: 공공데이터 공개 → DUR유형별 성분 현황 → 노인주의
- **규모**: 593건의 노인 주의 약물 데이터

### 4. senior_danger_ingredient.csv (노인 위험 성분)
- **출처**: [의약품 안전나라](https://nedrug.mfds.go.kr/pbp/CCBGA01/getItem?limit=10&totalPages=8&page=1&&openDataInfoSeq=2)
- **제공기관**: 대한민국 공식 전자정부 누리집 의약품통합정보시스템
- **데이터 세트**: 공공데이터 공개 → DUR유형별 품목 현황 → 노인주의
- **규모**: 약 105건의 노인 주의 의약 성분 데이터

## 한국어 임베딩 모델

시스템은 한국어 텍스트 처리를 위해 `upskyy/bge-m3-korean` 임베딩 모델을 사용합니다:
- 서버 시작 시 모델을 미리 로드하여 빠른 응답 시간 제공
- 한국어 약물명 및 성분명에 대한 의미 검색 지원
- 높은 정확도를 위해 임계값 0.9와 코사인 유사도 사용

## 주의사항

- Docker가 설치되어 있고 실행 중이어야 합니다
- Python 환경에 필요한 패키지들이 설치되어 있어야 합니다
- 8000 포트가 사용 가능해야 합니다
- 충분한 디스크 공간이 필요합니다 (데이터 크기에 따라)
- 한국어 임베딩 모델은 약 1-2GB 메모리가 필요합니다