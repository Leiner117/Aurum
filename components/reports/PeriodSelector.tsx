"use client";

import { cn } from "@/lib/utils";

const PERIODS = [
  { label: "Monthly", months: 1 },
  { label: "6 Months", months: 6 },
  { label: "Annual", months: 12 },
] as const;

interface PeriodSelectorProps {
  value: number;
  onChange: (months: number) => void;
}

export const PeriodSelector = ({ value, onChange }: PeriodSelectorProps) => {
  return (
    <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-0.5">
      {PERIODS.map((period) => {
        const isActive = value === period.months;
        return (
          <button
            key={period.months}
            onClick={() => onChange(period.months)}
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
};
