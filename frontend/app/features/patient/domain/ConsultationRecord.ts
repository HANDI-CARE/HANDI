export interface ConsultationRecord {
  id: number;
  classification: string | null;
  title: string;
  content: string | null;
  createdAt: Date;
  status: ConsultationStatus;
}

export type ConsultationStatus = "PENDING" | "COMPLETED" | "CANCELED";
