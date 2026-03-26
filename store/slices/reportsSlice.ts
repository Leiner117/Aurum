import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import {
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  parseISO,
} from "date-fns";

export interface CategorySpending {
  category_id: string | null;
  category_name: string;
  category_color: string;
  total: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
}

export interface DailySpending {
  day: string;
  total: number;
}

interface ReportsState {
  categorySpending: CategorySpending[];
  monthlyTrend: MonthlyTrend[];
  dailySpending: DailySpending[];
  totalThisMonth: number;
  totalLastMonth: number;
  totalExpenses: number;
  monthsBack: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  categorySpending: [],
  monthlyTrend: [],
  dailySpending: [],
  totalThisMonth: 0,
  totalLastMonth: 0,
  totalExpenses: 0,
  monthsBack: 6,
  isLoading: false,
  error: null,
};

type ExpenseRow = {
  amount: number;
  currency: string;
  date: string;
  category_id: string | null;
  categories: { name: string; color: string } | null;
};

export const fetchReportsThunk = createAsyncThunk(
  "reports/fetch",
  async (monthsBack: number, { rejectWithValue }) => {
    const supabase = createClient();
    const now = new Date();
    const rangeStart = format(startOfMonth(subMonths(now, monthsBack - 1)), "yyyy-MM-dd");
    const rangeEnd = format(endOfMonth(now), "yyyy-MM-dd");
    const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
    const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from(SUPABASE_TABLES.EXPENSES)
      .select("amount, currency, date, category_id, categories(name, color)")
      .eq("type", "expense")
      .gte("date", rangeStart)
      .lte("date", rangeEnd);

    if (error) return rejectWithValue(error.message);

    const rows = (data as unknown as ExpenseRow[]) ?? [];

    // Category spending
    const catMap = new Map<string, CategorySpending>();
    rows.forEach((r) => {
      const key = r.category_id ?? "uncategorized";
      const existing = catMap.get(key);
      if (existing) {
        existing.total += r.amount;
      } else {
        catMap.set(key, {
          category_id: r.category_id,
          category_name: r.categories?.name ?? "Uncategorized",
          category_color: r.categories?.color ?? "#64748b",
          total: r.amount,
        });
      }
    });
    const categorySpending = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

    // Monthly trend
    const monthMap = new Map<string, number>();
    for (let i = monthsBack - 1; i >= 0; i--) {
      monthMap.set(format(subMonths(now, i), "MMM yy"), 0);
    }
    rows.forEach((r) => {
      const label = format(parseISO(r.date), "MMM yy");
      if (monthMap.has(label)) monthMap.set(label, (monthMap.get(label) ?? 0) + r.amount);
    });
    const monthlyTrend = Array.from(monthMap.entries()).map(([month, total]) => ({ month, total }));

    // Daily spending (current month)
    const days = eachDayOfInterval({ start: startOfMonth(now), end: now });
    const dayMap = new Map<string, number>(days.map((d) => [format(d, "dd"), 0]));
    rows
      .filter((r) => r.date >= thisMonthStart)
      .forEach((r) => {
        const day = format(parseISO(r.date), "dd");
        if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + r.amount);
      });
    const dailySpending = Array.from(dayMap.entries()).map(([day, total]) => ({ day, total }));

    // Totals
    const totalThisMonth = rows.filter((r) => r.date >= thisMonthStart).reduce((s, r) => s + r.amount, 0);
    const totalLastMonth = rows
      .filter((r) => r.date >= lastMonthStart && r.date <= lastMonthEnd)
      .reduce((s, r) => s + r.amount, 0);
    const totalExpenses = rows.reduce((s, r) => s + r.amount, 0);

    return { categorySpending, monthlyTrend, dailySpending, totalThisMonth, totalLastMonth, totalExpenses };
  }
);

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setMonthsBack: (s, a: PayloadAction<number>) => { s.monthsBack = a.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportsThunk.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchReportsThunk.fulfilled, (s, a) => {
        s.isLoading = false;
        s.categorySpending = a.payload.categorySpending;
        s.monthlyTrend = a.payload.monthlyTrend;
        s.dailySpending = a.payload.dailySpending;
        s.totalThisMonth = a.payload.totalThisMonth;
        s.totalLastMonth = a.payload.totalLastMonth;
        s.totalExpenses = a.payload.totalExpenses;
      })
      .addCase(fetchReportsThunk.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });
  },
});

export const { setMonthsBack } = reportsSlice.actions;
export default reportsSlice.reducer;
