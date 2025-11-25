import { httpClient } from "~/shared/infrastructure/api/httpClient";
import type {
  DrugDetectResponseDto,
  DrugSearchRequestDto,
  DrugSearchResponseDto,
} from "../dto/DrugDto";

export const drugApi = {
  async searchByName(
    params: DrugSearchRequestDto
  ): Promise<DrugSearchResponseDto> {
    const response = await httpClient.post<DrugSearchResponseDto>(
      "/api/v1/ai/drug/searchByName",
      params,
      {
        timeout: 30000,
      }
    );
    return response.data;
  },

  async detectByImage(file: File): Promise<DrugDetectResponseDto> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await httpClient.post<DrugDetectResponseDto>(
      "/api/v1/ai/drug/detectByImage",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      }
    );
    return response.data;
  },
};
