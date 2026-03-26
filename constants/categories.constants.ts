export const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "utensils", color: "#f97316" },
  { name: "Transportation", icon: "car", color: "#3b82f6" },
  { name: "Housing", icon: "home", color: "#8b5cf6" },
  { name: "Healthcare", icon: "heart-pulse", color: "#ef4444" },
  { name: "Entertainment", icon: "tv", color: "#ec4899" },
  { name: "Shopping", icon: "shopping-bag", color: "#f59e0b" },
  { name: "Education", icon: "book-open", color: "#10b981" },
  { name: "Travel", icon: "plane", color: "#06b6d4" },
  { name: "Savings", icon: "piggy-bank", color: "#22c55e" },
  { name: "Other", icon: "ellipsis", color: "#64748b" },
] as const;

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
