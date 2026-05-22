import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { DEFAULT_CURRENCY } from "@/constants/currency.constants";

interface CurrencyState {
  defaultCurrency: string;
  rates: Record<string, number>;
  buyRate: number | null;
  sellRate: number | null;
  rateUpdatedAt: string | null;
  isLoadingRates: boolean;
}

const initialState: CurrencyState = {
  defaultCurrency: DEFAULT_CURRENCY,
  rates: {},
  buyRate: null,
  sellRate: null,
  rateUpdatedAt: null,
  isLoadingRates: false,
};

export const loadCurrencyProfileThunk = createAsyncThunk(
  "currency/loadProfile",
  async (_, { rejectWithValue }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { data } = await supabase
      .from(SUPABASE_TABLES.PROFILES)
      .select("default_currency")
      .eq("id", user.id)
      .single();
    return data?.default_currency ?? DEFAULT_CURRENCY;
  }
);

export const loadExchangeRatesThunk = createAsyncThunk(
  "currency/loadRates",
  async (base: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(SUPABASE_TABLES.EXCHANGE_RATES)
        .select("*");
      if (error) return rejectWithValue(error.message);

      const rates: Record<string, number> = { [base]: 1 };
      let buyRate: number | null = null;
      let sellRate: number | null = null;
      let rateUpdatedAt: string | null = null;

      for (const row of data ?? []) {
        if (row.base_currency === "USD" && row.target_currency === "CRC") {
          buyRate = row.rate;
          sellRate = row.sell_rate ?? null;
          rateUpdatedAt = row.fetched_at ?? null;

          if (base === "USD") {
            rates["CRC"] = row.rate;
          } else if (base === "CRC") {
            rates["USD"] = 1 / row.rate;
          }
        }
      }

      return { rates, buyRate, sellRate, rateUpdatedAt };
    } catch {
      return rejectWithValue("Failed to fetch exchange rates");
    }
  }
);

export const setDefaultCurrencyThunk = createAsyncThunk(
  "currency/setDefault",
  async (currency: string, { rejectWithValue, dispatch }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return rejectWithValue("Not authenticated");
    const { error } = await supabase
      .from(SUPABASE_TABLES.PROFILES)
      .update({ default_currency: currency })
      .eq("id", user.id);
    if (error) return rejectWithValue(error.message);
    dispatch(loadExchangeRatesThunk(currency));
    return currency;
  }
);

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadCurrencyProfileThunk.fulfilled, (s, a) => { s.defaultCurrency = a.payload; })
      .addCase(loadExchangeRatesThunk.pending, (s) => { s.isLoadingRates = true; })
      .addCase(loadExchangeRatesThunk.fulfilled, (s, a) => {
        s.isLoadingRates = false;
        const payload = a.payload as { rates: Record<string, number>; buyRate: number | null; sellRate: number | null; rateUpdatedAt: string | null };
        s.rates = payload.rates;
        s.buyRate = payload.buyRate;
        s.sellRate = payload.sellRate;
        s.rateUpdatedAt = payload.rateUpdatedAt;
      })
      .addCase(loadExchangeRatesThunk.rejected, (s) => { s.isLoadingRates = false; })
      .addCase(setDefaultCurrencyThunk.fulfilled, (s, a) => { s.defaultCurrency = a.payload as string; });
  },
});

export default currencySlice.reducer;
