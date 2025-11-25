import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { MobilePushService } from "./features/mobile-push/application/services/MobilePushService";

startTransition(() => {
  // Initialize Capacitor Push Notifications on Android (no-op on web/iOS here)
  MobilePushService.getInstance().initPushNotifications();

  hydrateRoot(
    document,
    // <StrictMode>
    <HydratedRouter />
    // </StrictMode>
  );
});
