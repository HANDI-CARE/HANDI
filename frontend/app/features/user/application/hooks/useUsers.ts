import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type User } from "../../domain/User";
import { UserService } from "../services/UserService";

const userService = UserService.getInstance();

/**
 * 사용자 목록 조회 훅 (관리자 전용)
 */
export const useUsers = (role?: UserRole) => {
  return useQuery({
    queryKey: ["users", role],
    queryFn: () => userService.getUsers(role),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 현재 사용자 정보 조회 훅
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => userService.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10분
    retry: false, // 인증 실패 시 재시도하지 않음
  });
};

/**
 * 사용자 삭제 뮤테이션 훅 (관리자 전용)
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      // 사용자 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

/**
 * 로그아웃 뮤테이션 훅
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.logout(),
    onSuccess: () => {
      // 로그아웃 시 모든 쿼리 캐시 클리어
      queryClient.clear();
    },
  });
};

export const useVerifyOrganizationCodeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userInputCode: string) =>
      userService.verifyOrganizationCode(userInputCode),
    onSuccess: () => {
      // 인증 관련 캐시 무효화 (필요시 확장)
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

export const useSetUserInfoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      phoneNumber: string;
      organizationId: number;
      role: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
      profileImageUrl: string;
      address: string;
    }) => userService.setUserInfo(payload),
    onSuccess: (user: User) => {
      // 사용자 캐시 갱신
      queryClient.setQueryData(["currentUser"], user);
    },
  });
};
