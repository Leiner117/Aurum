import { addDays, addWeeks, addMonths, addYears, parseISO, format, isToday, isBefore } from "date-fns";
import type { RecurringFrequency } from "@/types/recurring.types";

export function getNextDate(currentDate: string, frequency: RecurringFrequency): string {
  const date = parseISO(currentDate);
  const next =
    frequency === "daily"   ? addDays(date, 1) :
    frequency === "weekly"  ? addWeeks(date, 1) :
    frequency === "monthly" ? addMonths(date, 1) :
                              addYears(date, 1);
  return format(next, "yyyy-MM-dd");
}

export function isDue(nextDate: string): boolean {
  const date = parseISO(nextDate);
  return isToday(date) || isBefore(date, new Date());
}
