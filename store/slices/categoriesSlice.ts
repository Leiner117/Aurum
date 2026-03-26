import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category";

interface CategoriesState {
  items: Category[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CategoriesState = { items: [], isLoading: false, error: null };

export const fetchCategoriesThunk = createAsyncThunk(
  "categories/fetch",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.CATEGORIES)
      .select("*")
      .order("is_default", { ascending: false })
      .order("name");
    if (error) return rejectWithValue(error.message);
    return (data ?? []) as Category[];
  }
);

export const createCategoryThunk = createAsyncThunk(
  "categories/create",
  async (input: CreateCategoryInput, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase
      .from(SUPABASE_TABLES.CATEGORIES)
      .insert({ ...input, user_id: user.id });
    if (error) return rejectWithValue(error.message);
    dispatch(fetchCategoriesThunk());
  }
);

export const updateCategoryThunk = createAsyncThunk(
  "categories/update",
  async ({ id, ...input }: UpdateCategoryInput, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.CATEGORIES)
      .update(input)
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchCategoriesThunk());
  }
);

export const deleteCategoryThunk = createAsyncThunk(
  "categories/delete",
  async (id: string, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from(SUPABASE_TABLES.CATEGORIES)
      .delete()
      .eq("id", id);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchCategoriesThunk());
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoriesThunk.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchCategoriesThunk.fulfilled, (s, a) => { s.isLoading = false; s.items = a.payload; })
      .addCase(fetchCategoriesThunk.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(createCategoryThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(updateCategoryThunk.rejected, (s, a) => { s.error = a.payload as string; })
      .addCase(deleteCategoryThunk.rejected, (s, a) => { s.error = a.payload as string; });
  },
});

export default categoriesSlice.reducer;
