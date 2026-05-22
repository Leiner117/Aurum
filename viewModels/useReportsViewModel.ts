"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchReportsThunk,
  setMonthsBack as setMonthsBackAction,
  setSelectedCategoryIds as setSelectedCategoryIdsAction,
  setExpenseSortBy as setExpenseSortByAction,
} from "@/store/slices/reportsSlice";
import type {
  ReportExpenseRow,
  CategorySpending,
  MonthlyTrend,
  DailySpending,
  ExpenseSortKey,
} from "@/store/slices/reportsSlice";
import {
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  parseISO,
} from "date-fns";

export type { ReportExpenseRow, CategorySpending, MonthlyTrend, DailySpending, ExpenseSortKey };

export interface AvailableCategory {
  id: string | null;
  key: string;
  name: string;
  color: string;
}

export interface ReportsViewModelReturn {
  rawRows: ReportExpenseRow[];
  categorySpending: CategorySpending[];
  monthlyTrend: MonthlyTrend[];
  dailySpending: DailySpending[];
  sortedExpenses: ReportExpenseRow[];
  availableCategories: AvailableCategory[];
  totalThisMonth: number;
  totalLastMonth: number;
  totalPeriod: number;
  isLoading: boolean;
  error: string | null;
  monthsBack: number;
  selectedCategoryIds: string[];
  expenseSortBy: ExpenseSortKey;
  setMonthsBack: (n: number) => void;
  setSelectedCategoryIds: (ids: string[]) => void;
  setExpenseSortBy: (key: ExpenseSortKey) => void;
  refetch: () => void;
}

export const useReportsViewModel = (): ReportsViewModelReturn => {
  const dispatch = useAppDispatch();
  const { rawRows, monthsBack, selectedCategoryIds, expenseSortBy, isLoading, error } =
    useAppSelector((s) => s.reports);

  useEffect(() => {
    dispatch(fetchReportsThunk(monthsBack));
  }, [dispatch, monthsBack]);

  const filteredRows = useMemo(() => {
    if (selectedCategoryIds.length === 0) return rawRows;
    return rawRows.filter((r) => {
      const key = r.category_id ?? "uncategorized";
      return selectedCategoryIds.includes(key);
    });
  }, [rawRows, selectedCategoryIds]);

  const availableCategories = useMemo<AvailableCategory[]>(() => {
    const seen = new Map<string, AvailableCategory>();
    rawRows.forEach((r) => {
      const key = r.category_id ?? "uncategorized";
      if (!seen.has(key)) {
        seen.set(key, { id: r.category_id, key, name: r.category_name, color: r.category_color });
      }
    });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawRows]);

  const categorySpending = useMemo<CategorySpending[]>(() => {
    const catMap = new Map<string, CategorySpending>();
    filteredRows.forEach((r) => {
      const key = r.category_id ?? "uncategorized";
      const existing = catMap.get(key);
      if (existing) {
        existing.total += r.amount;
      } else {
        catMap.set(key, {
          category_id: r.category_id,
          category_name: r.category_name,
          category_color: r.category_color,
          total: r.amount,
        });
      }
    });
    return Array.from(catMap.values()).sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  const monthlyTrend = useMemo<MonthlyTrend[]>(() => {
    const now = new Date();
    const monthMap = new Map<string, number>();
    for (let i = monthsBack - 1; i >= 0; i--) {
      monthMap.set(format(subMonths(now, i), "MMM yy"), 0);
    }
    filteredRows.forEach((r) => {
      const label = format(parseISO(r.date), "MMM yy");
      if (monthMap.has(label)) monthMap.set(label, (monthMap.get(label) ?? 0) + r.amount);
    });
    return Array.from(monthMap.entries()).map(([month, total]) => ({ month, total }));
  }, [filteredRows, monthsBack]);

  const dailySpending = useMemo<DailySpending[]>(() => {
    const now = new Date();
    const days = eachDayOfInterval({ start: startOfMonth(now), end: now });
    const dayMap = new Map<string, number>(days.map((d) => [format(d, "dd"), 0]));
    const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
    filteredRows
      .filter((r) => r.date >= thisMonthStart)
      .forEach((r) => {
        const day = format(parseISO(r.date), "dd");
        if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + r.amount);
      });
    return Array.from(dayMap.entries()).map(([day, total]) => ({ day, total }));
  }, [filteredRows]);

  const now = new Date();
  const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

  const totalThisMonth = useMemo(
    () => filteredRows.filter((r) => r.date >= thisMonthStart).reduce((s, r) => s + r.amount, 0),
    [filteredRows, thisMonthStart]
  );

  const totalLastMonth = useMemo(
    () =>
      filteredRows
        .filter((r) => r.date >= lastMonthStart && r.date <= lastMonthEnd)
        .reduce((s, r) => s + r.amount, 0),
    [filteredRows, lastMonthStart, lastMonthEnd]
  );

  const totalPeriod = useMemo(
    () => filteredRows.reduce((s, r) => s + r.amount, 0),
    [filteredRows]
  );

  const sortedExpenses = useMemo<ReportExpenseRow[]>(() => {
    return [...filteredRows].sort((a, b) => {
      switch (expenseSortBy) {
        case "date_desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date_asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount_desc":
          return b.amount - a.amount;
        case "amount_asc":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
  }, [filteredRows, expenseSortBy]);

  const setMonthsBack = (n: number) => dispatch(setMonthsBackAction(n));
  const setSelectedCategoryIds = (ids: string[]) => dispatch(setSelectedCategoryIdsAction(ids));
  const setExpenseSortBy = (key: ExpenseSortKey) => dispatch(setExpenseSortByAction(key));
  const refetch = () => dispatch(fetchReportsThunk(monthsBack));

  return {
    rawRows,
    categorySpending,
    monthlyTrend,
    dailySpending,
    sortedExpenses,
    availableCategories,
    totalThisMonth,
    totalLastMonth,
    totalPeriod,
    isLoading,
    error,
    monthsBack,
    selectedCategoryIds,
    expenseSortBy,
    setMonthsBack,
    setSelectedCategoryIds,
    setExpenseSortBy,
    refetch,
  };
};
