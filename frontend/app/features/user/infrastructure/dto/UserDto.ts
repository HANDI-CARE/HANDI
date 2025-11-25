// API 응답용 User DTO
export interface UserResponseDto {
  id: number | null;
  oauthUserId: number;
  organizationId: number | null;
  role: string | null;
  name: string;
  email: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  address: string | null;
  fcmToken: string | null;
  createdAt: string;
  updatedAt: string | null;
  needsAdditionalInfo: boolean;
}

// 사용자 초기 정보 등록 DTO
export interface SetUserInfoRequestDto {
  name: string;
  phoneNumber: string;
  organizationId: number;
  role: string;
  profileImageUrl: string;
  address: string;
}

// 사용자 업데이트 요청 DTO
export interface UpdateUserRequestDto {
  name?: string;
  email?: string;
  phone_number?: string;
  department?: string;
  profile_image_url?: string;
}

// 기관 코드 검증 요청 DTO
export interface VerifyOrganizationCodeRequestDto {
  userInputCode: string;
}

// 기관 코드 검증 결과 DTO
export interface VerifyOrganizationCodeResultDto {
  phoneNumber: string;
  organizationId: number;
  organizationName: string;
  role: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
}
