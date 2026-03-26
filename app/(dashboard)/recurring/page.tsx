"use client";

import { useState } from "react";
import { Plus, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { RecurringList } from "@/components/recurring/RecurringList";
import { RecurringForm } from "@/components/recurring/RecurringForm";
import { useRecurringViewModel } from "@/viewModels/useRecurringViewModel";
import { useCategoriesViewModel } from "@/viewModels/useCategoriesViewModel";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import { useToast } from "@/providers/ToastProvider";
import type { RecurringExpenseInput } from "@/lib/validators";
import type { RecurringExpenseWithCategory } from "@/types/recurring.types";

export default function RecurringPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringExpenseWithCategory | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const {
    recurring,
    isLoading,
    isProcessing,
    generatedCount,
    createRecurring,
    updateRecurring,
    toggleActive,
    deleteRecurring,
  } = useRecurringViewModel();

  const { categories } = useCategoriesViewModel();
  const { defaultCurrency } = useCurrencyViewModel();

  async function handleCreate(data: RecurringExpenseInput) {
    setActionLoading(true);
    const ok = await createRecurring({
      ...data,
      category_id: data.category_id || null,
    });
    setActionLoading(false);
    if (ok) {
      setIsCreateOpen(false);
      showToast("Recurring expense added", "success");
    } else {
      showToast("Failed to add recurring expense", "error");
    }
  }

  async function handleEdit(data: RecurringExpenseInput) {
    if (!editTarget) return;
    setActionLoading(true);
    const ok = await updateRecurring({
      id: editTarget.id,
      ...data,
      category_id: data.category_id || null,
    });
    setActionLoading(false);
    if (ok) {
      setEditTarget(null);
      showToast("Recurring expense updated", "success");
    } else {
      showToast("Failed to update recurring expense", "error");
    }
  }

  async function handleDelete(id: string) {
    const ok = await deleteRecurring(id);
    if (ok) showToast("Recurring expense deleted", "success");
    else showToast("Failed to delete recurring expense", "error");
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    const ok = await toggleActive(id, isActive);
    if (ok) showToast(isActive ? "Activated" : "Paused", "success");
    else showToast("Failed to update status", "error");
  }

  const activeCount = recurring.filter((r) => r.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Expenses"
        description="Manage scheduled expenses that are auto-generated."
        actions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New recurring
          </Button>
        }
      />

      {/* Auto-generated banner */}
      {generatedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <span>
            <strong>{generatedCount}</strong> expense
            {generatedCount !== 1 ? "s were" : " was"} auto-generated from your recurring
            schedule.
          </span>
        </div>
      )}

      {/* Stats row */}
      {!isLoading && recurring.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
          <span>
            {recurring.length} total — {activeCount} active,{" "}
            {recurring.length - activeCount} paused
          </span>
          {isProcessing && (
            <Badge variant="info">
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Processing…
            </Badge>
          )}
        </div>
      )}

      {/* List */}
      <Card>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : recurring.length === 0 ? (
          <EmptyState
            icon={<RefreshCw className="h-6 w-6" />}
            title="No recurring expenses"
            description="Add a recurring expense and it will be auto-generated on schedule."
            actionLabel="New recurring"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <RecurringList
            items={recurring}
            onEdit={(item) => setEditTarget(item)}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        )}
      </Card>

      {/* Create modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New recurring expense"
        size="sm"
      >
        <RecurringForm
          categories={categories}
          defaultCurrency={defaultCurrency}
          isLoading={actionLoading}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit recurring expense"
        size="sm"
      >
        {editTarget && (
          <RecurringForm
            recurring={editTarget}
            categories={categories}
            defaultCurrency={defaultCurrency}
            isLoading={actionLoading}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>
    </div>
  );
}
