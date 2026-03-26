"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  function prev() {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  }

  function next() {
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={prev} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[130px] text-center text-sm font-medium text-[var(--color-foreground)]">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={next} aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
