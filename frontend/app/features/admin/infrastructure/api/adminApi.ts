import { httpClient } from "../../../../shared/infrastructure/api/httpClient";
import type {
  AddEmployeeRelationsRequestDto,
  AddGuardianRelationsRequestDto,
  AdminUserDto,
  ApiEnvelope,
  ApiListEnvelope,
  CreateAdminUserRequestDto,
  OrganizationDto,
  PageInfoDto,
  SendOrganizationCodeRequestDto,
  SendOrganizationCodeResponseDto,
  SeniorDto,
  SeniorSearchQueryDto,
  UpdateAdminUserRequestDto,
  UpdateOrganizationRequestDto,
} from "../dto/AdminDto";

// Base paths (organizations 경로로 통합)
const ORGS_BASE = "/api/v1/organizations";
const SENIORS_BASE = "/api/v1/seniors"; // 시니어 개별 CRUD는 유지
const REL_BASE = "/api/v1/senior-relations";

export const adminApi = {
  // Users (organizations scope)
  getUser: async (id: number): Promise<ApiEnvelope<AdminUserDto>> => {
    const res = await httpClient.get<ApiEnvelope<AdminUserDto>>(
      `${ORGS_BASE}/users/${id}`
    );
    return res.data;
  },

  updateUser: async (
    id: number,
    body: UpdateAdminUserRequestDto
  ): Promise<ApiEnvelope<AdminUserDto>> => {
    const res = await httpClient.put<ApiEnvelope<AdminUserDto>>(
      `${ORGS_BASE}/users/${id}`,
      body
    );
    return res.data;
  },

  deleteUser: async (
    id: number
  ): Promise<ApiEnvelope<Record<string, never>>> => {
    const res = await httpClient.delete<ApiEnvelope<Record<string, never>>>(
      `${ORGS_BASE}/users/${id}`
    );
    return res.data;
  },

  restoreUser: async (id: number): Promise<ApiEnvelope<AdminUserDto>> => {
    const res = await httpClient.put<ApiEnvelope<AdminUserDto>>(
      `${ORGS_BASE}/users/${id}/restore`,
      {}
    );
    return res.data;
  },

  listUsers: async (params: {
    page: number;
    size: number;
    sort: string | string[];
    keyword?: string;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
    includeDeleted?: boolean;
    role?: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
  }): Promise<ApiListEnvelope<AdminUserDto>> => {
    const { sort, ...rest } = params;
    // 일부 백엔드가 배열 쿼리 인코딩을 허용하지 않으므로 sort는 sortBy/sortDirection만 사용
    // keyword 호환성 확보(q, search 동시 전송)
    const keywordCompat: any = rest.keyword
      ? { keyword: rest.keyword, search: rest.keyword, q: rest.keyword }
      : {};
    const res = await httpClient.get<ApiListEnvelope<AdminUserDto>>(
      `${ORGS_BASE}/users`,
      { params: { ...rest, ...keywordCompat } }
    );
    return res.data;
  },

  createUser: async (
    body: CreateAdminUserRequestDto
  ): Promise<ApiEnvelope<AdminUserDto>> => {
    const res = await httpClient.post<ApiEnvelope<AdminUserDto>>(
      `${ORGS_BASE}/users`,
      body
    );
    return res.data;
  },

  sendOrganizationCode: async (
    body: SendOrganizationCodeRequestDto
  ): Promise<ApiEnvelope<SendOrganizationCodeResponseDto>> => {
    const res = await httpClient.post<
      ApiEnvelope<SendOrganizationCodeResponseDto>
    >(`${ORGS_BASE}/users/code/send`, body);
    return res.data;
  },

  // Seniors
  getSenior: async (seniorId: number): Promise<ApiEnvelope<SeniorDto>> => {
    const res = await httpClient.get<ApiEnvelope<SeniorDto>>(
      `${SENIORS_BASE}/${seniorId}`
    );
    return res.data;
  },

  updateSenior: async (
    seniorId: number,
    body: Partial<SeniorDto> & {
      name?: string;
      dischargeDate: string | null;
      note: string | null;
      isActive?: boolean;
    }
  ): Promise<ApiEnvelope<SeniorDto>> => {
    const res = await httpClient.put<ApiEnvelope<SeniorDto>>(
      `${SENIORS_BASE}/${seniorId}`,
      body
    );
    return res.data;
  },

  deleteSenior: async (
    seniorId: number
  ): Promise<ApiEnvelope<Record<string, never>>> => {
    const res = await httpClient.delete<ApiEnvelope<Record<string, never>>>(
      `${SENIORS_BASE}/${seniorId}`
    );
    return res.data;
  },

  createSenior: async (body: {
    birthDate: string;
    gender: "FEMALE" | "MALE";
    name: string;
    organizationId: number;
    admissionDate: string | null;
    note: string | null;
  }): Promise<ApiEnvelope<SeniorDto>> => {
    const res = await httpClient.post<ApiEnvelope<SeniorDto>>(
      `${SENIORS_BASE}`,
      body
    );
    return res.data;
  },

  searchSeniors: async (
    params: SeniorSearchQueryDto
  ): Promise<ApiEnvelope<{ result: SeniorDto[]; pageInfo: PageInfoDto }>> => {
    const { sort, ...rest } = params as any;
    const encoded = Array.isArray(sort) ? JSON.stringify(sort) : sort;
    const res = await httpClient.get<
      ApiEnvelope<{ result: SeniorDto[]; pageInfo: PageInfoDto }>
    >(`${SENIORS_BASE}/search`, { params: { ...rest, sort: encoded } });
    return res.data;
  },

  // Organizations (info)
  getOrganization: async (): Promise<ApiEnvelope<OrganizationDto>> => {
    const res = await httpClient.get<ApiEnvelope<OrganizationDto>>(
      `${ORGS_BASE}/info`
    );
    return res.data;
  },

  updateOrganization: async (
    _id: number,
    body: UpdateOrganizationRequestDto
  ): Promise<ApiEnvelope<OrganizationDto>> => {
    const res = await httpClient.put<ApiEnvelope<OrganizationDto>>(
      `${ORGS_BASE}/info`,
      body
    );
    return res.data;
  },

  getOrganizationUsers: async (params: {
    page: number;
    size: number;
    sort: string | string[];
    keyword?: string;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
    includeDeleted?: boolean;
    role?: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
  }): Promise<ApiListEnvelope<AdminUserDto>> => {
    const { sort, ...rest } = params;
    const res = await httpClient.get<ApiListEnvelope<AdminUserDto>>(
      `${ORGS_BASE}/users`,
      { params: rest }
    );
    return res.data;
  },

  getOrganizationSeniors: async (params: {
    page: number;
    size: number;
    sort: string | string[];
    keyword?: string;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
  }): Promise<ApiListEnvelope<SeniorDto>> => {
    const { sort, ...rest } = params;
    const res = await httpClient.get<ApiListEnvelope<SeniorDto>>(
      `${ORGS_BASE}/seniors`,
      { params: rest }
    );
    return res.data;
  },

  // Senior Relations
  addSeniorGuardianRelations: async (
    seniorId: number,
    body: AddGuardianRelationsRequestDto
  ): Promise<ApiEnvelope<Record<string, never>>> => {
    const res = await httpClient.post<ApiEnvelope<Record<string, never>>>(
      `${REL_BASE}/${seniorId}/guardians`,
      body
    );
    return res.data;
  },

  addSeniorEmployeeRelations: async (
    seniorId: number,
    body: AddEmployeeRelationsRequestDto
  ): Promise<ApiEnvelope<Record<string, never>>> => {
    const res = await httpClient.post<ApiEnvelope<Record<string, never>>>(
      `${REL_BASE}/${seniorId}/employees`,
      body
    );
    return res.data;
  },

  deleteSeniorUserRelation: async (
    seniorId: number,
    userId: number
  ): Promise<ApiEnvelope<Record<string, never>>> => {
    const res = await httpClient.delete<ApiEnvelope<Record<string, never>>>(
      `${REL_BASE}/${seniorId}/user/${userId}`
    );
    return res.data;
  },
};
