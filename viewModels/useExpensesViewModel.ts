"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { EXPENSES_PAGE_SIZE } from "@/constants/expenses.constants";
import type {
  ExpenseWithCategory,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilters,
} from "@/types/expense.types";

export interface ExpensesViewModelReturn {
  expenses: ExpenseWithCategory[];
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
  refetch: () => Promise<void>;
}

export function useExpensesViewModel(): ExpensesViewModelReturn {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ExpenseFilters>({});
  const supabase = createClient();

  const totalPages = Math.max(1, Math.ceil(totalCount / EXPENSES_PAGE_SIZE));

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from(SUPABASE_TABLES.EXPENSES)
        .select("*, category:categories(id, name, icon, color)", { count: "exact" });

      if (filters.type) query = query.eq("type", filters.type);
      if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
      if (filters.startDate) query = query.gte("date", filters.startDate);
      if (filters.endDate) query = query.lte("date", filters.endDate);
      if (filters.minAmount) query = query.gte("amount", filters.minAmount);
      if (filters.maxAmount) query = query.lte("amount", filters.maxAmount);
      if (filters.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }

      const sortMap: Record<string, { col: string; asc: boolean }> = {
        date_desc: { col: "date", asc: false },
        date_asc: { col: "date", asc: true },
        amount_desc: { col: "amount", asc: false },
        amount_asc: { col: "amount", asc: true },
      };
      const sort = sortMap[filters.sortBy ?? "date_desc"];
      query = query.order(sort.col, { ascending: sort.asc });

      const from = (currentPage - 1) * EXPENSES_PAGE_SIZE;
      query = query.range(from, from + EXPENSES_PAGE_SIZE - 1);

      const { data, error: dbError, count } = await query;
      if (dbError) throw dbError;

      // Cast needed: Supabase can't infer join shape without FK in Relationships
      setExpenses((data as unknown as ExpenseWithCategory[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, filters, currentPage]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  function setFilters(newFilters: ExpenseFilters) {
    setFiltersState(newFilters);
    setCurrentPage(1);
  }

  async function createExpense(input: CreateExpenseInput): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.EXPENSES)
        .insert({ ...input, user_id: user.id });

      if (dbError) throw dbError;
      await fetchExpenses();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense");
      return false;
    }
  }

  async function updateExpense({ id, ...input }: UpdateExpenseInput): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.EXPENSES)
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (dbError) throw dbError;
      await fetchExpenses();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expense");
      return false;
    }
  }

  async function deleteExpense(id: string): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.EXPENSES)
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setTotalCount((prev) => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
      return false;
    }
  }

  return {
    expenses,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
    setPage: setCurrentPage,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}
