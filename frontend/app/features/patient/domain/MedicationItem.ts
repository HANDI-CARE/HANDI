/**
 * 투약 내역 조회로 받은 데이터
 */
export interface MedicationItem {
  id: number;
  schedulesId: number;
  medicationName: string;
  seniorId: number;
  seniorName: string;
  medicationPhotoPath: string | null;
  medicatedAt: Date | null;
  medicationDate: Date;
  medicationTime: MedicationScheduleTime;
  createdAt: Date;
  updatedAt: Date;
}

export type MedicationScheduleTime =
  | "BEFORE_BREAKFAST"
  | "AFTER_BREAKFAST"
  | "BEFORE_LUNCH"
  | "AFTER_LUNCH"
  | "BEFORE_DINNER"
  | "AFTER_DINNER"
  | "BEDTIME";
