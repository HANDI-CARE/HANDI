import { useQuery } from "@tanstack/react-query";
import { GuardianSeniorService } from "../services/GuardianSeniorService";

const guardianSeniorService = GuardianSeniorService.getInstance();

export const useGuardianSeniors = (guardianId: number) => {
  return useQuery({
    queryKey: ["guardianSeniors", guardianId],
    queryFn: () => guardianSeniorService.getGuardianSeniors(guardianId!),
    enabled: typeof guardianId === "number",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
