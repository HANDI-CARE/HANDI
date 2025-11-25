import { httpClient } from "../../../../shared/infrastructure/api/httpClient";
import type { OrganizationDto } from "../dto/OrganizationDto";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

export const organizationApi = {
  async getOrganization(id: number): Promise<OrganizationDto> {
    const response = await httpClient.get<ApiResponse<OrganizationDto>>(
      `/api/v1/organizations/${id}`
    );
    return response.data.result;
  },
};
