import { parseDate, parseDateTime } from "~/shared/utils/dateUtils";
import type { Senior } from "../../domain/Senior";
import type { SeniorDto } from "../../infrastructure/dto/AdminDto";

export class SeniorMapper {
  static toEntity(dto: SeniorDto): Senior {
    return {
      id: dto.id,
      organizationId: dto.organizationId,
      organizationName: dto.organizationName,
      name: dto.name,
      birthDate: parseDate(dto.birthDate),
      gender: dto.gender,
      admissionDate: dto.admissionDate ? parseDate(dto.admissionDate) : null,
      dischargeDate: dto.dischargeDate ? parseDate(dto.dischargeDate) : null,
      note: dto.note,
      isActive: dto.isActive,
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
      age: dto.age,
    };
  }

  static toEntityList(dtos: SeniorDto[]): Senior[] {
    return dtos.map((d) => this.toEntity(d));
  }
}
