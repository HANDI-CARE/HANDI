export interface TodayMedicationSchedule {
  id: number;
  schedulesId: number;
  medicationName: string;
  seniorId: number;
  seniorName: string;
  medicationPhotoPath: string | null;
  medicatedAt: Date | null;
  medicationDate: Date;
  medicationTime: string;
  medicationExactTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
