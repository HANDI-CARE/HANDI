import { parseDateTime } from "~/shared/utils/dateUtils";
import type { Organization } from "../../domain/Organization";
import type { OrganizationDto } from "../../infrastructure/dto/AdminDto";

export class OrganizationMapper {
  static toEntity(dto: OrganizationDto): Organization {
    return {
      id: dto.id,
      name: dto.name,
      breakfastTime: dto.breakfastTime,
      lunchTime: dto.lunchTime,
      dinnerTime: dto.dinnerTime,
      sleepTime: dto.sleepTime,
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
    };
  }
}
