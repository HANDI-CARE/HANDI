import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { httpClient } from "~/shared/infrastructure/api/httpClient";
import type { AdminUser } from "../../domain/Admin";
import type { Organization } from "../../domain/Organization";
import type { Senior } from "../../domain/Senior";
import type {
  CreateAdminUserRequestDto,
  PageInfoDto,
  SendOrganizationCodeRequestDto,
  UpdateAdminUserRequestDto,
  UpdateOrganizationRequestDto,
} from "../../infrastructure/dto/AdminDto";
import { AdminService } from "../services/AdminService";

const adminService = AdminService.getInstance();

// Admin Users
export const useAdminUser = (id: number) => {
  return useQuery<AdminUser>({
    queryKey: ["adminUser", id],
    queryFn: () => adminService.getUser(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: UpdateAdminUserRequestDto;
    }) => adminService.updateUser(id, body),
    onSuccess: (data) => {
      qc.setQueryData(["adminUser", data.id], data);
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
};

export const useDeleteAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
};

export const useRestoreAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.restoreUser(id),
    onSuccess: (data) => {
      qc.setQueryData(["adminUser", data.id], data);
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
};

export const useAdminUsers = (params: {
  page: number;
  size: number;
  sort: string | string[];
  keyword?: string;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  includeDeleted?: boolean;
  role?: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
}) => {
  return useQuery<{ users: AdminUser[]; pageInfo: PageInfoDto }>({
    queryKey: ["adminUsers", params],
    queryFn: () => adminService.listUsers(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAdminUserRequestDto) =>
      adminService.createUser(body),
    onSuccess: (created) => {
      // 모든 adminUsers 캐시 리스트에 선행 추가
      qc.setQueriesData<{ users: AdminUser[]; pageInfo: PageInfoDto }>(
        { queryKey: ["adminUsers"] },
        (old) => {
          if (!old) return old as any;
          const deduped = [created, ...old.users].reduce<AdminUser[]>(
            (acc, u) => {
              if (!acc.find((x) => x.id === u.id)) acc.push(u);
              return acc;
            },
            []
          );
          return {
            users: deduped,
            pageInfo: {
              ...old.pageInfo,
              totalElements:
                (old.pageInfo?.totalElements ?? old.users.length) +
                (old.users.find((u) => u.id === created.id) ? 0 : 1),
            },
          } as { users: AdminUser[]; pageInfo: PageInfoDto };
        }
      );
      // 서버 최신화
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
};

export const useSendOrganizationCode = () => {
  return useMutation({
    mutationFn: async (body: SendOrganizationCodeRequestDto) => {
      await httpClient.get("/mock-oauth?email=admin@test.com");
      return adminService.sendOrganizationCode(body);
    },
  });
};

// Seniors
export const useSenior = (seniorId: number) => {
  return useQuery<Senior>({
    queryKey: ["senior", seniorId],
    queryFn: () => adminService.getSenior(seniorId),
    enabled: !!seniorId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateSenior = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      seniorId,
      body,
    }: {
      seniorId: number;
      body: {
        name?: string;
        dischargeDate: string | null;
        note: string | null;
        isActive?: boolean;
      };
    }) => adminService.updateSenior(seniorId, body),
    onSuccess: (data) => {
      qc.setQueryData(["senior", data.id], data);
      qc.invalidateQueries({ queryKey: ["organizationSeniors"] });
    },
  });
};

export const useDeleteSenior = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seniorId: number) => adminService.deleteSenior(seniorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizationSeniors"] });
    },
  });
};

export const useCreateSenior = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      birthDate: string;
      gender: "FEMALE" | "MALE";
      name: string;
      organizationId: number;
      admissionDate: string | null;
      note: string | null;
    }) => adminService.createSenior(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizationSeniors"] });
    },
  });
};

export const useSearchSeniors = (params: {
  organizationId: number;
  name?: string;
  isActive?: boolean;
  page: number;
  size: number;
  sort: string | string[];
}) => {
  return useQuery<{ seniors: Senior[]; pageInfo: PageInfoDto }>({
    queryKey: ["seniorSearch", params],
    queryFn: () => adminService.searchSeniors(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

// Organizations
export const useOrganization = (id?: number) => {
  return useQuery<Organization>({
    queryKey: ["organization", id ?? "info"],
    queryFn: () => adminService.getOrganization(id),
    enabled: true,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateOrganization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: UpdateOrganizationRequestDto;
    }) => adminService.updateOrganization(id, body),
    onSuccess: (data) => {
      qc.setQueryData(["organization", data.id], data);
      qc.invalidateQueries({ queryKey: ["organizationUsers"] });
      qc.invalidateQueries({ queryKey: ["organizationSeniors"] });
    },
  });
};

export const useOrganizationUsers = (params: {
  page: number;
  size: number;
  sort: string | string[];
  keyword?: string;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  includeDeleted?: boolean;
  role?: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
}) => {
  return useQuery<{ users: AdminUser[]; pageInfo: PageInfoDto }>({
    queryKey: ["organizationUsers", params],
    queryFn: () => adminService.getOrganizationUsers(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useOrganizationSeniors = (params: {
  page: number;
  size: number;
  sort: string | string[];
  keyword?: string;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}) => {
  return useQuery<{ seniors: Senior[]; pageInfo: PageInfoDto }>({
    queryKey: ["organizationSeniors", params],
    queryFn: () => adminService.getOrganizationSeniors(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

// Senior Relations
export const useAddSeniorGuardianRelations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      seniorId,
      guardianIds,
    }: {
      seniorId: number;
      guardianIds: number[];
    }) => adminService.addSeniorGuardianRelations(seniorId, { guardianIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizationSeniors"] });
      qc.invalidateQueries({ queryKey: ["senior"] });
    },
  });
};

export const useAddSeniorEmployeeRelations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      seniorId,
      employeeIds,
    }: {
      seniorId: number;
      employeeIds: number[];
    }) => adminService.addSeniorEmployeeRelations(seniorId, { employeeIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizationSeniors"] });
      qc.invalidateQueries({ queryKey: ["senior"] });
    },
  });
};

export const useDeleteSeniorUserRelation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ seniorId, userId }: { seniorId: number; userId: number }) =>
      adminService.deleteSeniorUserRelation(seniorId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizationSeniors"] });
      qc.invalidateQueries({ queryKey: ["senior"] });
    },
  });
};
