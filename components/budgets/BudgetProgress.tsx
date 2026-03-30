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

export const BudgetProgress = ({ summary, className }: BudgetProgressProps) => {
  const pct = Math.min(summary.percentage, 100);

  return (
    <div className={cn("space-y-1", className)}>
      {/* Labels row */}
      <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
        <span>{Math.round(summary.percentage)}% used</span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-px bg-[var(--color-muted-foreground)] opacity-50" />
          <span>{summary.alert_threshold}% alert</span>
        </div>
      </div>
      {/* Track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            STATUS_TRACK[summary.status]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
