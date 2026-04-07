"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createClient } from "@/lib/supabase/client";
import { fetchExpensesThunk } from "@/store/slices/expensesSlice";
import { fetchAccountsThunk } from "@/store/slices/accountsSlice";
import { fetchTransfersThunk } from "@/store/slices/transfersSlice";
import { fetchBudgetsThunk, fetchSummariesThunk } from "@/store/slices/budgetsSlice";
import { fetchGoalsThunk } from "@/store/slices/goalsSlice";
import { fetchReportsThunk } from "@/store/slices/reportsSlice";
import type { ExpenseFilters } from "@/types/expense.types";

interface SyncState {
  expenseFilters: ExpenseFilters;
  expensePage: number;
  budgetMonth: number;
  budgetYear: number;
  monthsBack: number;
}

export const useRealtimeSyncViewModel = () => {
  const dispatch = useAppDispatch();

  const expenseFilters = useAppSelector((s) => s.expenses.filters);
  const expensePage = useAppSelector((s) => s.expenses.currentPage);
  const budgetMonth = useAppSelector((s) => s.budgets.selectedMonth);
  const budgetYear = useAppSelector((s) => s.budgets.selectedYear);
  const monthsBack = useAppSelector((s) => s.reports.monthsBack);

  const stateRef = useRef<SyncState>({
    expenseFilters,
    expensePage,
    budgetMonth,
    budgetYear,
    monthsBack,
  });

  useEffect(() => {
    stateRef.current = { expenseFilters, expensePage, budgetMonth, budgetYear, monthsBack };
  }, [expenseFilters, expensePage, budgetMonth, budgetYear, monthsBack]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => {
        const { expenseFilters, expensePage, monthsBack } = stateRef.current;
        dispatch(fetchExpensesThunk({ filters: expenseFilters, page: expensePage }));
        dispatch(fetchReportsThunk(monthsBack));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts" }, () => {
        dispatch(fetchAccountsThunk());
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "transfers" }, () => {
        dispatch(fetchTransfersThunk());
        dispatch(fetchAccountsThunk());
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, () => {
        const { budgetMonth, budgetYear } = stateRef.current;
        dispatch(fetchBudgetsThunk({ month: budgetMonth, year: budgetYear }));
        dispatch(fetchSummariesThunk({ month: budgetMonth, year: budgetYear }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => {
        dispatch(fetchGoalsThunk());
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_contributions" }, () => {
        dispatch(fetchGoalsThunk());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]);
};
