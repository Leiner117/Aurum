"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { CategoryIcon } from "./CategoryIcon";
import { CategoryForm } from "./CategoryForm";
import type { Category, UpdateCategoryInput } from "@/types/category.types";
import type { CategoryInput } from "@/lib/validators";

interface CategoryListProps {
  categories: Category[];
  isLoading: boolean;
  onUpdate: (data: UpdateCategoryInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function CategoryList({
  categories,
  isLoading,
  onUpdate,
  onDelete,
}: CategoryListProps) {
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function handleUpdate(data: CategoryInput) {
    if (!editTarget) return;
    setActionLoading(true);
    const ok = await onUpdate({ id: editTarget.id, ...data });
    setActionLoading(false);
    if (ok) setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    const ok = await onDelete(deleteTarget.id);
    setActionLoading(false);
    if (ok) setDeleteTarget(null);
  }

  return (
    <>
      <ul className="divide-y divide-[var(--color-border)]">
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center gap-3 py-3">
            {/* Icon bubble */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: cat.color + "22" }}
            >
              <CategoryIcon name={cat.icon} className="h-4 w-4" color={cat.color} />
            </div>

            {/* Name */}
            <span className="flex-1 text-sm font-medium text-[var(--color-foreground)]">
              {cat.name}
            </span>

            {/* Type badge */}
            <Badge variant={cat.type === "income" ? "success" : "default"}>
              {cat.type === "income" ? "Income" : "Expense"}
            </Badge>
            {/* Default badge */}
            {cat.is_default && <Badge variant="default">Default</Badge>}

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setEditTarget(cat)}
                disabled={isLoading}
                aria-label="Edit category"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                onClick={() => setDeleteTarget(cat)}
                disabled={isLoading}
                aria-label="Delete category"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Edit modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit category"
        size="sm"
      >
        <CategoryForm
          category={editTarget ?? undefined}
          isLoading={actionLoading}
          onSubmit={handleUpdate}
          onCancel={() => setEditTarget(null)}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete category"
        size="sm"
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Are you sure you want to delete{" "}
          <strong className="text-[var(--color-foreground)]">{deleteTarget?.name}</strong>?
          Expenses linked to this category will be uncategorized.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={actionLoading}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
