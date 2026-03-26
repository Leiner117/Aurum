import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { EXPENSES_PAGE_SIZE } from "@/constants/expenses.constants";
import type {
  ExpenseWithCategory,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilters,
} from "@/types/expense";

interface ExpensesState {
  items: ExpenseWithCategory[];
  totalCount: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  filters: ExpenseFilters;
}

const initialState: ExpensesState = {
  items: [],
  totalCount: 0,
  currentPage: 1,
  isLoading: true,
  error: null,
  filters: {},
};

export const fetchExpensesThunk = createAsyncThunk(
  "expenses/fetch",
  async (args: { filters: ExpenseFilters; page: number }, { rejectWithValue }) => {
    const supabase = createClient();
    const { filters, page } = args;

    let query = supabase
      .from(SUPABASE_TABLES.EXPENSES)
      .select("*, category:categories(id, name, icon, color)", { count: "exact" });

    if (filters.type) query = query.eq("type", filters.type);
    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.startDate) query = query.gte("date", filters.startDate);
    if (filters.endDate) query = query.lte("date", filters.endDate);
    if (filters.minAmount) query = query.gte("amount", filters.minAmount);
    if (filters.maxAmount) query = query.lte("amount", filters.maxAmount);
    if (filters.search) query = query.ilike("description", `%${filters.search}%`);

    const sortMap: Record<string, { col: string; asc: boolean }> = {
      date_desc: { col: "date", asc: false },
      date_asc: { col: "date", asc: true },
      amount_desc: { col: "amount", asc: false },
      amount_asc: { col: "amount", asc: true },
    };
    const sort = sortMap[filters.sortBy ?? "date_desc"];
    query = query.order(sort.col, { ascending: sort.asc });

    const from = (page - 1) * EXPENSES_PAGE_SIZE;
    query = query.range(from, from + EXPENSES_PAGE_SIZE - 1);

    const { data, error, count } = await query;
    if (error) return rejectWithValue(error.message);
    return { items: (data as unknown as ExpenseWithCategory[]) ?? [], totalCount: count ?? 0 };
  }
);

export const createExpenseThunk = createAsyncThunk(
  "expenses/create",
  async (input: CreateExpenseInput, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase
      .from(SUPABASE_TABLES.EXPENSES)
      .insert({ ...input, user_id: user.id });
    if (error) return rejectWithValue(error.message);
    const s = (getState() as { expenses: ExpensesState }).expenses;
    dispatch(fetchExpensesThunk({ filters: s.filters, page: s.currentPage }));
  }
);

export const updateExpenseThunk = createAsyncThunk(
  "expenses/update",
  async ({ id, ...input }: UpdateExpenseInput, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.EXPENSES)
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    const s = (getState() as { expenses: ExpensesState }).expenses;
    dispatch(fetchExpensesThunk({ filters: s.filters, page: s.currentPage }));
  }
);

export const deleteExpenseThunk = createAsyncThunk(
  "expenses/delete",
  async (id: string, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.EXPENSES)
      .delete()
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    const s = (getState() as { expenses: ExpensesState }).expenses;
    dispatch(fetchExpensesThunk({ filters: s.filters, page: s.currentPage }));
  }
);

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setFilters: (s, a: PayloadAction<ExpenseFilters>) => {
      s.filters = a.payload;
      s.currentPage = 1;
    },
    setPage: (s, a: PayloadAction<number>) => { s.currentPage = a.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpensesThunk.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchExpensesThunk.fulfilled, (s, a) => {
        s.isLoading = false;
        s.items = a.payload.items;
        s.totalCount = a.payload.totalCount;
      })
      .addCase(fetchExpensesThunk.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(createExpenseThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(updateExpenseThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(deleteExpenseThunk.rejected, (s, a) => { s.error = a.payload as string; });
  },
});

export const { setFilters, setPage } = expensesSlice.actions;
export default expensesSlice.reducer;
