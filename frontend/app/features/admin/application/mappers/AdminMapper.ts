import { parseDateTime } from "~/shared/utils/dateUtils";
import type { AdminUser } from "../../domain/Admin";
import type { AdminUserDto } from "../../infrastructure/dto/AdminDto";

export class AdminMapper {
  static toEntity(dto: AdminUserDto): AdminUser {
    return {
      id: dto.id,
      oauthUserId: dto.oauthUserId,
      organizationId: dto.organizationId,
      role: dto.role,
      name: dto.name,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      profileImageUrl: dto.profileImageUrl,
      address: dto.address,
      fcmToken: dto.fcmToken,
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
      isDeleted: dto.isDeleted,
      needsAdditionalInfo: dto.needsAdditionalInfo,
    };
  }

  static toEntityList(dtos: AdminUserDto[]): AdminUser[] {
    return dtos.map((d) => this.toEntity(d));
  }
}
