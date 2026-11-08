import { ROUTES } from "@/constants/routes.constants";

// Android notification channels — push ids must match supabase/functions/send-push/index.ts
export const NOTIFICATION_CHANNELS = {
  BUDGETS: { id: "budgets", name: "Budget alerts", description: "When a budget reaches its alert threshold or is exceeded" },
  RECURRING: { id: "recurring", name: "Recurring transactions", description: "When recurring transactions are added automatically" },
  GOALS: { id: "goals", name: "Savings goals", description: "When a savings goal is reached" },
  REMINDERS: { id: "reminders", name: "Daily reminder", description: "A daily nudge to log your transactions" },
} as const;

export const NOTIFICATION_PREFERENCE_DEFAULTS = {
  budget_alerts: true,
  recurring_generated: true,
  goal_reached: true,
} as const;

export const NOTIFICATION_PREFERENCE_OPTIONS = [
  { key: "budget_alerts", label: "Budget alerts", description: "When a budget hits its alert threshold or is exceeded" },
  { key: "recurring_generated", label: "Recurring transactions", description: "When recurring transactions are added for you" },
  { key: "goal_reached", label: "Goals reached", description: "When you complete a savings goal" },
] as const;

// Per-device storage (localStorage)
export const PUSH_TOKEN_STORAGE_KEY = "aurum-push-token";
export const PUSH_PERMISSION_ASKED_KEY = "aurum-push-permission-asked";
export const DAILY_REMINDER_STORAGE_KEY = "aurum-daily-reminder";

export const DAILY_REMINDER_ID = 1001;
export const DAILY_REMINDER_DEFAULT = { enabled: false, hour: 20, minute: 0 } as const;
export const DAILY_REMINDER_CONTENT = {
  title: "Log today's spending",
  body: "Take a minute to record today's transactions in Aurum.",
  route: ROUTES.EXPENSES,
} as const;

// Android small icon (white silhouette) in android/app/src/main/res/drawable
export const NOTIFICATION_SMALL_ICON = "ic_stat_notification";
export const NOTIFICATION_ICON_COLOR = "#f59e0b";
