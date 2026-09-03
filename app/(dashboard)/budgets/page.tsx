"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { MonthSelector } from "@/components/budgets/MonthSelector";
import { WeekSelector } from "@/components/budgets/WeekSelector";
import { BudgetOverviewCard } from "@/components/budgets/BudgetOverviewCard";
import { BudgetComplianceGrid } from "@/components/budgets/BudgetComplianceGrid";
import { MonthlyIncomeModal } from "@/components/budgets/MonthlyIncomeModal";
import { useBudgetsViewModel } from "@/viewModels/useBudgetsViewModel";
import { useBudgetAlertsViewModel } from "@/viewModels/useBudgetAlertsViewModel";
import { useCategoriesViewModel } from "@/viewModels/useCategoriesViewModel";
import { useToast } from "@/providers/ToastProvider";
import type { BudgetInput, MonthlyIncomeInput } from "@/lib/validators";

const BudgetsPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const { showToast } = useToast();

  const {
    summaries,
    isLoading,
    selectedMonth,
    selectedYear,
    selectedPeriodType,
    selectedWeek,
    setMonth,
    setWeek,
    setPeriodType,
    createBudget,
    updateBudget,
    deleteBudget,
    overview,
    compliance,
    isComplianceLoading,
    monthlyIncome,
    monthlyIncomeCurrency,
    isIncomeLoading,
    setMonthlyIncome,
    defaultCurrency,
  } = useBudgetsViewModel();

  const { categories } = useCategoriesViewModel();

  useBudgetAlertsViewModel(summaries);

  const handleCreate = async (data: BudgetInput) => {
    setCreateLoading(true);
    const ok = await createBudget({
      ...data,
      month: data.period_type === "monthly" ? (data.month ?? null) : null,
      week_number: data.period_type === "weekly" ? (data.week_number ?? null) : null,
    });
    setCreateLoading(false);
    if (ok) {
      setIsCreateOpen(false);
      showToast("Budget created", "success");
    } else {
      showToast("Failed to create budget", "error");
    }
  };

  const handleSetIncome = async (data: MonthlyIncomeInput) => {
    const ok = await setMonthlyIncome(data.monthly_income, data.currency);
    if (ok) {
      setIsIncomeOpen(false);
      showToast("Monthly income updated", "success");
    } else {
      showToast("Failed to update income", "error");
    }
  };

  const emptyLabel =
    selectedPeriodType === "weekly"
      ? `No budgets for week ${selectedWeek}`
      : "No budgets for this month";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Set spending limits by category."
        actions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New budget
          </Button>
        }
      />

      {/* Period type toggle + navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Period toggle */}
          <div className="flex rounded-lg border border-[var(--color-border)] p-1 gap-1">
            {(["monthly", "weekly"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${
                  selectedPeriodType === type
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Time navigator */}
          {selectedPeriodType === "monthly" ? (
            <MonthSelector month={selectedMonth} year={selectedYear} onChange={setMonth} />
          ) : (
            <WeekSelector week={selectedWeek} year={selectedYear} onChange={setWeek} />
          )}
        </div>

        <p className="text-sm text-[var(--color-muted-foreground)]">
          {summaries.length} budget{summaries.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Monthly-only sections */}
      {selectedPeriodType === "monthly" && (
        <>
          <BudgetOverviewCard
            overview={overview}
            onEditIncome={() => setIsIncomeOpen(true)}
            isLoading={isIncomeLoading}
          />
          <BudgetComplianceGrid
            compliance={compliance ?? []}
            year={selectedYear}
            currency={overview.currency}
            isLoading={isComplianceLoading}
          />
        </>
      )}

      {/* Budget cards grid */}
      {isLoading ? (
        <PageSpinner />
      ) : summaries.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title={emptyLabel}
          description="Create a budget to track spending limits by category."
          actionLabel="New budget"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <BudgetCard
              key={summary.id}
              summary={summary}
              categories={categories}
              onUpdate={async (data) => {
                const ok = await updateBudget(data);
                if (ok) showToast("Budget updated", "success");
                else showToast("Failed to update budget", "error");
                return ok;
              }}
              onDelete={async (id) => {
                const ok = await deleteBudget(id);
                if (ok) showToast("Budget deleted", "success");
                else showToast("Failed to delete budget", "error");
                return ok;
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New budget"
        size="sm"
      >
        <BudgetForm
          categories={categories}
          defaultMonth={selectedMonth}
          defaultYear={selectedYear}
          defaultWeek={selectedWeek}
          defaultPeriodType={selectedPeriodType}
          defaultCurrency={defaultCurrency}
          isLoading={createLoading}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <MonthlyIncomeModal
        isOpen={isIncomeOpen}
        currentIncome={monthlyIncome}
        currentCurrency={monthlyIncomeCurrency}
        isLoading={isIncomeLoading}
        onSubmit={handleSetIncome}
        onClose={() => setIsIncomeOpen(false)}
      />
    </div>
  );
};

export default BudgetsPage;
