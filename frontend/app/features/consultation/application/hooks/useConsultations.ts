import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  RegisterEmployeeScheduleRequest,
  RegisterGuardianScheduleRequest,
} from "../../domain/Consultation";
import { ConsultationService } from "../services/ConsultationService";

const consultationService = ConsultationService.getInstance();

// 간호사가 선택한 상담 일정 조회 hook
export const useEmployeeSchedule = () => {
  return useQuery({
    queryKey: ["employeeSchedule"],
    queryFn: async () => {
      try {
        const response = await consultationService.getEmployeeSchedule();
        return response;
      } catch (error) {
        console.warn("Employee schedule API not available");
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

export const useRegisterEmployeeSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: RegisterEmployeeScheduleRequest) =>
      consultationService.registerEmployeeSchedule(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employeeSchedule"],
        refetchType: "all",
      });
    },
  });
};

// 보호자가 선택한 상담 일정 조회 hook
// seniorId가 undefined이면 데이터를 자동으로 다시 가져오지 않음
export const useGuardianSchedule = (seniorId?: number) => {
  return useQuery({
    queryKey: ["guardianSchedule", seniorId],
    queryFn: async () => {
      try {
        const response = await consultationService.getGuardianSchedule(
          seniorId!
        );
        return response;
      } catch (error) {
        console.warn("Guardian schedule API not available");
      }
    },
    enabled: typeof seniorId === "number" && seniorId > 0,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

export const useRegisterGuardianSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: RegisterGuardianScheduleRequest) =>
      consultationService.registerGuardianSchedule(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guardianSchedule", variables.seniorId],
        refetchType: "all",
      });
    },
  });
};
