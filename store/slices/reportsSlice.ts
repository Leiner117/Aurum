import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import type { ExpenseSortKey } from "@/types/expense/expense.types";

export type { ExpenseSortKey };

export interface ReportExpenseRow {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  category_id: string | null;
  category_name: string;
  category_color: string;
}

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
  rawRows: ReportExpenseRow[];
  monthsBack: number;
  selectedCategoryIds: string[];
  expenseSortBy: ExpenseSortKey;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  rawRows: [],
  monthsBack: 6,
  selectedCategoryIds: [],
  expenseSortBy: "date_desc",
  isLoading: true,
  error: null,
};

type FetchedRow = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  category_id: string | null;
  categories: { name: string; color: string } | null;
};

export const fetchReportsThunk = createAsyncThunk(
  "reports/fetch",
  async (monthsBack: number, { rejectWithValue }) => {
    const supabase = createClient();
    const now = new Date();
    // Fetch one extra month so "vs last month" comparison is always available
    const rangeStart = format(startOfMonth(subMonths(now, monthsBack)), "yyyy-MM-dd");
    const rangeEnd = format(endOfMonth(now), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from(SUPABASE_TABLES.EXPENSES)
      .select("id, amount, currency, date, description, category_id, categories(name, color)")
      .eq("type", "expense")
      .gte("date", rangeStart)
      .lte("date", rangeEnd);

    if (error) return rejectWithValue(error.message);

    const rawRows: ReportExpenseRow[] = ((data as unknown as FetchedRow[]) ?? []).map((r) => ({
      id: r.id,
      amount: r.amount,
      currency: r.currency,
      date: r.date,
      description: r.description,
      category_id: r.category_id,
      category_name: r.categories?.name ?? "Uncategorized",
      category_color: r.categories?.color ?? "#64748b",
    }));

    return rawRows;
  }
);

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setMonthsBack: (s, a: PayloadAction<number>) => { s.monthsBack = a.payload; },
    setSelectedCategoryIds: (s, a: PayloadAction<string[]>) => { s.selectedCategoryIds = a.payload; },
    setExpenseSortBy: (s, a: PayloadAction<ExpenseSortKey>) => { s.expenseSortBy = a.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportsThunk.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchReportsThunk.fulfilled, (s, a) => {
        s.isLoading = false;
        s.rawRows = a.payload;
        s.selectedCategoryIds = [];
      })
      .addCase(fetchReportsThunk.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });
  },
});

export const { setMonthsBack, setSelectedCategoryIds, setExpenseSortBy } = reportsSlice.actions;
export default reportsSlice.reducer;
