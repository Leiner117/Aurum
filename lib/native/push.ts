import { PushNotifications } from "@capacitor/push-notifications";
import { App } from "@capacitor/app";
import { createClient } from "@/lib/supabase/client";
import { getPlatform, isNativePlatform } from "@/lib/native/platform";
import { readStorage, removeStorage, writeStorage } from "@/lib/native/storage";
import { SUPABASE_FUNCTIONS } from "@/constants/supabase.constants";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_ICON_COLOR,
  PUSH_TOKEN_STORAGE_KEY,
} from "@/constants/notifications.constants";
import type { DevicePlatform } from "@/types/notification.types";

export type PushPermission = "granted" | "denied" | "prompt" | "unsupported";

const IMPORTANCE_HIGH = 4;
const IMPORTANCE_DEFAULT = 3;

// Channels must exist before Android shows a notification on them (idempotent)
export const ensureNotificationChannels = async (): Promise<void> => {
  if (getPlatform() !== "android") return;
  const channels = Object.values(NOTIFICATION_CHANNELS).map((channel) => ({
    ...channel,
    importance: (channel.id === NOTIFICATION_CHANNELS.REMINDERS.id
      ? IMPORTANCE_DEFAULT
      : IMPORTANCE_HIGH) as 3 | 4,
    visibility: 0 as const,
    lightColor: NOTIFICATION_ICON_COLOR,
    vibration: true,
  }));
  // Channels are system-wide, so the local reminder can use one created here
  await Promise.all(channels.map((channel) => PushNotifications.createChannel(channel)));
};

export const getPushPermission = async (): Promise<PushPermission> => {
  if (!isNativePlatform()) return "unsupported";
  const { receive } = await PushNotifications.checkPermissions();
  return receive === "granted" ? "granted" : receive === "denied" ? "denied" : "prompt";
};

export const requestPushPermission = async (): Promise<PushPermission> => {
  if (!isNativePlatform()) return "unsupported";
  const { receive } = await PushNotifications.requestPermissions();
  return receive === "granted" ? "granted" : receive === "denied" ? "denied" : "prompt";
};

// Fire-and-forget: the token arrives through the "registration" listener.
// Without google-services.json the native call never resolves, so it is not awaited.
export const registerForPush = (): void => {
  PushNotifications.register().catch(() => undefined);
};

export const saveDeviceToken = async (token: string): Promise<void> => {
  const { version } = await App.getInfo().catch(() => ({ version: null }));
  const supabase = createClient();
  const { error } = await supabase.rpc(SUPABASE_FUNCTIONS.REGISTER_DEVICE_TOKEN, {
    p_token: token,
    p_platform: getPlatform() as DevicePlatform,
    p_app_version: version,
  });
  if (!error) writeStorage(PUSH_TOKEN_STORAGE_KEY, token);
};

// Called on sign-out so this device stops receiving the previous user's alerts
export const removeDeviceToken = async (): Promise<void> => {
  const token = readStorage<string | null>(PUSH_TOKEN_STORAGE_KEY, null);
  if (!token) return;
  const supabase = createClient();
  await supabase.rpc(SUPABASE_FUNCTIONS.UNREGISTER_DEVICE_TOKEN, { p_token: token });
  removeStorage(PUSH_TOKEN_STORAGE_KEY);
};
