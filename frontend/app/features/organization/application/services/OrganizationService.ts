import { parseDateTime } from "~/shared/utils/dateUtils";
import type { Organization } from "../../domain/Organization";
import { organizationApi } from "../../infrastructure/api/organizationApi";
import type { OrganizationDto } from "../../infrastructure/dto/OrganizationDto";

export class OrganizationService {
  private static instance: OrganizationService | null = null;

  public static getInstance(): OrganizationService {
    if (!OrganizationService.instance) {
      OrganizationService.instance = new OrganizationService();
    }
    return OrganizationService.instance;
  }

  private constructor() {}

  private mapDtoToEntity(dto: OrganizationDto): Organization {
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

  async getOrganization(id: number): Promise<Organization> {
    const dto = await organizationApi.getOrganization(id);
    return this.mapDtoToEntity(dto);
  }
}
