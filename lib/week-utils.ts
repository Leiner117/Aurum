const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getISOYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

export function getISOWeeksInYear(year: number): number {
  return getISOWeek(new Date(year, 11, 28));
}

export function getWeekDateRange(week: number, year: number): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

export function getCurrentISOWeek(): { week: number; year: number } {
  const now = new Date();
  return { week: getISOWeek(now), year: getISOYear(now) };
}

export function formatWeekLabel(week: number, year: number): string {
  const { start, end } = getWeekDateRange(week, year);
  const startStr = `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}`;
  const endMonth = end.getMonth();
  const endStr =
    start.getMonth() === endMonth
      ? String(end.getDate())
      : `${MONTH_SHORT[endMonth]} ${end.getDate()}`;
  return `Week ${week} · ${startStr}–${endStr}`;
}
