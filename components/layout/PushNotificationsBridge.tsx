"use client";

import { usePushNotificationsViewModel } from "@/viewModels/usePushNotificationsViewModel";

// Registers this device for push and routes notification taps. Renders nothing.
export const PushNotificationsBridge = () => {
  usePushNotificationsViewModel();
  return null;
};
