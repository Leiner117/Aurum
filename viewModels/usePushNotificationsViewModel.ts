"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useToast } from "@/providers/ToastProvider";
import { isNativePlatform } from "@/lib/native/platform";
import { readStorage, writeStorage } from "@/lib/native/storage";
import {
  ensureNotificationChannels,
  getPushPermission,
  registerForPush,
  requestPushPermission,
  saveDeviceToken,
} from "@/lib/native/push";
import { PUSH_PERMISSION_ASKED_KEY } from "@/constants/notifications.constants";

const routeFrom = (data: unknown): string | null => {
  const route = (data as { route?: unknown } | undefined)?.route;
  return typeof route === "string" && route.startsWith("/") ? route : null;
};

const toastTypeFor = (type: unknown): "error" | "warning" | "success" =>
  type === "budget_exceeded" ? "error" : type === "budget_warning" ? "warning" : "success";

// Mounted once inside the authenticated layout. Inert on the web.
export const usePushNotificationsViewModel = (): void => {
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isNativePlatform()) return;

    const listeners = [
      PushNotifications.addListener("registration", ({ value }) => {
        saveDeviceToken(value);
      }),
      // Android doesn't show push banners while the app is open — surface it in-app
      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        const text = [notification.title, notification.body].filter(Boolean).join(" — ");
        if (text) showToast(text, toastTypeFor(notification.data?.type));
      }),
      PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
        const route = routeFrom(notification.data);
        if (route) router.push(route);
      }),
      LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
        const route = routeFrom(notification.extra);
        if (route) router.push(route);
      }),
    ];

    const setup = async () => {
      await ensureNotificationChannels();
      let permission = await getPushPermission();

      // Ask once automatically after sign-in; later changes happen from Settings
      if (permission === "prompt" && !readStorage(PUSH_PERMISSION_ASKED_KEY, false)) {
        writeStorage(PUSH_PERMISSION_ASKED_KEY, true);
        permission = await requestPushPermission();
      }

      if (permission === "granted") registerForPush();
    };
    setup().catch(() => undefined);

    return () => {
      listeners.forEach((listener) => listener.then((handle) => handle.remove()));
    };
  }, [router, showToast]);
};
