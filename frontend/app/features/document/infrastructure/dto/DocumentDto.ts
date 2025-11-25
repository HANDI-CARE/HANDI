import type { OffsetPaginatedResponseDto } from "~/shared/infrastructure/api/dto";
import type { ApiResponse } from "~/shared/infrastructure/api/httpClient";

export interface DocumentItemDto {
  documentId: number;
  senior: {
    id: number;
    name: string;
    gender: string;
    note: string | null;
    age: number;
  };
  documentName: string;
  originalPhotoPaths: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type GetDocumentResponseDto = ApiResponse<DocumentItemDto>;

export type GetDocumentsResponseDto = OffsetPaginatedResponseDto<
  DocumentItemDto[]
>;
