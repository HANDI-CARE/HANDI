import type { OffsetPaginatedRequestParams } from "~/shared/infrastructure/api/dto";
import { httpClient } from "~/shared/infrastructure/api/httpClient";
import type {
  GetDocumentResponseDto,
  GetDocumentsResponseDto,
} from "../dto/DocumentDto";

export const documentApi = {
  async uploadDocument(
    patientId: number,
    file: File
  ): Promise<GetDocumentResponseDto> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append("word_boxes", JSON.stringify([]));

    const response = await httpClient.post<GetDocumentResponseDto>(
      `/api/v1/documents/seniors/${patientId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  async getDocuments(
    patientId: number,
    params: OffsetPaginatedRequestParams & {
      sortBy?: "documentName" | "uploadedAt";
      sortDirection?: "ASC" | "DESC";
    }
  ): Promise<GetDocumentsResponseDto> {
    const response = await httpClient.get<GetDocumentsResponseDto>(
      `/api/v1/documents/senior/${patientId}`,
      { params }
    );
    return response.data;
  },

  async getDocument(documentId: number): Promise<GetDocumentResponseDto> {
    const response = await httpClient.get<GetDocumentResponseDto>(
      `/api/v1/documents/${documentId}`
    );
    return response.data;
  },

  async deleteDocument(documentId: number): Promise<void> {
    await httpClient.delete(`/api/v1/documents/${documentId}`);
  },
};
