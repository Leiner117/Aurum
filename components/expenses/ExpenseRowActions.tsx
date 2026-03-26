"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "./ExpenseForm";
import type { ExpenseWithCategory, UpdateExpenseInput } from "@/types/expense.types";
import type { Category } from "@/types/category.types";
import type { Account } from "@/types/account.types";
import type { ExpenseInput } from "@/lib/validators";

interface ExpenseRowActionsProps {
  expense: ExpenseWithCategory;
  categories: Category[];
  accounts?: Account[];
  onUpdate: (data: UpdateExpenseInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export const ExpenseRowActions = ({
  expense,
  categories,
  accounts = [],
  onUpdate,
  onDelete,
}: ExpenseRowActionsProps) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleUpdate = async (data: ExpenseInput) => {
    setIsActionLoading(true);
    const ok = await onUpdate({ id: expense.id, ...data });
    setIsActionLoading(false);
    if (ok) setShowEdit(false);
  };

  const handleDelete = async () => {
    setIsActionLoading(true);
    const ok = await onDelete(expense.id);
    setIsActionLoading(false);
    if (ok) setShowDelete(false);
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setShowEdit(true)}
          aria-label="Edit expense"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-[var(--color-danger)]"
          onClick={() => setShowDelete(true)}
          aria-label="Delete expense"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit expense">
        <ExpenseForm
          expense={expense}
          categories={categories}
          accounts={accounts}
          isLoading={isActionLoading}
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete expense" size="sm">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Are you sure you want to delete{" "}
          <strong className="text-[var(--color-foreground)]">{expense.description}</strong>?
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
