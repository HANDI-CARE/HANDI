export interface ConsultationDto {
  id: number;
  patientName: string;
  title: string;
  guardianName: string;
  employeeName: string;
  meetingTime: string;
}

export interface ConsultationTypeDto {
  id: string;
  patientName: string;
  topic: string;
  guardian: string;
  dateTime: string;
  status: "위험" | "주의" | "양호";
  note: string | null;
}

export interface CreateConsultationRequestDto {
  patientName: string;
  topic: string;
  guardian: string;
  dateTime: string;
  status: "위험" | "주의" | "양호";
  note: string | null;
}

export interface UpdateConsultationRequestDto {
  id: string;
  patientName?: string;
  topic?: string;
  guardian?: string;
  dateTime?: string;
  status?: "위험" | "주의" | "양호";
  note: string | null;
}

export interface RegisterEmployeeScheduleRequestDto {
  checkedTime: string[];
}

// 간호사가 선택한 상담 일정 조회 응답 DTO
export interface EmployeeScheduleResponseDto {
  checkedTime: string[];
}

export interface RegisterGuardianScheduleRequestDto {
  seniorId: number;
  checkedTime: string[];
}

// 보호자가 선택한 상담 일정 조회 응답 DTO
export interface GuardianScheduleResponseDto {
  seniorId: number;
  checkedTime: string[];
}
