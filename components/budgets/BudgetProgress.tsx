import { cn } from "@/lib/utils";
import { BUDGET_STATUS_COLORS } from "@/constants/budgets.constants";
import type { BudgetSummary } from "@/types/budget.types";

interface BudgetProgressProps {
  summary: BudgetSummary;
  className?: string;
}

const STATUS_TRACK: Record<string, string> = {
  ok: "bg-green-500",
  warning: "bg-yellow-500",
  exceeded: "bg-red-500",
};

export function BudgetProgress({ summary, className }: BudgetProgressProps) {
  const pct = Math.min(summary.percentage, 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
        <span>{Math.round(summary.percentage)}% used</span>
        <span>{summary.alert_threshold}% alert</span>
      </div>
      {/* Track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            STATUS_TRACK[summary.status]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Alert threshold marker */}
      <div
        className="relative h-0"
        style={{ marginTop: "-10px" }}
      >
        <div
          className="absolute top-0 h-4 w-0.5 -translate-y-3 bg-[var(--color-muted-foreground)] opacity-40"
          style={{ left: `${summary.alert_threshold}%` }}
        />
      </div>
    </div>
  );
}
