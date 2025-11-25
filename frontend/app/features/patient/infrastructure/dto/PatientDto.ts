import type { DrugInfoDto } from "~/features/drug/infrastructure/dto/DrugDto";
import type { MedicationScheduleTime } from "../../domain/MedicationItem";
import type { ObservationRecordLevel } from "../../domain/ObservationRecord";

// 복약 시간 분류 타입
export type MedicationTimeCategory =
  | "BEFORE_BREAKFAST"
  | "AFTER_BREAKFAST"
  | "BEFORE_LUNCH"
  | "AFTER_LUNCH"
  | "BEFORE_DINNER"
  | "AFTER_DINNER"
  | "BEDTIME";

// 복약 스케줄 DTO (API 응답)
export interface MedicationScheduleDto {
  id: number;
  seniorId: number;
  seniorName: string;
  medicationName: string;
  startDate: string;
  endDate: string;
  description: {
    drug_candidates: DrugInfoDto[];
  };
  medicationInfo: string;
  // 변경: 시간 분류와 정확한 시간을 함께 저장
  medicationTimes: MedicationTimeCategory[]; // ["BEFORE_BREAKFAST", "AFTER_DINNER"]
  scheduledTimes: string[]; // ["07:30", "19:30"] - 기관별 정확한 시간
  // 추가: 복약 완료 상태
  isCompleted?: boolean;
  completedAt?: string;
}

// 오늘 복약 내역 API 응답 DTO (새로 추가)
export interface TodayMedicationScheduleDto {
  schedulesId: number;
  seniorId: number;
  seniorName: string;
  medicationName: string;
  id: number;
  medicationPhotoPath: string | null;
  medicatedAt: string | null;
  medicationTime: MedicationTimeCategory; // "AFTER_BREAKFAST", "BEFORE_DINNER" 등
  scheduledTime: string; // "08:30", "18:00" 등 - 기관별 정확한 시간
  medicationDate: string; // "2025-08-06"
  isCompleted?: boolean;
  completedAt?: string;
}

// 투약 내역 DTO
export interface MedicatationDto {
  id: number;
  schedulesId: number;
  medicationName: string;
  seniorId: number;
  seniorName: string;
  medicationPhotoPath: string | null;
  medicatedAt: string | null;
  medicationDate: string;
  medicationTime: MedicationTimeCategory;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationMinimalDto {
  id: number;
  medicationPhotoPath: string | null;
  medicatedAt: string | null;
  medicationTime: MedicationScheduleTime;
  medicationDate: string;
  createdAt: string;
  updatedAt: string;
}

// 투약 스케줄에 대해 조회했을 때 각 투약 내역에 대하여 반환되는, 일부 필드만 들어있는 DTO
export interface MedicationSchedulesMinimalDto {
  schedulesId: number;
  seniorId: number;
  seniorName: string;
  medicationName: string;
  medications: MedicationMinimalDto[];
}

// API 응답용 Patient DTO
export interface PatientResponseDto {
  id: number;
  organizationId: number;
  organizationName: string;
  name: string;
  birthDate: string;
  gender: "FEMALE" | "MALE";
  admissionDate: string | null;
  dischargeDate: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  age: number;
}

export interface PatientDetailAllResponseDto extends PatientResponseDto {
  relatedUsers: {
    userId: number;
    userName: string;
    userEmail: string;
    phoneNumber: string;
    role: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
    profileImageUrl: string | null;
    relationCreatedAt: string;
  }[];
}

// 대시보드용 환자 데이터 DTO
export interface PatientDataDto {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  last_visit: string;
  status: "위험" | "주의" | "양호";
  note: string | null;
  medication_schedule?: MedicationScheduleDto[];
}

// 대시보드용 병원 일정 DTO
export interface HospitalScheduleDataDto {
  id: string;
  patient_name: string;
  hospital: string;
  department: string;
  date_time: string;
}

// 대시보드용 상담 일정 DTO
export interface ConsultationScheduleDataDto {
  id: string;
  patient_name: string;
  topic: string;
  guardian: string;
  date_time: string;
}

// 환자 생성 요청 DTO
export interface CreatePatientRequestDto {
  name: string;
  age: number;
  gender: "MALE" | "FEMALE";
  phone_number: string;
  address: string;
  nurse_id: string;
  emergency_contact?: string;
  medical_history?: string[];
  allergies?: string[];
}

// 환자 업데이트 요청 DTO
export interface UpdatePatientRequestDto {
  name?: string;
  age?: number;
  phone_number?: string;
  address?: string;
  nurse_id?: string;
  emergency_contact?: string;
  medical_history?: string[];
  allergies?: string[];
}

// 활력징후 조회 DTO
export interface VitalSignResponseDto {
  id: number;
  seniorId: number;
  seniorName: string;
  systolic: number;
  diastolic: number;
  bloodGlucose: number;
  temperature: number;
  height: number;
  weight: number;
  updateAt: string;
  createdAt: string;
  updatedAt: string;
  measuredDate: string;
}

// 특정 날짜 활력징후 조회 DTO
export type VitalSignsByRangeResponseDto = Array<{
  id: number;
  seniorId: number;
  seniorName: string;
  systolic: number;
  diastolic: number;
  bloodGlucose: number;
  temperature: number;
  height: number;
  weight: number;
  updateAt: string;
  createdAt: string;
  updatedAt: string;
  measuredDate: string;
}>;

/**
 * 관찰 일지 조회 응답 DTO
 *
 * 관찰 일지 목록 조회 응답 DTO에도 사용됨
 */
export interface GetObservationRecordResponseDto {
  id: number;
  senior: {
    id: number;
    name: string;
    gender: string;
    note: string | null;
    age: number;
  };
  content: string | null;
  level: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  nurse: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  guardian: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
}

/**
 * 관찰 일지 생성 요청 DTO
 */
export interface AddObservationRecordRequestDto {
  content: string | null;
  level: ObservationRecordLevel;
}

/**
 *  관찰 일지 생성 응답 DTO
 */
export interface AddObservationRecordResponseDto {
  id: number;
  senior: {
    id: number;
    name: string;
    gender: string;
    note: string | null;
    age: number;
  };
  content: string | null;
  level: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  nurse: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  guardian: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
}

/**
 * 관찰 일지 수정 요청 DTO
 */
export interface UpdateObservationRecordRequestDto {
  content: string | null;
  level: ObservationRecordLevel | null;
}

/**
 * 관찰 일지 수정 응답 DTO
 */
export interface UpdateObservationRecordResponseDto {
  id: number;
  content: string | null;
  level: string;
}

/**
 * 관찰 일지 삭제 응답 DTO
 */
export interface DeleteObservationRecordResponseDto {
  id: number;
  senior: {
    id: number;
    organization: {
      id: number;
      name: string;
      breakfastTime: string;
      lunchTime: string;
      dinnerTime: string;
      sleepTime: string;
    };
    name: string;
    birthDate: string;
    gender: string;
    admissionDate: string | null;
    dischargeDate: string | null;
    note: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  content: string | null;
  level: number;
  createdAt: string;
  isDeleted: boolean;
}

// 상담 일정 DTO
export interface ConsultationScheduleResponseDto {
  id: string;
  nurse_id: string;
  date: string;
  time_slot: string;
  is_available: boolean;
  patient_id?: string;
  patient_name?: string;
  consultation_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 상담 일정 생성 요청 DTO
export interface CreateConsultationScheduleRequestDto {
  nurse_id: string;
  date: string;
  time_slot: string;
  is_available: boolean;
  patient_id?: string;
  consultation_type?: string;
  notes?: string;
}

// 페이지네이션 응답 DTO
export interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 시니어(환자) DTO
export interface SeniorDto {
  id: number;
  name: string;
  gender: "MALE" | "FEMALE";
  note: string | null;
  age: number;
}

// 간호사 DTO
export interface NurseDto {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
}

// 보호자 DTO
export interface GuardianDto {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
}

// 환자 리스트 DTO (Significant)
export interface PatientListDto {
  significantId: number;
  senior: SeniorDto;
  content: string | null;
  level: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  lastHospitalVisit: string | null;
  nurse: NurseDto;
  guardian: GuardianDto;
}

export interface SeniorEmployeeResponseDto {
  id: number;
  organizationId: number;
  organizationName: string;
  name: string;
  birthDate: string;
  admissionDate: string | null;
  dischargeDate: string | null;
  gender: "MALE" | "FEMALE";
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  age: number;
}

export interface ObservationRecordsDto {
  id: number | null;
  senior: {
    id: number;
    name: string;
    gender: string;
    note: string | null;
    age: number;
  };
  content: string | null;
  level: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isDeleted: boolean | null;
  nurse: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  guardian: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  lastHospitalVisit: string | null;
}

export type ObservationRecordResponseDto = ObservationRecordsDto[];

/**
 * 환자 메모 조회 응답 DTO
 */
export interface PatientMemoResponseDto {
  seniorId: number;
  note: string | null;
}

/**
 * 환자 메모 수정 요청 DTO
 */
export interface UpdatePatientMemoRequestDto {
  note: string | null;
}

/**
 * 투약 스케줄 DTO
 */
export interface PrescriptionItemDto {
  id: number;
  seniorId: number;
  seniorName: string;
  medicationName: string;
  startDate: string;
  endDate: string;
  description: {
    drug_candidates: any[];
  };
  medicationTimes: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 특정 투약 스케줄 조회
 */
export type PrescriptionResponseDto = PrescriptionItemDto;

/**
 * 특정 날짜 투약 스케줄 조회
 */
export type PrescriptionByRangeResponseDto = PrescriptionItemDto[];

export interface AddPrescriptionRequestDto {
  medicationName: string;
  startDate: string;
  endDate: string;
  description: {
    drug_candidates: any[];
  };
  medicationTimes: string[];
  drug_summary: {
    name: string;
    capacity: string;
  }[];
}
