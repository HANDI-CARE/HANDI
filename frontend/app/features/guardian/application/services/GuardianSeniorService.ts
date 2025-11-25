import type { Patient } from "~/features/patient/domain/Patient";
import type { OffsetPaginated } from "~/shared/domain/pagination";
import { guardianApi } from "../../infrastructure/api/guardianApi";
import { GuardianSeniorMapper } from "../mappers/GuardianSeniorMapper";

export class GuardianSeniorService {
  private static instance: GuardianSeniorService | null = null;

  public static getInstance(): GuardianSeniorService {
    if (!GuardianSeniorService.instance) {
      GuardianSeniorService.instance = new GuardianSeniorService();
    }
    return GuardianSeniorService.instance;
  }

  private constructor() {}

  /**
   * 모든 환자 조회(페이지네이션 안 함)
   */
  async getGuardianSeniors(
    guardianId: number
  ): Promise<OffsetPaginated<Patient[]>> {
    const response = await guardianApi.getGuardianSeniors(guardianId, {
      page: 1,
      size: 99999,
    });
    return {
      pageInfo: response.pageInfo,
      data: GuardianSeniorMapper.toEntityList(response.result ?? []),
    };
  }
}
