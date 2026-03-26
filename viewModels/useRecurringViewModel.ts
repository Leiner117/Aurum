"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { isDue, getNextDate } from "@/lib/recurrence";
import type {
  RecurringExpenseWithCategory,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from "@/types/recurring.types";

export interface RecurringViewModelReturn {
  recurring: RecurringExpenseWithCategory[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  generatedCount: number;
  createRecurring: (data: CreateRecurringExpenseInput) => Promise<boolean>;
  updateRecurring: (data: UpdateRecurringExpenseInput) => Promise<boolean>;
  toggleActive: (id: string, isActive: boolean) => Promise<boolean>;
  deleteRecurring: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useRecurringViewModel(): RecurringViewModelReturn {
  const [recurring, setRecurring] = useState<RecurringExpenseWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const supabase = createClient();

  const fetchRecurring = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from(SUPABASE_TABLES.RECURRING_EXPENSES)
        .select("*, category:categories(id, name, icon, color)")
        .order("next_date");

      if (dbError) throw dbError;
      setRecurring((data as unknown as RecurringExpenseWithCategory[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recurring expenses");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Recurrence engine — runs once on mount, generates all due expenses
  const processRecurring = useCallback(async () => {
    try {
      setIsProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dueItems } = await supabase
        .from(SUPABASE_TABLES.RECURRING_EXPENSES)
        .select("*")
        .eq("is_active", true);

      if (!dueItems?.length) return;

      const dueTodayOrPast = dueItems.filter((item) => isDue(item.next_date));
      if (!dueTodayOrPast.length) return;

      let count = 0;

      for (const item of dueTodayOrPast) {
        // Insert expense
        await supabase.from(SUPABASE_TABLES.EXPENSES).insert({
          user_id: user.id,
          category_id: item.category_id,
          amount: item.amount,
          currency: item.currency,
          description: item.description,
          date: item.next_date,
          is_recurring: true,
          recurring_expense_id: item.id,
        });

        // Advance next_date
        const nextDate = getNextDate(item.next_date, item.frequency);
        await supabase
          .from(SUPABASE_TABLES.RECURRING_EXPENSES)
          .update({ next_date: nextDate, updated_at: new Date().toISOString() })
          .eq("id", item.id);

        count++;
      }

      if (count > 0) {
        setGeneratedCount(count);
        await fetchRecurring();
      }
    } catch {
      // Engine errors are non-critical — fail silently
    } finally {
      setIsProcessing(false);
    }
  }, [supabase, fetchRecurring]);

  useEffect(() => {
    fetchRecurring();
    processRecurring();
  }, [fetchRecurring, processRecurring]);

  async function createRecurring(input: CreateRecurringExpenseInput): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.RECURRING_EXPENSES)
        .insert({ ...input, user_id: user.id });

      if (dbError) throw dbError;
      await fetchRecurring();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create recurring expense");
      return false;
    }
  }

  async function updateRecurring({ id, ...input }: UpdateRecurringExpenseInput): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.RECURRING_EXPENSES)
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (dbError) throw dbError;
      await fetchRecurring();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update recurring expense");
      return false;
    }
  }

  async function toggleActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.RECURRING_EXPENSES)
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (dbError) throw dbError;
      setRecurring((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r))
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle recurring expense");
      return false;
    }
  }

  async function deleteRecurring(id: string): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.RECURRING_EXPENSES)
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
      setRecurring((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recurring expense");
      return false;
    }
  }

  return {
    recurring,
    isLoading,
    isProcessing,
    error,
    generatedCount,
    createRecurring,
    updateRecurring,
    toggleActive,
    deleteRecurring,
    refetch: fetchRecurring,
  };
}
