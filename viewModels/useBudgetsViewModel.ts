"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBudgetsThunk,
  fetchSummariesThunk,
  createBudgetThunk,
  updateBudgetThunk,
  deleteBudgetThunk,
  processRecurringBudgetsThunk,
  setMonth as setMonthAction,
} from "@/store/slices/budgetsSlice";
import type { CreateBudgetInput, UpdateBudgetInput } from "@/types/budget.types";

export interface BudgetsViewModelReturn {
  budgets: ReturnType<typeof useAppSelector<ReturnType<typeof useAppSelector>>>;
  summaries: ReturnType<typeof useAppSelector<ReturnType<typeof useAppSelector>>>;
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  setMonth: (month: number, year: number) => void;
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
  } = useAppSelector((s) => s.budgets);

  useEffect(() => {
    dispatch(fetchBudgetsThunk({ month: selectedMonth, year: selectedYear }));
    dispatch(fetchSummariesThunk({ month: selectedMonth, year: selectedYear }));
    dispatch(processRecurringBudgetsThunk());
  }, [dispatch, selectedMonth, selectedYear]);

  const setMonth = (month: number, year: number) => dispatch(setMonthAction({ month, year }));

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
    setMonth,
    createBudget,
    updateBudget,
    deleteBudget,
    refetch,
  };
};
