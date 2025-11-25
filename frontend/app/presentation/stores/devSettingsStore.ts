import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DevSettingsState {
  routeGuardEnabled: boolean;
  setRouteGuardEnabled: (enabled: boolean) => void;
}

export const useDevSettingsStore = create<DevSettingsState>()(
  persist(
    (set) => ({
      routeGuardEnabled: true,
      setRouteGuardEnabled: (enabled: boolean) =>
        set({ routeGuardEnabled: enabled }),
    }),
    {
      name: "dev-settings", // localStorage에 저장될 키 이름
      version: 1, // 스키마 버전 (향후 구조 변경 시 마이그레이션에 사용)
    }
  )
);
