export const BUDGET_ALERT_THRESHOLD_DEFAULT = 80; // percent

export const BUDGET_STATUS = {
  OK: "ok",
  WARNING: "warning",
  EXCEEDED: "exceeded",
} as const;

export const BUDGET_STATUS_COLORS = {
  ok: "#22c55e",
  warning: "#f59e0b",
  exceeded: "#ef4444",
} as const;
