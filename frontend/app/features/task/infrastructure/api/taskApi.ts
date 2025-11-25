import type { OffsetPaginatedRequestParams, OffsetPaginatedResponseDto } from "~/shared/infrastructure/api/dto";
import { httpClient } from "../../../../shared/infrastructure/api/httpClient";
import type { TodayMedicationScheduleResponseDto } from "../dto/TaskDto";

export const taskApi = {

  /**
   * 오늘 복약 일정 조회
   */
  getTodayMedicationSchedules: async (
    params: OffsetPaginatedRequestParams,
  ): Promise<OffsetPaginatedResponseDto<TodayMedicationScheduleResponseDto>> => {
    const response = await httpClient.get<OffsetPaginatedResponseDto<TodayMedicationScheduleResponseDto>>(`/api/v1/medications/today`, {
      params: {...params}
    });
    return response.data;
  },
};
