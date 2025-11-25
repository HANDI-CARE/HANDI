/// <reference types="@capacitor/push-notifications" />
/// <reference types="@capacitor/status-bar" />
/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kykint.handi",
  appName: "Handi",
  webDir: "build/client",
  server: {
    androidScheme: "https",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["sound", "alert"],
    },
    StatusBar: {
      overlaysWebView: false,
      style: "LIGHT",
    },
  },
};

export default config;
