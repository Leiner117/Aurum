export const REPORT_PERIODS = [
  { label: "Last 3 months", value: "3m" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last 12 months", value: "12m" },
  { label: "This year", value: "year" },
  { label: "Custom range", value: "custom" },
] as const;

export const CHART_COLORS = [
  "#6366f1", "#f97316", "#22c55e", "#ef4444",
  "#f59e0b", "#3b82f6", "#ec4899", "#10b981",
  "#06b6d4", "#8b5cf6",
] as const;

export const RECURRING_FREQUENCIES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
] as const;
