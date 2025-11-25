import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { DrugSummary } from "~/features/drug/application/domain/DrugSummary";
import type { ObservationRecord } from "../../domain/ObservationRecord";
import type {
  MedicationSchedulesMinimal,
  ObservationRecords,
  PatientMemo,
  SeniorEmployeeWithObservationRecord,
} from "../../domain/Patient";
import { PatientService } from "../services/PatientService";

const patientService = PatientService.getInstance();

/**
 * 대시보드용 환자 리스트 조회 훅 (쿠키 기반 사용자 식별)
 */
export const useRecentSignificant = () => {
  return useQuery({
    queryKey: ["recentSignificant"],
    queryFn: () => patientService.getRecentSignificant(),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 대시보드용 환자 데이터 조회 훅
 */
export const usePatientDataForDashboard = (nurseId?: string) => {
  return useQuery({
    queryKey: ["patientDataForDashboard", nurseId],
    queryFn: () =>
      patientService.getPatientDataForDashboard(nurseId || "mock-nurse-id"),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 전체 환자목록 (/nurse/patients)
 */
export const usePatientsForDashboard = (nurseId?: string) => {
  return useQuery({
    queryKey: ["patientsForDashboard", nurseId],
    queryFn: () =>
      patientService.getPatientsForDashboard(nurseId || "mock-nurse-id"),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 오늘 복약 스케줄 조회 훅 (쿠키 기반 사용자 식별)
 */
export const useTodayMedicationSchedules = () => {
  return useQuery({
    queryKey: ["todayMedicationSchedules"],
    queryFn: () => patientService.getTodayMedicationSchedules(),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 오늘 복약 내역 조회 훅 (새로운 API 응답 구조)
 */
export const useTodayMedicationSchedulesNew = () => {
  return useQuery({
    queryKey: ["todayMedicationSchedulesNew"],
    queryFn: () => patientService.getTodayMedicationSchedulesNew(),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 특정 복약 스케줄 조회 훅
 */
export const useMedicationSchedule = (scheduleId: number) => {
  return useQuery({
    queryKey: ["medicationSchedule", scheduleId],
    queryFn: () => patientService.getMedicationSchedule(scheduleId),
    enabled: !!scheduleId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 특정 기간 동안의 시니어의 복약 내역 조회 훅
 */
export const useMedicationSchedulesByRange = (
  seniorId: number,
  params: { startDate?: string; endDate?: string }
) => {
  return useQuery({
    queryKey: ["medicationSchedules", "range", seniorId, params],
    queryFn: () =>
      patientService.getMedicationSchedulesByRange(seniorId, params),
    enabled: !!seniorId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 특정 투약 내역 조회 훅
 */
export const useMedication = (medicationId: number) => {
  return useQuery({
    queryKey: ["medication", medicationId],
    queryFn: () => patientService.getMedication(medicationId),
    enabled: !!medicationId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 특정 복약 스케줄의 각 투약 내역을 조회 훅
 */
export const useMedicationSchedulesByScheduleId = (scheduleId: number) => {
  return useQuery({
    queryKey: ["medicationSchedules", scheduleId],
    queryFn: () => patientService.getMedicationsByScheduleId(scheduleId),
    enabled: !!scheduleId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 특정 기간에 대해 환자의 모든 복약 내역을 조회하는 훅
 */
export const useAllMedicationsByRange = (
  seniorId: number,
  params: { page?: number; size?: number; startDate?: string; endDate?: string }
) => {
  return useQuery<Record<number, MedicationSchedulesMinimal>>({
    queryKey: ["medications", "allByRange", seniorId, params],
    queryFn: async () => {
      const schedules = await patientService.getMedicationSchedulesByRange(
        seniorId,
        params
      );
      if (!schedules || schedules.length === 0) return {};

      try {
        const obj: Record<number, MedicationSchedulesMinimal> = {};

        for (const schedule of schedules) {
          try {
            const result = await patientService.getMedicationsByScheduleId(
              schedule.id
            );
            obj[schedule.id] = result;
          } catch (e) {
            console.warn("schedule 처리 실패:", schedule.id, e);
          }
        }

        return obj;
      } catch (error) {
        console.error("Error fetching medications by range:", error);
        return {};
      }
    },
    enabled: !!seniorId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 보호자용 환자 데이터 조회 훅
 */
export const usePatientsForGuardian = (guardianId?: number) => {
  return useQuery({
    queryKey: ["patientsForGuardian", guardianId],
    queryFn: () => patientService.getPatientsForGuardian(guardianId || 1),
    enabled: true, // guardianId가 없어도 mock 데이터를 위해 실행
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 특정 환자 조회 훅
 */
export const usePatient = (patientId: number) => {
  return useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientService.getPatient(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePatientDetailAll = (patientId: number) => {
  return useQuery({
    queryKey: ["patientDetailAll", patientId],
    queryFn: () => patientService.getPatientDetailAll(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * 특정 날짜 환자 활력 징후 조회 훅
 */
export const useVitalSignsByRange = (
  patientId: number,
  startDate: Date,
  endDate: Date
) => {
  return useQuery({
    queryKey: ["vitalSigns", patientId, { startDate, endDate }],
    queryFn: () =>
      PatientService.getInstance().getPatientVitalSignsByRange(patientId, {
        startDate,
        endDate,
      }),
    enabled: !!patientId && !!startDate && !!endDate,
  });
};

/**
 * 지정 날짜의 활력 징후 조회 훅
 */
export const useVitalSignByDate = (patientId: number, date: Date) => {
  return useQuery({
    queryKey: ["vitalSignByDate", patientId, date],
    queryFn: () => patientService.getPatientVitalSign(patientId, date),
    enabled: !!patientId && !!date,
  });
};

/**
 * 지정 날짜의 활력 징후 수정 뮤테이션 훅
 */
export const useUpdateVitalSign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      date,
      data,
    }: {
      patientId: number;
      date: Date;
      data: {
        systolic: number | null;
        diastolic: number | null;
        bloodGlucose: number | null;
        temperature: number | null;
      };
    }) => patientService.updateVitalSign(patientId, date, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["vitalSignByDate", variables.patientId, variables.date],
      });
      queryClient.invalidateQueries({ queryKey: ["vitalSigns"], exact: false });
    },
  });
};

/**
 * 환자 관찰 일지 조회 훅
 */
export const usePatientObservationRecord = (recordId: number) => {
  return useQuery({
    queryKey: ["observationRecords", recordId],
    queryFn: () => patientService.getPatientObservationRecord(recordId),
    enabled: !!recordId,
    placeholderData: keepPreviousData,
  });
};

/**
 * 환자 관찰 일지 목록 조회 훅
 */
export const usePatientObservationRecords = (
  seniorId: number,
  filters: {
    page: number;
    size: number;
    startDate: Date;
    endDate: Date;
  }
) => {
  return useQuery({
    queryKey: ["observationRecords", seniorId, filters],
    queryFn: () =>
      patientService.getPatientObservationRecords(seniorId, filters),
    enabled: !!filters,
    placeholderData: keepPreviousData,
  });
};

/**
 * 환자 관찰 일지 추가 뮤테이션 훅
 */
export const useAddPatientObservationRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: number;
      data: ObservationRecord;
    }) => patientService.addPatientObservationRecord(patientId, data),
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries({
        queryKey: ["observationRecords"],
        exact: false,
      });
    },
  });
};

/**
 * 환자 관찰 일지 수정 뮤테이션 훅
 */
export const useUpdatePatientObservationRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recordId,
      data,
    }: {
      recordId: number;
      data: ObservationRecord;
    }) => patientService.updatePatientObservationRecord(recordId, data),
    onSuccess: (updatedRecord) => {
      queryClient.invalidateQueries({
        queryKey: ["observationRecords"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["recentObservationRecord"],
        exact: false,
      });
    },
  });
};

/**
 * 환자 관찰 일지 삭제 뮤테이션 훅
 */
export const useDeletePatientObservationRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId }: { recordId: number }) =>
      patientService.deletePatientObservationRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["observationRecords"],
        exact: false,
      });
    },
  });
};

/**
 * 환자 통계 조회 훅
 */
export const usePatientStats = (nurseId?: string) => {
  return useQuery({
    queryKey: ["patientStats", nurseId],
    queryFn: () => patientService.getPatientStats(nurseId),
    staleTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 간호사의 모든 환자와 관찰일지를 조회하는 훅
 */
export const useSeniorEmployeesWithObservationRecords = () => {
  return useQuery<{
    patients: SeniorEmployeeWithObservationRecord[];
    observationRecords: ObservationRecords[];
  }>({
    queryKey: ["seniorEmployeesWithObservationRecords"],
    queryFn: async () => {
      try {
        // 병렬로 환자 목록과 관찰일지를 조회
        const [patientsData, observationRecordsData] = await Promise.all([
          patientService.getSeniorEmployees(),
          patientService.getRecentObservationRecord(),
        ]);

        // 환자와 관찰일지를 매칭하여 결합
        const patientsWithObservations: SeniorEmployeeWithObservationRecord[] =
          patientsData.map((patient) => {
            const observationRecord = observationRecordsData.find(
              (record) => record.senior.id === patient.id
            );

            return {
              ...patient,
              observationRecord,
            };
          });

        return {
          patients: patientsWithObservations, // 환자 + 관찰일지 결합
          observationRecords: observationRecordsData, // 순수 관찰일지 목록
        };
      } catch (error) {
        console.warn("API not available, using mock data:", error);

        // Mock 데이터 반환
        const mockPatients: SeniorEmployeeWithObservationRecord[] = [
          {
            id: 1,
            organizationId: 1,
            organizationName: "하는대학요양원",
            name: "김할머니",
            birthDate: new Date("1930-01-01"),
            gender: "FEMALE",
            admissionDate: new Date("2020-01-01"),
            dischargeDate: new Date("2025-12-31"), // 퇴원 예정일
            note: "특별한 주의사항",
            isActive: true,
            createdAt: new Date("2020-01-01"),
            updatedAt: new Date("2024-01-01"),
            age: 95,
            observationRecord: {
              id: 1,
              senior: {
                id: 1,
                name: "김할머니",
                gender: "FEMALE",
                note: "특별한 주의사항",
                age: 95,
              },
              content: "혈당 수치가 불안정하여 주의가 필요합니다.",
              level: "HIGH",
              createdAt: new Date("2024-01-20"),
              updatedAt: new Date("2024-01-20"),
              isDeleted: false,
              nurse: {
                id: 1,
                name: "박간호사",
                email: "nurse@test.com",
                phoneNumber: "010-1234-5678",
              },
              guardian: {
                id: 1,
                name: "김아들",
                email: "son@test.com",
                phoneNumber: "010-9876-5432",
              },
              lastHospitalVisit: new Date("2024-01-15"),
            },
          },
          {
            id: 2,
            organizationId: 1,
            organizationName: "하는대학요양원",
            name: "박할아버지",
            birthDate: new Date("1935-01-01"),
            gender: "MALE",
            admissionDate: new Date("2021-01-01"),
            dischargeDate: new Date("2025-12-31"), // 퇴원 예정일
            note: "관절 통증 관리 중",
            isActive: true,
            createdAt: new Date("2021-01-01"),
            updatedAt: new Date("2024-01-01"),
            age: 90,
            observationRecord: {
              id: 2,
              senior: {
                id: 2,
                name: "박할아버지",
                gender: "MALE",
                note: "관절 통증 관리 중",
                age: 90,
              },
              content: "무릎 관절 통증 호소, 진통제 효과가 제한적입니다.",
              level: "MEDIUM",
              createdAt: new Date("2024-01-19"),
              updatedAt: new Date("2024-01-19"),
              isDeleted: false,
              nurse: {
                id: 2,
                name: "김간호사",
                email: "nurse2@test.com",
                phoneNumber: "010-2345-6789",
              },
              guardian: {
                id: 2,
                name: "박딸",
                email: "daughter@test.com",
                phoneNumber: "010-8765-4321",
              },
              lastHospitalVisit: new Date("2024-01-10"),
            },
          },
        ];

        return {
          patients: mockPatients,
          observationRecords: mockPatients.map((p) => p.observationRecord!),
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

export const useRecentObservationRecord = () => {
  return useQuery({
    queryKey: ["recentObservationRecord"],
    queryFn: () => patientService.getRecentObservationRecord(),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 간호사에게 할당된 환자들과 그들의 관계(보호자)를 조회하는 훅
 * - 간호사로 로그인된 상태로 사용해야 함
 * - 간호사의 담당 환자 목록을 먼저 조회 (getSeniorEmployees)
 * - 각 환자별로 useQueries를 통해 patientDetailAll을 병렬 조회
 * - 보호자 기준으로 시니어 목록 매핑을 생성하여 반환
 */
export const useAssignedPatientsWithRelations = () => {
  const seniorsQuery = useQuery({
    queryKey: ["seniorEmployees"],
    queryFn: () => patientService.getSeniorEmployees(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const detailQueries = useQueries({
    queries: (seniorsQuery.data || []).map((senior) => ({
      queryKey: ["patientDetailAll", senior.id],
      queryFn: () => patientService.getPatientDetailAll(senior.id),
      enabled: !!senior.id,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })),
  });

  const details = detailQueries.map((q) => q.data).filter(Boolean) as Array<
    Awaited<ReturnType<typeof patientService.getPatientDetailAll>>
  >;

  const guardianMap: Record<number, { id: number; name: string }> = {};
  const guardianToSeniors: Record<number, { id: number; name: string }[]> = {};
  const guardianToSeniorsSet: Record<number, Set<number>> = {};

  details.forEach((detail) => {
    const seniorId = detail.id;
    const seniorName = (detail as any).name as string;
    const guardianUser = detail.relatedUsers.find((u) => u.role === "GUARDIAN");
    if (guardianUser) {
      guardianMap[guardianUser.userId] = {
        id: guardianUser.userId,
        name: guardianUser.userName,
      };
      if (!guardianToSeniors[guardianUser.userId])
        guardianToSeniors[guardianUser.userId] = [];
      if (!guardianToSeniorsSet[guardianUser.userId])
        guardianToSeniorsSet[guardianUser.userId] = new Set<number>();
      if (!guardianToSeniorsSet[guardianUser.userId].has(seniorId)) {
        guardianToSeniors[guardianUser.userId].push({
          id: seniorId,
          name: seniorName,
        });
        guardianToSeniorsSet[guardianUser.userId].add(seniorId);
      }
    }
  });

  const guardianOptions = Object.values(guardianMap);

  const isLoading =
    seniorsQuery.isLoading || detailQueries.some((q) => q.isLoading);
  const isFetching =
    seniorsQuery.isFetching || detailQueries.some((q) => q.isFetching);

  return {
    seniors: seniorsQuery.data || [],
    guardianOptions,
    guardianToSeniors,
    isLoading,
    isFetching,
  };
};
/**
 * 환자 메모 조회 훅
 */
export const usePatientMemo = (patientId: number) => {
  return useQuery<PatientMemo>({
    queryKey: ["patientMemo", patientId],
    queryFn: () => patientService.getPatientMemo(patientId),
    enabled: !!patientId,
    staleTime: 60 * 1000,
  });
};

/**
 * 환자 메모 업데이트 뮤테이션 훅
 */
export const useUpdatePatientMemo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      memo,
    }: {
      patientId: number;
      memo: PatientMemo;
    }) => patientService.updatePatientMemo(patientId, memo),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["patientMemo", variables.patientId], data);
    },
  });
};

/**
 * 처방 생성 뮤테이션 훅
 */
export const useCreatePrescription = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      medicationName: string;
      startDate: string;
      endDate: string;
      description: any;
      medicationTimes: string[];
      drug_summary: DrugSummary[];
    }) => patientService.createPrescription(patientId, data),
    onSuccess: () => {
      // 오늘 복약 내역 및 관련 목록 무효화
      queryClient.invalidateQueries({
        queryKey: ["todayMedicationSchedulesNew"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["medications"],
        exact: false,
      });
    },
  });
};
