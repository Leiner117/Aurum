// Android notification channels — ids must match supabase/functions/send-push/index.ts
export const NOTIFICATION_CHANNELS = {
  BUDGETS: { id: "budgets", name: "Budget alerts", description: "When a budget reaches its alert threshold or is exceeded" },
  RECURRING: { id: "recurring", name: "Recurring transactions", description: "When recurring transactions are added automatically" },
  GOALS: { id: "goals", name: "Savings goals", description: "When a savings goal is reached" },
} as const;

export const NOTIFICATION_PREFERENCE_DEFAULTS = {
  budget_alerts: true,
  recurring_generated: true,
  goal_reached: true,
} as const;
