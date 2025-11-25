import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  PatientDocument,
  PatientDocumentList,
} from "../../domain/PatientDocument";
import { DocumentService } from "../services/DocumentService";

const service = DocumentService.getInstance();

export const useDocuments = (
  patientId: number,
  params: {
    page: number;
    size: number;
    sortBy?: "documentName" | "uploadedAt";
    sortDirection?: "ASC" | "DESC";
  }
) => {
  return useQuery<PatientDocumentList>({
    queryKey: ["documents", patientId, params],
    queryFn: () => service.getDocuments(patientId, params),
    enabled: !!patientId,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useDocument = (documentId?: number) => {
  return useQuery<PatientDocument>({
    queryKey: ["document", documentId],
    queryFn: () => service.getDocument(documentId!),
    enabled: !!documentId,
    staleTime: 60 * 1000,
  });
};

export const useUploadDocument = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => service.uploadDocument(patientId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
    },
  });
};

export const useDeleteDocument = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => service.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
    },
  });
};
