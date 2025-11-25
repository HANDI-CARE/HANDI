import type { Patient } from "~/features/patient/domain/Patient";
import { parseDate, parseDateTime } from "~/shared/utils/dateUtils";
import type { GuardianSeniorResponseDto } from "../../infrastructure/dto/GuardianSeniorDto";

export class GuardianSeniorMapper {
  static toEntity(dto: GuardianSeniorResponseDto): Patient {
    return {
      ...dto,
      birthDate: parseDate(dto.birthDate),
      admissionDate: dto.admissionDate ? parseDate(dto.admissionDate) : null,
      dischargeDate: dto.dischargeDate ? parseDate(dto.dischargeDate) : null,
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
    };
  }

  static toEntityList(dtos: GuardianSeniorResponseDto[]): Patient[] {
    return dtos.map((dto) => this.toEntity(dto));
  }
}
