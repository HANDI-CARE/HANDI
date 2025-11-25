import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FcmTokenState {
  fcmToken: string | null;
  isTokenRegistered: boolean;

  setFcmToken: (token: string) => void;
  removeFcmToken: () => void;
  setTokenRegistered: (registered: boolean) => void;
  clearFcmToken: () => void;
}

export const useFcmTokenStore = create<FcmTokenState>()(
  persist(
    (set) => ({
      fcmToken: null,
      isTokenRegistered: false,

      setFcmToken: (token: string) => {
        set({ fcmToken: token });
      },

      removeFcmToken: () => {
        set({ fcmToken: null });
      },

      setTokenRegistered: (registered: boolean) => {
        set({ isTokenRegistered: registered });
      },

      clearFcmToken: () => {
        set({
          fcmToken: null,
          isTokenRegistered: false,
        });
      },
    }),
    {
      name: "fcm-token-storage",
      partialize: (state) => ({
        fcmToken: state.fcmToken,
        isTokenRegistered: state.isTokenRegistered,
      }),
    }
  )
);
