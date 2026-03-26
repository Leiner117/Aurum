"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchExpensesThunk,
  createExpenseThunk,
  updateExpenseThunk,
  deleteExpenseThunk,
  setFilters as setFiltersAction,
  setPage as setPageAction,
} from "@/store/slices/expensesSlice";
import { EXPENSES_PAGE_SIZE } from "@/constants/expenses.constants";
import type { CreateExpenseInput, UpdateExpenseInput, ExpenseFilters } from "@/types/expense.types";

export interface ExpensesViewModelReturn {
  expenses: ReturnType<typeof useAppSelector<ReturnType<typeof useAppSelector>>>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filters: ExpenseFilters;
  setFilters: (filters: ExpenseFilters) => void;
  setPage: (page: number) => void;
  createExpense: (data: CreateExpenseInput) => Promise<boolean>;
  updateExpense: (data: UpdateExpenseInput) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  refetch: () => void;
}

export const useExpensesViewModel = () => {
  const dispatch = useAppDispatch();
  const { items: expenses, totalCount, currentPage, isLoading, error, filters } = useAppSelector(
    (s) => s.expenses
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / EXPENSES_PAGE_SIZE));

  useEffect(() => {
    dispatch(fetchExpensesThunk({ filters, page: currentPage }));
  }, [dispatch, filters, currentPage]);

  const setFilters = (newFilters: ExpenseFilters) => dispatch(setFiltersAction(newFilters));
  const setPage = (page: number) => dispatch(setPageAction(page));

  const createExpense = async (data: CreateExpenseInput): Promise<boolean> => {
    const result = await dispatch(createExpenseThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const updateExpense = async (data: UpdateExpenseInput): Promise<boolean> => {
    const result = await dispatch(updateExpenseThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    const result = await dispatch(deleteExpenseThunk(id));
    return !result.type.endsWith("/rejected");
  };

  const refetch = () => dispatch(fetchExpensesThunk({ filters, page: currentPage }));

  return {
    expenses,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
    setPage,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch,
  };
};
