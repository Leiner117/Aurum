export const ROUTES = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  AUTH_CALLBACK: "/auth/callback",

  // Dashboard
  DASHBOARD: "/",
  EXPENSES: "/expenses",
  CATEGORIES: "/categories",
  BUDGETS: "/budgets",
  REPORTS: "/reports",
  RECURRING: "/recurring",
  SETTINGS: "/settings",
} as const;

export const PUBLIC_ROUTES: string[] = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.AUTH_CALLBACK,
];
