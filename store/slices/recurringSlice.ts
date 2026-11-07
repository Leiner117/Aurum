import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_FUNCTIONS, SUPABASE_TABLES } from "@/constants/supabase.constants";
import type {
  RecurringExpenseWithCategory,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from "@/types/recurring.types";

interface RecurringState {
  items: RecurringExpenseWithCategory[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  generatedCount: number;
}

const initialState: RecurringState = {
  items: [],
  isLoading: true,
  isProcessing: false,
  error: null,
  generatedCount: 0,
};

export const fetchRecurringThunk = createAsyncThunk(
  "recurring/fetch",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.RECURRING_EXPENSES)
      .select("*, category:categories(id, name, icon, color)")
      .order("next_date");
    if (error) return rejectWithValue(error.message);
    return (data as unknown as RecurringExpenseWithCategory[]) ?? [];
  }
);

// Due items are generated in the database (process_my_recurring), the same code the
// daily pg_cron job runs — rows are locked so the app and the job never duplicate.
export const processRecurringThunk = createAsyncThunk(
  "recurring/process",
  async (_, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { data: count, error } = await supabase.rpc(SUPABASE_FUNCTIONS.PROCESS_MY_RECURRING);
    if (error) return rejectWithValue(error.message);

    if (count && count > 0) dispatch(fetchRecurringThunk());
    return count ?? 0;
  }
);

export const createRecurringThunk = createAsyncThunk(
  "recurring/create",
  async (input: CreateRecurringExpenseInput, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase
      .from(SUPABASE_TABLES.RECURRING_EXPENSES)
      .insert({ ...input, user_id: user.id });
    if (error) return rejectWithValue(error.message);
    dispatch(fetchRecurringThunk());
  }
);

export const updateRecurringThunk = createAsyncThunk(
  "recurring/update",
  async ({ id, ...input }: UpdateRecurringExpenseInput, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.RECURRING_EXPENSES)
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchRecurringThunk());
  }
);

export const toggleActiveThunk = createAsyncThunk(
  "recurring/toggleActive",
  async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.RECURRING_EXPENSES)
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    return { id, isActive };
  }
);

export const deleteRecurringThunk = createAsyncThunk(
  "recurring/delete",
  async (id: string, { rejectWithValue }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.RECURRING_EXPENSES)
      .delete()
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    return id;
  }
);

const recurringSlice = createSlice({
  name: "recurring",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecurringThunk.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchRecurringThunk.fulfilled, (s, a) => { s.isLoading = false; s.items = a.payload; })
      .addCase(fetchRecurringThunk.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(processRecurringThunk.pending, (s) => { s.isProcessing = true; })
      .addCase(processRecurringThunk.fulfilled, (s, a) => {
        s.isProcessing = false;
        s.generatedCount = a.payload ?? 0;
      })
      .addCase(processRecurringThunk.rejected, (s) => { s.isProcessing = false; })
      .addCase(toggleActiveThunk.fulfilled, (s, a) => {
        const item = s.items.find((r) => r.id === a.payload.id);
        if (item) item.is_active = a.payload.isActive;
      })
      .addCase(deleteRecurringThunk.fulfilled, (s, a) => {
        s.items = s.items.filter((r) => r.id !== a.payload);
      })
      .addCase(createRecurringThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(updateRecurringThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(toggleActiveThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(deleteRecurringThunk.rejected, (s, a) => { s.error = a.payload as string; });
  },
});

export default recurringSlice.reducer;
