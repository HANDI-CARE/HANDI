# ᄒᆞᆫ디 (Handi) 🤝

> **독거노인을 위한 AI 기반 통합 돌봄 플랫폼**  
> 보호자, 요양보호사, 의료진을 하나로 연결하는 스마트 케어 솔루션

<div align="center">

![Project Status](https://img.shields.io/badge/Status-Production-brightgreen)
![Frontend](https://img.shields.io/badge/Frontend-React%2019.x-61DAFB?logo=react)
![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.4-6DB33F?logo=spring)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)
![Cache](https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis)

</div>

---

## 📋 목차

- [🎯 프로젝트 개요](#-프로젝트-개요)
- [👥 핵심 페르소나](#-핵심-페르소나)
- [💡 핵심 기능](#-핵심-기능)
- [⚙️ 기술 스택](#️-기술-스택)
- [🏗️ 시스템 아키텍처](#️-시스템-아키텍처)
- [🚀 시작하기](#-시작하기)
- [📁 프로젝트 구조](#-프로젝트-구조)
- [🔗 API 문서](#-api-문서)
- [🎨 화면 설계](#-화면-설계)
- [🌟 차별화 포인트](#-차별화-포인트)
- [📊 경쟁 분석](#-경쟁-분석)
- [👨‍💻 개발팀](#-개발팀)

---

## 🎯 프로젝트 개요

**ᄒᆞᆫ디(Handi)** 는 독거노인을 돌보는 보호자, 요양보호사, 의료진을 하나의 플랫폼으로 연결하여 
체계적이고 효율적인 돌봄 서비스를 제공하는 AI 기반 통합 케어 솔루션입니다.

### 🎯 프로젝트 목표

- **통합 돌봄 관리**: 모든 돌봄 관계자를 하나의 플랫폼에서 연결
- **AI 자동화**: 복약 모니터링, 건강 분석, 문서 관리 자동화
- **실시간 소통**: 보호자-요양보호사-의료진 간 실시간 정보 공유
- **원격 의료 연계**: 화상 면담을 통한 의료 서비스 접근성 향상

---

## 👥 핵심 페르소나

### 👩‍💼 페르소나 1: 김영희 (45세, 직장인 보호자)

- **상황**: 독거노인 어머니(75세)를 돌보는 직장인 딸
- **고민**: 
  - 멀리 떨어진 곳에서 근무하며 어머니의 건강 상태를 실시간으로 파악하기 어려움
  - 요양보호사와의 소통 부족으로 인한 불안감 😰
  - 어머니의 복약 관리 및 건강 상태 모니터링 필요

### 👩‍⚕️ 페르소나 2: 박미경 (52세, 요양보호사)

- **상황**: 5년차 요양보호사로 여러 어르신을 담당
- **고민**:
  - 수기 간병일지 작성으로 인한 업무 과중 📝
  - 보호자와의 소통 창구 부족으로 인한 스트레스
  - 어르신의 건강 변화를 체계적으로 관리하고 싶어함

---

## 💡 핵심 기능

### 🏥 1. 통합 돌봄 관리
- 건강 데이터 수집 및 자동 간병일지 생성
- 실시간 건강 상태 모니터링
- 돌봄 일정 관리 및 알림

### 🤝 2. 스마트 매칭
- 보호자-요양보호사 일정 자동 조율
- AI 기반 최적 매칭 알고리즘
- 지역별, 전문분야별 요양보호사 추천

### 💻 3. 원격 의료 연계
- 의사-보호자 화상 면담 시스템 (WebRTC)
- 실시간 건강 상담 및 처방전 발급
- 의료진 연계 응급 대응 시스템

### 💊 4. AI 복약 관리
- **AI 비전 기술**을 활용한 복약 모니터링
- 복약 시간 자동 알림 및 확인
- 복약 이력 추적 및 부작용 모니터링

### 📄 5. 스마트 문서 관리
- 의료 기록 디지털화
- **AI 자동 마스킹**으로 개인정보 보호
- 간병일지 자동 생성 및 공유

---

## ⚙️ 기술 스택

### 🖥️ Frontend
- **React.js 19.x** - 모던 웹 애플리케이션 개발
- **TypeScript** - 타입 안정성 보장
- **TailwindCSS** - 효율적인 스타일링
- **Ant Design** - 컴포넌트 기반 스타일링
- **HTML5** - 카메라 API, 알림 기능 지원
- **WebRTC** - 실시간 화상 통화

### 🔧 Backend
- **Java 17** - 안정적인 서버 개발
- **Spring Boot 3.4.5** - 빠른 개발 및 배포
- **Spring Security** - 인증 및 권한 관리
- **Spring Data JPA** - 데이터베이스 ORM
- **WebRTC** - 실시간 화상 통화 서버 구축축

### 🗄️ Database & Cache
- **PostgreSQL** - 사용자 정보, 건강 데이터, 일정 정보
- **Redis** - 세션 관리, 캐싱, 실시간 알림

### 🤖 AI & ML
- **ChromaDB + Sentence-Transformers** - 한국어 임베딩 기반 벡터 검색(RAG)
- **LangChain + GMS(OpenAI 호환)** - LLM 요약/생성 파이프라인
- **Whisper(faster-whisper)** - STT(음성→텍스트)
- **Google Vision API** - 이미지 OCR 추출
- **GLiNER-ko** - 문서 엔티티 인식(NER)

### ☁️ Infrastructure
- **Docker** - 컨테이너 기반 배포
- **AWS EC2** - 클라우드 서버 환경
- **Jenkins** - CI/CD 자동화
- **Swagger** - API 문서화

---


## 📁 프로젝트 구조

```
S13P11A306/
├── 📁 backend/                 # Spring Boot 백엔드
│   ├── 📁 src/main/java/
│   │   └── 📁 com/handi/backend/
│   │       ├── 📁 config/      # 설정 파일들
│   │       ├── 📁 controller/  # REST API 컨트롤러
│   │       ├── 📁 converter/   # dto, 시간 변환
│   │       ├── 📁 dto/         # 요청, 응답 DTO
│   │       ├── 📁 Entity/      # 엔티티 클래스
│   │       ├── 📁 enum/        # ENUM 
│   │       ├── 📁 exception/   # 예외 처리
│   │       ├── 📁 mapper/      # Mapper
│   │       ├── 📁 service/     # 비즈니스 로직
│   │       ├── 📁 repository/  # 데이터 접근 계층
│   │       └── 📁 util/        # 공통 서비스
│   ├── 📄 build.gradle         # 의존성 관리
│   └── 📄 README.md           # 백엔드 문서
├── 📁 frontend/
│   ├── 📁 android/                     # Capacitor Android 프로젝트
│   ├── 📁 app/                         # 웹 앱 소스 (UI, 도메인, 서비스)
│   ├── 📁 public/                      # 정적 파일
│   └── 📄 README.md                    # 프론트엔드 문서
├── 📁 ai/
│   ├── 📁 llm/                         # STT + 회의요약 + RAG+LLM API
│   ├── 📁 pharmguard/                  # OCR + 약품탐지 + RAG 검색 + 문서처리 API
│   ├── 📁 vectordb/                    # CSV → 벡터 인제스터 스크립트/데이터
│   └── 📄 README.md                    # AI 문서
└── 📄 README.md                        # 프로젝트 전체 문서
```

## 📚 서브시스템 문서

- Frontend
  - React 19 + TypeScript + TailwindCSS 4 + Ant Design 5. 라우팅 구조, 인증 플로우, 모바일(Android, Capacitor) 빌드 가이드 포함
  - 실행/환경 변수/프록시/LiveKit 설정 등 상세는 `frontend/README.md` 참고
  - 링크: [frontend/README.md](frontend/README.md)

- Backend
  - Spring Boot 3.4, PostgreSQL/Redis/MinIO/RabbitMQ 연동, OAuth2/JWT/FCM/LiveKit/OpenVidu 등 핵심 서버 기능 문서화
  - 실행 방법(Docker Compose), 주요 환경 변수, 빌드 명령 등은 `backend/README.md` 참고
  - 링크: [backend/README.md](backend/README.md)

- AI
  - 이미지 약품 탐지(OCR)·노인 위험 약/성분·의약품 상세 검색(RAG), 문서 NER/마스킹, STT+회의 요약, 다약제 RAG+LLM 요약 제공
  - 벡터DB(ChromaDB) 인제스트 스크립트, 주요 API 엔드포인트, 실행/환경 설정은 `ai/README.md` 참고
  - 링크: [ai/README.md](ai/README.md)

---

## 🧭 서브시스템 요약

### Frontend 요약
- React Router v7 기반 라우팅 그룹(간호사/보호자/관리자/공용)과 상태 관리(Zustand, TanStack Query)
- LiveKit 화상 상담, Capacitor(Android) 연동(푸시/딥링크)
- 실행: `npm ci && npm run dev` (기본 http://localhost:3000)
- 환경: `.env.local` → `VITE_API_URL`, `VITE_USE_PROXY`, `VITE_LIVEKIT_URL`

### Backend 요약
- Spring Boot 3.4, PostgreSQL/Redis/MinIO/RabbitMQ, OAuth2/JWT/FCM/LiveKit
- 실행: `docker-compose -f docker-compose-prod.yml up -d` 또는 `./gradlew clean build && java -jar ...`
- 환경: `OPENVIDU_PROD_ENV`(.env) 및 OAuth/Twilio/JWT 등 필수 시크릿

### AI 요약
- Pharmguard: Google Vision OCR → 의미검색 → 후보/상세/노인 위험 조회, 문서 NER/마스킹
- LLM: faster-whisper STT, LangChain+GMS 요약(Stuff/Map-Reduce/Chaining), 단일/다약제 분석
- VectorDB: CSV → ChromaDB 인제스트(`medicine_total_info`, `medicine_detail_info`, `senior_danger_*`)
- 실행(로컬):
  - ChromaDB: `docker compose up -d` (ai 디렉토리)
  - 인제스트: `python vectordb/script/*_ingestor.py`
  - API: `uvicorn app.main:app --reload --port 5500(Pharm) / 5600(LLM)`

---

## 🚀 배포 개요(Jenkins)
- 브랜치 트리거: `fe-prod`(Frontend), `be-prod`(Backend), `ai-prod`(AI)
- Frontend: CI 빌드 → S3 업로드 → CloudFront 무효화, Android Debug APK 아티팩트 생성
- Backend: Gradle 빌드/테스트 → Docker Build/Push → docker-compose 배포(헬스체크/롤백)
- AI: ChromaDB 보장(+인제스트) → RabbitMQ 보장 → LLM/Pharmguard Docker Build/Push → 서비스 무중단 교체

---

## 📋 개발 컨벤션

### 🌿 Git Flow

[우아한형제들 기술블로그](https://techblog.woowahan.com/2553/) 참고

#### 브랜치 구조
- **`main`**: 테스트가 완료되어 배포하기 위한 브랜치
- **`fe`**: 프론트엔드 전용 브랜치  
- **`be`**: 백엔드 전용 브랜치
- **`develop`**: 하나의 이슈에 대한 해결이 완료되면 병합하여 배포 전 테스트 진행

#### 브랜치 네이밍
```bash
# feature 브랜치
feat#2943

# hotfix 브랜치  
hotfix#2381
```

### 📝 Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) 기반

#### 기본 규칙
- **한국어로 작성**
- **헤더 / 바디 / 푸터** 구조로 작성 (내용별로 한 줄 띄우기)
- **Jira 이슈 번호** 포함

#### Commit 타입

| Prefix | 설명 | 예시 |
|--------|------|------|
| `feat` | 새로운 기능 추가 | `feat: 로그인 API 추가` |
| `fix` | 버그, 오류 수정 | `fix: 비밀번호 검증 로직 오류 수정` |
| `docs` | 문서 수정 | `docs: README에 API 사용법 추가` |
| `style` | 코드 포맷/스타일 변경 | `style: 들여쓰기 및 세미콜론 컨벤션 수정` |
| `refactor` | 기능 변화 없이 코드 개선 | `refactor: 로그인 API 로직 리팩토링` |

#### Commit 메시지 형식

**헤더 형식:**
```bash
feat[#2943]: 로그인 API 추가
fix[#2943]: 비밀번호 검증 로직 오류 수정  
docs[#2943]: README에 API 사용법 추가
style[#2943]: 들여쓰기 및 세미콜론 컨벤션 수정
refactor[#2943]: 로그인 API 로직 리팩토링
```

**전체 메시지 예시:**
```markdown
feat[#2943]: 로그인 API 추가

- Google OAuth API 추가
- Kakao OAuth API 추가
- JWT 토큰 생성 로직 구현

Jira: ASDFLKJCVV92J3BSF
```

### 🎯 Jira 작성 컨벤션

#### Task 설명 템플릿

```markdown
[내용설명]
- Task나 Story에 관한 설명
- 구현해야 할 기능의 상세 내용

[참고사항]  
- API 문서 링크
- 관련 이슈나 참고 자료
- 기술적 고려사항

[완료 조건]
- 조건 1: 기능 구현 완료
- 조건 2: 테스트 코드 작성
- 조건 3: 코드 리뷰 완료
```

#### 이슈 연동 규칙
- **브랜치명**에 Jira 이슈 번호 포함
- **커밋 메시지**에 이슈 번호 명시
- **PR 제목**에 이슈 번호와 작업 내용 포함

### 🔄 Pull Request 규칙

#### PR 생성 규칙
1. **제목 형식**: `[#이슈번호] 작업 내용 요약`
   ```
   [#2943] 로그인 API 구현 및 OAuth 연동
   ```

2. **설명 템플릿**:
   ```markdown
   ## 📋 작업 내용
   - [ ] Google OAuth API 구현
   - [ ] Kakao OAuth API 구현  
   - [ ] JWT 토큰 로직 추가
   
   ## 🧪 테스트 방법
   1. 로그인 페이지 접속
   2. Google/Kakao 로그인 버튼 클릭
   3. 토큰 발급 확인
   
   ## 📝 기타사항
   - API 문서 업데이트 필요
   - 환경변수 설정 가이드 추가
   
   ## 🔗 관련 이슈
   - Jira: [HANDI-2943](링크)
   ```

#### 코드 리뷰 규칙
- **팀별 리뷰**: 각 팀(FE/BE)의 **나머지 2명 모두 승인** 후 merge
- **리뷰 기간**: PR 생성 후 **24시간 이내** 리뷰 완료
- **머지 담당**: 팀장 또는 작업자가 직접 머지
- **Conflict 해결**: 작업자가 직접 해결 후 재요청

#### 머지 전 체크리스트
- [ ] Jira 이슈와 연동 확인
- [ ] 코드 리뷰 2명 이상 승인
- [ ] CI/CD 파이프라인 통과
- [ ] 테스트 코드 작성 및 통과
- [ ] 문서 업데이트 (필요시)

---

## 🔗 API 문서

### 📚 API 문서화

현재 API 문서는 개발 진행에 따라 순차적으로 추가될 예정입니다.

- **📊 API 명세서**: 추후 업데이트 예정
- **🔍 Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **📖 Postman Collection**: 추후 제공 예정

### 🚧 현재 구현된 API

- **Health Check**: 애플리케이션 상태 확인 API
- **Application Info**: 기본 정보 조회 API

> **참고**: 전체 API 문서는 개발 완료 후 이 섹션에서 확인하실 수 있습니다.

---

## 🎨 화면 설계

### 📱 주요 화면

1. **🏠 대시보드**: 전체 돌봄 현황 요약
2. **👤 사용자 관리**: 보호자/요양보호사 프로필 관리
3. **💊 복약 관리**: AI 복약 모니터링 화면
4. **📄 간병일지**: 자동 생성된 일지 확인
5. **📹 화상 면담**: WebRTC 기반 원격 상담
6. **📊 건강 분석**: 데이터 기반 건강 상태 분석

---

## 🌟 차별화 포인트

### ✨ 핵심 차별화 요소

1. **🔗 통합성**: 모든 돌봄 관계자를 하나의 플랫폼에서 연결
2. **🤖 AI 기반 자동화**: 복약 모니터링, 건강 분석, 문서 관리 자동화
3. **📞 원격 의료 연계**: 의사-보호자 직접 소통 채널 제공
4. **⏰ 실시간 모니터링**: 24시간 건강 상태 추적 및 즉시 알림
5. **🔐 개인정보 보호**: AI 자동 마스킹으로 민감 정보 보호

---

## 📊 경쟁 분석

| 서비스 | 주요 기능 | 한계점 | ᄒᆞᆫ디의 차별점 |
|--------|-----------|--------|----------------|
| **케어닥** 🏥 | 간병인 매칭 | 단순 매칭 중심 | AI 기반 통합 돌봄 관리 |
| **시니어케어** 👴 | 요양원 정보 제공 | 정보 제공 중심 | 실시간 모니터링 & 원격 의료 |
| **복약알리미** 💊 | 복약 관리 | 단일 기능 | AI 비전 기반 자동 복약 확인 |
| **실버케어** 📱 | 건강 모니터링 | 부분적 기능 | 전체 돌봄 생태계 통합 |

---

## 👨‍💻 개발팀

<div align="center">

### 🎯 SSAFY 13기 공통 프로젝트 A306팀

</div>

### 👥 팀 구성

<table>
<tr>
<td align="center">

<img src="docs/ddeockip_박병찬_circle.png" width="300" style="border-radius:50%; object-fit:cover;" alt="박병찬">

**🏆 팀장**  
**박병찬**  
`Backend Developer`  
- 프로젝트 총괄
- AI 개발 총괄
- API 개발 지원

</td>
<td align="center">

<img src="docs/ddeockip_이태호_circle.png" width="300" style="border-radius:50%; object-fit:cover;" alt="이태호">

**⚙️ 백엔드 팀장**  
**이태호**  
`Backend Developer`  
- API 개발 총괄
- 데이터베이스 설계
- 서버 로직 구현

</td>
<td align="center">

<img src="docs/ddeockip_최경민_circle.png" width="300" style="border-radius:50%; object-fit:cover;" alt="최경민">

**🔧 인프라 팀장**  
**최경민**  
`Backend Developer`  
- 인프라 구축 총괄
- 데이터베이스 설계
- API 개발 지원

</td>
</tr>
<tr>
<td align="center">

<img src="docs/ddeockip_김영규_circle.png" width="300" style="border-radius:50%; object-fit:cover;" alt="김영규">

**🎨 프론트엔드 팀장**  
**김영규**  
`Frontend Developer`  
- 프론트엔드 총괄
- UI/UX 설계
- 컴포넌트 아키텍처

</td>
<td align="center">

<img src="docs/ddeockip_양재원_circle.png" width="300" style="border-radius:50%; object-fit:cover;" alt="양재원">

**💻 프론트엔드**  
**양재원**  
`Frontend Developer`  
- React 컴포넌트 개발
- 사용자 인터페이스 구현
- API 연동

</td>
<td align="center">

<img src="docs/ddeokip_고영우_circle.png" width="300" style="border-radius:50%; object-fit:cover;" alt="고영우">

**🖼️ 프론트엔드**  
**고영우**  
`Frontend Developer`  
- 프론트엔드 기능 구현
- 반응형 웹 개발
- 사용자 경험 최적화

</td>
</tr>
</table>

### 🔧 개발 환경

- **Frontend**: React.js, TypeScript, TailwindCSS
- **Backend**: Spring Boot, Java 17, PostgreSQL, Redis
- **DevOps**: Docker, AWS EC2, Jenkins
- **Collaboration**: GitLab, Jira, Figma

---

<div align="center">

### 🤝 함께 만들어가는 따뜻한 돌봄 문화

**ᄒᆞᆫ디(Handi)** 는 기술을 통해 사람과 사람을 연결하고,  
더 나은 돌봄 서비스를 제공하는 것을 목표로 합니다.

---

![Footer](https://img.shields.io/badge/Made%20with-❤️-red)
![SSAFY](https://img.shields.io/badge/SSAFY-13기-blue)
![Team](https://img.shields.io/badge/Team-A306-green)

**📧 Contact**: ssafy.handi@gmail.com  
**🏠 Organization**: [SSAFY 13기 공통 프로젝트](https://github.com/your-organization)

</div>