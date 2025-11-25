export interface User {
  id: number | null;
  oauthUserId: number;
  organizationId: number | null;
  role: UserRole | null;
  name: string;
  email: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  address: string | null;
  fcmToken: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  needsAdditionalInfo: boolean;
}

export enum UserRole {
  NURSE = "nurse",
  GUARDIAN = "guardian",
  ADMIN = "admin",
}

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
