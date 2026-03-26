"use client";

import { useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ExpenseFiltersBar } from "@/components/expenses/ExpenseFilters";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseRowActions } from "@/components/expenses/ExpenseRowActions";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { useExpensesViewModel } from "@/viewModels/useExpensesViewModel";
import { useCategoriesViewModel } from "@/viewModels/useCategoriesViewModel";
import { useToast } from "@/providers/ToastProvider";
import { formatCurrency } from "@/lib/currency/format";
import { formatDate } from "@/lib/utils";
import { EXPENSES_PAGE_SIZE } from "@/constants/expenses.constants";
import type { ExpenseWithCategory, UpdateExpenseInput } from "@/types/expense.types";
import type { ExpenseInput } from "@/lib/validators";

export default function ExpensesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const { showToast } = useToast();

  const {
    expenses,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    filters,
    setFilters,
    setPage,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpensesViewModel();

  const { categories } = useCategoriesViewModel();

  async function handleCreate(data: ExpenseInput) {
    setCreateLoading(true);
    const ok = await createExpense(data);
    setCreateLoading(false);
    if (ok) {
      setIsCreateOpen(false);
      showToast("Expense added", "success");
    } else {
      showToast("Failed to add expense", "error");
    }
  }

  const columns: Column<ExpenseWithCategory>[] = [
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <div>
          <p className="font-medium text-[var(--color-foreground)]">{row.description}</p>
          {row.notes && (
            <p className="text-xs text-[var(--color-muted-foreground)] truncate max-w-xs">
              {row.notes}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) =>
        row.category ? (
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: row.category.color + "22" }}
            >
              <CategoryIcon
                name={row.category.icon}
                className="h-3 w-3"
                color={row.category.color}
              />
            </div>
            <span className="text-sm">{row.category.name}</span>
          </div>
        ) : (
          <span className="text-[var(--color-muted-foreground)]">—</span>
        ),
    },
    {
      key: "date",
      header: "Date",
      cell: (row) => (
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      cell: (row) => (
        <div className="text-right">
          <span className="font-semibold text-[var(--color-foreground)]">
            {formatCurrency(row.amount, row.currency)}
          </span>
          {row.is_recurring && (
            <Badge variant="info" className="ml-2 text-xs">
              Recurring
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      cell: (row) => (
        <ExpenseRowActions
          expense={row}
          categories={categories}
          onUpdate={async (data: UpdateExpenseInput) => {
            const ok = await updateExpense(data);
            if (ok) showToast("Expense updated", "success");
            else showToast("Failed to update expense", "error");
            return ok;
          }}
          onDelete={async (id: string) => {
            const ok = await deleteExpense(id);
            if (ok) showToast("Expense deleted", "success");
            else showToast("Failed to delete expense", "error");
            return ok;
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description={`${totalCount} expense${totalCount !== 1 ? "s" : ""} total`}
        actions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        }
      />

      <ExpenseFiltersBar
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />

      <DataTable
        columns={columns}
        data={expenses}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={EXPENSES_PAGE_SIZE}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title="No expenses found"
            description={
              Object.keys(filters).length
                ? "Try adjusting your filters."
                : "Add your first expense to get started."
            }
            actionLabel={!Object.keys(filters).length ? "Add expense" : undefined}
            onAction={!Object.keys(filters).length ? () => setIsCreateOpen(true) : undefined}
          />
        }
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add expense"
        size="lg"
      >
        <ExpenseForm
          categories={categories}
          isLoading={createLoading}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
