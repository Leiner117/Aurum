"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBudgetsThunk,
  fetchSummariesThunk,
  createBudgetThunk,
  updateBudgetThunk,
  deleteBudgetThunk,
  processRecurringBudgetsThunk,
  fetchMonthlyIncomeThunk,
  updateMonthlyIncomeThunk,
  fetchComplianceThunk,
  setMonth as setMonthAction,
  setWeek as setWeekAction,
  setPeriodType as setPeriodTypeAction,
} from "@/store/slices/budgetsSlice";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import { getCurrentISOWeek } from "@/lib/week-utils";
import type {
  BudgetOverview,
  BudgetComplianceMonth,
  BudgetPeriodType,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/budget.types";
import type { BudgetSummary } from "@/types/budget.types";

export interface BudgetsViewModelReturn {
  budgets: ReturnType<typeof useAppSelector<ReturnType<typeof useAppSelector>>>;
  summaries: BudgetSummary[];
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  selectedPeriodType: BudgetPeriodType;
  selectedWeek: number;
  monthlyIncome: number | null;
  monthlyIncomeCurrency: string;
  isIncomeLoading: boolean;
  compliance: BudgetComplianceMonth[];
  isComplianceLoading: boolean;
  overview: BudgetOverview;
  defaultCurrency: string;
  setMonth: (month: number, year: number) => void;
  setWeek: (week: number, year: number) => void;
  setPeriodType: (type: BudgetPeriodType) => void;
  setMonthlyIncome: (amount: number | null, currency: string) => Promise<boolean>;
  createBudget: (data: CreateBudgetInput) => Promise<boolean>;
  updateBudget: (data: UpdateBudgetInput) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  refetch: () => void;
}

export const useBudgetsViewModel = () => {
  const dispatch = useAppDispatch();
  const {
    items: budgets,
    summaries,
    selectedMonth,
    selectedYear,
    selectedPeriodType: rawSelectedPeriodType,
    selectedWeek: rawSelectedWeek,
    isLoading,
    isSummaryLoading,
    error,
    monthlyIncome,
    monthlyIncomeCurrency,
    isIncomeLoading,
    compliance,
    isComplianceLoading,
  } = useAppSelector((s) => s.budgets);

  // Defensive fallback for state persisted before weekly budgets existed.
  const selectedPeriodType = rawSelectedPeriodType ?? "monthly";
  const selectedWeek = rawSelectedWeek ?? getCurrentISOWeek().week;

  const { defaultCurrency } = useCurrencyViewModel();

  const incomeFetched = useRef(false);

  useEffect(() => {
    dispatch(
      fetchBudgetsThunk({
        month: selectedMonth,
        year: selectedYear,
        periodType: selectedPeriodType,
        weekNumber: selectedWeek,
      })
    );
    dispatch(
      fetchSummariesThunk({
        month: selectedMonth,
        year: selectedYear,
        periodType: selectedPeriodType,
        weekNumber: selectedWeek,
      })
    );
    dispatch(processRecurringBudgetsThunk());
  }, [dispatch, selectedMonth, selectedYear, selectedPeriodType, selectedWeek]);

  useEffect(() => {
    if (!incomeFetched.current) {
      incomeFetched.current = true;
      dispatch(fetchMonthlyIncomeThunk());
    }
  }, [dispatch]);

  useEffect(() => {
    if (selectedPeriodType !== "monthly") return;
    const refCurrency = defaultCurrency ?? "USD";
    dispatch(fetchComplianceThunk({ year: selectedYear, currency: refCurrency }));
  }, [dispatch, selectedYear, defaultCurrency, selectedPeriodType]);

  const overview = useMemo<BudgetOverview>(() => {
    const refCurrency = defaultCurrency ?? "USD";
    const totalBudgeted = summaries
      .filter((r) => r.budget_currency === refCurrency)
      .reduce((s, r) => s + r.budget_amount, 0);
    const canCompare = monthlyIncomeCurrency === refCurrency;
    return {
      monthlyIncome,
      monthlyIncomeCurrency,
      totalBudgeted,
      impliedSavings:
        monthlyIncome !== null && canCompare ? monthlyIncome - totalBudgeted : null,
      currency: refCurrency,
    };
  }, [summaries, monthlyIncome, monthlyIncomeCurrency, defaultCurrency]);

  const setMonth = (month: number, year: number) =>
    dispatch(setMonthAction({ month, year }));

  const setWeek = (week: number, year: number) =>
    dispatch(setWeekAction({ week, year }));

  const setPeriodType = (type: BudgetPeriodType) =>
    dispatch(setPeriodTypeAction(type));

  const setMonthlyIncome = async (amount: number | null, currency: string): Promise<boolean> => {
    const result = await dispatch(updateMonthlyIncomeThunk({ amount, currency }));
    return !result.type.endsWith("/rejected");
  };

  const createBudget = async (data: CreateBudgetInput): Promise<boolean> => {
    const result = await dispatch(createBudgetThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const updateBudget = async (data: UpdateBudgetInput): Promise<boolean> => {
    const result = await dispatch(updateBudgetThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const deleteBudget = async (id: string): Promise<boolean> => {
    const result = await dispatch(deleteBudgetThunk(id));
    return !result.type.endsWith("/rejected");
  };

  const refetch = () => {
    dispatch(
      fetchBudgetsThunk({
        month: selectedMonth,
        year: selectedYear,
        periodType: selectedPeriodType,
        weekNumber: selectedWeek,
      })
    );
    dispatch(
      fetchSummariesThunk({
        month: selectedMonth,
        year: selectedYear,
        periodType: selectedPeriodType,
        weekNumber: selectedWeek,
      })
    );
  };

  return {
    budgets,
    summaries,
    isLoading,
    isSummaryLoading,
    error,
    selectedMonth,
    selectedYear,
    selectedPeriodType,
    selectedWeek,
    monthlyIncome,
    monthlyIncomeCurrency,
    isIncomeLoading,
    compliance,
    isComplianceLoading,
    overview,
    defaultCurrency: defaultCurrency ?? "USD",
    setMonth,
    setWeek,
    setPeriodType,
    setMonthlyIncome,
    createBudget,
    updateBudget,
    deleteBudget,
    refetch,
  };
};
