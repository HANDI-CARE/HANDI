import type {
  OffsetPaginatedResponseDto,
  OffsetPaginatedWithOptionalDateRequestParams,
} from "~/shared/infrastructure/api/dto";
import type { AllSchedules, AllSchedulesResponse } from "../../domain/Hospital";
import { hospitalApi } from "../../infrastructure/api/hospitalApi";
import { HospitalMapper } from "../mappers/HospitalMapper";

export class HospitalService {
  private readonly basePath = "/api/v1/hospital-schedules";

  // 싱글톤 인스턴스
  private static instance: HospitalService | null = null;

  // 싱글톤 인스턴스 반환
  public static getInstance(): HospitalService {
    if (!HospitalService.instance) {
      HospitalService.instance = new HospitalService();
    }
    return HospitalService.instance;
  }

  // 생성자를 private으로 만들어 외부에서 new로 생성 불가
  private constructor() {}

  /**
   * 상담 상세정보 조회
   */
  async getMeeting(meetingId: number): Promise<AllSchedules> {
    const response = await hospitalApi.getMeeting(meetingId);
    return HospitalMapper.toEntity(response.result!);
  }

  /**
   * 모든 스케줄 조회
   */
  async getAllSchedules(
    searchParams: {
      meetingType: "withDoctor" | "withEmployee";
    },
    paginationParams: OffsetPaginatedWithOptionalDateRequestParams
  ): Promise<OffsetPaginatedResponseDto<AllSchedulesResponse>> {
    try {
      const response = await hospitalApi.getAllSchedules(
        searchParams,
        paginationParams
      );
      return {
        ...response,
        result:
          response.result?.map((dto) => HospitalMapper.toEntity(dto)) || [],
      };
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return this.getMockSchedules();
    }
  }

  async createNewMeeting(meeting: {
    employeeId: number;
    guardianId: number;
    seniorId: number;
    meetingTime: string;
    title: string;
    meetingType: "withEmployee" | "withDoctor";
    doctorName: string;
    hospitalName: string;
    classification: string;
  }): Promise<AllSchedules> {
    const response = await hospitalApi.createNewMeeting(meeting);
    try {
      return HospitalMapper.createMeetingResponseDtoToEntity(response.result!);
    } catch (error) {
      console.log("Error creating schedule", error);
      throw error;
    }
  }

  private getMockSchedules(): OffsetPaginatedResponseDto<AllSchedulesResponse> {
    // 모든 스케줄에서 동일한 nurse 정보 사용 (간호사 기준으로 모든 스케줄을 반환하므로)
    const commonNurse = {
      id: 1,
      name: "박간호사",
      email: "nurse.park@example.com",
      phoneNumber: "010-1234-5678",
    };

    const mockData: AllSchedulesResponse = [
      {
        id: 1,
        title: "병원 정기 상담",
        meetingTime: new Date("2025-08-13T09:30:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withDoctor" as const,
        content: "정기 상담입니다",
        classification: "내과",
        hospitalName: "서울대병원",
        doctorName: "김의사",
        nurse: commonNurse,
        guardian: {
          id: 1,
          name: "박보호자",
          email: "kim@example.com",
          phoneNumber: "010-1234-2678",
        },
        senior: {
          id: 1,
          name: "김환자",
          gender: "MALE" as const,
          note: "당뇨 관리중인 환자",
          age: 70,
        },
        startedAt: new Date("2025-01-01T09:30:00+09:00"),
        endedAt: new Date("2025-01-01T10:30:00+09:00"),
      },
      {
        id: 2,
        title: "심장 검사 상담",
        meetingTime: new Date("2025-08-13T10:00:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withDoctor" as const,
        content: "심장 기능 검사 결과 상담",
        classification: "심장내과",
        hospitalName: "연세대병원",
        doctorName: "이의사",
        nurse: commonNurse,
        guardian: {
          id: 2,
          name: "이보호자",
          email: "guardian.lee@example.com",
          phoneNumber: "010-2345-6789",
        },
        senior: {
          id: 2,
          name: "이할머니",
          gender: "FEMALE" as const,
          note: "고혈압 환자",
          age: 75,
        },
        startedAt: new Date("2025-01-02T10:00:00+09:00"),
        endedAt: new Date("2025-01-02T11:00:00+09:00"),
      },
      {
        id: 3,
        title: "관절 치료 상담",
        meetingTime: new Date("2025-08-13T14:30:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withEmployee" as const,
        content: "무릎 관절 통증 치료 상담",
        classification: null,
        hospitalName: null,
        doctorName: null,
        nurse: commonNurse,
        guardian: {
          id: 3,
          name: "박보호자",
          email: "guardian.park@example.com",
          phoneNumber: "010-3456-7890",
        },
        senior: {
          id: 3,
          name: "박할아버지",
          gender: "MALE" as const,
          note: "관절염 환자",
          age: 80,
        },
        startedAt: new Date("2025-01-03T14:30:00+09:00"),
        endedAt: new Date("2025-01-03T15:30:00+09:00"),
      },
      {
        id: 4,
        title: "호흡기 검사 상담",
        meetingTime: new Date("2025-08-13T10:30:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withDoctor" as const,
        content: "폐 기능 검사 및 상담",
        classification: "호흡기내과",
        hospitalName: "고려대병원",
        doctorName: "최의사",
        nurse: commonNurse,
        guardian: {
          id: 4,
          name: "최보호자",
          email: "guardian.choi@example.com",
          phoneNumber: "010-4567-8901",
        },
        senior: {
          id: 4,
          name: "최환자",
          gender: "FEMALE" as const,
          note: "천식 환자",
          age: 68,
        },
        startedAt: new Date("2025-01-04T11:00:00+09:00"),
        endedAt: new Date("2025-01-04T12:00:00+09:00"),
      },
      {
        id: 5,
        title: "소화기 검사 상담",
        meetingTime: new Date("2025-01-05T15:00:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withDoctor" as const,
        content: "위내시경 검사 결과 상담",
        classification: "소화기내과",
        hospitalName: "성균관대병원",
        doctorName: "정의사",
        nurse: commonNurse,
        guardian: {
          id: 5,
          name: "정보호자",
          email: "guardian.jung@example.com",
          phoneNumber: "010-5678-9012",
        },
        senior: {
          id: 5,
          name: "정환자",
          gender: "MALE" as const,
          note: "위염 환자",
          age: 72,
        },
        startedAt: new Date("2025-01-05T15:00:00+09:00"),
        endedAt: new Date("2025-01-05T16:00:00+09:00"),
      },
      {
        id: 6,
        title: "간호사 정기 방문",
        meetingTime: new Date("2025-01-06T09:00:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withEmployee",
        content: "정기 건강 상태 점검",
        classification: null,
        hospitalName: null,
        doctorName: null,
        nurse: commonNurse,
        guardian: {
          id: 6,
          name: "김보호자",
          email: "guardian.kim@example.com",
          phoneNumber: "010-6789-0123",
        },
        senior: {
          id: 6,
          name: "김할머니",
          gender: "FEMALE" as const,
          note: "당뇨 관리중인 환자",
          age: 78,
        },
        startedAt: new Date("2025-01-06T09:00:00+09:00"),
        endedAt: new Date("2025-01-06T10:00:00+09:00"),
      },
      {
        id: 7,
        title: "영양사 상담",
        meetingTime: new Date("2025-01-07T13:00:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withEmployee",
        content: "식단 조정 및 영양 상담",
        classification: null,
        hospitalName: null,
        doctorName: null,
        nurse: commonNurse,
        guardian: {
          id: 7,
          name: "박보호자",
          email: "guardian.park@example.com",
          phoneNumber: "010-7890-1234",
        },
        senior: {
          id: 7,
          name: "박할아버지",
          gender: "MALE" as const,
          note: "저염식 필요",
          age: 82,
        },
        startedAt: new Date("2025-01-07T13:00:00+09:00"),
        endedAt: new Date("2025-01-07T14:00:00+09:00"),
      },
      {
        id: 8,
        title: "물리치료사 상담",
        meetingTime: new Date("2025-01-08T16:00:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withEmployee",
        content: "재활 운동 프로그램 상담",
        classification: null,
        hospitalName: null,
        doctorName: null,
        nurse: commonNurse,
        guardian: {
          id: 8,
          name: "이보호자",
          email: "guardian.lee@example.com",
          phoneNumber: "010-8901-2345",
        },
        senior: {
          id: 8,
          name: "이환자",
          gender: "FEMALE" as const,
          note: "뇌졸중 후유증",
          age: 76,
        },
        startedAt: new Date("2025-01-08T16:00:00+09:00"),
        endedAt: new Date("2025-01-08T17:00:00+09:00"),
      },
      {
        id: 9,
        title: "정신건강 상담",
        meetingTime: new Date("2025-01-09T10:30:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withEmployee",
        content: "우울증 증상 상담",
        classification: null,
        hospitalName: null,
        doctorName: null,
        nurse: commonNurse,
        guardian: {
          id: 9,
          name: "최보호자",
          email: "guardian.choi@example.com",
          phoneNumber: "010-9012-3456",
        },
        senior: {
          id: 9,
          name: "최할머니",
          gender: "FEMALE" as const,
          note: "우울증 환자",
          age: 74,
        },
        startedAt: new Date("2025-01-09T10:30:00+09:00"),
        endedAt: new Date("2025-01-09T11:30:00+09:00"),
      },
      {
        id: 10,
        title: "사회복지사 상담",
        meetingTime: new Date("2025-01-10T14:00:00+09:00"),
        status: "CONDUCTED" as const,
        meetingType: "withEmployee",
        content: "복지 혜택 및 서비스 상담",
        classification: null,
        hospitalName: null,
        doctorName: null,
        nurse: commonNurse,
        guardian: {
          id: 10,
          name: "정보호자",
          email: "guardian.jung@example.com",
          phoneNumber: "010-0123-4567",
        },
        senior: {
          id: 10,
          name: "정할아버지",
          gender: "MALE" as const,
          note: "독거노인",
          age: 85,
        },
        startedAt: new Date("2025-01-10T14:00:00+09:00"),
        endedAt: new Date("2025-01-10T15:00:00+09:00"),
      },
    ];

    return {
      success: true,
      message: "목업 데이터가 성공적으로 조회되었습니다.",
      result: mockData,
      pageInfo: {
        page: 0,
        size: mockData.length,
        totalElements: mockData.length,
        totalPages: 1,
        first: true,
        last: true,
        hasNext: false,
        hasPrevious: false,
        empty: false,
      },
    };
  }
}
