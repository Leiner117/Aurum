import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNativePlatform } from "@/lib/native/platform";

export type HapticVariant = "success" | "error" | "warning" | "info";

const NOTIFICATION_BY_VARIANT: Record<Exclude<HapticVariant, "info">, NotificationType> = {
  success: NotificationType.Success,
  warning: NotificationType.Warning,
  error: NotificationType.Error,
};

// Feedback for an outcome (saved, failed, warning). No-op on the web.
export const hapticFeedback = (variant: HapticVariant): void => {
  if (!isNativePlatform()) return;
  const action = variant === "info"
    ? Haptics.impact({ style: ImpactStyle.Light })
    : Haptics.notification({ type: NOTIFICATION_BY_VARIANT[variant] });
  action.catch(() => undefined);
};

// Light tick for taps on primary controls
export const hapticTap = (): void => {
  if (!isNativePlatform()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
};
