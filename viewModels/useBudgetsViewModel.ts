"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES, SUPABASE_FUNCTIONS } from "@/constants/supabase.constants";
import { BUDGET_ALERT_THRESHOLD_DEFAULT } from "@/constants/budgets.constants";
import type {
  Budget,
  BudgetSummary,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/budget.types";

export interface BudgetsViewModelReturn {
  budgets: Budget[];
  summaries: BudgetSummary[];
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  setMonth: (month: number, year: number) => void;
  createBudget: (data: CreateBudgetInput) => Promise<boolean>;
  updateBudget: (data: UpdateBudgetInput) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useBudgetsViewModel(): BudgetsViewModelReturn {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summaries, setSummaries] = useState<BudgetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from(SUPABASE_TABLES.BUDGETS)
        .select("*")
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .order("created_at");

      if (dbError) throw dbError;
      setBudgets(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budgets");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedMonth, selectedYear]);

  const fetchSummaries = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: dbError } = await supabase
        .rpc(SUPABASE_FUNCTIONS.GET_BUDGET_SUMMARY, {
          p_user_id: user.id,
          p_month: selectedMonth,
          p_year: selectedYear,
        });

      if (dbError) throw dbError;
      // Map budget_id → id so components can use summary.id consistently
      const mapped = ((data ?? []) as unknown as BudgetSummary[]).map((s) => ({
        ...s,
        id: s.budget_id,
        month: selectedMonth,
        year: selectedYear,
      }));
      setSummaries(mapped);
    } catch {
      // Summaries are non-critical — fail silently
    } finally {
      setIsSummaryLoading(false);
    }
  }, [supabase, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudgets();
    fetchSummaries();
  }, [fetchBudgets, fetchSummaries]);

  function setMonth(month: number, year: number) {
    setSelectedMonth(month);
    setSelectedYear(year);
  }

  async function createBudget(input: CreateBudgetInput): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.BUDGETS)
        .insert({
          ...input,
          user_id: user.id,
          alert_threshold: input.alert_threshold ?? BUDGET_ALERT_THRESHOLD_DEFAULT,
        });

      if (dbError) throw dbError;
      await fetchBudgets();
      await fetchSummaries();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create budget");
      return false;
    }
  }

  async function updateBudget({ id, ...input }: UpdateBudgetInput): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.BUDGETS)
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (dbError) throw dbError;
      await fetchBudgets();
      await fetchSummaries();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget");
      return false;
    }
  }

  async function deleteBudget(id: string): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.BUDGETS)
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete budget");
      return false;
    }
  }

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
    refetch: fetchBudgets,
  };
}
