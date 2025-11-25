export interface AllSchedulesDto {
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
  meetingTime: string;
  status: "PENDING" | "CONDUCTED" | "CANCELLED";
  title: string;
  meetingType: "withEmployee" | "withDoctor";
  content: string | null;
  classification: string | null;
  hospitalName: string | null;
  doctorName: string | null;
  startedAt: string;
  endedAt: string;
}

export type AllSchedulesResponseDto = AllSchedulesDto[];

export interface CreateMeetingRequestDto {
  employeeId: number;
  guardianId: number;
  seniorId: number;
  meetingTime: string;
  title: string;
  meetingType: "withEmployee" | "withDoctor";
  doctorName: string;
  hospitalName: string;
  classification: string;
}

export type CreateMeetingResponseDto = AllSchedulesDto;
