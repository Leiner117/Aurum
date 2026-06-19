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
    setMonth,
    createBudget,
    updateBudget,
    deleteBudget,
    overview,
    compliance,
    isComplianceLoading,
    monthlyIncome,
    isIncomeLoading,
    setMonthlyIncome,
  } = useBudgetsViewModel();

  const { categories } = useCategoriesViewModel();

  useBudgetAlertsViewModel(summaries);

  const handleCreate = async (data: BudgetInput) => {
    setCreateLoading(true);
    const ok = await createBudget(data);
    setCreateLoading(false);
    if (ok) {
      setIsCreateOpen(false);
      showToast("Budget created", "success");
    } else {
      showToast("Failed to create budget", "error");
    }
  };

  const handleSetIncome = async (data: MonthlyIncomeInput) => {
    const ok = await setMonthlyIncome(data.monthly_income);
    if (ok) {
      setIsIncomeOpen(false);
      showToast("Monthly income updated", "success");
    } else {
      showToast("Failed to update income", "error");
    }
  };

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

      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <MonthSelector
          month={selectedMonth}
          year={selectedYear}
          onChange={setMonth}
        />
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {summaries.length} budget{summaries.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Monthly overview */}
      <BudgetOverviewCard
        overview={overview}
        onEditIncome={() => setIsIncomeOpen(true)}
        isLoading={isIncomeLoading}
      />

      {/* Year compliance grid */}
      <BudgetComplianceGrid
        compliance={compliance}
        year={selectedYear}
        currency={overview.currency}
        isLoading={isComplianceLoading}
      />

      {/* Budget cards grid */}
      {isLoading ? (
        <PageSpinner />
      ) : summaries.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="No budgets for this month"
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
          isLoading={createLoading}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <MonthlyIncomeModal
        isOpen={isIncomeOpen}
        currentIncome={monthlyIncome}
        currency={overview.currency}
        isLoading={isIncomeLoading}
        onSubmit={handleSetIncome}
        onClose={() => setIsIncomeOpen(false)}
      />
    </div>
  );
};

export default BudgetsPage;
