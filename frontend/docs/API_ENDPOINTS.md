# API 엔드포인트 가이드 (현행 반영)

이 문서는 실제 프런트엔드 코드에서 사용 중인 엔드포인트와 흐름을 요약합니다. 기본 전제: 인증은 쿠키/세션 기반이며, Axios는 `withCredentials: true`로 설정되어 있습니다.

## 기본

- 기본 URL
  - 개발: `VITE_USE_PROXY === "1"`이면 Vite 프록시(`/api`, `/mock-oauth` → `VITE_API_URL`)
  - 그 외: `baseURL = DEFAULT_API_URL`(`app/shared/constants/url.ts`)
- 공통 헤더: `Content-Type: application/json`
- 인증 처리: 401 시 `/api/v1/auth/refresh` 재시도, 실패 시 로그인 리다이렉트

## 인증/사용자

- 로그아웃: `POST /api/v1/auth/logout`
- 토큰 갱신: `POST /api/v1/auth/refresh` → 200이면 성공
- 내 정보: `GET /api/v1/users/me`
- 사용자 초기 정보 등록: `POST /api/v1/users/me`
- 기관 코드 검증: `POST /api/v1/users/code/verify`

OAuth 로그인은 로그인 페이지에서 `VITE_API_URL + /oauth2/authorization/{provider}`로 팝업 이동 후, `UserService.getCurrentUser()`로 세션 정보를 가져오는 방식입니다.

## 환자/투약/관찰 기록

- 환자 상세: `GET /api/v1/seniors/{seniorId}`
- 환자 관련 모든 사용자: `GET /api/v1/seniors/{seniorId}/detail/all`
- 환자 메모: `GET|PUT /api/v1/seniors/note/{seniorId}`
- 대시보드 환자 리스트(중요 환자): `GET /api/v1/significant/recent`
- 오늘 복약 스케줄: `GET /api/v1/medicationSchedules/today`
- 스케줄 상세: `GET /api/v1/medicationSchedules/{id}`
- 기간별 복약 스케줄: `GET /api/v1/medicationSchedules/seniors/{seniorId}/range`
- 스케줄별 투약 내역: `GET /api/v1/medications/schedules/{scheduleId}`
- 투약 단건: `GET /api/v1/medications/{medicationId}`
- 복약 내역(대시보드 신규 구조): `GET /api/v1/medications/today`
- 활력징후(단일/범위):
  - `GET /api/v1/vitals/seniors/{seniorId}` with `?date=YYYYMMDD`
  - `GET /api/v1/vitals/seniors/{seniorId}/range?startDate=YYYYMMDD&endDate=YYYYMMDD`
  - `PUT /api/v1/vitals/seniors/{seniorId}` with `?date=YYYYMMDD`
- 관찰일지(단건/목록/생성/수정/삭제):
  - `GET /api/v1/observation-records/{seniorId}`
  - `GET /api/v1/observation-records/seniors/{seniorId}/range`
  - `POST /api/v1/observation-records/seniors/{seniorId}`
  - `PUT /api/v1/observation-records/{recordId}`
  - `DELETE /significant/{recordId}`(주의: 엔드포인트 비정형, 코드와 동일하게 표기)

## 상담/병원 일정

- 상담(레거시/페이지 전용)
  - 목록: `GET /consultations`
  - 생성: `POST /consultations`
  - 수정: `PUT /consultations/{id}`
  - 삭제: `DELETE /consultations/{id}`
  - 예약: `POST /consultations/{id}/book`
  - 취소: `POST /consultations/{id}/cancel`
  - 가용 슬롯: `GET /consultations/available-slots`

- 회의/병원 일정(신규)
  - 미팅 상세: `GET /api/v1/meetings/{meetingId}`
  - 전체 일정: `GET /api/v1/meetings/meeting-type?meetingType=withDoctor|withEmployee&...`
  - 미팅 생성: `POST /api/v1/meetings`
  - (withDoctor) 의사 정보 업데이트: `PUT /api/v1/meetings/{meetingId}/doctor`

- 상담 시간 선택(레디스 기반 임시 저장)
  - 간호사 선택 저장: `POST /api/v1/meeting/redis/schedule/register/employee`
  - 간호사 선택 조회: `GET /api/v1/meeting/redis/schedule/employee`
  - 보호자 선택 저장: `POST /api/v1/meeting/redis/schedule/register/guardian`
  - 보호자 선택 조회: `GET /api/v1/meeting/redis/schedule/guardian/{seniorId}`

## 문서(처방전 등)

- 업로드: `POST /api/v1/documents/seniors/{seniorId}` (multipart/form-data)
- 목록: `GET /api/v1/documents/senior/{seniorId}`
- 단건: `GET /api/v1/documents/{documentId}`
- 삭제: `DELETE /api/v1/documents/{documentId}`

## 약물 AI

- 명칭 검색: `POST /api/v1/ai/drug/searchByName`
- 이미지 탐지: `POST /api/v1/ai/drug/detectByImage` (multipart/form-data)

## 조직

- 단건 조회: `GET /api/v1/organizations/{id}`

## 공통 응답/페이지네이션

- 공통 래퍼: `{ success: boolean, message: string, result: T }` 형태가 다수 API에서 사용됩니다.
- 페이지네이션: `OffsetPaginatedResponseDto` 등 공통 DTO를 사용하며, `page`, `limit`, 범위 날짜 파라미터 조합을 지원합니다.
