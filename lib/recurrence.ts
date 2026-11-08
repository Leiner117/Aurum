import { addMonths, format, getDaysInMonth, setDate } from "date-fns";

// Next-occurrence math for generated transactions lives in SQL: public.next_recurring_date()

export const getNextSpecificDayDate = (specificDay: number): string => {
  const today = new Date();
  const currentDay = today.getDate();
  const base = currentDay < specificDay ? today : addMonths(today, 1);
  const clamped = Math.min(specificDay, getDaysInMonth(base));
  return format(setDate(base, clamped), "yyyy-MM-dd");
};
