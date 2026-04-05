"use client";

import { Trash2, PiggyBank, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { formatCurrency } from "@/lib/currency/format";
import { formatDate } from "@/lib/utils";
import type { Goal } from "@/types/goal";

interface GoalCardProps {
  goal: Goal;
  onContribute: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

export const GoalCard = ({ goal, onContribute, onEdit, onDelete }: GoalCardProps) => {
  const pct = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
    : 0;

  return (
    <Card>
      <CardBody className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: goal.color + "22" }}
            >
              <CategoryIcon name={goal.icon} className="h-5 w-5" color={goal.color} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--color-foreground)]">{goal.name}</p>
              {goal.description && (
                <p className="truncate text-xs text-[var(--color-muted-foreground)]">{goal.description}</p>
              )}
            </div>
          </div>
          {goal.is_completed && (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
            <span>{formatCurrency(goal.current_amount, goal.currency)}</span>
            <span>{pct}%</span>
            <span>{formatCurrency(goal.target_amount, goal.currency)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: goal.color }}
            />
          </div>
        </div>

        {/* Target date */}
        {goal.target_date && (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Target: {formatDate(goal.target_date)}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!goal.is_completed && (
            <Button size="sm" onClick={() => onContribute(goal)} className="flex-1">
              <PiggyBank className="h-4 w-4" />
              Add funds
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => onEdit(goal)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(goal.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
