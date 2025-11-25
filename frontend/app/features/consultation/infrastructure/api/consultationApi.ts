import type { ResponseDto } from "../../../../shared/infrastructure/api/dto";
import { httpClient } from "../../../../shared/infrastructure/api/httpClient";
import type {
  EmployeeScheduleResponseDto,
  GuardianScheduleResponseDto,
  RegisterEmployeeScheduleRequestDto,
  RegisterGuardianScheduleRequestDto,
} from "../dto/ConsultationDto";

export const consultationApi = {
  registerEmployeeSchedule: async (
    request: RegisterEmployeeScheduleRequestDto
  ): Promise<void> => {
    const response = await httpClient.post<ResponseDto<void>>(
      "/api/v1/meeting/redis/schedule/register/employee",
      request
    );
    return response.data.result ?? undefined;
  },

  // 간호사가 선택한 상담 일정 조회 API
  getEmployeeSchedule: async (): Promise<EmployeeScheduleResponseDto> => {
    const response = await httpClient.get<
      ResponseDto<EmployeeScheduleResponseDto>
    >("/api/v1/meeting/redis/schedule/employee");
    return response.data.result ?? { checkedTime: [] };
  },

  registerGuardianSchedule: async (
    request: RegisterGuardianScheduleRequestDto
  ): Promise<void> => {
    const response = await httpClient.post<ResponseDto<void>>(
      "/api/v1/meeting/redis/schedule/register/guardian",
      request
    );
    return response.data.result ?? undefined;
  },

  // 보호자가 선택한 상담 일정 조회 API
  getGuardianSchedule: async (
    seniorId: number
  ): Promise<GuardianScheduleResponseDto> => {
    const response = await httpClient.get<
      ResponseDto<GuardianScheduleResponseDto>
    >(`/api/v1/meeting/redis/schedule/guardian/${seniorId}`);
    return response.data.result ?? { seniorId: 0, checkedTime: [] };
  },
};
