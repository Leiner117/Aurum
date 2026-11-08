import { LocalNotifications } from "@capacitor/local-notifications";
import { isNativePlatform } from "@/lib/native/platform";
import {
  DAILY_REMINDER_CONTENT,
  DAILY_REMINDER_ID,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_ICON_COLOR,
  NOTIFICATION_SMALL_ICON,
} from "@/constants/notifications.constants";

// Schedules (or replaces) the repeating daily reminder at hour:minute device time
export const scheduleDailyReminder = async (hour: number, minute: number): Promise<void> => {
  if (!isNativePlatform()) return;
  await cancelDailyReminder();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_REMINDER_ID,
        title: DAILY_REMINDER_CONTENT.title,
        body: DAILY_REMINDER_CONTENT.body,
        channelId: NOTIFICATION_CHANNELS.REMINDERS.id,
        smallIcon: NOTIFICATION_SMALL_ICON,
        iconColor: NOTIFICATION_ICON_COLOR,
        extra: { route: DAILY_REMINDER_CONTENT.route },
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      },
    ],
  });
};

export const cancelDailyReminder = async (): Promise<void> => {
  if (!isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
};
