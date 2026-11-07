export type NotificationType =
  | "budget_warning"
  | "budget_exceeded"
  | "recurring_generated"
  | "goal_reached";

export type PushStatus = "pending" | "sent" | "skipped" | "failed";

export type DevicePlatform = "android" | "ios" | "web";

export type DeviceToken = {
  id: string;
  user_id: string;
  token: string;
  platform: DevicePlatform;
  app_version: string | null;
  last_seen_at: string;
  created_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  route: string | null;
  data: Record<string, unknown>;
  push_status: PushStatus;
  push_error: string | null;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
};

export type NotificationPreferences = {
  user_id: string;
  budget_alerts: boolean;
  recurring_generated: boolean;
  goal_reached: boolean;
  updated_at: string;
};
