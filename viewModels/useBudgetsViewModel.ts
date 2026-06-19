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
} from "@/store/slices/budgetsSlice";
import type { BudgetOverview, BudgetComplianceMonth, CreateBudgetInput, UpdateBudgetInput } from "@/types/budget.types";
import type { BudgetSummary } from "@/types/budget.types";

export interface BudgetsViewModelReturn {
  budgets: ReturnType<typeof useAppSelector<ReturnType<typeof useAppSelector>>>;
  summaries: BudgetSummary[];
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  monthlyIncome: number | null;
  isIncomeLoading: boolean;
  compliance: BudgetComplianceMonth[];
  isComplianceLoading: boolean;
  overview: BudgetOverview;
  setMonth: (month: number, year: number) => void;
  setMonthlyIncome: (amount: number | null) => Promise<boolean>;
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
    isLoading,
    isSummaryLoading,
    error,
    monthlyIncome,
    isIncomeLoading,
    compliance,
    isComplianceLoading,
  } = useAppSelector((s) => s.budgets);

  const incomeFetched = useRef(false);

  useEffect(() => {
    dispatch(fetchBudgetsThunk({ month: selectedMonth, year: selectedYear }));
    dispatch(fetchSummariesThunk({ month: selectedMonth, year: selectedYear }));
    dispatch(processRecurringBudgetsThunk());
  }, [dispatch, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!incomeFetched.current) {
      incomeFetched.current = true;
      dispatch(fetchMonthlyIncomeThunk());
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchComplianceThunk(selectedYear));
  }, [dispatch, selectedYear]);

  const overview = useMemo<BudgetOverview>(() => {
    const totalBudgeted = summaries.reduce((s, r) => s + r.budget_amount, 0);
    const currency = summaries[0]?.budget_currency ?? "USD";
    return {
      monthlyIncome,
      totalBudgeted,
      impliedSavings: monthlyIncome !== null ? monthlyIncome - totalBudgeted : null,
      currency,
    };
  }, [summaries, monthlyIncome]);

  const setMonth = (month: number, year: number) => dispatch(setMonthAction({ month, year }));

  const setMonthlyIncome = async (amount: number | null): Promise<boolean> => {
    const result = await dispatch(updateMonthlyIncomeThunk(amount));
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
    dispatch(fetchBudgetsThunk({ month: selectedMonth, year: selectedYear }));
    dispatch(fetchSummariesThunk({ month: selectedMonth, year: selectedYear }));
  };

  return {
    budgets,
    summaries,
    isLoading,
    isSummaryLoading,
    error,
    selectedMonth,
    selectedYear,
    monthlyIncome,
    isIncomeLoading,
    compliance,
    isComplianceLoading,
    overview,
    setMonth,
    setMonthlyIncome,
    createBudget,
    updateBudget,
    deleteBudget,
    refetch,
  };
};
