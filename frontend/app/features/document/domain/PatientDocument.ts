export interface PatientDocument {
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
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientDocumentList {
  data: PatientDocument[];
  pageInfo: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    empty: boolean;
  };
}
