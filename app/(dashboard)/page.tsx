"use client";

import Link from "next/link";
import { Plus, Receipt, TrendingUp, TrendingDown, Target, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCard } from "@/components/layout/SummaryCard";
import { ChartCard } from "@/components/reports/ChartCard";
import { SpendingByCategoryChart } from "@/components/reports/SpendingByCategoryChart";
import { MonthlyTrendChart } from "@/components/reports/MonthlyTrendChart";
import { BudgetProgress } from "@/components/budgets/BudgetProgress";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useReportsViewModel } from "@/viewModels/useReportsViewModel";
import { useBudgetsViewModel } from "@/viewModels/useBudgetsViewModel";
import { useExpensesViewModel } from "@/viewModels/useExpensesViewModel";
import { useCategoriesViewModel } from "@/viewModels/useCategoriesViewModel";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import { useAccountsViewModel } from "@/viewModels/useAccountsViewModel";
import { useToast } from "@/providers/ToastProvider";
import { formatCurrency } from "@/lib/currency/format";
import { formatDate } from "@/lib/utils";
import { ROUTES } from "@/constants/routes.constants";
import { format } from "date-fns";
import { useState } from "react";
import type { ExpenseInput } from "@/lib/validators";

const STATUS_BADGE: Record<string, "success" | "warning" | "danger"> = {
  ok: "success",
  warning: "warning",
  exceeded: "danger",
};

const DashboardPage = () => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const { showToast } = useToast();

  const { defaultCurrency } = useCurrencyViewModel();
  const { categorySpending, monthlyTrend, totalThisMonth, totalLastMonth, isLoading: reportsLoading } =
    useReportsViewModel();
  const { summaries } = useBudgetsViewModel();
  const { expenses, isLoading: expensesLoading, createExpense } = useExpensesViewModel();
  const { categories } = useCategoriesViewModel();
  const { accounts } = useAccountsViewModel();

  const recentExpenses = expenses.filter((e) => e.type === "expense").slice(0, 5);
  const diff = totalThisMonth - totalLastMonth;
  const diffSign = diff >= 0 ? "+" : "";
  const trend = diff > 0 ? "up" : diff < 0 ? "down" : "neutral";
  const exceededBudgets = summaries.filter((s) => s.status !== "ok").length;

  const handleQuickAdd = async (data: ExpenseInput) => {
    setQuickAddLoading(true);
    const ok = await createExpense(data);
    setQuickAddLoading(false);
    if (ok) {
      setIsQuickAddOpen(false);
      showToast("Expense added", "success");
    } else {
      showToast("Failed to add expense", "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${format(new Date(), "MMMM yyyy")} overview`}
        actions={
          <Button size="sm" onClick={() => setIsQuickAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Quick add
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="This Month"
          value={formatCurrency(totalThisMonth, defaultCurrency)}
          subtitle={`${diffSign}${formatCurrency(Math.abs(diff), defaultCurrency)} vs last month`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={trend}
        />
        <SummaryCard
          title="Last Month"
          value={formatCurrency(totalLastMonth, defaultCurrency)}
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <SummaryCard
          title="Total Expenses"
          value={String(expenses.length)}
          subtitle="this month"
          icon={<Receipt className="h-5 w-5" />}
        />
        <SummaryCard
          title="Budget Alerts"
          value={String(exceededBudgets)}
          subtitle={exceededBudgets > 0 ? "need attention" : "all on track"}
          icon={<Target className="h-5 w-5" />}
          trend={exceededBudgets > 0 ? "up" : "neutral"}
        />
      </div>

      {/* Charts + recent */}
      <div className="grid gap-4 lg:grid-cols-3 items-stretch">
        {/* Spending by category */}
        <div className="lg:col-span-1 flex flex-col">
          <ChartCard title="Spending by Category" isLoading={reportsLoading} className="flex-1">
            <SpendingByCategoryChart data={categorySpending} currency={defaultCurrency} />
          </ChartCard>
        </div>

        {/* Monthly trend */}
        <div className="lg:col-span-2 flex flex-col">
          <ChartCard title="Monthly Trend" isLoading={reportsLoading} className="flex-1">
            <MonthlyTrendChart data={monthlyTrend} currency={defaultCurrency} />
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent expenses */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Recent Expenses</h3>
            <Link href={ROUTES.EXPENSES}>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {expensesLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : recentExpenses.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                No expenses yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {recentExpenses.map((exp) => (
                  <li key={exp.id} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: (exp.category?.color ?? "#64748b") + "22" }}
                    >
                      <CategoryIcon
                        name={exp.category?.icon ?? "ellipsis"}
                        className="h-3.5 w-3.5"
                        color={exp.category?.color ?? "#64748b"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                        {exp.description}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {formatDate(exp.date)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-foreground)]">
                      {formatCurrency(exp.amount, exp.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Budget status */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Budget Status</h3>
            <Link href={ROUTES.BUDGETS}>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="space-y-4">
            {summaries.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--color-muted-foreground)]">
                No budgets set for this month.
              </p>
            ) : (
              summaries.slice(0, 4).map((summary) => (
                <div key={summary.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        name={summary.category_icon}
                        className="h-3.5 w-3.5"
                        color={summary.category_color}
                      />
                      <span className="text-sm text-[var(--color-foreground)]">
                        {summary.category_name}
                      </span>
                    </div>
                    <Badge variant={STATUS_BADGE[summary.status]}>
                      {Math.round(summary.percentage)}%
                    </Badge>
                  </div>
                  <BudgetProgress summary={summary} />
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick add modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title="Quick Add Expense"
        size="lg"
      >
        <ExpenseForm
          categories={categories}
          accounts={accounts}
          type="expense"
          defaultCurrency={defaultCurrency}
          isLoading={quickAddLoading}
          onSubmit={handleQuickAdd}
          onCancel={() => setIsQuickAddOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default DashboardPage;
