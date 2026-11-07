export const SUPABASE_TABLES = {
  PROFILES: "profiles",
  CATEGORIES: "categories",
  EXPENSES: "expenses",
  BUDGETS: "budgets",
  RECURRING_EXPENSES: "recurring_expenses",
  EXCHANGE_RATES: "exchange_rates",
  ACCOUNTS: "accounts",
  GOALS: "goals",
  GOAL_CONTRIBUTIONS: "goal_contributions",
  TRANSFERS: "transfers",
  API_TOKENS: "api_tokens",
  DEVICE_TOKENS: "device_tokens",
  NOTIFICATIONS: "notifications",
  NOTIFICATION_PREFERENCES: "notification_preferences",
} as const;

export const SUPABASE_FUNCTIONS = {
  GET_BUDGET_SUMMARY: "get_budget_summary",
  GET_BUDGET_COMPLIANCE: "get_budget_compliance",
  PROCESS_MY_RECURRING: "process_my_recurring",
  REGISTER_DEVICE_TOKEN: "register_device_token",
  UNREGISTER_DEVICE_TOKEN: "unregister_device_token",
} as const;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};
