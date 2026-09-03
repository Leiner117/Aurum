import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES, SUPABASE_FUNCTIONS } from "@/constants/supabase.constants";
import { BUDGET_ALERT_THRESHOLD_DEFAULT } from "@/constants/budgets.constants";
import { getCurrentISOWeek } from "@/lib/week-utils";
import type {
  Budget,
  BudgetSummary,
  BudgetComplianceMonth,
  BudgetPeriodType,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/budget.types";

interface BudgetsState {
  items: Budget[];
  summaries: BudgetSummary[];
  selectedMonth: number;
  selectedYear: number;
  selectedPeriodType: BudgetPeriodType;
  selectedWeek: number;
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  monthlyIncome: number | null;
  monthlyIncomeCurrency: string;
  isIncomeLoading: boolean;
  compliance: BudgetComplianceMonth[];
  isComplianceLoading: boolean;
}

const now = new Date();
const currentWeek = getCurrentISOWeek();

const initialState: BudgetsState = {
  items: [],
  summaries: [],
  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),
  selectedPeriodType: "monthly",
  selectedWeek: currentWeek.week,
  isLoading: true,
  isSummaryLoading: true,
  error: null,
  monthlyIncome: null,
  monthlyIncomeCurrency: "USD",
  isIncomeLoading: false,
  compliance: [],
  isComplianceLoading: false,
};

export const fetchBudgetsThunk = createAsyncThunk(
  "budgets/fetch",
  async (
    args: { month: number; year: number; periodType: BudgetPeriodType; weekNumber?: number },
    { rejectWithValue }
  ) => {
    const supabase = createClient();
    let query = supabase
      .from(SUPABASE_TABLES.BUDGETS)
      .select("*")
      .eq("year", args.year)
      .eq("period_type", args.periodType)
      .order("created_at");

    if (args.periodType === "weekly") {
      query = query.eq("week_number", args.weekNumber ?? 1);
    } else {
      query = query.eq("month", args.month);
    }

    const { data, error } = await query;
    if (error) return rejectWithValue(error.message);
    return (data ?? []) as Budget[];
  }
);

export const fetchSummariesThunk = createAsyncThunk(
  "budgets/fetchSummaries",
  async (
    args: { month: number; year: number; periodType: BudgetPeriodType; weekNumber?: number },
    { rejectWithValue }
  ) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { data, error } = await supabase.rpc(SUPABASE_FUNCTIONS.GET_BUDGET_SUMMARY, {
      p_user_id: user.id,
      p_month: args.month,
      p_year: args.year,
      p_period_type: args.periodType,
      p_week_number: args.weekNumber ?? null,
    });
    if (error) return rejectWithValue(error.message);
    const mapped = ((data ?? []) as unknown as BudgetSummary[]).map((s) => ({
      ...s,
      id: s.budget_id,
      year: args.year,
      month: args.periodType === "monthly" ? args.month : null,
      week_number: args.periodType === "weekly" ? (args.weekNumber ?? null) : null,
    }));
    return mapped;
  }
);

export const createBudgetThunk = createAsyncThunk(
  "budgets/create",
  async (input: CreateBudgetInput, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    // Cast needed: Supabase generated types predate the weekly-budget migration
    // (period_type, week_number columns and nullable month).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(SUPABASE_TABLES.BUDGETS).insert({
      ...input,
      user_id: user.id,
      alert_threshold: input.alert_threshold ?? BUDGET_ALERT_THRESHOLD_DEFAULT,
      notifications_enabled: input.notifications_enabled ?? true,
      month: input.period_type === "monthly" ? (input.month ?? null) : null,
      week_number: input.period_type === "weekly" ? (input.week_number ?? null) : null,
    } as any);
    if (error) return rejectWithValue(error.message);
    const s = (getState() as { budgets: BudgetsState }).budgets;
    dispatch(
      fetchBudgetsThunk({
        month: s.selectedMonth,
        year: s.selectedYear,
        periodType: s.selectedPeriodType,
        weekNumber: s.selectedWeek,
      })
    );
    dispatch(
      fetchSummariesThunk({
        month: s.selectedMonth,
        year: s.selectedYear,
        periodType: s.selectedPeriodType,
        weekNumber: s.selectedWeek,
      })
    );
  }
);

export const updateBudgetThunk = createAsyncThunk(
  "budgets/update",
  async ({ id, ...input }: UpdateBudgetInput, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from(SUPABASE_TABLES.BUDGETS)
      .update({ ...input, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    const s = (getState() as { budgets: BudgetsState }).budgets;
    dispatch(
      fetchBudgetsThunk({
        month: s.selectedMonth,
        year: s.selectedYear,
        periodType: s.selectedPeriodType,
        weekNumber: s.selectedWeek,
      })
    );
    dispatch(
      fetchSummariesThunk({
        month: s.selectedMonth,
        year: s.selectedYear,
        periodType: s.selectedPeriodType,
        weekNumber: s.selectedWeek,
      })
    );
  }
);

export const deleteBudgetThunk = createAsyncThunk(
  "budgets/delete",
  async (id: string, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    const { error } = await supabase.from(SUPABASE_TABLES.BUDGETS).delete().eq("id", id);
    if (error) return rejectWithValue(error.message);
    const s = (getState() as { budgets: BudgetsState }).budgets;
    dispatch(
      fetchBudgetsThunk({
        month: s.selectedMonth,
        year: s.selectedYear,
        periodType: s.selectedPeriodType,
        weekNumber: s.selectedWeek,
      })
    );
    dispatch(
      fetchSummariesThunk({
        month: s.selectedMonth,
        year: s.selectedYear,
        periodType: s.selectedPeriodType,
        weekNumber: s.selectedWeek,
      })
    );
  }
);

export const processRecurringBudgetsThunk = createAsyncThunk(
  "budgets/processRecurring",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      .eq("period_type", "monthly")
      .eq("month", prevMonth)
      .eq("year", prevYear);

    if (!recurringBudgets?.length) return;

    for (const budget of recurringBudgets) {
      const { data: existing } = await supabase
        .from(SUPABASE_TABLES.BUDGETS)
        .select("id")
        .eq("category_id", budget.category_id)
        .eq("period_type", "monthly")
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .single();

      if (!existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from(SUPABASE_TABLES.BUDGETS).insert({
          user_id: user.id,
          category_id: budget.category_id,
          amount: budget.amount,
          currency: budget.currency,
          period_type: "monthly",
          month: currentMonth,
          year: currentYear,
          alert_threshold: budget.alert_threshold,
          is_recurring: true,
        } as any);
      }
    }
  }
);

export const fetchMonthlyIncomeThunk = createAsyncThunk(
  "budgets/fetchIncome",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.PROFILES)
      .select("monthly_income, monthly_income_currency")
      .eq("id", user.id)
      .single();
    if (error) return rejectWithValue(error.message);
    return {
      amount: (data?.monthly_income ?? null) as number | null,
      currency: (data?.monthly_income_currency ?? "USD") as string,
    };
  }
);

export const updateMonthlyIncomeThunk = createAsyncThunk(
  "budgets/updateIncome",
  async ({ amount, currency }: { amount: number | null; currency: string }, { rejectWithValue }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase
      .from(SUPABASE_TABLES.PROFILES)
      .update({ monthly_income: amount, monthly_income_currency: currency })
      .eq("id", user.id);
    if (error) return rejectWithValue(error.message);
    return { amount, currency };
  }
);

export const fetchComplianceThunk = createAsyncThunk(
  "budgets/fetchCompliance",
  async ({ year, currency }: { year: number; currency?: string }, { rejectWithValue }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { data, error } = await supabase.rpc(SUPABASE_FUNCTIONS.GET_BUDGET_COMPLIANCE, {
      p_user_id: user.id,
      p_year: year,
      p_currency: currency ?? null,
    });
    if (error) return rejectWithValue(error.message);
    return (
      (data ?? []) as {
        month: number;
        total_budgeted: number;
        total_spent: number;
        budget_met: boolean;
      }[]
    ).map(
      (r) =>
        ({
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
    setWeek: (s, a: PayloadAction<{ week: number; year: number }>) => {
      s.selectedWeek = a.payload.week;
      s.selectedYear = a.payload.year;
    },
    setPeriodType: (s, a: PayloadAction<BudgetPeriodType>) => {
      s.selectedPeriodType = a.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgetsThunk.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(fetchBudgetsThunk.fulfilled, (s, a) => {
        s.isLoading = false;
        s.items = a.payload;
      })
      .addCase(fetchBudgetsThunk.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.payload as string;
      })
      .addCase(fetchSummariesThunk.pending, (s) => {
        s.isSummaryLoading = true;
      })
      .addCase(fetchSummariesThunk.fulfilled, (s, a) => {
        s.isSummaryLoading = false;
        s.summaries = a.payload;
      })
      .addCase(fetchSummariesThunk.rejected, (s) => {
        s.isSummaryLoading = false;
      })
      .addCase(createBudgetThunk.rejected, (s, a) => {
        s.error = a.payload as string;
      })
      .addCase(updateBudgetThunk.rejected, (s, a) => {
        s.error = a.payload as string;
      })
      .addCase(deleteBudgetThunk.rejected, (s, a) => {
        s.error = a.payload as string;
      })
      .addCase(fetchMonthlyIncomeThunk.pending, (s) => {
        s.isIncomeLoading = true;
      })
      .addCase(fetchMonthlyIncomeThunk.fulfilled, (s, a) => {
        s.isIncomeLoading = false;
        s.monthlyIncome = a.payload.amount;
        s.monthlyIncomeCurrency = a.payload.currency;
      })
      .addCase(fetchMonthlyIncomeThunk.rejected, (s) => {
        s.isIncomeLoading = false;
      })
      .addCase(updateMonthlyIncomeThunk.pending, (s) => {
        s.isIncomeLoading = true;
      })
      .addCase(updateMonthlyIncomeThunk.fulfilled, (s, a) => {
        s.isIncomeLoading = false;
        s.monthlyIncome = a.payload.amount;
        s.monthlyIncomeCurrency = a.payload.currency;
      })
      .addCase(updateMonthlyIncomeThunk.rejected, (s) => {
        s.isIncomeLoading = false;
      })
      .addCase(fetchComplianceThunk.pending, (s) => {
        s.isComplianceLoading = true;
      })
      .addCase(fetchComplianceThunk.fulfilled, (s, a) => {
        s.isComplianceLoading = false;
        s.compliance = a.payload;
      })
      .addCase(fetchComplianceThunk.rejected, (s) => {
        s.isComplianceLoading = false;
      });
  },
});

export const { setMonth, setWeek, setPeriodType } = budgetsSlice.actions;
export default budgetsSlice.reducer;
