export interface Hospital {
  id: number;
  seniorId: number;
  patientName: string;
  hospitalName: string | null;
  department: string;
  appointmentTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  note: string | null;
  doctorName: string | null;
}

export interface CreateHospitalRequest {
  patientName: string;
  hospital: string;
  department: string;
  doctor: string;
  dateTime: string;
  status: "위험" | "주의" | "양호";
  note: string | null;
}

export interface UpdateHospitalRequest {
  id: string;
  patientName?: string;
  hospital?: string;
  department?: string;
  doctor?: string;
  dateTime?: string;
  status?: "위험" | "주의" | "양호";
  note: string | null;
}

export interface AllSchedules {
  id: number;
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
  senior: {
    id: number;
    name: string;
    gender: "MALE" | "FEMALE";
    note: string | null;
    age: number;
  };
  meetingTime: Date;
  status: "PENDING" | "CONDUCTED" | "CANCELLED";
  title: string;
  meetingType: "withEmployee" | "withDoctor";
  content: string | null;
  classification: string | null;
  hospitalName: string | null;
  doctorName: string | null;
  startedAt: Date;
  endedAt: Date;
}

export type AllSchedulesResponse = AllSchedules[];
