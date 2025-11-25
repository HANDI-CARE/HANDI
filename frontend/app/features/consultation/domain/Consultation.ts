export interface Consultation {
  id: number;
  patientName: string;
  title: string;
  guardianName: string;
  employeeName: string;
  meetingTime: string;
}

export interface CreateConsultationRequest {
  patientName: string;
  topic: string;
  guardian: string;
  dateTime: string;
  status: "위험" | "주의" | "양호";
  note: string | null;
}

export interface UpdateConsultationRequest {
  id: string;
  patientName?: string;
  topic?: string;
  guardian?: string;
  dateTime?: string;
  status?: "위험" | "주의" | "양호";
  note: string | null;
}

export interface RegisterEmployeeScheduleRequest {
  checkedTime: Date[];
}

// 간호사가 선택한 상담 일정 응답 domain
export interface EmployeeScheduleResponse {
  checkedTime: Date[];
}

export interface RegisterGuardianScheduleRequest {
  seniorId: number;
  checkedTime: Date[];
}

// 보호자가 선택한 상담 일정 응답 domain
export interface GuardianScheduleResponse {
  seniorId: number;
  checkedTime: Date[];
}
