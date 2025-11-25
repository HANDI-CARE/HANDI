import type { OffsetPaginatedWithOptionalDateRequestParams } from "~/shared/infrastructure/api/dto";
import type {
  OffsetPaginatedResponseDto,
  ResponseDto,
} from "../../../../shared/infrastructure/api/dto";
import { httpClient } from "../../../../shared/infrastructure/api/httpClient";
import type {
  AllSchedulesDto,
  AllSchedulesResponseDto,
  CreateMeetingRequestDto,
  CreateMeetingResponseDto,
} from "../dto/HospitalDto";

export const hospitalApi = {
  /**
   * 상담 상세정보 조회
   */
  getMeeting: async (
    meetingId: number
  ): Promise<ResponseDto<AllSchedulesDto>> => {
    const response = await httpClient.get<ResponseDto<AllSchedulesDto>>(
      `/api/v1/meetings/${meetingId}`
    );
    return response.data;
  },

  /**
   * 모든 일정 목록 조회 (병원, 일반상담 pagination 및 sorting 지원)
   */
  getAllSchedules: async (
    searchParams: {
      meetingType: "withDoctor" | "withEmployee";
    },
    paginationParams: OffsetPaginatedWithOptionalDateRequestParams
  ): Promise<OffsetPaginatedResponseDto<AllSchedulesResponseDto>> => {
    const response = await httpClient.get<
      OffsetPaginatedResponseDto<AllSchedulesResponseDto>
    >("/api/v1/meetings/meeting-type", {
      params: { ...searchParams, ...paginationParams },
    });

    return response.data;
  },

  createNewMeeting: async (
    requestDto: CreateMeetingRequestDto
  ): Promise<ResponseDto<CreateMeetingResponseDto>> => {
    try {
      // 1단계: 기본 미팅 생성
      const basicMeetingData = {
        employeeId: requestDto.employeeId,
        guardianId: requestDto.guardianId,
        seniorId: requestDto.seniorId,
        meetingTime: requestDto.meetingTime,
        title: requestDto.title,
        meetingType: requestDto.meetingType, 
      };

      const createResponse = await httpClient.post<
        ResponseDto<CreateMeetingResponseDto>
      >("/api/v1/meetings", basicMeetingData);

      // 2단계: 의사 정보 업데이트 (meetingType을 withDoctor로 변경)
      if (requestDto.meetingType === "withDoctor" && createResponse.data.result) {
        const meetingId = createResponse.data.result.id;
        const doctorData = {
          classification: requestDto.classification,
          hospitalName: requestDto.hospitalName,
          doctorName: requestDto.doctorName
        };

        await httpClient.put(`/api/v1/meetings/${meetingId}/doctor`, doctorData);
      }

      return createResponse.data;
    } catch (error: any) {
      throw error;
    }
  },
};
