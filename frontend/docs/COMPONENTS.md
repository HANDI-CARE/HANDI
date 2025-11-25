# 컴포넌트 가이드 (현행 반영)

이 문서는 실제 코드 구조(Atomic + 페이지)와 패턴을 기준으로 정리되었습니다.

## 계층

- 위치: `app/presentation`
- 구성: `components/{atoms,molecules,organisms,templates}` + `pages` + 전역 `stores`
- 레이아웃: `templates/AppLayout.tsx` + 하위 레이아웃 컴포넌트(Header/Sidebar/SubHeader/Footer)

## Atoms(공통)

- 경로: `presentation/components/atoms`
- 예시: `Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `Select.tsx`, `Statistic.tsx`
- 스타일: Tailwind + AntD 조합. 공통 프라이머리 색은 시안 계열(`app/app.css` 참조)

## Molecules/Organisms

- 경로: `presentation/components/{molecules,organisms}`
- 예시
  - Molecules: `PatientCard.tsx`, `DetailItem.tsx`, `CalendarItem.tsx`
  - Organisms: `PatientListCard.tsx`, `ConsultationScheduleCard.tsx`, `HospitalScheduleCard.tsx`, `RegisteredPatientsCard.tsx`, `GenericCalendar.tsx`

## Templates

- 경로: `presentation/components/templates`
- `AppLayout.tsx`는 역할별 메뉴/헤더/사이드바를 배치하고, children에 페이지를 렌더링합니다.

## Pages

- 경로: `presentation/pages`
- 그룹: `home`, `login`, `nurse`, `guardian`, `admin(일부)`, `video-call`
- 예시
  - Nurse: 대시보드, 환자 목록/상세, 상담/병원 일정, 투약 확인
  - Guardian: 대시보드, 병원 일정, 상담 일정
  - Admin: 사용자/시니어/기관 관리 페이지(일부 노출)

## 비주얼/테마

- Tailwind v4: `app/app.css`에서 `@theme`로 폰트/색상 토큰 정의
- AntD: `root.tsx`의 `ConfigProvider`에서 토큰 및 Calendar 등의 컴포넌트 토큰 재정의

## 상호작용/패턴

- 폼/리스트는 AntD 컴포넌트와 Tailwind 유틸 클래스를 조합
- 복합 상호작용(예: 환자 상세의 모달, 상담/병원 일정 선택)은 organisms 단위로 구성하여 페이지에서 조합

## 예시: 환자 상세(모듈식 구성)

```tsx
// presentation/pages/nurse/patient-detail/PatientDetail.tsx (개념)
<AppLayout>
  <VitalSignCard />
  <ObservationRecordCard />
  <MedicationItemCard />
  {/* 모달들: ConsultationRecordHistory, DocumentHistory 등 */}
</AppLayout>
```

## 접근성/성능 권장

- 의미 있는 대체 텍스트와 키보드 포커스 가능한 컨트롤 제공
- 리스트 가상화는 필요 시 도입, Query 캐싱으로 네트워크 부하 감소
