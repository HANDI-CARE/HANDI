// 관리자 도메인 타입

export type AdminUserRole = "ADMIN" | "EMPLOYEE" | "GUARDIAN";

export interface AdminUser {
  id: number;
  oauthUserId: number;
  organizationId: number;
  role: AdminUserRole;
  name: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
  address?: string;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  needsAdditionalInfo: boolean;
}

export interface PageInfo {
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
