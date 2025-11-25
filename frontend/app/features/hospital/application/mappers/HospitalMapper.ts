import {
  formatDateTime,
  parseDateTime,
} from "../../../../shared/utils/dateUtils";
import type { AllSchedules } from "../../domain/Hospital";
import type {
  AllSchedulesDto,
  CreateMeetingResponseDto,
} from "../../infrastructure/dto/HospitalDto";

export class HospitalMapper {
  static toEntity(dto: AllSchedulesDto): AllSchedules {
    return {
      id: dto.id,
      nurse: dto.nurse,
      guardian: dto.guardian,
      senior: dto.senior,
      meetingTime: parseDateTime(dto.meetingTime),
      status: dto.status,
      title: dto.title,
      meetingType: dto.meetingType,
      content: dto.content,
      classification: dto.classification,
      hospitalName: dto.hospitalName,
      doctorName: dto.doctorName,
      startedAt: parseDateTime(dto.startedAt),
      endedAt: parseDateTime(dto.endedAt),
    };
  }

  static toDto(entity: AllSchedules): AllSchedulesDto {
    return {
      id: entity.id,
      nurse: entity.nurse,
      guardian: entity.guardian,
      senior: entity.senior,
      meetingTime: formatDateTime(entity.meetingTime),
      status: entity.status,
      title: entity.title,
      meetingType: entity.meetingType,
      content: entity.content,
      classification: entity.classification,
      hospitalName: entity.hospitalName,
      doctorName: entity.doctorName,
      startedAt: formatDateTime(entity.startedAt),
      endedAt: formatDateTime(entity.endedAt),
    };
  }

  static createMeetingResponseDtoToEntity(
    dto: CreateMeetingResponseDto
  ): AllSchedules {
    return {
      ...dto,
      meetingTime: parseDateTime(dto.meetingTime),
      startedAt: parseDateTime(dto.startedAt),
      endedAt: parseDateTime(dto.endedAt),
    };
  }
}
