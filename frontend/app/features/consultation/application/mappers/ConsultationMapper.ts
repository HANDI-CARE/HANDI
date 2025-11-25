import {
  formatDateTime,
  parseDateTime,
} from "../../../../shared/utils/dateUtils";
import type {
  EmployeeScheduleResponse,
  GuardianScheduleResponse,
  RegisterEmployeeScheduleRequest,
  RegisterGuardianScheduleRequest,
} from "../../domain/Consultation";
import type {
  EmployeeScheduleResponseDto,
  GuardianScheduleResponseDto,
  RegisterEmployeeScheduleRequestDto,
  RegisterGuardianScheduleRequestDto,
} from "../../infrastructure/dto/ConsultationDto";

export class ConsultationMapper {
  //
  // 간호사
  //

  static toRegisterEmployeeScheduleRequest(
    dto: RegisterEmployeeScheduleRequestDto
  ): RegisterEmployeeScheduleRequest {
    return {
      checkedTime: dto.checkedTime.map((time) => parseDateTime(time)),
    };
  }

  static toRegisterEmployeeScheduleRequestDto(
    entity: RegisterEmployeeScheduleRequest
  ): RegisterEmployeeScheduleRequestDto {
    return {
      checkedTime: entity.checkedTime.map((time) => formatDateTime(time)),
    };
  }

  // 간호사가 선택한 상담 일정 응답 DTO를 domain으로 변환
  static toEmployeeScheduleResponse(
    dto: EmployeeScheduleResponseDto
  ): EmployeeScheduleResponse {
    return {
      checkedTime: dto.checkedTime.map((time) => parseDateTime(time)),
    };
  }

  // 간호사가 선택한 상담 일정 domain을 DTO로 변환
  static toEmployeeScheduleResponseDto(
    entity: EmployeeScheduleResponse
  ): EmployeeScheduleResponseDto {
    return {
      checkedTime: entity.checkedTime.map((time) => formatDateTime(time)),
    };
  }

  //
  // 보호자
  //

  static toRegisterGuardianScheduleRequest(
    dto: RegisterGuardianScheduleRequestDto
  ): RegisterGuardianScheduleRequest {
    return {
      ...dto,
      checkedTime: dto.checkedTime.map((time) => parseDateTime(time)),
    };
  }

  static toRegisterGuardianScheduleRequestDto(
    entity: RegisterGuardianScheduleRequest
  ): RegisterGuardianScheduleRequestDto {
    return {
      ...entity,
      checkedTime: entity.checkedTime.map((time) => formatDateTime(time)),
    };
  }

  // 간호사가 선택한 상담 일정 응답 DTO를 domain으로 변환
  static toGuardianScheduleResponse(
    dto: GuardianScheduleResponseDto
  ): GuardianScheduleResponse {
    return {
      ...dto,
      checkedTime: dto.checkedTime.map((time) => parseDateTime(time)),
    };
  }

  // 간호사가 선택한 상담 일정 domain을 DTO로 변환
  static toGuardianScheduleResponseDto(
    entity: GuardianScheduleResponse
  ): GuardianScheduleResponseDto {
    return {
      ...entity,
      checkedTime: entity.checkedTime.map((time) => formatDateTime(time)),
    };
  }
}
