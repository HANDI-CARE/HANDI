import { httpClient } from "../../../../shared/infrastructure/api/httpClient";
import type {
  SetUserInfoRequestDto,
  UpdateUserRequestDto,
  UserResponseDto,
  VerifyOrganizationCodeRequestDto,
  VerifyOrganizationCodeResultDto,
} from "../dto/UserDto";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

/**
 * 사용자 관련 API 호출 함수들
 */
export const userApi = {
  /**
   * 로그아웃 API
   * POST /auth/logout
   */
  async logout(): Promise<void> {
    await httpClient.post("/api/v1/auth/logout");
  },

  /**
   * 현재 사용자 정보 조회 API
   * GET /auth/me
   */

  // 현재 사용자 정보 조회
  getCurrentUser: async (): Promise<ApiResponse<UserResponseDto>> => {
    const response = await httpClient.get<ApiResponse<UserResponseDto>>(
      "/api/v1/users/me"
    );
    return response.data;
  },

  // 추가 정보 입력
  setUserInfo: async (
    userData: SetUserInfoRequestDto
  ): Promise<ApiResponse<UserResponseDto>> => {
    const response = await httpClient.post<ApiResponse<UserResponseDto>>(
      "/api/v1/users/me",
      userData
    );
    return response.data;
  },

  /**
   * 토큰 갱신 API
   * POST /auth/refresh
   */
  async refreshToken(): Promise<boolean> {
    const response = await httpClient.post<Promise<void>>(
      "/api/v1/auth/refresh"
    );
    if (response.status === 200) {
      return true;
    }
    return false;
  },

  // 기관코드 검증
  async verifyOrganizationCode(
    request: VerifyOrganizationCodeRequestDto
  ): Promise<VerifyOrganizationCodeResultDto> {
    const response = await httpClient.post<{
      success: boolean;
      message: string;
      result: VerifyOrganizationCodeResultDto;
    }>("/api/v1/users/code/verify", request);
    return response.data.result;
  },

  /**
   * 사용자 목록 조회 API (관리자 전용)
   * GET /users
   *
   * TODO: 관리자 모드에서 필요한 지 검토 후 필요 없으면 삭제
   */
  async getUsers(params?: {
    role?: "nurse" | "guardian" | "admin";
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const response = await httpClient.get("/users", { params });
    return response.data;
  },

  /**
   * 특정 사용자 조회 API
   * GET /users/:id
   *
   * TODO: 관리자 모드에서 필요한 지 검토 후 필요 없으면 삭제
   */
  async getUser(userId: string): Promise<UserResponseDto> {
    const response = await httpClient.get<UserResponseDto>(`/users/${userId}`);
    return response.data;
  },

  /**
   * 사용자 정보 업데이트 API
   * PUT /users/:id
   *
   * TODO: 관리자 모드에서 필요한 지 검토 후 필요 없으면 삭제
   */
  async updateUser(
    userId: string,
    userData: UpdateUserRequestDto
  ): Promise<UserResponseDto> {
    const response = await httpClient.put<UserResponseDto>(
      `/users/${userId}`,
      userData
    );
    return response.data;
  },

  /**
   * 사용자 삭제 API (관리자 전용)
   * DELETE /users/:id
   *
   * TODO: 관리자 모드에서 필요한 지 검토 후 필요 없으면 삭제
   */
  async deleteUser(userId: string): Promise<void> {
    await httpClient.delete(`/users/${userId}`);
  },
};
