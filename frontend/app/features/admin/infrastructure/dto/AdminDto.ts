// 관리자 기능 관련 DTO 정의

// 공통 페이지 정보 DTO
export interface PageInfoDto {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  empty: boolean;
}

// 공통 API 래퍼
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  result: T;
}

// 리스트 응답(배열 + 페이지 정보)
export interface ApiListEnvelope<T> {
  success: boolean;
  message: string;
  result: T[];
  pageInfo: PageInfoDto;
}

// Admin User DTO
export type AdminUserRoleDto = "ADMIN" | "EMPLOYEE" | "GUARDIAN";

export interface AdminUserDto {
  id: number;
  oauthUserId: number;
  organizationId: number;
  role: AdminUserRoleDto;
  name: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
  address?: string;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  needsAdditionalInfo: boolean;
}

export interface UpdateAdminUserRequestDto {
  organizationId: number;
  role: AdminUserRoleDto;
  name: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
  address?: string;
}

export interface CreateAdminUserRequestDto {
  email: string;
  name: string;
  phoneNumber: string;
  organizationId: number;
  role: AdminUserRoleDto;
  profileImageUrl?: string;
  address?: string;
}

export interface SendOrganizationCodeRequestDto {
  organizationId: number;
  phoneNumber: string;
  role: AdminUserRoleDto;
}

export interface SendOrganizationCodeResponseDto {
  organizationId: number;
  expiresIn: number;
  expiresAt: string;
  userMessage: string;
}

// Senior DTO
export type SeniorGenderDto = "MALE" | "FEMALE";

export interface SeniorDto {
  id: number;
  organizationId: number;
  organizationName: string;
  name: string;
  birthDate: string;
  gender: SeniorGenderDto;
  admissionDate: string | null;
  dischargeDate: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  age: number;
}

export interface CreateSeniorRequestDto {
  birthDate: string;
  gender: SeniorGenderDto;
  name: string;
  organizationId: number;
  admissionDate: string | null;
  note: string | null;
}

export interface UpdateSeniorRequestDto {
  name?: string;
  dischargeDate: string | null;
  note: string | null;
  isActive?: boolean;
}

export interface SeniorSearchQueryDto {
  organizationId: number;
  name?: string;
  isActive?: boolean;
  page: number;
  size: number;
  sort: string | string[];
}

// Organization DTO
export interface OrganizationDto {
  id: number;
  name: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  sleepTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationRequestDto {
  name: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  sleepTime: string;
}

// Senior Relation DTO
export interface AddGuardianRelationsRequestDto {
  guardianIds: number[];
}

export interface AddEmployeeRelationsRequestDto {
  employeeIds: number[];
}
