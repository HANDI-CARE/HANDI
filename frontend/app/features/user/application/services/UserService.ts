import { parseDateTime } from "~/shared/utils/dateUtils";
import { UserRole, type User } from "../../domain/User";
import { userApi } from "../../infrastructure/api/userApi";
import { UserMapper } from "../mappers/UserMapper";

export class UserService {
  private readonly basePath = "/users";

  // 싱글톤 인스턴스
  private static instance: UserService | null = null;

  // 싱글톤 인스턴스 반환
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // 생성자를 private으로 만들어 외부에서 new로 생성 불가
  private constructor() {}

  // 로그아웃
  async logout(): Promise<void> {
    try {
      await userApi.logout();
    } catch (error) {
      console.error("로그아웃 중 오류:", error);
    }
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await userApi.getCurrentUser();
      return {
        ...response.result,
        role: response.result.role
          ? UserMapper.userRoleToEntity(response.result.role)
          : null,
        createdAt: parseDateTime(response.result.createdAt),
        updatedAt: response.result.updatedAt
          ? parseDateTime(response.result.updatedAt)
          : null,
      };
    } catch (error) {
      throw new Error("Failed to get current user");
    }
  }

  // 초기 정보 등록
  async setUserInfo(userData: {
    name: string;
    phoneNumber: string;
    organizationId: number;
    role: string;
    profileImageUrl: string;
    address: string;
  }): Promise<User> {
    try {
      const response = await userApi.setUserInfo(userData);
      return {
        ...response.result,
        role: response.result.role
          ? UserMapper.userRoleToEntity(response.result.role)
          : null,
        createdAt: parseDateTime(response.result.createdAt),
        updatedAt: response.result.updatedAt
          ? parseDateTime(response.result.updatedAt)
          : null,
      };
    } catch (error) {
      throw new Error("초기 정보 등록에 실패했습니다.");
    }
  }

  /**
   * 토큰 갱신
   *
   * 갱신 실패 시 다시 로그인해야 함
   */
  async refreshToken(): Promise<boolean> {
    try {
      return await userApi.refreshToken();
    } catch (error) {
      // 토큰 갱신 실패 시 로그아웃 처리
      console.error(error);
      return false;
    }
  }

  // 기관코드 검증
  async verifyOrganizationCode(userInputCode: string): Promise<{
    phoneNumber: string;
    organizationId: number;
    organizationName: string;
    role: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
  }> {
    try {
      return await userApi.verifyOrganizationCode({ userInputCode });
    } catch (error) {
      throw new Error("기관코드 검증에 실패했습니다.");
    }
  }

  /**
   * 사용자 목록 조회 (관리자 전용)
   */
  async getUsers(role?: UserRole): Promise<User[]> {
    try {
      const params = role ? { role } : {};
      const response = await userApi.getUsers(params);

      // TODO: needsAdditionalInfo가 true인 사용자는 아직 최종 가입이 완료되지 않아 없는 것처럼 간주
      const filteredUsers = response.data.filter(
        (user) => !user.needsAdditionalInfo
      );

      return response.data.map((data) => {
        return {
          ...data,
          createdAt: parseDateTime(data.createdAt),
          updatedAt: data.updatedAt ? parseDateTime(data.updatedAt) : null,
          role: data.role ? UserMapper.userRoleToEntity(data.role) : null,
        };
      });
    } catch (error) {
      // API가 없는 경우 목업 데이터 반환
      console.warn("Users API not available, using mock data");

      const mockUsers: any[] = [
        // Assuming UserResponseDto is not directly imported here, so using 'any' for now
        {
          id: "nurse-1",
          name: "김간호사",
          email: "nurse1@example.com",
          role: "nurse",
          created_at: new Date("2024-01-01").toISOString(),
          updated_at: new Date("2024-01-20").toISOString(),
          department: "간호부",
        },
        {
          id: "nurse-2",
          name: "이간호사",
          email: "nurse2@example.com",
          role: "nurse",
          created_at: new Date("2024-01-05").toISOString(),
          updated_at: new Date("2024-01-18").toISOString(),
          department: "간호부",
        },
        {
          id: "guardian-1",
          name: "고보호자",
          email: "guardian1@example.com",
          role: "guardian",
          created_at: new Date("2024-01-01").toISOString(),
          updated_at: new Date("2024-01-20").toISOString(),
          department: "보호자",
        },
        {
          id: "guardian-2",
          name: "박보호자",
          email: "guardian2@example.com",
          role: "guardian",
          created_at: new Date("2024-01-05").toISOString(),
          updated_at: new Date("2024-01-18").toISOString(),
          department: "보호자",
        },
        {
          id: "admin-1",
          name: "박관리자",
          email: "admin1@example.com",
          role: "admin",
          created_at: new Date("2024-01-01").toISOString(),
          updated_at: new Date("2024-01-19").toISOString(),
          department: "관리부",
        },
      ];

      const filteredUsers = role
        ? mockUsers.filter((user) => user.role === role)
        : mockUsers;

      return filteredUsers.map((user) => {
        return {
          ...user,
          role: UserMapper.userRoleToEntity(user.role),
        };
      });
    }
  }

  /**
   * 사용자 삭제 (관리자 전용)
   *
   * TODO: 관리자 모드에서 필요한 지 검토 후 필요 없으면 삭제
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await userApi.deleteUser(userId);
    } catch (error) {
      throw new Error("Failed to delete user");
    }
  }
}
