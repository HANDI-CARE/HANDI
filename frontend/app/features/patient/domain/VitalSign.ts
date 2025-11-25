/**
 * 환자 활력 징후.
 */
export interface VitalSign {
  id: number;
  seniorId: number;
  seniorName: string;
  systolic: number | null;
  diastolic: number | null;
  bloodGlucose: number | null;
  temperature: number | null;
  height: number | null;
  weight: number | null;
  updateAt: Date;
  createdAt: Date;
  updatedAt: Date;
  measuredDate: Date;
}
