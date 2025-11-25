import { useMutation, useQuery } from "@tanstack/react-query";
import { DrugService } from "../services/DrugService";

const service = DrugService.getInstance();

export const useDrugSearch = (query: string, debounceMs = 300) => {
  return useQuery({
    queryKey: ["drugSearch", query],
    queryFn: () => service.searchByName(query),
    enabled: query.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    select: (items) => items,
  });
};

export const useDetectDrugByImage = () => {
  return useMutation({
    mutationFn: (file: File) => service.detectByImage(file),
  });
};
