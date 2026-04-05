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
} as const;

export const SUPABASE_FUNCTIONS = {
  GET_BUDGET_SUMMARY: "get_budget_summary",
} as const;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};
