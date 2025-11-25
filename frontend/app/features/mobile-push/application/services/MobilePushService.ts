import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

import { App } from "@capacitor/app";
import type {
  ActionPerformed,
  Channel,
  Importance,
  PushNotificationSchema,
  Token,
} from "@capacitor/push-notifications";
import type { PushData } from "../../domain/PushData";
import { pushApi } from "../../infrastructure/api/pushApi";
import { useDeepLinkStore } from "../../stores/deepLinkStore";
import { useFcmTokenStore } from "../../stores/fcmTokenStore";

export class MobilePushService {
  // 싱글톤 인스턴스
  private static instance: MobilePushService | null = null;

  public static getInstance(): MobilePushService {
    if (!MobilePushService.instance) {
      MobilePushService.instance = new MobilePushService();
    }
    return MobilePushService.instance;
  }

  private constructor() {}

  readonly DEFAULT_CHANNEL_ID = "handi_default_channel";

  async initPushNotifications() {
    if (
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "android"
    ) {
      return; // only initialize on Android device
    }

    try {
      // Android 13+ permission flow
      let permStatus = await PushNotifications.checkPermissions();
      if (
        permStatus.receive === "prompt" ||
        permStatus.receive === "prompt-with-rationale"
      ) {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== "granted") {
        console.warn("Push permission not granted");
        return;
      }

      await this.ensureDefaultChannel();

      // Register device for FCM token
      await PushNotifications.register();

      await PushNotifications.addListener("registration", (token: Token) => {
        // if (process.env.NODE_ENV === "development") {
        console.log("FCM registration token:", token.value);
        // }

        const { setFcmToken, setTokenRegistered } = useFcmTokenStore.getState();
        setFcmToken(token.value);
        setTokenRegistered(true);

        this.registerTokenToServer(token.value);
      });

      await PushNotifications.addListener("registrationError", (err: any) => {
        // eslint-disable-next-line no-console
        console.error("Push registration error:", err.error ?? err);

        const { removeFcmToken, setTokenRegistered } =
          useFcmTokenStore.getState();
        removeFcmToken();
        setTokenRegistered(false);
      });

      // 포그라운드에서 수신되는 알림에 대한 콜백
      await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification: PushNotificationSchema) => {}
      );

      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action: ActionPerformed) => {
          // 알림 클릭 시 딥링크 처리
          if (action.actionId === "tap") {
            const payload = JSON.parse(
              action.notification.data.data
            ) as PushData;
            const { type, data } = payload || {};

            const { setDeepLink } = useDeepLinkStore.getState();

            if (type === "meeting") {
              const meetingId = data.meetingId;
              if (meetingId === undefined || meetingId === null) {
                throw new Error("Meeting ID is expected");
              }
              setDeepLink({
                path: `/video-call/${meetingId}`,
              });
            } else if (type === "medicine") {
              const seniorId = data.seniorId;
              if (seniorId === undefined || seniorId === null) {
                throw new Error("Senior ID is expected");
              }
              setDeepLink({
                path: `/nurse/patients/${seniorId}`,
              });
            }
          }
        }
      );

      // 앱이 포그라운드 상태로 전환될 때 토큰 서버에 저장
      // 가장 최근에 사용한 휴대폰의 토큰만 서버에 저장하기 위함
      await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          const { isTokenRegistered, fcmToken } = useFcmTokenStore.getState();
          if (isTokenRegistered && fcmToken) {
            this.registerTokenToServer(fcmToken);
          }
        }
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize push notifications:", error);
    }
  }

  private async registerTokenToServer(fcmToken: string): Promise<void> {
    await pushApi.registerTokenToServer(fcmToken);
  }

  private async ensureDefaultChannel(): Promise<void> {
    try {
      const channel = {
        id: this.DEFAULT_CHANNEL_ID,
        name: "General Notifications",
        description: "Handi 앱 알림",
        importance: 4 satisfies Importance, // HIGH
        visibility: 1, // PUBLIC
        lights: true,
        vibration: true,
      } satisfies Channel;
      await PushNotifications.createChannel(channel);
    } catch (error: any) {
      // Ignore if not supported or already exists
      // eslint-disable-next-line no-console
      console.debug("createChannel skipped:", error);
    }
  }
}
