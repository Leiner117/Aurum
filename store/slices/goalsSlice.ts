import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { fetchAccountsThunk } from "@/store/slices/accountsSlice";
import { fetchExpensesThunk } from "@/store/slices/expensesSlice";
import { fetchReportsThunk } from "@/store/slices/reportsSlice";
import type {
  Goal,
  GoalContribution,
  CreateGoalInput,
  UpdateGoalInput,
  CreateGoalContributionInput,
} from "@/types/goal";

interface ExpensesSliceState { filters: Record<string, unknown>; currentPage: number; }
interface ReportsSliceState { monthsBack: number; }
interface CategoriesSliceState { items: { id: string; name: string; type: string }[] }

interface GoalsState {
  items: Goal[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GoalsState = { items: [], isLoading: true, error: null };

export const fetchGoalsThunk = createAsyncThunk(
  "goals/fetch",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.GOALS)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return rejectWithValue(error.message);
    return (data ?? []) as Goal[];
  }
);

export const createGoalThunk = createAsyncThunk(
  "goals/create",
  async (input: CreateGoalInput, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase
      .from(SUPABASE_TABLES.GOALS)
      .insert({ ...input, user_id: user.id });
    if (error) return rejectWithValue(error.message);
    dispatch(fetchGoalsThunk());
  }
);

export const updateGoalThunk = createAsyncThunk(
  "goals/update",
  async ({ id, ...input }: UpdateGoalInput, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.GOALS)
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchGoalsThunk());
  }
);

export const deleteGoalThunk = createAsyncThunk(
  "goals/delete",
  async (id: string, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.GOALS)
      .delete()
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchGoalsThunk());
  }
);

export const createGoalContributionThunk = createAsyncThunk(
  "goals/createContribution",
  async (input: CreateGoalContributionInput, { rejectWithValue, dispatch, getState }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");

    // 1. Insert the contribution (DB trigger handles account balance deduction)
    const { error } = await supabase
      .from(SUPABASE_TABLES.GOAL_CONTRIBUTIONS)
      .insert({ ...input, user_id: user.id });
    if (error) return rejectWithValue(error.message);

    // 2. Find goal name + Savings category id from state
    const state = getState() as {
      goals: { items: Goal[] };
      categories: CategoriesSliceState;
      expenses: ExpensesSliceState;
      reports: ReportsSliceState;
    };
    const goal = state.goals.items.find((g) => g.id === input.goal_id);
    const goalName = goal?.name ?? "Savings goal";
    const savingsCategory = state.categories.items.find(
      (c) => c.name === "Savings" && c.type === "expense"
    );

    // 3. Create a mirrored expense record so it appears in transactions.
    //    account_id is intentionally null — the trigger already deducted from
    //    the account; we just want visibility in the transaction list.
    await supabase.from(SUPABASE_TABLES.EXPENSES).insert({
      user_id: user.id,
      amount: input.amount,
      currency: input.currency,
      description: `Ahorro: ${goalName}`,
      date: input.date,
      notes: input.notes ?? null,
      type: "expense",
      category_id: savingsCategory?.id ?? null,
      account_id: null,
    });

    // 4. Refresh all affected slices
    dispatch(fetchGoalsThunk());
    dispatch(fetchAccountsThunk());
    const root = state;
    dispatch(fetchExpensesThunk({ filters: root.expenses.filters as never, page: root.expenses.currentPage }));
    dispatch(fetchReportsThunk(root.reports.monthsBack));
  }
);

export const deleteGoalContributionThunk = createAsyncThunk(
  "goals/deleteContribution",
  async (id: string, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.GOAL_CONTRIBUTIONS)
      .delete()
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchGoalsThunk());
    dispatch(fetchAccountsThunk());
  }
);

export const fetchGoalContributionsThunk = createAsyncThunk(
  "goals/fetchContributions",
  async (goalId: string, { rejectWithValue }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.GOAL_CONTRIBUTIONS)
      .select("*")
      .eq("goal_id", goalId)
      .order("date", { ascending: false });
    if (error) return rejectWithValue(error.message);
    return (data ?? []) as GoalContribution[];
  }
);

const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoalsThunk.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchGoalsThunk.fulfilled, (s, a) => { s.isLoading = false; s.items = a.payload; })
      .addCase(fetchGoalsThunk.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(createGoalThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(updateGoalThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(deleteGoalThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(createGoalContributionThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(deleteGoalContributionThunk.rejected, (s, a) => { s.error = a.payload as string; });
  },
});

export default goalsSlice.reducer;
