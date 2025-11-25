import type {
  EmployeeScheduleResponse,
  GuardianScheduleResponse,
  RegisterEmployeeScheduleRequest,
  RegisterGuardianScheduleRequest,
} from "../../domain/Consultation";
import { consultationApi } from "../../infrastructure/api/consultationApi";
import { ConsultationMapper } from "../mappers/ConsultationMapper";

export class ConsultationService {
  private readonly basePath = "/api/v1/consultation-schedules";

  // 싱글톤 인스턴스
  private static instance: ConsultationService | null = null;

  // 싱글톤 인스턴스 반환
  public static getInstance(): ConsultationService {
    if (!ConsultationService.instance) {
      ConsultationService.instance = new ConsultationService();
    }
    return ConsultationService.instance;
  }

  // 생성자를 private으로 만들어 외부에서 new로 생성 불가
  private constructor() {}

  async registerEmployeeSchedule(
    request: RegisterEmployeeScheduleRequest
  ): Promise<void> {
    return await consultationApi.registerEmployeeSchedule(
      ConsultationMapper.toRegisterEmployeeScheduleRequestDto(request)
    );
  }

  // 간호사가 선택한 상담 일정 조회 메서드
  async getEmployeeSchedule(): Promise<EmployeeScheduleResponse> {
    try {
      const response = await consultationApi.getEmployeeSchedule();
      return ConsultationMapper.toEmployeeScheduleResponse(response);
    } catch (error) {
      console.warn(
        "Employee schedule API not available, returning empty array"
      );
      return { checkedTime: [] };
    }
  }

  async registerGuardianSchedule(
    request: RegisterGuardianScheduleRequest
  ): Promise<void> {
    return await consultationApi.registerGuardianSchedule(
      ConsultationMapper.toRegisterGuardianScheduleRequestDto(request)
    );
  }

  // 보호자가 선택한 상담 일정 조회 메서드
  async getGuardianSchedule(
    seniorId: number
  ): Promise<GuardianScheduleResponse> {
    try {
      const response = await consultationApi.getGuardianSchedule(seniorId);
      return ConsultationMapper.toGuardianScheduleResponse(response);
    } catch (error) {
      console.warn(
        "Guardian schedule API not available, returning empty array"
      );
      return { seniorId: 0, checkedTime: [] };
    }
  }
}
