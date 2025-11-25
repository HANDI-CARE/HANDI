import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskService } from "../services/TaskService";

const taskService = TaskService.getInstance();

export const useTodayMedicationSchedules = () => {
  return useQuery({
    queryKey: ["todayMedicationSchedules"],
    queryFn: () => taskService.getTodayMedicationSchedules({ page: 1, size: 99999 }),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};