export type SeniorGender = "MALE" | "FEMALE";

export interface Senior {
  id: number;
  organizationId: number;
  organizationName: string;
  name: string;
  birthDate: Date;
  gender: SeniorGender;
  admissionDate: Date | null;
  dischargeDate: Date | null;
  note: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  age: number;
}
