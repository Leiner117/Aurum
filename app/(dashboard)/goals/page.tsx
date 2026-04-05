"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalContributionForm } from "@/components/goals/GoalContributionForm";
import { useGoalsViewModel } from "@/viewModels/useGoalsViewModel";
import { useAccountsViewModel } from "@/viewModels/useAccountsViewModel";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import { useToast } from "@/providers/ToastProvider";
import type { Goal } from "@/types/goal";
import type { GoalInput, GoalContributionInput } from "@/lib/validators";

const GoalsPage = () => {
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [contributingGoal, setContributingGoal] = useState<Goal | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const { showToast } = useToast();

  const { goals, isLoading, createGoal, updateGoal, deleteGoal, contribute } = useGoalsViewModel();
  const { accounts } = useAccountsViewModel();
  const { defaultCurrency } = useCurrencyViewModel();

  const handleGoalSubmit = async (data: GoalInput) => {
    setFormLoading(true);
    const ok = editingGoal
      ? await updateGoal({ ...data, id: editingGoal.id })
      : await createGoal(data);
    setFormLoading(false);
    if (ok) {
      setIsGoalFormOpen(false);
      setEditingGoal(undefined);
      showToast(editingGoal ? "Goal updated" : "Goal created", "success");
    } else {
      showToast("Failed to save goal", "error");
    }
  };

  const handleContribute = async (data: GoalContributionInput) => {
    setFormLoading(true);
    const ok = await contribute(data);
    setFormLoading(false);
    if (ok) {
      setIsContributeOpen(false);
      setContributingGoal(undefined);
      showToast("Funds added to goal", "success");
    } else {
      showToast("Failed to add funds", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteGoal(id);
    if (ok) showToast("Goal deleted", "success");
    else showToast("Failed to delete goal", "error");
  };

  const openContribute = (goal: Goal) => {
    setContributingGoal(goal);
    setIsContributeOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalFormOpen(true);
  };

  const closeGoalForm = () => {
    setIsGoalFormOpen(false);
    setEditingGoal(undefined);
  };

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Goals"
        description="Track your savings targets and progress"
        actions={
          <Button size="sm" onClick={() => setIsGoalFormOpen(true)}>
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : goals.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--color-muted-foreground)]">No goals yet. Create your first savings goal!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                Active ({activeGoals.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={openContribute}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                Completed ({completedGoals.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={openContribute}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goal form modal */}
      <Modal
        isOpen={isGoalFormOpen}
        onClose={closeGoalForm}
        title={editingGoal ? "Edit goal" : "New savings goal"}
        size="md"
      >
        <GoalForm
          goal={editingGoal}
          defaultCurrency={defaultCurrency}
          isLoading={formLoading}
          onSubmit={handleGoalSubmit}
          onCancel={closeGoalForm}
        />
      </Modal>

      {/* Contribute modal */}
      <Modal
        isOpen={isContributeOpen}
        onClose={() => { setIsContributeOpen(false); setContributingGoal(undefined); }}
        title="Add funds to goal"
        size="sm"
      >
        {contributingGoal && (
          <GoalContributionForm
            goal={contributingGoal}
            accounts={accounts}
            defaultCurrency={defaultCurrency}
            isLoading={formLoading}
            onSubmit={handleContribute}
            onCancel={() => { setIsContributeOpen(false); setContributingGoal(undefined); }}
          />
        )}
      </Modal>
    </div>
  );
};

export default GoalsPage;
