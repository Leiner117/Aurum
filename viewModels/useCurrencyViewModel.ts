"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import { fetchExchangeRates, convertAmount } from "@/lib/currency/convert";

export interface CurrencyViewModelReturn {
  defaultCurrency: string;
  rates: Record<string, number>;
  isLoadingRates: boolean;
  convert: (amount: number, from: string, to?: string) => number;
  setDefaultCurrency: (currency: string) => Promise<boolean>;
}

export function useCurrencyViewModel(): CurrencyViewModelReturn {
  const [defaultCurrency, setDefaultCurrencyState] = useState(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const supabase = createClient();

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from(SUPABASE_TABLES.PROFILES)
      .select("default_currency")
      .eq("id", user.id)
      .single();

    if (data?.default_currency) {
      setDefaultCurrencyState(data.default_currency);
    }
  }, [supabase]);

  const loadRates = useCallback(async (base: string) => {
    if (!process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY) return;
    try {
      setIsLoadingRates(true);
      const fetchedRates = await fetchExchangeRates(base);
      setRates(fetchedRates);
    } catch {
      // Silently fail — rates will be unavailable
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (defaultCurrency) loadRates(defaultCurrency);
  }, [defaultCurrency, loadRates]);

  function convert(amount: number, from: string, to?: string): number {
    const target = to ?? defaultCurrency;
    if (!Object.keys(rates).length || from === target) return amount;
    return convertAmount(amount, from, target, rates);
  }

  async function setDefaultCurrency(currency: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from(SUPABASE_TABLES.PROFILES)
        .update({ default_currency: currency })
        .eq("id", user.id);

      if (error) throw error;
      setDefaultCurrencyState(currency);
      return true;
    } catch {
      return false;
    }
  }

  return { defaultCurrency, rates, isLoadingRates, convert, setDefaultCurrency };
}
