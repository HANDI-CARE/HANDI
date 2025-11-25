import { create } from "zustand";

export interface DeepLinkData {
  path: string;
}

interface DeepLinkState {
  // 현재 딥링크 데이터
  currentDeepLink: DeepLinkData | null;

  // 액션들
  setDeepLink: (deepLink: DeepLinkData) => void;
  clearDeepLink: () => void;
}

export const useDeepLinkStore = create<DeepLinkState>((set, get) => ({
  currentDeepLink: null,

  setDeepLink: (deepLink: DeepLinkData) => {
    set({ currentDeepLink: deepLink });
  },

  clearDeepLink: () => {
    set({ currentDeepLink: null });
  },
}));
