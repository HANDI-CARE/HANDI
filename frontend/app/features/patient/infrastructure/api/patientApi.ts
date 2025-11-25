import type { CreateDrugRequestDto } from "~/features/drug/infrastructure/dto/DrugDto";
import type {
  OffsetPaginatedRequestParams,
  OffsetPaginatedResponseDto,
  OffsetPaginatedWithOptionalDateRequestParams,
} from "~/shared/infrastructure/api/dto";
import { httpClient } from "../../../../shared/infrastructure/api/httpClient";
import type {
  AddObservationRecordRequestDto,
  AddObservationRecordResponseDto,
  ConsultationScheduleResponseDto,
  CreateConsultationScheduleRequestDto,
  DeleteObservationRecordResponseDto,
  GetObservationRecordResponseDto,
  MedicatationDto,
  MedicationScheduleDto,
  MedicationSchedulesMinimalDto,
  ObservationRecordResponseDto,
  PaginatedResponseDto,
  PatientDataDto,
  PatientDetailAllResponseDto,
  PatientListDto,
  PatientMemoResponseDto,
  PatientResponseDto,
  SeniorEmployeeResponseDto,
  TodayMedicationScheduleDto,
  UpdateObservationRecordRequestDto,
  UpdateObservationRecordResponseDto,
  UpdatePatientMemoRequestDto,
  VitalSignResponseDto,
  VitalSignsByRangeResponseDto,
} from "../dto/PatientDto";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

/**
 * 환자 관련 API 호출 함수들 (통합)
 */
export const patientApi = {
  /**
   * 처방 생성 API
   * POST /api/v1/medicationSchedules/senior/:patientId
   */
  async createPrescription(
    patientId: number,
    data: CreateDrugRequestDto
  ): Promise<void> {
    const modifiedData = {
      ...data,
      medicationTime: data.medicationTimes,
    };
    const serialized: any = JSON.stringify(modifiedData);
    await httpClient.post<void>(
      `/api/v1/medicationSchedules/senior/${patientId}`,
      { data: serialized }
    );
  },
  /**
   * 대시보드용 환자 리스트 조회 API (쿠키 기반 사용자 식별)
   * GET /api/v1/significant/recent
   */
  async getRecentSignificant(): Promise<PatientListDto[]> {
    const response = await httpClient.get<ApiResponse<PatientListDto[]>>(
      "/api/v1/significant/recent"
    );
    return response.data.result;
  },

  /**
   * 특정 투약 스케줄 조회 API
   * GET /api/v1/medicationSchedules/{id}
   */
  async getMedicationSchedule(id: number): Promise<MedicationScheduleDto> {
    const response = await httpClient.get<ApiResponse<MedicationScheduleDto>>(
      `/api/v1/medicationSchedules/${id}`
    );
    return response.data.result;
  },

  /**
   * 간호사 담당 환자들의 오늘 복약 스케줄 조회 API
   * GET /api/v1/medicationSchedules/today
   */
  async getTodayMedicationSchedules(): Promise<MedicationScheduleDto[]> {
    const response = await httpClient.get<ApiResponse<MedicationScheduleDto[]>>(
      "/api/v1/medicationSchedules/today"
    );
    return response.data.result;
  },

  /**
   * 특정 기간 동안의 시니어의 복약 스케줄 조회
   */
  async getMedicationSchedulesByRange(
    seniorId: number,
    params: OffsetPaginatedWithOptionalDateRequestParams
  ): Promise<MedicationScheduleDto[]> {
    const response = await httpClient.get<ApiResponse<MedicationScheduleDto[]>>(
      `/api/v1/medicationSchedules/seniors/${seniorId}/range`,
      { params }
    );
    return response.data.result;
  },

  /**
   * 특정 복약 스케줄에 해당하는 복약 내역 조회
   */
  async getMedicationsByScheduleId(
    scheduleId: number
  ): Promise<MedicationSchedulesMinimalDto> {
    const response = await httpClient.get<
      ApiResponse<MedicationSchedulesMinimalDto>
    >(`/api/v1/medications/schedules/${scheduleId}`);
    return response.data.result;
  },

  /**
   * 투약 내역 한 건 조회 API
   * GET /api/v1/medications/:medicationId
   */
  async getMedication(medicationId: number): Promise<MedicatationDto> {
    const response = await httpClient.get<ApiResponse<MedicatationDto>>(
      `/api/v1/medications/${medicationId}`
    );
    return response.data.result;
  },

  /**
   * 오늘 복약 내역 조회 API (새로운 응답 구조)
   * GET /api/v1/medications/today
   */
  async getTodayMedicationSchedulesNew(): Promise<
    TodayMedicationScheduleDto[]
  > {
    const response = await httpClient.get<
      ApiResponse<TodayMedicationScheduleDto[]>
    >("/api/v1/medications/today");
    return response.data.result;
  },

  /**
   * 대시보드용 환자 데이터 조회 API
   * GET /patients/dashboard
   */
  async getPatientDataForDashboard(nurseId: string): Promise<PatientDataDto[]> {
    const response = await httpClient.get<PatientDataDto[]>(
      `/patients/dashboard`,
      {
        params: { nurse_id: nurseId },
      }
    );
    return response.data;
  },

  /**
   * 보호자용 환자 데이터 조회 API
   * GET /patients/guardian
   */
  async getPatientsForGuardian(guardianId: number): Promise<PatientDataDto[]> {
    const response = await httpClient.get<PatientDataDto[]>(
      `/patients/guardian`,
      {
        params: { guardian_id: guardianId },
      }
    );
    return response.data;
  },

  /**
   * 특정 환자 조회 API
   * GET /api/v1/seniors/:seniorId
   */
  async getPatient(patientId: number): Promise<PatientResponseDto> {
    const response = await httpClient.get<ApiResponse<PatientResponseDto>>(
      `/api/v1/seniors/${patientId}`
    );
    return response.data.result;
  },

  /**
   * 특정 환자와 관련된 모든 사용자들 조회 API
   * GET /api/v1/seniors/:seniorId/detail/all
   */
  async getPatientDetailAll(
    patientId: number
  ): Promise<PatientDetailAllResponseDto> {
    const response = await httpClient.get<
      ApiResponse<PatientDetailAllResponseDto>
    >(`/api/v1/seniors/${patientId}/detail/all`);
    return response.data.result;
  },

  /**
   * 환자 통계 조회 API
   * GET /patients/stats
   */
  async getPatientStats(params?: {
    nurse_id?: string;
    period?: "week" | "month" | "year";
  }): Promise<{
    total_patients: number;
    new_patients_this_month: number;
    average_age: number;
    gender_distribution: { male: number; female: number };
    age_distribution: Array<{ age_group: string; count: number }>;
    health_status_summary: {
      good: number;
      fair: number;
      poor: number;
    };
  }> {
    const response = await httpClient.get("/patients/stats", { params });
    return response.data;
  },

  // 활력징후 조회 API
  async getVitalSign(
    patientId: number,
    params: {
      date: string;
    }
  ): Promise<VitalSignResponseDto> {
    const response = await httpClient.get<ApiResponse<VitalSignResponseDto>>(
      `/api/v1/vitals/seniors/${patientId}`,
      { params }
    );
    return response.data.result;
  },

  // 특정 날짜 활력징후 조회 API
  async getVitalSignsByRange(
    patientId: number,
    params: {
      startDate: string;
      endDate: string;
    }
  ): Promise<VitalSignsByRangeResponseDto> {
    const response = await httpClient.get<
      ApiResponse<VitalSignsByRangeResponseDto>
    >(`/api/v1/vitals/seniors/${patientId}/range`, { params });
    return response.data.result;
  },

  /**
   * 활력 징후 수정 API
   * PUT /api/v1/vitals/seniors/:patientId?date=YYYYMMDD
   */
  async updateVitalSign(
    patientId: number,
    params: { date: string },
    data: {
      systolic: number | null;
      diastolic: number | null;
      bloodGlucose: number | null;
      temperature: number | null;
    }
  ): Promise<VitalSignResponseDto> {
    const response = await httpClient.put<ApiResponse<VitalSignResponseDto>>(
      `/api/v1/vitals/seniors/${patientId}`,
      data,
      { params }
    );
    return response.data.result;
  },

  /**
   * 환자 관찰 일지 조회 API
   */
  async getPatientObservationRecord(
    patientId: number
  ): Promise<GetObservationRecordResponseDto> {
    const response = await httpClient.get<GetObservationRecordResponseDto>(
      `/api/v1/observation-records/${patientId}`
    );
    return response.data;
  },

  /**
   * 환자 관찰 일지 목록 조회 API
   */
  async getPatientObservationRecords(
    patientId: number,
    params: {
      startDate?: string;
      endDate?: string;
    },
    paginationParams: OffsetPaginatedRequestParams
  ): Promise<OffsetPaginatedResponseDto<GetObservationRecordResponseDto[]>> {
    const response = await httpClient.get<
      OffsetPaginatedResponseDto<GetObservationRecordResponseDto[]>
    >(`/api/v1/observation-records/seniors/${patientId}/range`, {
      params: { ...params, ...paginationParams },
    });
    return response.data;
  },

  /**
   * 환자 관찰 일지 생성 API
   */
  async addPatientObservationRecord(
    patientId: number,
    data: AddObservationRecordRequestDto
  ): Promise<ApiResponse<AddObservationRecordResponseDto>> {
    const response = await httpClient.post<
      ApiResponse<AddObservationRecordResponseDto>
    >(`/api/v1/observation-records/seniors/${patientId}`, data);
    return response.data;
  },

  /**
   * 환자 관찰 일지 수정 API
   */
  async updatePatientObservationRecord(
    recordId: number,
    data: UpdateObservationRecordRequestDto
  ): Promise<UpdateObservationRecordResponseDto> {
    const response = await httpClient.put<UpdateObservationRecordResponseDto>(
      `/api/v1/observation-records/${recordId}`,
      data
    );
    return response.data;
  },

  /**
   * 환자 관찰 일지 삭제 API
   */
  async deletePatientObservationRecord(
    recordId: number
  ): Promise<DeleteObservationRecordResponseDto> {
    const response =
      await httpClient.delete<DeleteObservationRecordResponseDto>(
        `/significant/${recordId}`
      );
    return response.data;
  },

  // 상담 일정 관련 API
  /**
   * 상담 일정 목록 조회 API
   * GET /consultations
   */
  async getConsultations(params?: {
    nurse_id?: string;
    patient_id?: string;
    date?: string;
    is_available?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponseDto<ConsultationScheduleResponseDto>> {
    const response = await httpClient.get<
      PaginatedResponseDto<ConsultationScheduleResponseDto>
    >("/consultations", { params });
    return response.data;
  },

  /**
   * 상담 일정 생성 API
   * POST /consultations
   */
  async createConsultation(
    consultationData: CreateConsultationScheduleRequestDto
  ): Promise<ConsultationScheduleResponseDto> {
    const response = await httpClient.post<ConsultationScheduleResponseDto>(
      "/consultations",
      consultationData
    );
    return response.data;
  },

  /**
   * 상담 일정 수정 API
   * PUT /consultations/:id
   */
  async updateConsultation(
    consultationId: string,
    consultationData: Partial<CreateConsultationScheduleRequestDto>
  ): Promise<ConsultationScheduleResponseDto> {
    const response = await httpClient.put<ConsultationScheduleResponseDto>(
      `/consultations/${consultationId}`,
      consultationData
    );
    return response.data;
  },

  /**
   * 상담 일정 삭제 API
   * DELETE /consultations/:id
   */
  async deleteConsultation(consultationId: string): Promise<void> {
    await httpClient.delete(`/consultations/${consultationId}`);
  },

  /**
   * 상담 예약 API
   * POST /consultations/:id/book
   */
  async bookConsultation(
    consultationId: string,
    bookingData: {
      patient_id: string;
      consultation_type?: string;
      notes?: string;
    }
  ): Promise<ConsultationScheduleResponseDto> {
    const response = await httpClient.post<ConsultationScheduleResponseDto>(
      `/consultations/${consultationId}/book`,
      bookingData
    );
    return response.data;
  },

  /**
   * 상담 예약 취소 API
   * POST /consultations/:id/cancel
   */
  async cancelConsultation(
    consultationId: string
  ): Promise<ConsultationScheduleResponseDto> {
    const response = await httpClient.post<ConsultationScheduleResponseDto>(
      `/consultations/${consultationId}/cancel`
    );
    return response.data;
  },

  /**
   * 간호사의 가용 시간 조회 API
   * GET /consultations/available-slots
   */
  async getAvailableSlots(params: { nurse_id: string; date: string }): Promise<
    Array<{
      time_slot: string;
      is_available: boolean;
      consultation_id?: string;
    }>
  > {
    const response = await httpClient.get("/consultations/available-slots", {
      params,
    });
    return response.data;
  },

  /**
   * 간호사 담당 환자 목록 조회 API
   * GET /api/v1/employees/seniors
   */
  async getSeniorEmployees(
    paginationParams: OffsetPaginatedRequestParams,
    searchParams?: {
      keyword?: string;
    }
  ) {
    const response = await httpClient.get<
      OffsetPaginatedResponseDto<SeniorEmployeeResponseDto[]>
    >("/api/v1/employees/seniors", {
      params: { ...searchParams, ...paginationParams },
    });
    return response.data;
  },

  /**
   * 모든 환자의 최근 관찰 기록 조회 API
   * GET /api/v1/observation-records/recent
   */
  async getRecentObservationRecord(): Promise<ObservationRecordResponseDto> {
    const response = await httpClient.get(`/api/v1/observation-records/recent`);
    return response.data.result;
  },

  /**
   * 환자 메모 조회 API
   * GET /api/v1/seniors/note/:patientId
   */
  async getPatientMemo(patientId: number): Promise<PatientMemoResponseDto> {
    const response = await httpClient.get<ApiResponse<PatientMemoResponseDto>>(
      `/api/v1/seniors/note/${patientId}`
    );
    return response.data.result;
  },

  /**
   * 환자 메모 업데이트 API
   * PUT /api/v1/seniors/note/:patientId
   */
  async updatePatientMemo(
    patientId: number,
    data: UpdatePatientMemoRequestDto
  ): Promise<PatientMemoResponseDto> {
    const response = await httpClient.put<ApiResponse<PatientMemoResponseDto>>(
      `/api/v1/seniors/note/${patientId}`,
      data
    );
    return response.data.result;
  },
};
