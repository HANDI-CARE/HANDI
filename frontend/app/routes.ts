import { type RouteConfig, index, route } from "@react-router/dev/routes";

//
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// 라우트 수정할 때 `httpClient.ts`의 라우트 보호 파트도 함께 수정하기!!
//
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//

// 공용 라우트
export const commonRoutes = [
  index("presentation/pages/home/Home.tsx"),

  // 화상 통화
  route("video-call/:roomName", "presentation/pages/video-call/VideoCall.tsx"),

  // TODO: 추후 관리자 계정 정상 생성되면 관리자 라우트로 복구시키기
  route("admin/users", "presentation/pages/admin/users/Users.tsx"),
  route("admin/users/:id", "presentation/pages/admin/users/UserDetail.tsx"),
  route("admin/seniors", "presentation/pages/admin/seniors/Seniors.tsx"),
  route(
    "admin/organization",
    "presentation/pages/admin/organizations/Organization.tsx"
  ),
] satisfies RouteConfig;

// 로그인, 온보딩 라우트
export const onboardingRoutes = [
  route("login", "presentation/pages/login/SocialLogin.tsx"),
  route(
    "onboarding/organization-code",
    "presentation/pages/login/OrganizationCode.tsx"
  ),
  route(
    "onboarding/additional-info",
    "presentation/pages/login/AdditionalInfo.tsx"
  ),
] satisfies RouteConfig;

// 간호사 모드 라우트
export const nurseRoutes = [
  route("nurse/dashboard", "presentation/pages/nurse/Dashboard.tsx"),
  route("nurse/consultation", "presentation/pages/nurse/Consultation.tsx"),
  route(
    "nurse/consultation-schedules",
    "presentation/pages/nurse/ConsultationSchedules.tsx"
  ),
  route(
    "nurse/hospital-schedules",
    "presentation/pages/nurse/HospitalSchedules.tsx"
  ),
  route(
    "nurse/hospital-schedules-management",
    "presentation/pages/nurse/HospitalSchedulesManagement.tsx"
  ),
  route("nurse/patients", "presentation/pages/nurse/Patients.tsx"),
  route(
    "nurse/patients/:patientId",
    "presentation/pages/nurse/patient-detail/PatientDetail.tsx"
  ),
  route(
    "nurse/medication-check",
    "presentation/pages/nurse/MedicationCheck.tsx"
  ),
  route("nurse/video-call", "presentation/pages/nurse/VideoCall.tsx"),
] satisfies RouteConfig;

// 보호자 모드 라우트
export const guardianRoutes = [
  route("guardian/dashboard", "presentation/pages/guardian/Dashboard.tsx"),
  route(
    "guardian/hospital-schedules",
    "presentation/pages/guardian/HospitalSchedules.tsx"
  ),
  route(
    "guardian/consultation",
    "presentation/pages/guardian/Consultation.tsx"
  ),
  route(
    "guardian/consultation-schedules",
    "presentation/pages/guardian/ConsultationSchedules.tsx"
  ),
] satisfies RouteConfig;

// 관리자 모드 라우트
export const adminRoutes = [
  // TODO: 임시로 common routes로 옮겨 놓은 관리자 라우트 복구시키기
] satisfies RouteConfig;

export default [
  ...commonRoutes,
  ...onboardingRoutes,
  ...nurseRoutes,
  ...guardianRoutes,
  ...adminRoutes,
] satisfies RouteConfig;
