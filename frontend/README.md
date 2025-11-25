# Handi - 환자 관리 서비스 (Frontend)

간호사/보호자/관리자를 위한 환자 관리 서비스 프론트엔드입니다. React Router v7 앱 구조, TypeScript, TailwindCSS 4, Ant Design 5, TanStack Query 5, Zustand, LiveKit, Capacitor(Android) 등을 사용합니다.

## 🚀 핵심 기능

- **간호사 모드**: 대시보드, 환자 목록/상세, 상담 일정, 병원 일정 관리, 투약 확인, 화상 상담
- **보호자 모드**: 대시보드, 병원 일정, 상담 예약/확인
- **관리자 모드(초기)**: 사용자/시니어/기관 관리(일부 라우트만 노출)
- **화상 상담**: LiveKit 기반 실시간 화상 통화(미니 플로팅 뷰 포함)
- **모바일 연동**: Capacitor로 Android 푸시/딥링크 처리

## 🛠 기술 스택

- **런타임/도구**: Node 20, Vite 6, React 19, TypeScript 5, React Router v7(framework)
- **UI/스타일**: TailwindCSS 4(@tailwindcss/vite), Ant Design 5, Recharts
- **상태/데이터**: Zustand 5, TanStack Query 5, Axios
- **RTC/모바일**: LiveKit, Capacitor(Android)

## 📁 디렉터리 구조

```
app/
├─ entry.client.tsx                 # 클라이언트 엔트리(푸시 초기화, HydratedRouter)
├─ root.tsx                         # 전역 레이아웃/프로바이더/에러바운더리
├─ routes.ts                        # React Router v7 라우트 설정(역할별 그룹)
├─ app.css                          # Tailwind v4 테마/글로벌 스타일
├─ features/                        # 기능(도메인) 단위 폴더
│  ├─ user/                         # user 도메인
│  │  ├─ application/ services, mappers, hooks
│  │  ├─ domain/ User.ts, enums
│  │  └─ infrastructure/ api, dto
│  ├─ patient/ ...                  # patient, task, consultation, hospital, ...
│  └─ mobile-push/                  # 푸시/딥링크 stores, service
├─ presentation/                    # UI 레이어(Atomic + Pages)
│  ├─ components/ atoms, molecules, organisms, templates
│  ├─ pages/ role별 페이지 집합(nurse/guardian/admin/login/home/video-call)
│  └─ stores/                       # 전역 UI/사용자/화상통화 상태(Zustand)
├─ shared/                          # 공통 상수/유틸/HTTP 클라이언트
│  ├─ constants/url.ts              # 기본 API/LK URL 상수
│  └─ infrastructure/api/httpClient.ts # Axios 인스턴스/토큰 갱신/라우트 보호
└─ welcome/                         # 웰컴 리소스
```

추가 문서: `docs/ARCHITECTURE.md`, `docs/STATE_MANAGEMENT.md`, `docs/COMPONENTS.md`, `docs/API_ENDPOINTS.md`

## 🧭 라우팅

- 구성 파일: `app/routes.ts`, `react-router.config.ts`
- SPA 모드: `ssr: false`
- 그룹
  - 공용: `/`, `/video-call/:roomName`, 임시 관리자 경로(`/admin/users`, `/admin/seniors`, `/admin/organization`)
  - 온보딩/로그인: `/login`, `/onboarding/organization-code`, `/onboarding/additional-info`
  - 간호사: `/nurse/...`(대시보드/상담/병원일정/환자/투약)
  - 보호자: `/guardian/...`(대시보드/병원일정/상담)
- 라우트 가드: `app/root.tsx`에서 사용자/역할 기반 이동 제어, `httpClient` 응답 인터셉터에서 401 처리 시 보호 라우트 접근 차단 및 로그인 리다이렉트

## 🔐 인증

- 소셜 로그인(네이버/카카오/구글)
- 로그인 플로우: `presentation/pages/login/SocialLogin.tsx`
  - `VITE_API_URL` 기반 OAuth 엔드포인트로 새 창 이동 → `public/oauth-callback.html`에서 postMessage → `UserService.getCurrentUser()`로 사용자 정보 로드
- 토큰 갱신/만료 처리: `shared/infrastructure/api/httpClient.ts` 응답 인터셉터
  - 401 시 `/auth/refresh` 시도 → 실패 시 사용자 상태 초기화 및 로그인 리다이렉트(비보호 경로 제외)

## ⚙️ 환경 변수(.env.local)

필수/선택 항목과 동작은 다음과 같습니다.

```
# 백엔드 베이스 URL (OAuth 및 프록시 타겟에 사용, 필수)
VITE_API_URL=https://api.example.com

# 개발 프록시 사용 여부(1: 사용). 사용 시 Vite dev 프록시가 /api, /mock-oauth를 VITE_API_URL로 전달
VITE_USE_PROXY=1

# LiveKit 서버 URL(미설정 시 기본값 사용)
VITE_LIVEKIT_URL=wss://rtc.example.com
```

- 기본값: `app/shared/constants/url.ts`
  - `DEFAULT_API_URL = https://api.brewprint.xyz`
  - `DEFAULT_LIVEKIT_URL = wss://rtc.brewprint.xyz`
- `httpClient` 동작
  - `VITE_USE_PROXY === "1"` → Axios `baseURL` 없음(프록시 사용), Vite가 `/api`, `/mock-oauth`를 `VITE_API_URL`로 프록시
  - 그 외 → Axios `baseURL = DEFAULT_API_URL`
- 주의: 로그인 화면은 `VITE_API_URL`을 직접 사용합니다(OAuth 팝업 URL 생성). 반드시 설정하세요.

## ▶️ 실행 방법

사전 요구: Node.js 22, npm 10

```
npm ci        # 또는 npm install
npm run dev   # 개발 서버(기본 http://localhost:3000)
```

참고: 개발 서버 포트는 `vite.config.ts`에서 3000으로 설정되어 있습니다.

## 📱 모바일(Android) 빌드(옵션)

- Capacitor 설정: `capacitor.config.ts`(`webDir: build/client`)
- 절차
  1) `npm run build`
  2) `npx cap sync android`
  3) Android Studio에서 `android/` 열기 및 빌드/실행
- 푸시/딥링크: `features/mobile-push`와 `presentation/stores` 참조

## 🎨 스타일/테마

- Tailwind v4: `app/app.css` 내 `@theme`로 폰트와 주요 색상(시안 계열) 정의
- Ant Design: `ConfigProvider`로 프라이머리 컬러/Calendar 등 토큰 커스터마이징(`app/root.tsx`)

## 📚 문서

- `docs/ARCHITECTURE.md` - 아키텍처 개요/원칙
- `docs/STATE_MANAGEMENT.md` - Zustand/React Query 전략
- `docs/COMPONENTS.md` - 컴포넌트 계층/작성 가이드
- `docs/API_ENDPOINTS.md` - API 엔드포인트 예시

## 🤝 기여

1. 브랜치 생성: `git checkout -b feat/JIRA-ISSUE-your-feature`
2. 커밋: `git commit -m "feat: add your feature"`
   - 내용에 JIRA ISSUE 번호 추가
3. 푸시 및 PR 오픈