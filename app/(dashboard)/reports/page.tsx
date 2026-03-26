"use client";

import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/reports/ChartCard";
import { SpendingByCategoryChart } from "@/components/reports/SpendingByCategoryChart";
import { MonthlyTrendChart } from "@/components/reports/MonthlyTrendChart";
import { DailySpendingChart } from "@/components/reports/DailySpendingChart";
import { PeriodSelector } from "@/components/reports/PeriodSelector";
import { useReportsViewModel } from "@/viewModels/useReportsViewModel";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import { useExpensesViewModel } from "@/viewModels/useExpensesViewModel";
import { exportExpensesToCsv } from "@/lib/export";
import { formatCurrency } from "@/lib/currency/format";
import { format } from "date-fns";

export default function ReportsPage() {
  const {
    categorySpending,
    monthlyTrend,
    dailySpending,
    totalThisMonth,
    totalLastMonth,
    isLoading,
    monthsBack,
    setMonthsBack,
  } = useReportsViewModel();

  const { defaultCurrency } = useCurrencyViewModel();
  const { expenses } = useExpensesViewModel();

  const monthLabel = format(new Date(), "MMMM yyyy");
  const diff = totalThisMonth - totalLastMonth;
  const diffSign = diff >= 0 ? "+" : "";

  function handleExport() {
    const filename = `expenses-${format(new Date(), "yyyy-MM")}.csv`;
    exportExpensesToCsv(expenses, filename);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Visualize your spending patterns."
        actions={
          <div className="flex items-center gap-2">
            <PeriodSelector value={monthsBack} onChange={setMonthsBack} />
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">{monthLabel}</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-foreground)]">
            {formatCurrency(totalThisMonth, defaultCurrency)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">vs last month</p>
          <p className={`mt-1 text-xl font-semibold ${diff > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>
            {diffSign}{formatCurrency(Math.abs(diff), defaultCurrency)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-[var(--color-muted-foreground)]">Period total</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-foreground)]">
            {formatCurrency(monthlyTrend.reduce((s, m) => s + m.total, 0), defaultCurrency)}
          </p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Spending by Category" isLoading={isLoading}>
          <SpendingByCategoryChart data={categorySpending} currency={defaultCurrency} />
        </ChartCard>

        <ChartCard title="Monthly Trend" isLoading={isLoading}>
          <MonthlyTrendChart data={monthlyTrend} currency={defaultCurrency} />
        </ChartCard>

        <ChartCard title={`Daily Spending — ${monthLabel}`} isLoading={isLoading}>
          <DailySpendingChart data={dailySpending} currency={defaultCurrency} />
        </ChartCard>

        <ChartCard title="Top Categories" isLoading={isLoading}>
          <ul className="space-y-3">
            {categorySpending.slice(0, 6).map((cat) => {
              const maxTotal = categorySpending[0]?.total ?? 1;
              const pct = Math.round((cat.total / maxTotal) * 100);
              return (
                <li key={cat.category_id ?? "none"} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-foreground)]">{cat.category_name}</span>
                    <span className="font-medium">{formatCurrency(cat.total, defaultCurrency)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.category_color }}
                    />
                  </div>
                </li>
              );
            })}
            {!isLoading && !categorySpending.length && (
              <p className="py-4 text-center text-sm text-[var(--color-muted-foreground)]">No data yet.</p>
            )}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
