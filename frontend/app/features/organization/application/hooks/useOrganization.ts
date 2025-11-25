import { useQuery } from "@tanstack/react-query";
import { OrganizationService } from "../services/OrganizationService";

const organizationService = OrganizationService.getInstance();

export const useOrganization = (id?: number) => {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: () => organizationService.getOrganization(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
