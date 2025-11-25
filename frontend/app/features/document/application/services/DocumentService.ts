import { formatDateTime, parseDateTime } from "~/shared/utils/dateUtils";
import type {
  PatientDocument,
  PatientDocumentList,
} from "../../domain/PatientDocument";
import { documentApi } from "../../infrastructure/api/documentApi";
import type { DocumentItemDto } from "../../infrastructure/dto/DocumentDto";

export class DocumentService {
  private static instance: DocumentService | null = null;

  static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  private mapDtoToDomain(dto: DocumentItemDto): PatientDocument {
    return {
      ...dto,
      uploadedAt: parseDateTime(dto.uploadedAt),
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
    };
  }

  private mapDomainToDto(entity: PatientDocument): DocumentItemDto {
    return {
      ...entity,
      uploadedAt: formatDateTime(entity.uploadedAt),
      createdAt: formatDateTime(entity.createdAt),
      updatedAt: formatDateTime(entity.updatedAt),
    };
  }

  private parseImageUrls(originalPhotoPaths: string): string[] {
    if (!originalPhotoPaths) return [];
    try {
      // 서버가 콤마 구분자 혹은 JSON 배열 문자열을 줄 수 있으므로 방어적으로 처리
      if (originalPhotoPaths.trim().startsWith("[")) {
        const arr = JSON.parse(originalPhotoPaths);
        return Array.isArray(arr) ? arr.map(String) : [];
      }
      return originalPhotoPaths
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  async uploadDocument(
    patientId: number,
    file: File
  ): Promise<PatientDocument> {
    const res = await documentApi.uploadDocument(patientId, file);
    return this.mapDtoToDomain(res.result);
  }

  async getDocuments(
    patientId: number,
    params: {
      page: number;
      size: number;
      sortBy?: "documentName" | "uploadedAt";
      sortDirection?: "ASC" | "DESC";
    }
  ): Promise<PatientDocumentList> {
    const res = await documentApi.getDocuments(patientId, params);
    return {
      data: (res.result ?? []).map((dto) => this.mapDtoToDomain(dto)),
      pageInfo: res.pageInfo,
    };
  }

  async getDocument(documentId: number): Promise<PatientDocument> {
    const res = await documentApi.getDocument(documentId);
    return this.mapDtoToDomain(res.result);
  }

  async deleteDocument(documentId: number): Promise<void> {
    await documentApi.deleteDocument(documentId);
  }
}
