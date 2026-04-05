import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { fetchAccountsThunk } from "@/store/slices/accountsSlice";
import type { Transfer, CreateTransferInput } from "@/types/transfer";

interface TransfersState {
  items: Transfer[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TransfersState = { items: [], isLoading: true, error: null };

export const fetchTransfersThunk = createAsyncThunk(
  "transfers/fetch",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.TRANSFERS)
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return rejectWithValue(error.message);
    return (data ?? []) as Transfer[];
  }
);

export const createTransferThunk = createAsyncThunk(
  "transfers/create",
  async (input: CreateTransferInput, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase
      .from(SUPABASE_TABLES.TRANSFERS)
      .insert({ ...input, user_id: user.id });
    if (error) return rejectWithValue(error.message);
    dispatch(fetchTransfersThunk());
    dispatch(fetchAccountsThunk());
  }
);

export const deleteTransferThunk = createAsyncThunk(
  "transfers/delete",
  async (id: string, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.TRANSFERS)
      .delete()
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchTransfersThunk());
    dispatch(fetchAccountsThunk());
  }
);

const transfersSlice = createSlice({
  name: "transfers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransfersThunk.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchTransfersThunk.fulfilled, (s, a) => { s.isLoading = false; s.items = a.payload; })
      .addCase(fetchTransfersThunk.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(createTransferThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(deleteTransferThunk.rejected, (s, a) => { s.error = a.payload as string; });
  },
});

export default transfersSlice.reducer;
