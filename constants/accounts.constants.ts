export const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings",  label: "Savings" },
  { value: "cash",     label: "Cash" },
  { value: "credit",   label: "Credit" },
] as const;

export const ACCOUNT_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#64748b",
] as const;

export const ACCOUNT_ICON_DEFAULT = "wallet";
export const ACCOUNT_COLOR_DEFAULT = "#10b981";
