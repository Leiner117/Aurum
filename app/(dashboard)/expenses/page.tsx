"use client";

import { useState } from "react";
import { Plus, Receipt, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Spinner } from "@/components/ui/Spinner";
import { ExpenseFiltersBar } from "@/components/expenses/ExpenseFilters";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseRowActions } from "@/components/expenses/ExpenseRowActions";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { useExpensesViewModel } from "@/viewModels/useExpensesViewModel";
import { useCategoriesViewModel } from "@/viewModels/useCategoriesViewModel";
import { useAccountsViewModel } from "@/viewModels/useAccountsViewModel";
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
  const { accounts } = useAccountsViewModel();

  const handleTabChange = (tab: TransactionType) => {
    setActiveType(tab);
    setFilters({ ...filters, type: tab });
  };

  const handleCreate = async (data: ExpenseInput) => {
    setCreateLoading(true);
    const ok = await createExpense({ ...data, type: activeType });
    setCreateLoading(false);
    if (ok) {
      setIsCreateOpen(false);
      showToast(activeType === "income" ? "Income added" : "Expense added", "success");
    } else {
      showToast(activeType === "income" ? "Failed to add income" : "Failed to add expense", "error");
    }
  };

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
            <span className="hidden sm:inline text-sm">{row.category.name}</span>
          </div>
        ) : (
          <span className="text-[var(--color-muted-foreground)]">—</span>
        ),
    },
    {
      key: "date",
      header: "Date",
      className: "hidden sm:table-cell",
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
          accounts={accounts}
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
                ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
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

      {/* Mobile card list */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={isIncome ? <TrendingUp className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
            title={isIncome ? "No income found" : "No expenses found"}
            description={
              Object.keys(filters).filter((k) => k !== "type").length
                ? "Try adjusting your filters."
                : isIncome ? "Add your first income entry." : "Add your first expense."
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
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                {/* Category icon */}
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: (exp.category?.color ?? "#64748b") + "22" }}
                >
                  <CategoryIcon
                    name={exp.category?.icon ?? "ellipsis"}
                    className="h-4 w-4"
                    color={exp.category?.color ?? "#64748b"}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                    {exp.description}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                    {exp.category?.name ?? "Uncategorized"} · {formatDate(exp.date)}
                  </p>
                  {exp.is_recurring && (
                    <Badge variant="info" className="mt-1 text-xs">Recurring</Badge>
                  )}
                </div>

                {/* Amount + actions */}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      exp.type === "income"
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-foreground)]"
                    )}
                  >
                    {exp.type === "income" ? "+" : ""}
                    {formatCurrency(exp.amount, exp.currency)}
                  </span>
                  <ExpenseRowActions
                    expense={exp}
                    categories={categories}
                    accounts={accounts}
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
                </div>
              </div>
            ))}

            {/* Mobile pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-1 pt-1 text-sm text-[var(--color-muted-foreground)]">
                <span>
                  {(currentPage - 1) * EXPENSES_PAGE_SIZE + 1}–
                  {Math.min(currentPage * EXPENSES_PAGE_SIZE, totalCount)} of {totalCount}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-1 font-medium text-[var(--color-foreground)]">
                    {currentPage} / {totalPages}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
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
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={isIncome ? "Add income" : "Add expense"}
        size="lg"
      >
        <ExpenseForm
          categories={categories}
          accounts={accounts}
          type={activeType}
          hideTypeToggle
          isLoading={createLoading}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
