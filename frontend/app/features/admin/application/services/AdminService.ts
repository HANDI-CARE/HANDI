import type { AdminUser } from "../../domain/Admin";
import type { Organization } from "../../domain/Organization";
import type { Senior } from "../../domain/Senior";
import { adminApi } from "../../infrastructure/api/adminApi";
import type {
  AddEmployeeRelationsRequestDto,
  AddGuardianRelationsRequestDto,
  CreateAdminUserRequestDto,
  PageInfoDto,
  SendOrganizationCodeRequestDto,
  SeniorSearchQueryDto,
  UpdateAdminUserRequestDto,
  UpdateOrganizationRequestDto,
} from "../../infrastructure/dto/AdminDto";
import { AdminMapper } from "../mappers/AdminMapper";
import { OrganizationMapper } from "../mappers/OrganizationMapper";
import { SeniorMapper } from "../mappers/SeniorMapper";

export class AdminService {
  private static instance: AdminService | null = null;
  public static getInstance(): AdminService {
    if (!this.instance) this.instance = new AdminService();
    return this.instance;
  }
  private constructor() {}

  // Admin User
  async getUser(id: number): Promise<AdminUser> {
    const res = await adminApi.getUser(id);
    return AdminMapper.toEntity(res.result);
  }

  async updateUser(
    id: number,
    body: UpdateAdminUserRequestDto
  ): Promise<AdminUser> {
    const res = await adminApi.updateUser(id, body);
    return AdminMapper.toEntity(res.result);
  }

  async deleteUser(id: number): Promise<void> {
    await adminApi.deleteUser(id);
  }

  async restoreUser(id: number): Promise<AdminUser> {
    const res = await adminApi.restoreUser(id);
    return AdminMapper.toEntity(res.result);
  }

  async listUsers(params: {
    page: number;
    size: number;
    sort: string | string[];
    keyword?: string;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
    includeDeleted?: boolean;
  }): Promise<{ users: AdminUser[]; pageInfo: PageInfoDto }> {
    const res = await adminApi.listUsers(params);
    return {
      users: AdminMapper.toEntityList(res.result),
      pageInfo: res.pageInfo,
    };
  }

  async createUser(body: CreateAdminUserRequestDto): Promise<AdminUser> {
    const res = await adminApi.createUser(body);
    return AdminMapper.toEntity(res.result);
  }

  async sendOrganizationCode(body: SendOrganizationCodeRequestDto): Promise<{
    organizationId: number;
    expiresIn: number;
    expiresAt: string;
    userMessage: string;
  }> {
    const res = await adminApi.sendOrganizationCode(body);
    return res.result;
  }

  // Seniors
  async getSenior(seniorId: number): Promise<Senior> {
    const res = await adminApi.getSenior(seniorId);
    return SeniorMapper.toEntity(res.result);
  }

  async updateSenior(
    seniorId: number,
    body: {
      name?: string;
      dischargeDate: string | null;
      note: string | null;
      isActive?: boolean;
    }
  ): Promise<Senior> {
    const res = await adminApi.updateSenior(seniorId, body);
    return SeniorMapper.toEntity(res.result);
  }

  async deleteSenior(seniorId: number): Promise<void> {
    await adminApi.deleteSenior(seniorId);
  }

  async createSenior(body: {
    birthDate: string;
    gender: "FEMALE" | "MALE";
    name: string;
    organizationId: number;
    admissionDate: string | null;
    note: string | null;
  }): Promise<Senior> {
    const res = await adminApi.createSenior(body);
    return SeniorMapper.toEntity(res.result);
  }

  async searchSeniors(
    params: SeniorSearchQueryDto
  ): Promise<{ seniors: Senior[]; pageInfo: PageInfoDto }> {
    const res = await adminApi.searchSeniors(params);
    // API 스펙이 중첩된 ApiEnvelope를 반환 예시로 적혀 있으나, 실제 사용은 최상위 result 기준으로 처리
    const result = res.result as unknown as {
      result: any[];
      pageInfo: PageInfoDto;
    };
    return {
      seniors: SeniorMapper.toEntityList(result.result),
      pageInfo: result.pageInfo,
    };
  }

  // Organizations
  async getOrganization(_id?: number): Promise<Organization> {
    const res = await adminApi.getOrganization();
    return OrganizationMapper.toEntity(res.result);
  }

  async updateOrganization(
    id: number,
    body: UpdateOrganizationRequestDto
  ): Promise<Organization> {
    const res = await adminApi.updateOrganization(id, body);
    return OrganizationMapper.toEntity(res.result);
  }

  async getOrganizationUsers(params: {
    page: number;
    size: number;
    sort: string | string[];
    keyword?: string;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
    includeDeleted?: boolean;
    role?: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
  }): Promise<{ users: AdminUser[]; pageInfo: PageInfoDto }> {
    const res = await adminApi.getOrganizationUsers(params);
    return {
      users: AdminMapper.toEntityList(res.result),
      pageInfo: res.pageInfo,
    };
  }

  async getOrganizationSeniors(params: {
    page: number;
    size: number;
    sort: string | string[];
    keyword?: string;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
  }): Promise<{ seniors: Senior[]; pageInfo: PageInfoDto }> {
    const res = await adminApi.getOrganizationSeniors(params);
    return {
      seniors: SeniorMapper.toEntityList(res.result),
      pageInfo: res.pageInfo,
    };
  }

  // Senior Relations
  async addSeniorGuardianRelations(
    seniorId: number,
    body: AddGuardianRelationsRequestDto
  ): Promise<void> {
    await adminApi.addSeniorGuardianRelations(seniorId, body);
  }

  async addSeniorEmployeeRelations(
    seniorId: number,
    body: AddEmployeeRelationsRequestDto
  ): Promise<void> {
    await adminApi.addSeniorEmployeeRelations(seniorId, body);
  }

  async deleteSeniorUserRelation(
    seniorId: number,
    userId: number
  ): Promise<void> {
    await adminApi.deleteSeniorUserRelation(seniorId, userId);
  }
}
