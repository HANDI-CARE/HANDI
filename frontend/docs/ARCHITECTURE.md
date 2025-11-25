# 아키텍처 가이드 (현행 반영)

이 문서는 Handi 프론트엔드의 실제 코드 구조와 운영 방식(React Router v7 프레임워크, Vite 6, TailwindCSS 4, Ant Design, TanStack Query, Zustand, LiveKit, Capacitor)을 기준으로 작성되었습니다.

## 개요

- 패턴: Feature-first + Layered(기능 폴더 내부에 Application/Domain/Infrastructure 구성)
- 라우팅: React Router v7(App Framework), SPA 모드(SSR 비활성)
- 상태: 클라이언트(Zustand) + 서버 상태(TanStack Query)
- 네트워킹: Axios 단일 인스턴스 + 401 처리/토큰 갱신 인터셉터

## 디렉터리 구조(요약)

```
app/
├─ entry.client.tsx         # HydratedRouter + 모바일 푸시 초기화
├─ root.tsx                 # 전역 레이아웃/프로바이더/LiveKit/에러 바운더리
├─ routes.ts                # 역할별 라우트 그룹 정의
├─ app.css                  # Tailwind v4 테마 및 글로벌 스타일
├─ features/
│  ├─ user/                 # application/domain/infrastructure
│  ├─ patient/
│  ├─ hospital/
│  ├─ consultation/
│  ├─ document/
│  ├─ drug/
│  ├─ organization/
│  └─ mobile-push/
├─ presentation/            # UI(Atomic) + pages + stores
├─ shared/
│  ├─ constants/url.ts      # DEFAULT_API_URL, DEFAULT_LIVEKIT_URL
│  └─ infrastructure/api/httpClient.ts  # Axios/인터셉터
└─ welcome/
```

## 계층 설명(Feature 내부)

- Domain: 엔티티/값/도메인 규칙. 예) `features/user/domain/User.ts`
- Application: 서비스/훅/매퍼. 예) `features/user/application/services/UserService.ts`
- Infrastructure: 외부 연동(API/DTO). 예) `features/patient/infrastructure/api/patientApi.ts`
- Presentation: Atomic 컴포넌트/페이지/전역 스토어. 예) `presentation/pages/nurse/...`

의존성 방향은 기능 폴더 내에서 다음을 유지합니다.

```
Presentation → Application → Domain ← Infrastructure
```

## 라우팅 구조

- 구성: `app/routes.ts` + `react-router.config.ts (ssr: false)`
- 그룹
  - 공용: `/`, `/video-call/:roomName`, 임시 관리자(`/admin/users`, `/admin/seniors`, `/admin/organization`)
  - 온보딩: `/login`, `/onboarding/organization-code`, `/onboarding/additional-info`
  - 간호사: `/nurse/...`(대시보드/상담/병원일정/환자/투약)
  - 보호자: `/guardian/...`(대시보드/병원일정/상담)
- 가드: `app/root.tsx`
  - 로그인/추가입력 여부 및 역할에 따른 리다이렉트
  - 개발용 스위치: `useDevSettingsStore().routeGuardEnabled`

## 전역 프로바이더/레이아웃

- `root.tsx`
  - TanStack Query: `staleTime=5m`, `gcTime=10m`, `retry=1`, `refetchOnWindowFocus=false`
  - Ant Design: 프라이머리(시안 계열) 토큰/컴포넌트 토큰 커스터마이징
  - LiveKit: `RoomContext` + `LiveKitRoom` + 미니 영상통화(Draggable)
  - Capacitor(App BackButton, exitApp) + 딥링크 처리

## 네트워킹/보안

- Axios 인스턴스: `shared/infrastructure/api/httpClient.ts`
  - `withCredentials=true`, `timeout=10s`, `Content-Type: application/json`
  - `VITE_USE_PROXY === "1"` → dev 프록시 사용(Vite에서 `/api`, `/mock-oauth` 프록시)
  - 그 외 → `baseURL = DEFAULT_API_URL`
  - 401 응답 시: `/api/v1/auth/refresh` 재시도 → 실패 시 사용자 제거/로그인 리다이렉트(비보호 경로 제외)

## 환경 변수

- `VITE_API_URL`: 백엔드 베이스 URL(로그인 OAuth 팝업 URL 생성에 필요)
- `VITE_USE_PROXY`: 1일 때 Vite 프록시 활성화(`/api`, `/mock-oauth` → `VITE_API_URL`)
- `VITE_LIVEKIT_URL`: 미설정 시 `DEFAULT_LIVEKIT_URL`

## 스타일/테마

- Tailwind v4: `@theme`로 폰트/컬러 토큰 정의, 전역 스크롤바/AntD 색상 보정
- Ant Design: `ConfigProvider`로 전역 토큰/Calendar 등 컴포넌트 토큰 튜닝

## 예시: 역할 가드 핵심 로직(개념)

```tsx
// app/root.tsx (발췌)
useLayoutEffect(() => {
  if (!routeGuardEnabled) return;
  const isLoggedInAndRegistered = isAuthenticated && !user?.needsAdditionalInfo;
  // 경로 그룹 판별 후 역할/상태에 맞지 않으면 window.location.href로 리다이렉트
}, [location.pathname, isAuthenticated, user?.role, routeGuardEnabled]);
```

## 빌드/배포

- Dev: `npm run dev`(Vite 3000), 선택적으로 프록시 사용
- Build: `npm run build` → `build/client`, `build/server`

## 모범 사례

- 기능 단위로 폴더링하고 각 기능 내 계층 분리 유지
- 컴포넌트는 UI 로직만, 비즈니스/데이터는 Application/Infrastructure로 이동
- 인터셉터에서 인증/리다이렉트 일관 관리, 컴포넌트에서는 실패 메시지 등 사용자 경험 처리에 집중
