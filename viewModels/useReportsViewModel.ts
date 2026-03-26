"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import { subMonths, startOfMonth, endOfMonth, format, eachDayOfInterval, parseISO } from "date-fns";

export interface CategorySpending {
  category_id: string | null;
  category_name: string;
  category_color: string;
  total: number;
}

export interface MonthlyTrend {
  month: string;       // "Jan 25"
  total: number;
}

export interface DailySpending {
  day: string;         // "01", "02" ...
  total: number;
}

export interface BudgetVsActual {
  category_name: string;
  budget: number;
  actual: number;
}

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
  refetch: () => Promise<void>;
}

export function useReportsViewModel(): ReportsViewModelReturn {
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [dailySpending, setDailySpending] = useState<DailySpending[]>([]);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [totalLastMonth, setTotalLastMonth] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthsBack, setMonthsBack] = useState(6);
  const supabase = createClient();

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      const rangeStart = format(startOfMonth(subMonths(now, monthsBack - 1)), "yyyy-MM-dd");
      const rangeEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

      const { data: expenses, error: dbError } = await supabase
        .from(SUPABASE_TABLES.EXPENSES)
        .select("amount, currency, date, category_id, categories(name, color)")
        .eq("type", "expense")
        .gte("date", rangeStart)
        .lte("date", rangeEnd);

      if (dbError) throw dbError;

      type ExpenseRow = {
        amount: number;
        currency: string;
        date: string;
        category_id: string | null;
        categories: { name: string; color: string } | null;
      };
      const rows = (expenses as unknown as ExpenseRow[]) ?? [];

      // ── Category spending ──────────────────────────────
      const catMap = new Map<string, CategorySpending>();
      rows.forEach((r) => {
        const key = r.category_id ?? "uncategorized";
        const existing = catMap.get(key);
        if (existing) {
          existing.total += r.amount;
        } else {
          catMap.set(key, {
            category_id: r.category_id,
            category_name: r.categories?.name ?? "Uncategorized",
            category_color: r.categories?.color ?? "#64748b",
            total: r.amount,
          });
        }
      });
      setCategorySpending(
        Array.from(catMap.values()).sort((a, b) => b.total - a.total)
      );

      // ── Monthly trend ──────────────────────────────────
      const monthMap = new Map<string, number>();
      for (let i = monthsBack - 1; i >= 0; i--) {
        const label = format(subMonths(now, i), "MMM yy");
        monthMap.set(label, 0);
      }
      rows.forEach((r) => {
        const label = format(parseISO(r.date), "MMM yy");
        if (monthMap.has(label)) monthMap.set(label, (monthMap.get(label) ?? 0) + r.amount);
      });
      setMonthlyTrend(
        Array.from(monthMap.entries()).map(([month, total]) => ({ month, total }))
      );

      // ── Daily spending (current month) ─────────────────
      const days = eachDayOfInterval({ start: startOfMonth(now), end: now });
      const dayMap = new Map<string, number>(days.map((d) => [format(d, "dd"), 0]));
      rows
        .filter((r) => r.date >= thisMonthStart)
        .forEach((r) => {
          const day = format(parseISO(r.date), "dd");
          if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + r.amount);
        });
      setDailySpending(
        Array.from(dayMap.entries()).map(([day, total]) => ({ day, total }))
      );

      // ── Totals ─────────────────────────────────────────
      const thisMonth = rows.filter((r) => r.date >= thisMonthStart);
      const lastMonth = rows.filter((r) => r.date >= lastMonthStart && r.date <= lastMonthEnd);
      setTotalThisMonth(thisMonth.reduce((s, r) => s + r.amount, 0));
      setTotalLastMonth(lastMonth.reduce((s, r) => s + r.amount, 0));
      setTotalExpenses(rows.reduce((s, r) => s + r.amount, 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, monthsBack]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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
    refetch: fetchReports,
  };
}
