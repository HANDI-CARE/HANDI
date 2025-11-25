# 상태 관리 가이드 (현행 반영)

이 문서는 실제 구현을 기준으로 클라이언트 상태(Zustand)와 서버 상태(TanStack Query) 전략을 설명합니다.

## 전역 스토어(Zustand)

- 파일: `app/presentation/stores/*`
- 퍼시스턴스: `zustand/middleware`의 `persist` 사용(localStorage)

### 사용자 스토어

- 파일: `app/presentation/stores/userStore.ts`
- 상태: `user`, `isAuthenticated`, `isLoading`, `onboarding`
- 액션: `loadUser`, `setUser`, `removeUser`, `logout`, 온보딩 보조 setter들
- 동작 요약
  - `loadUser`: `UserService.getCurrentUser()`로 사용자 로드, `needsAdditionalInfo=true`면 로그인 완료로 간주하지 않음
  - `logout`: 서버 로그아웃 시도 후 로컬 상태/세션 정리
  - `persist`의 `partialize`로 필요한 키만 저장(`user`, `isAuthenticated`, `onboarding`)

### 개발 설정 스토어

- 파일: `app/presentation/stores/devSettingsStore.ts`
- 상태: `routeGuardEnabled`(기본 true)
- 목적: 개발 중 라우트 가드 토글

### 화상통화 스토어

- 파일: `app/presentation/stores/videoCallStore.ts`
- 상태: `token`, `connectionState`
- 액션: `setToken`, `removeToken`, `setConnectionState`

## 서버 상태(TanStack Query)

- 프로바이더: `app/root.tsx`에서 `QueryClient` 구성
  - `staleTime=5분`, `gcTime=10분`, `retry=1`, `refetchOnWindowFocus=false`
- 훅은 각 기능 폴더(application/hooks 또는 presentation/pages 내부)에서 필요 시 정의하여 사용

예시(개념):

```ts
const { data, isLoading } = useQuery({
  queryKey: ["patients", page],
  queryFn: () => patientApi.getTodayMedicationSchedules(),
});
```

## 인증 및 401 처리(핵심)

- Axios 인스턴스: `app/shared/infrastructure/api/httpClient.ts`
- 401 처리 흐름
  - 보호되지 않은 경로(`/`, `/login`, `/onboarding/...`)는 강제 리다이렉트 제외
  - 401 발생 시 `/api/v1/auth/refresh` 호출 → 성공 시 원요청 재시도, 실패 시 사용자 제거 및 `/login` 리다이렉트

## API 계층 정리

도메인별 Infrastructure 계층에서 실제 엔드포인트를 호출합니다.

- 사용자: `features/user/infrastructure/api/userApi.ts`
  - `/api/v1/auth/logout`, `/api/v1/auth/refresh`, `/api/v1/users/me`, `/api/v1/users/code/verify`
- 환자/투약/관찰 기록: `features/patient/infrastructure/api/patientApi.ts`
  - 예) `/api/v1/seniors/:id`, `/api/v1/vitals/seniors/:id`, `/api/v1/medications/today`, `/api/v1/observation-records/...`
- 상담 일정: `features/consultation/infrastructure/api/consultationApi.ts`
  - 예) `/api/v1/meeting/redis/schedule/*`
- 병원 일정/미팅: `features/hospital/infrastructure/api/hospitalApi.ts`
  - 예) `/api/v1/meetings`, `/api/v1/meetings/meeting-type`
- 문서(처방전 등): `features/document/infrastructure/api/documentApi.ts`
  - 예) `/api/v1/documents/seniors/:id`
- 약물 AI: `features/drug/infrastructure/api/drugApi.ts`
  - 예) `/api/v1/ai/drug/searchByName`, `/api/v1/ai/drug/detectByImage`

## 캐싱/무효화 권장

- 목록/상세 키를 구분하여 부분 무효화
- 뮤테이션 성공 시 관련 `queryKey` 무효화 또는 직접 `setQueryData`

## 패턴/가이드

- UI(컴포넌트) ↔ 상태(스토어/쿼리) 경계 분명히 하기
- 전역 스토어에는 세션/역할/토큰 등 최소 정보만 보관
- 비즈니스 절차는 서비스/훅으로 캡슐화하고 컴포넌트에서는 단순 호출만
