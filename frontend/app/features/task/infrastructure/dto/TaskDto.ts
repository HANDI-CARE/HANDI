export interface TodayMedicationScheduleDto {
  id: number;
  schedulesId: number;
  medicationName: string;
  seniorId: number;
  seniorName: string;
  medicationPhotoPath: string | null;
  medicatedAt: string | null;
  medicationDate: string;
  medicationTime: string;
  medicationExactTime: string;
  createdAt: string;
  updatedAt: string;
}

export type TodayMedicationScheduleResponseDto = TodayMedicationScheduleDto[];
