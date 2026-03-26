"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { BudgetProgress } from "./BudgetProgress";
import { BudgetForm } from "./BudgetForm";
import { formatCurrency } from "@/lib/currency/format";
import type { BudgetSummary, UpdateBudgetInput } from "@/types/budget.types";
import type { Category } from "@/types/category.types";
import type { BudgetInput } from "@/lib/validators";

const STATUS_BADGE: Record<string, "success" | "warning" | "danger"> = {
  ok: "success",
  warning: "warning",
  exceeded: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  ok: "On track",
  warning: "Near limit",
  exceeded: "Exceeded",
};

interface BudgetCardProps {
  summary: BudgetSummary;
  categories: Category[];
  onUpdate: (data: UpdateBudgetInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export const BudgetCard = ({ summary, categories, onUpdate, onDelete }: BudgetCardProps) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleUpdate = async (data: BudgetInput) => {
    setIsActionLoading(true);
    const ok = await onUpdate({ id: summary.id, ...data });
    setIsActionLoading(false);
    if (ok) setShowEdit(false);
  };

  const handleDelete = async () => {
    setIsActionLoading(true);
    const ok = await onDelete(summary.id);
    setIsActionLoading(false);
    if (ok) setShowDelete(false);
  };

  return (
    <>
      <Card>
        <CardBody className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: summary.category_color + "22" }}
              >
                <CategoryIcon
                  name={summary.category_icon}
                  className="h-4 w-4"
                  color={summary.category_color}
                />
              </div>
              <div>
                <p className="font-medium text-[var(--color-foreground)]">
                  {summary.category_name}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {formatCurrency(summary.spent, summary.budget_currency)} /{" "}
                  {formatCurrency(summary.budget_amount, summary.budget_currency)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={STATUS_BADGE[summary.status]}>
                {STATUS_LABEL[summary.status]}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setShowEdit(true)}
                aria-label="Edit budget"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-[var(--color-danger)]"
                onClick={() => setShowDelete(true)}
                aria-label="Delete budget"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <BudgetProgress summary={summary} />

          {/* Remaining */}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {summary.remaining >= 0 ? (
              <>
                <span className="font-medium text-[var(--color-foreground)]">
                  {formatCurrency(summary.remaining, summary.budget_currency)}
                </span>{" "}
                remaining
              </>
            ) : (
              <>
                <span className="font-medium text-[var(--color-danger)]">
                  {formatCurrency(Math.abs(summary.remaining), summary.budget_currency)}
                </span>{" "}
                over budget
              </>
            )}
          </p>
        </CardBody>
      </Card>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit budget" size="sm">
        <BudgetForm
          budget={summary}
          categories={categories}
          isLoading={isActionLoading}
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete budget" size="sm">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Delete the budget for{" "}
          <strong className="text-[var(--color-foreground)]">{summary.category_name}</strong>?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={isActionLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isActionLoading}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
};
