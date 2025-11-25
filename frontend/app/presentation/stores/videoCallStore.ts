import type { ConnectionState } from "livekit-client";
import { create } from "zustand";

interface VideoCallState {
  token: string | null;
  connectionState: ConnectionState | null;

  setToken: (token: string) => void;
  removeToken: () => void;
  setConnectionState: (connectionState: ConnectionState) => void;
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  token: null,
  connectionState: null,
  setToken: (token: string) => set({ token }),
  removeToken: () => set({ token: null }),
  setConnectionState: (connectionState: ConnectionState) =>
    set({ connectionState }),
}));
