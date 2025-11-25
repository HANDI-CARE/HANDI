export interface PrescriptionItem {
  id: number;
  seniorId: number;
  seniorName: string;
  medicationName: string;
  startDate: Date;
  endDate: Date;
  description: {
    drug_candidates: any[];
  };
  medicationTimes: string[];
  createdAt: Date;
  updatedAt: Date;
}
