"use client";

import { cn } from "@/lib/utils";
import { REPORT_PERIODS } from "@/constants/reports.constants";

const PERIOD_MONTHS: Record<string, number> = {
  "3m": 3,
  "6m": 6,
  "12m": 12,
};

interface PeriodSelectorProps {
  value: number;
  onChange: (months: number) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-0.5">
      {REPORT_PERIODS.filter((p) => p.value !== "custom" && p.value !== "year").map((period) => {
        const months = PERIOD_MONTHS[period.value];
        const isActive = value === months;
        return (
          <button
            key={period.value}
            onClick={() => onChange(months)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
