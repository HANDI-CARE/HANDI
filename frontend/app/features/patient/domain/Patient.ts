import type { DrugInfo } from "~/features/drug/application/domain/DrugInfo";
import type { MedicationScheduleTime } from "./MedicationItem";

// 복약 시간 분류 타입
export type MedicationTimeCategory =
  | "BEFORE_BREAKFAST"
  | "AFTER_BREAKFAST"
  | "BEFORE_LUNCH"
  | "AFTER_LUNCH"
  | "BEFORE_DINNER"
  | "AFTER_DINNER"
  | "BEDTIME";

export const timeOrder: Record<MedicationTimeCategory, number> = {
  BEFORE_BREAKFAST: 1,
  AFTER_BREAKFAST: 2,
  BEFORE_LUNCH: 3,
  AFTER_LUNCH: 4,
  BEFORE_DINNER: 5,
  AFTER_DINNER: 6,
  BEDTIME: 7,
};

// 복약 스케줄 데이터 타입
export interface MedicationSchedule {
  id: number;
  seniorId: number;
  seniorName: string;
  medicationName: string;
  startDate: string;
  endDate: string;
  description: {
    drug_candidates: DrugInfo[];
  };
  medicationInfo: string;
  // 변경: 시간 분류와 정확한 시간을 함께 저장
  medicationTimes: MedicationTimeCategory[]; // ["BEFORE_BREAKFAST", "AFTER_DINNER"]
  scheduledTimes: string[]; // ["07:30", "19:30"] - 기관별 정확한 시간
  // 추가: 복약 완료 상태
  isCompleted?: boolean;
  completedAt?: string;
}

// 오늘 복약 내역 도메인 타입 (새로 추가)
export interface TodayMedicationSchedule {
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

export interface MedicationMinimal {
  id: number;
  medicationPhotoPath: string | null;
  medicatedAt: Date | null;
  medicationTime: MedicationScheduleTime;
  medicationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 투약 스케줄에 대해 조회했을 때 각 투약 내역에 대하여 반환되는, 일부 필드만 들어있는 타입
export interface MedicationSchedulesMinimal {
  schedulesId: number;
  seniorId: number;
  seniorName: string;
  medicationName: string;
  medications: MedicationMinimal[];
}

// 환자 데이터 타입
export interface PatientData {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  lastVisit: string;
  status: "위험" | "주의" | "양호";
  note: string | null;
  medicationSchedule?: MedicationSchedule[];
}

// 병원 일정 데이터 타입
export interface HospitalScheduleData {
  id: string;
  patientName: string;
  hospital: string;
  department: string;
  dateTime: string;
}

// 상담 일정 데이터 타입
export interface ConsultationScheduleData {
  id: string;
  patientName: string;
  topic: string;
  guardian: string;
  dateTime: string;
}

export interface Patient {
  id: number;
  organizationId: number;
  organizationName: string;
  name: string;
  birthDate: Date;
  gender: "FEMALE" | "MALE";
  admissionDate: Date | null;
  dischargeDate: Date | null;
  note: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  age: number;
}

export interface ConsultationSchedule {
  id: string;
  nurseId: string;
  date: Date;
  timeSlot: string;
  isAvailable: boolean;
  patientId?: string;
  patientName?: string;
  consultationType?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 시니어(환자) 도메인
export interface Senior {
  id: number;
  name: string;
  gender: "MALE" | "FEMALE";
  note: string | null;
  age: number;
}

// 간호사 도메인
export interface Nurse {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
}

// 보호자 도메인
export interface Guardian {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
}

// 환자 리스트 도메인 (Significant)
export interface PatientList {
  significantId: number;
  senior: Senior;
  content: string | null;
  level: number;
  levelText: "위험" | "주의" | "양호";
  createdAt: string;
  lastHospitalVisit: string | null;
  nurse: Nurse;
  guardian: Guardian;
}

export interface SeniorEmployee {
  id: number;
  organizationId: number;
  organizationName: string;
  name: string;
  birthDate: Date;
  admissionDate: Date | null;
  dischargeDate: Date | null;
  gender: "MALE" | "FEMALE";
  note: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  age: number;
}

export interface ObservationRecords {
  id: number | null;
  senior: Senior;
  content: string | null;
  level: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  isDeleted: boolean | null;
  nurse: Nurse;
  guardian: Guardian;
  lastHospitalVisit: Date | null;
}

export type ObservationRecordResponse = ObservationRecords[];

export interface SeniorEmployeeWithObservationRecord extends SeniorEmployee {
  observationRecord?: ObservationRecords;
}

/**
 * 환자 메모
 */
export interface PatientMemo {
  patientId: number;
  note: string | null;
}

/**
 * 환자와 연관된 모든 사람들의 데이터 조회
 */
export interface PatientDetailAll extends Patient {
  relatedUsers: {
    userId: number;
    userName: string;
    userEmail: string;
    phoneNumber: string;
    role: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
    profileImageUrl: string | null;
    relationCreatedAt: Date;
  }[];
}
