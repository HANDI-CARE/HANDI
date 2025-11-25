import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { OffsetPaginatedWithOptionalDateRequestParams } from "~/shared/infrastructure/api/dto";
import { HospitalService } from "../services/HospitalService";

const hospitalService = HospitalService.getInstance();

/**
 * 상담 상세정보 조회
 */
export const useGetMeeting = (meetingId: number) => {
  return useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () => hospitalService.getMeeting(meetingId),
    enabled: !!meetingId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 병원 및 상담 일정 조회
 */
export const useAllSchedules = (
  searchParams: {
    meetingType: "withDoctor" | "withEmployee";
  },
  paginationParams: OffsetPaginatedWithOptionalDateRequestParams
) => {
  return useQuery({
    queryKey: ["allSchedules", searchParams, paginationParams],
    queryFn: () =>
      hospitalService.getAllSchedules(searchParams, paginationParams),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    placeholderData: keepPreviousData,
  });
};

/**
 * 상담 일정 생성 훅
 */
export const useCreateNewMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meeting: {
      employeeId: number;
      guardianId: number;
      seniorId: number;
      meetingTime: string;
      title: string;
      meetingType: "withEmployee" | "withDoctor";
      doctorName: string;
      hospitalName: string;
      classification: string;
    }) => hospitalService.createNewMeeting(meeting),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allSchedules"], exact: false });
    },
  });
};
