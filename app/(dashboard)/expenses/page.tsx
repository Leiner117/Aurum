"use client";

import { useState } from "react";
import { Plus, Receipt, TrendingUp } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { EXPENSES_PAGE_SIZE } from "@/constants/expenses.constants";
import type { ExpenseWithCategory, UpdateExpenseInput, TransactionType } from "@/types/expense.types";
import type { ExpenseInput } from "@/lib/validators";

const TABS: { label: string; value: TransactionType }[] = [
  { label: "Expenses", value: "expense" },
  { label: "Income",   value: "income" },
];

export default function ExpensesPage() {
  const [activeType, setActiveType] = useState<TransactionType>("expense");
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

  // Keep filters in sync with active tab type
  function handleTabChange(tab: TransactionType) {
    setActiveType(tab);
    setFilters({ ...filters, type: tab });
  }

  // Initialize type filter on mount
  useState(() => {
    setFilters({ type: "expense" });
  });

  async function handleCreate(data: ExpenseInput) {
    setCreateLoading(true);
    const ok = await createExpense({ ...data, type: activeType });
    setCreateLoading(false);
    if (ok) {
      setIsCreateOpen(false);
      showToast(activeType === "income" ? "Income added" : "Expense added", "success");
    } else {
      showToast(activeType === "income" ? "Failed to add income" : "Failed to add expense", "error");
    }
  }

  const isIncome = activeType === "income";

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
          <span
            className={cn(
              "font-semibold",
              row.type === "income"
                ? "text-[var(--color-success)]"
                : "text-[var(--color-foreground)]"
            )}
          >
            {row.type === "income" ? "+" : ""}
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
            if (ok) showToast("Updated", "success");
            else showToast("Failed to update", "error");
            return ok;
          }}
          onDelete={async (id: string) => {
            const ok = await deleteExpense(id);
            if (ok) showToast("Deleted", "success");
            else showToast("Failed to delete", "error");
            return ok;
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description={`${totalCount} ${isIncome ? "income" : "expense"}${totalCount !== 1 ? "s" : ""} total`}
        actions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {isIncome ? "Add income" : "Add expense"}
          </Button>
        }
      />

      {/* Expense / Income tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeType === tab.value
                ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
          >
            {tab.value === "expense" ? (
              <Receipt className="h-3.5 w-3.5" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5" />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <ExpenseFiltersBar
        filters={filters}
        categories={categories.filter((c) => c.type === activeType)}
        onChange={(f) => setFilters({ ...f, type: activeType })}
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
            icon={isIncome ? <TrendingUp className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
            title={isIncome ? "No income found" : "No expenses found"}
            description={
              Object.keys(filters).filter((k) => k !== "type").length
                ? "Try adjusting your filters."
                : isIncome
                ? "Add your first income entry to get started."
                : "Add your first expense to get started."
            }
            actionLabel={
              !Object.keys(filters).filter((k) => k !== "type").length
                ? isIncome ? "Add income" : "Add expense"
                : undefined
            }
            onAction={
              !Object.keys(filters).filter((k) => k !== "type").length
                ? () => setIsCreateOpen(true)
                : undefined
            }
          />
        }
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={isIncome ? "Add income" : "Add expense"}
        size="lg"
      >
        <ExpenseForm
          categories={categories}
          type={activeType}
          isLoading={createLoading}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
