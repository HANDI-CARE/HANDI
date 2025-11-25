import { UserRole } from "../../domain/User";

export class UserMapper {
  static userRoleToEntity(role: string): UserRole {
    switch (role) {
      case "EMPLOYEE":
        return UserRole.NURSE;
      case "GUARDIAN":
        return UserRole.GUARDIAN;
      case "ADMIN":
        return UserRole.ADMIN;
      default:
        throw new Error(`Invalid user role: ${role}`);
    }
  }

  static userRoleToDto(role: UserRole): string {
    switch (role) {
      case UserRole.NURSE:
        return "EMPLOYEE";
      case UserRole.GUARDIAN:
        return "GUARDIAN";
      case UserRole.ADMIN:
        return "ADMIN";
    }
  }
}
