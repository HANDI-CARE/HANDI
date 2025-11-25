import type { TodayMedicationSchedule } from "../../domain/Task";
import type { TodayMedicationScheduleDto } from "../../infrastructure/dto/TaskDto";
import { parseDateTime, formatDateTime, parseDate, formatDate, formatTime, parseTime } from "../../../../shared/utils/dateUtils";

export class TaskMapper {
  static toEntity(dto: TodayMedicationScheduleDto): TodayMedicationSchedule {
    return {
      id: dto.id,
      schedulesId: dto.schedulesId,
      medicationName: dto.medicationName,
      seniorId: dto.seniorId,
      seniorName: dto.seniorName,
      medicationPhotoPath: dto.medicationPhotoPath,
      medicatedAt: dto.medicatedAt ? parseDateTime(dto.medicatedAt) : null,
      medicationDate: parseDate(dto.medicationDate),
      medicationTime: dto.medicationTime,
      medicationExactTime: parseTime(dto.medicationExactTime),
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
    };
  }

  static toDto(entity: TodayMedicationSchedule): TodayMedicationScheduleDto {
    return {
      id: entity.id,
      schedulesId: entity.schedulesId,
      medicationName: entity.medicationName,
      seniorId: entity.seniorId,
      seniorName: entity.seniorName,
      medicationPhotoPath: entity.medicationPhotoPath,
      medicatedAt: entity.medicatedAt ? formatDateTime(entity.medicatedAt) : null,
      medicationDate: formatDate(entity.medicationDate),
      medicationTime: entity.medicationTime,
      medicationExactTime: formatTime(entity.medicationExactTime),
      createdAt: formatDateTime(entity.createdAt),
      updatedAt: formatDateTime(entity.updatedAt),
    };
  }
}