import { httpClient } from "~/shared/infrastructure/api/httpClient";

export const pushApi = {
  registerTokenToServer: async (fcmToken: string): Promise<void> => {
    await httpClient.post("/api/v1/users/me/token", {
      token: fcmToken,
    });
  },
};
