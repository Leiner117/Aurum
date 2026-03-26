export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food & Dining",  icon: "utensils",     color: "#f97316", type: "expense" as const },
  { name: "Transportation", icon: "car",           color: "#3b82f6", type: "expense" as const },
  { name: "Housing",        icon: "home",          color: "#8b5cf6", type: "expense" as const },
  { name: "Healthcare",     icon: "heart-pulse",   color: "#ef4444", type: "expense" as const },
  { name: "Entertainment",  icon: "tv",            color: "#ec4899", type: "expense" as const },
  { name: "Shopping",       icon: "shopping-bag",  color: "#f59e0b", type: "expense" as const },
  { name: "Education",      icon: "book-open",     color: "#10b981", type: "expense" as const },
  { name: "Travel",         icon: "plane",         color: "#06b6d4", type: "expense" as const },
  { name: "Savings",        icon: "piggy-bank",    color: "#22c55e", type: "expense" as const },
  { name: "Other",          icon: "ellipsis",      color: "#64748b", type: "expense" as const },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary",       icon: "briefcase",  color: "#22c55e", type: "income" as const },
  { name: "Freelance",    icon: "wallet",     color: "#3b82f6", type: "income" as const },
  { name: "Investments",  icon: "piggy-bank", color: "#f59e0b", type: "income" as const },
  { name: "Other Income", icon: "ellipsis",   color: "#64748b", type: "income" as const },
] as const;

/** @deprecated Use DEFAULT_EXPENSE_CATEGORIES */
export const DEFAULT_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;

export const CATEGORY_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6",
  "#ec4899", "#64748b",
] as const;

export const CATEGORY_ICONS = [
  "utensils", "car", "home", "heart-pulse", "tv",
  "shopping-bag", "book-open", "plane", "piggy-bank",
  "wallet", "briefcase", "dumbbell", "music", "coffee",
  "gift", "ellipsis",
] as const;
