import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import type { Account, CreateAccountInput, UpdateAccountInput } from "@/types/account";

interface AccountsState {
  items: Account[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AccountsState = { items: [], isLoading: false, error: null };

export const fetchAccountsThunk = createAsyncThunk(
  "accounts/fetch",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.ACCOUNTS)
      .select("*")
      .order("is_default", { ascending: false })
      .order("name");
    if (error) return rejectWithValue(error.message);
    return (data ?? []) as Account[];
  }
);

export const createAccountThunk = createAsyncThunk(
  "accounts/create",
  async (input: CreateAccountInput, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase
      .from(SUPABASE_TABLES.ACCOUNTS)
      .insert({ ...input, user_id: user.id });
    if (error) return rejectWithValue(error.message);
    dispatch(fetchAccountsThunk());
  }
);

export const updateAccountThunk = createAsyncThunk(
  "accounts/update",
  async ({ id, ...input }: UpdateAccountInput, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.ACCOUNTS)
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchAccountsThunk());
  }
);

export const deleteAccountThunk = createAsyncThunk(
  "accounts/delete",
  async (id: string, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.ACCOUNTS)
      .delete()
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchAccountsThunk());
  }
);

const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountsThunk.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchAccountsThunk.fulfilled, (s, a) => { s.isLoading = false; s.items = a.payload; })
      .addCase(fetchAccountsThunk.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(createAccountThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(updateAccountThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(deleteAccountThunk.rejected, (s, a) => { s.error = a.payload as string; });
  },
});

export default accountsSlice.reducer;
