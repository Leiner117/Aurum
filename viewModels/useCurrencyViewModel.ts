"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loadCurrencyProfileThunk,
  loadExchangeRatesThunk,
  setDefaultCurrencyThunk,
} from "@/store/slices/currencySlice";
import { convertAmount } from "@/lib/currency/convert";

export interface CurrencyViewModelReturn {
  defaultCurrency: string;
  rates: Record<string, number>;
  isLoadingRates: boolean;
  convert: (amount: number, from: string, to?: string) => number;
  setDefaultCurrency: (currency: string) => Promise<boolean>;
}

export const useCurrencyViewModel = (): CurrencyViewModelReturn => {
  const dispatch = useAppDispatch();
  const { defaultCurrency, rates, isLoadingRates } = useAppSelector((s) => s.currency);

  useEffect(() => {
    // Skip if currency profile and rates are already in the persisted store
    if (defaultCurrency && Object.keys(rates).length > 0) return;
    dispatch(loadCurrencyProfileThunk()).then((action) => {
      const currency = action.payload as string;
      if (currency) dispatch(loadExchangeRatesThunk(currency));
    });
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const convert = (amount: number, from: string, to?: string): number => {
    const target = to ?? defaultCurrency;
    if (!Object.keys(rates).length || from === target) return amount;
    return convertAmount(amount, from, target, rates);
  };

  const setDefaultCurrency = async (currency: string): Promise<boolean> => {
    const result = await dispatch(setDefaultCurrencyThunk(currency));
    return !result.type.endsWith("/rejected");
  };

  return { defaultCurrency, rates, isLoadingRates, convert, setDefaultCurrency };
};
