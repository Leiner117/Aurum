import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { DEFAULT_CURRENCY } from "@/constants/currency.constants";

interface CurrencyState {
  defaultCurrency: string;
  rates: Record<string, number>;
  isLoadingRates: boolean;
}

const initialState: CurrencyState = {
  defaultCurrency: DEFAULT_CURRENCY,
  rates: {},
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
        .select("base_currency, target_currency, rate");
      if (error) return rejectWithValue(error.message);

      // Build a rates object where every value is relative to `base`.
      // convertAmount uses rates[to] / rates[from], so we need both
      // base currency and all others expressed in the same unit.
      const rates: Record<string, number> = { [base]: 1 };
      for (const row of data ?? []) {
        if (row.base_currency === "USD" && row.target_currency === "CRC") {
          if (base === "USD") {
            rates["CRC"] = row.rate;          // 1 USD = X CRC
          } else if (base === "CRC") {
            rates["USD"] = 1 / row.rate;      // 1 CRC = 1/X USD
          }
        }
      }
      return rates;
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
        s.rates = (a.payload as Record<string, number>) ?? {};
      })
      .addCase(loadExchangeRatesThunk.rejected, (s) => { s.isLoadingRates = false; })
      .addCase(setDefaultCurrencyThunk.fulfilled, (s, a) => { s.defaultCurrency = a.payload as string; });
  },
});

export default currencySlice.reducer;
