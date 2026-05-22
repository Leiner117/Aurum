export const REPORT_PERIODS = [
  { label: "Monthly", value: "1m", months: 1 },
  { label: "6 Months", value: "6m", months: 6 },
  { label: "Annual", value: "12m", months: 12 },
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
