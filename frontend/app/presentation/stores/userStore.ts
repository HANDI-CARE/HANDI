import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserService } from "../../features/user/application/services/UserService";
import type { User, UserState } from "../../features/user/domain/User";

interface UserStore extends UserState {
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  removeUser: () => void;
  setLoading: (loading: boolean) => void;
  loadUser: () => Promise<void>;
  // 온보딩 중 임시로 저장할 값들
  setOnboardingOrganizationId: (organizationId: number) => void;
  setOnboardingOrganizationName: (organizationName: string) => void;
  setOnboardingRoleDto: (role: "EMPLOYEE" | "GUARDIAN" | "ADMIN") => void;
  onboarding?: {
    organizationId?: number;
    organizationName?: string;
    role?: "EMPLOYEE" | "GUARDIAN" | "ADMIN";
  };
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      loadUser: async () => {
        try {
          set({ isLoading: true });
          const userService = UserService.getInstance();
          const user = await userService.getCurrentUser();
          // 추가정보 입력이 안 됐으면 아직 사용자 계정 생성이 완료되지 않은 것이므로
          // 사용자 정보를 받지 않은 것으로 간주
          if (user.needsAdditionalInfo) {
            return;
          }
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error("Failed to load user:", error);
          get().removeUser();
        } finally {
          set({ isLoading: false });
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      removeUser: () => {
        set({ user: null, isAuthenticated: false });
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          // UserService를 통한 로그아웃 호출
          const userService = UserService.getInstance();
          await userService.logout();
        } catch (error) {
          console.warn("Logout service failed:", error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setOnboardingOrganizationId: (organizationId: number) => {
        set((prev) => ({
          onboarding: { ...(prev.onboarding || {}), organizationId },
        }));
      },
      setOnboardingOrganizationName: (organizationName: string) => {
        set((prev) => ({
          onboarding: { ...(prev.onboarding || {}), organizationName },
        }));
      },
      setOnboardingRoleDto: (role: "EMPLOYEE" | "GUARDIAN" | "ADMIN") => {
        set((prev) => ({ onboarding: { ...(prev.onboarding || {}), role } }));
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboarding: state.onboarding,
      }),
    }
  )
);
