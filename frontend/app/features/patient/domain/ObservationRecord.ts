export type ObservationRecordLevel = "HIGH" | "MEDIUM" | "LOW";

export interface ObservationRecord {
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
  createdAt: Date;
  updatedAt: Date;
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
