"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatWeekLabel, getISOWeeksInYear } from "@/lib/week-utils";

interface WeekSelectorProps {
  week: number;
  year: number;
  onChange: (week: number, year: number) => void;
}

export const WeekSelector = ({ week, year, onChange }: WeekSelectorProps) => {
  const prev = () => {
    if (week === 1) {
      const prevYear = year - 1;
      onChange(getISOWeeksInYear(prevYear), prevYear);
    } else {
      onChange(week - 1, year);
    }
  };

  const next = () => {
    if (week === getISOWeeksInYear(year)) {
      onChange(1, year + 1);
    } else {
      onChange(week + 1, year);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={prev} aria-label="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[200px] text-center text-sm font-medium text-[var(--color-foreground)]">
        {formatWeekLabel(week, year)}, {year}
      </span>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={next} aria-label="Next week">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
