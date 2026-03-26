export const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings",  label: "Savings" },
  { value: "cash",     label: "Cash" },
  { value: "credit",   label: "Credit" },
] as const;

export const ACCOUNT_COLORS = [
  "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6",
  "#ef4444", "#ec4899", "#06b6d4", "#64748b",
] as const;

export const ACCOUNT_ICON_DEFAULT = "wallet";
export const ACCOUNT_COLOR_DEFAULT = "#f59e0b";
