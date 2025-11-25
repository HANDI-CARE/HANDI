import type {
  OffsetPaginatedRequestParams,
  OffsetPaginatedResponseDto,
} from "~/shared/infrastructure/api/dto";
import { httpClient } from "~/shared/infrastructure/api/httpClient";
import type { GuardianSeniorListResponseDto } from "../dto/GuardianSeniorDto";

export const guardianApi = {
  async getGuardianSeniors(
    guardianId: number,
    paginationParams: OffsetPaginatedRequestParams
  ): Promise<OffsetPaginatedResponseDto<GuardianSeniorListResponseDto>> {
    const response = await httpClient.get<
      OffsetPaginatedResponseDto<GuardianSeniorListResponseDto>
    >(`/api/v1/guardians/seniors/${guardianId}`, { params: paginationParams });
    return response.data;
  },
};
