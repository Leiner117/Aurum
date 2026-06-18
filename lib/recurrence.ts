import { addDays, addWeeks, addMonths, addYears, parseISO, format, isToday, isBefore, getDaysInMonth, setDate } from "date-fns";
import type { RecurringFrequency } from "@/types/recurring.types";

export const getNextDate = (currentDate: string, frequency: RecurringFrequency, specificDay?: number | null): string => {
  const date = parseISO(currentDate);
  if (frequency === "specific_day_monthly" && specificDay != null) {
    const nextMonth = addMonths(date, 1);
    const clamped = Math.min(specificDay, getDaysInMonth(nextMonth));
    return format(setDate(nextMonth, clamped), "yyyy-MM-dd");
  }
  const next =
    frequency === "daily"   ? addDays(date, 1) :
    frequency === "weekly"  ? addWeeks(date, 1) :
    frequency === "monthly" ? addMonths(date, 1) :
                              addYears(date, 1);
  return format(next, "yyyy-MM-dd");
};

export const getNextSpecificDayDate = (specificDay: number): string => {
  const today = new Date();
  const currentDay = today.getDate();
  const base = currentDay < specificDay ? today : addMonths(today, 1);
  const clamped = Math.min(specificDay, getDaysInMonth(base));
  return format(setDate(base, clamped), "yyyy-MM-dd");
};

export const isDue = (nextDate: string): boolean => {
  const date = parseISO(nextDate);
  return isToday(date) || isBefore(date, new Date());
};
