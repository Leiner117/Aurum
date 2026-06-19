import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES, SUPABASE_FUNCTIONS } from "@/constants/supabase.constants";
import { BUDGET_ALERT_THRESHOLD_DEFAULT } from "@/constants/budgets.constants";
import type { Budget, BudgetSummary, BudgetComplianceMonth, CreateBudgetInput, UpdateBudgetInput } from "@/types/budget.types";

interface BudgetsState {
  items: Budget[];
  summaries: BudgetSummary[];
  selectedMonth: number;
  selectedYear: number;
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  monthlyIncome: number | null;
  isIncomeLoading: boolean;
  compliance: BudgetComplianceMonth[];
  isComplianceLoading: boolean;
}

const now = new Date();

const initialState: BudgetsState = {
  items: [],
  summaries: [],
  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),
  isLoading: true,
  isSummaryLoading: true,
  error: null,
  monthlyIncome: null,
  isIncomeLoading: false,
  compliance: [],
  isComplianceLoading: false,
};

export const fetchBudgetsThunk = createAsyncThunk(
  "budgets/fetch",
  async (args: { month: number; year: number }, { rejectWithValue }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.BUDGETS)
      .select("*")
      .eq("month", args.month)
      .eq("year", args.year)
      .order("created_at");
    if (error) return rejectWithValue(error.message);
    return (data ?? []) as Budget[];
  }
);

export const fetchSummariesThunk = createAsyncThunk(
  "budgets/fetchSummaries",
  async (args: { month: number; year: number }, { rejectWithValue }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { data, error } = await supabase.rpc(SUPABASE_FUNCTIONS.GET_BUDGET_SUMMARY, {
      p_user_id: user.id,
      p_month: args.month,
      p_year: args.year,
    });
    if (error) return rejectWithValue(error.message);
    const mapped = ((data ?? []) as unknown as BudgetSummary[]).map((s) => ({
      ...s,
      id: s.budget_id,
      month: args.month,
      year: args.year,
    }));
    return mapped;
  }
);

export const createBudgetThunk = createAsyncThunk(
  "budgets/create",
  async (input: CreateBudgetInput, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase.from(SUPABASE_TABLES.BUDGETS).insert({
      ...input,
      user_id: user.id,
      alert_threshold: input.alert_threshold ?? BUDGET_ALERT_THRESHOLD_DEFAULT,
    });
    if (error) return rejectWithValue(error.message);
    const s = (getState() as { budgets: BudgetsState }).budgets;
    dispatch(fetchBudgetsThunk({ month: s.selectedMonth, year: s.selectedYear }));
    dispatch(fetchSummariesThunk({ month: s.selectedMonth, year: s.selectedYear }));
  }
);

export const updateBudgetThunk = createAsyncThunk(
  "budgets/update",
  async ({ id, ...input }: UpdateBudgetInput, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.BUDGETS)
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    const s = (getState() as { budgets: BudgetsState }).budgets;
    dispatch(fetchBudgetsThunk({ month: s.selectedMonth, year: s.selectedYear }));
    dispatch(fetchSummariesThunk({ month: s.selectedMonth, year: s.selectedYear }));
  }
);

export const deleteBudgetThunk = createAsyncThunk(
  "budgets/delete",
  async (id: string, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    const { error } = await supabase.from(SUPABASE_TABLES.BUDGETS).delete().eq("id", id);
    if (error) return rejectWithValue(error.message);
    const s = (getState() as { budgets: BudgetsState }).budgets;
    dispatch(fetchBudgetsThunk({ month: s.selectedMonth, year: s.selectedYear }));
    dispatch(fetchSummariesThunk({ month: s.selectedMonth, year: s.selectedYear }));
  }
);

export const processRecurringBudgetsThunk = createAsyncThunk(
  "budgets/processRecurring",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear = prevDate.getFullYear();

    const { data: recurringBudgets } = await supabase
      .from(SUPABASE_TABLES.BUDGETS)
      .select("*")
      .eq("is_recurring", true)
      .eq("month", prevMonth)
      .eq("year", prevYear);

    if (!recurringBudgets?.length) return;

    for (const budget of recurringBudgets) {
      const { data: existing } = await supabase
        .from(SUPABASE_TABLES.BUDGETS)
        .select("id")
        .eq("category_id", budget.category_id)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .single();

      if (!existing) {
        await supabase.from(SUPABASE_TABLES.BUDGETS).insert({
          user_id: user.id,
          category_id: budget.category_id,
          amount: budget.amount,
          currency: budget.currency,
          month: currentMonth,
          year: currentYear,
          alert_threshold: budget.alert_threshold,
          is_recurring: true,
        });
      }
    }
  }
);

export const fetchMonthlyIncomeThunk = createAsyncThunk(
  "budgets/fetchIncome",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.PROFILES)
      .select("monthly_income")
      .eq("id", user.id)
      .single();
    if (error) return rejectWithValue(error.message);
    return (data?.monthly_income ?? null) as number | null;
  }
);

export const updateMonthlyIncomeThunk = createAsyncThunk(
  "budgets/updateIncome",
  async (amount: number | null, { rejectWithValue }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase
      .from(SUPABASE_TABLES.PROFILES)
      .update({ monthly_income: amount })
      .eq("id", user.id);
    if (error) return rejectWithValue(error.message);
    return amount;
  }
);

export const fetchComplianceThunk = createAsyncThunk(
  "budgets/fetchCompliance",
  async (year: number, { rejectWithValue }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { data, error } = await supabase.rpc(SUPABASE_FUNCTIONS.GET_BUDGET_COMPLIANCE, {
      p_user_id: user.id,
      p_year: year,
    });
    if (error) return rejectWithValue(error.message);
    return ((data ?? []) as { month: number; total_budgeted: number; total_spent: number; budget_met: boolean }[]).map(
      (r) => ({
        month: r.month,
        totalBudgeted: r.total_budgeted,
        totalSpent: r.total_spent,
        budgetMet: r.budget_met,
        hasData: true,
      }) satisfies BudgetComplianceMonth
    );
  }
);

const budgetsSlice = createSlice({
  name: "budgets",
  initialState,
  reducers: {
    setMonth: (s, a: PayloadAction<{ month: number; year: number }>) => {
      s.selectedMonth = a.payload.month;
      s.selectedYear = a.payload.year;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgetsThunk.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchBudgetsThunk.fulfilled, (s, a) => { s.isLoading = false; s.items = a.payload; })
      .addCase(fetchBudgetsThunk.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(fetchSummariesThunk.pending, (s) => { s.isSummaryLoading = true; })
      .addCase(fetchSummariesThunk.fulfilled, (s, a) => { s.isSummaryLoading = false; s.summaries = a.payload; })
      .addCase(fetchSummariesThunk.rejected, (s) => { s.isSummaryLoading = false; })
      .addCase(createBudgetThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(updateBudgetThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(deleteBudgetThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(fetchMonthlyIncomeThunk.pending, (s) => { s.isIncomeLoading = true; })
      .addCase(fetchMonthlyIncomeThunk.fulfilled, (s, a) => { s.isIncomeLoading = false; s.monthlyIncome = a.payload; })
      .addCase(fetchMonthlyIncomeThunk.rejected, (s) => { s.isIncomeLoading = false; })
      .addCase(updateMonthlyIncomeThunk.pending, (s) => { s.isIncomeLoading = true; })
      .addCase(updateMonthlyIncomeThunk.fulfilled, (s, a) => { s.isIncomeLoading = false; s.monthlyIncome = a.payload; })
      .addCase(updateMonthlyIncomeThunk.rejected, (s) => { s.isIncomeLoading = false; })
      .addCase(fetchComplianceThunk.pending, (s) => { s.isComplianceLoading = true; })
      .addCase(fetchComplianceThunk.fulfilled, (s, a) => { s.isComplianceLoading = false; s.compliance = a.payload; })
      .addCase(fetchComplianceThunk.rejected, (s) => { s.isComplianceLoading = false; });
  },
});

export const { setMonth } = budgetsSlice.actions;
export default budgetsSlice.reducer;
