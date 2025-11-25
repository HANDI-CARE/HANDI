# Backend (Spring Boot)

## 📌 개요
Handi 백엔드는 **Spring Boot** 기반의 RESTful API 서버로, 요양 보호 서비스의 핵심 로직과 데이터 처리를 담당합니다.  
Redis, PostgreSQL, MinIO, RabbitMQ 등 다양한 인프라 컴포넌트와 연동되어 **실시간 데이터 처리, 안전한 문서 관리, 비동기 이벤트 처리**를 제공합니다.  

---

## ⚙️ 기술 스택
- **Framework**: Spring Boot 3.4.5 
- **Language**: Java 17  
- **Database**: PostgreSQL 15  
- **Cache / Queue**: Redis 7, RabbitMQ  
- **Storage**: MinIO (S3 호환 객체 스토리지)  
- **Build Tool**: Gradle  
- **Container**: Docker / Docker Compose  

---

## 🗂️ 프로젝트 구조
```
src/main/java/com/handi/backend
├── 📁 backend/                 # Spring Boot 백엔드
│   ├── 📁 src/main/java/
│   │   └── 📁 com/handi/backend/
│   │       ├── 📁 config/      # 설정 파일들
│   │       ├── 📁 controller/  # REST API 컨트롤러
│   │       ├── 📁 converter/   # dto, 시간 변환
│   │       ├── 📁 dto/         # 데이터 전송 객체 (요청/응답)
│   │       ├── 📁 Entity/      # JPA 엔티티
│   │       ├── 📁 enum/        # ENUM 
│   │       ├── 📁 exception/   # 전역 예외 처리
│   │       ├── 📁 mapper/      # Mapper
│   │       ├── 📁 service/     # 비즈니스 로직
│   │       ├── 📁 repository/  # Spring Data JPA Repository
│   │       └── 📁 util/        # 공통 서비스
│   ├── 📄 build.gradle         # 의존성 관리
│   └── 📄 README.md           # 백엔드 문서

```

---

## 🛠️ 주요 기능
- **사용자 관리**
  - OAuth2 (Google, Naver, Kakao) 로그인
  - JWT 기반 인증 및 권한 관리
  - Twilio SMS 인증 연동
- **돌봄 관리**
  - 어르신 복약 일정 관리
  - vital signs / 관찰 기록 저장 및 조회
  - 보호자-요양사-의료진 간 회의 매칭 및 스케줄링
- **실시간 커뮤니케이션**
  - LiveKit 기반 화상 상담 및 녹화
  - RabbitMQ 이벤트 처리
- **전자 문서 관리**
  - MinIO를 통한 전자문서 안전 저장
  - AI 기반 문서 마스킹 / 분석 기능 제공
- **FCM 기반 알림 서비스 구현**
  - FCM Token을 통해 복약, 상담 알림 서비스
- **자동 상담 매칭 시스템**
  - 매일 자정(00시) 자동 상담 매칭 시스템
  - Redis 및 백트래킹 알고리즘을 활용한 효율적인 매칭 시스템

---

## 🚀 실행 방법

### 1. 환경 변수 설정
`.env` 파일에 민감 정보를 정의합니다.
```env
PASS=your_password
JWT_SECRET=your_secret_key
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
NAVER_ID=...
GOOGLE_ID=...
KAKAO_ID=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### 2. Docker Compose 실행
```bash
docker-compose -f docker-compose-prod.yml up -d
```

### 3. Backend 접속
```bash
http://localhost:8080
```

---

## 🔑 환경 변수 주요 항목
- **DB**
  - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
- **Redis**
  - `SPRING_DATA_REDIS_HOST`, `SPRING_DATA_REDIS_PORT`
- **MinIO**
  - `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
- **LiveKit**
  - `LIVEKIT_HTTP_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- **OAuth2**
  - `GOOGLE_ID`, `GOOGLE_SECRET`, `NAVER_ID`, `KAKAO_ID`
- **JWT**
  - `JWT_SECRET`
- **SMS 인증**
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`

---

## 🧪 개발용 빌드 및 실행
```bash
./gradlew clean build
java -jar build/libs/handi-backend-0.0.1-SNAPSHOT.jar
```
