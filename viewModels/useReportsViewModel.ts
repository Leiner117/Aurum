"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReportsThunk, setMonthsBack as setMonthsBackAction } from "@/store/slices/reportsSlice";
import type { CategorySpending, MonthlyTrend, DailySpending } from "@/store/slices/reportsSlice";

export type { CategorySpending, MonthlyTrend, DailySpending };

export interface ReportsViewModelReturn {
  categorySpending: CategorySpending[];
  monthlyTrend: MonthlyTrend[];
  dailySpending: DailySpending[];
  totalThisMonth: number;
  totalLastMonth: number;
  totalExpenses: number;
  isLoading: boolean;
  error: string | null;
  monthsBack: number;
  setMonthsBack: (n: number) => void;
  refetch: () => void;
}

export const useReportsViewModel = (): ReportsViewModelReturn => {
  const dispatch = useAppDispatch();
  const {
    categorySpending,
    monthlyTrend,
    dailySpending,
    totalThisMonth,
    totalLastMonth,
    totalExpenses,
    isLoading,
    error,
    monthsBack,
  } = useAppSelector((s) => s.reports);

  useEffect(() => {
    dispatch(fetchReportsThunk(monthsBack));
  }, [dispatch, monthsBack]);

  const setMonthsBack = (n: number) => dispatch(setMonthsBackAction(n));
  const refetch = () => dispatch(fetchReportsThunk(monthsBack));

  return {
    categorySpending,
    monthlyTrend,
    dailySpending,
    totalThisMonth,
    totalLastMonth,
    totalExpenses,
    isLoading,
    error,
    monthsBack,
    setMonthsBack,
    refetch,
  };
};
