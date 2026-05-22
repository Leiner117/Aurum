"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency/format";
import { format, parseISO } from "date-fns";
import type { ReportExpenseRow, ExpenseSortKey } from "@/viewModels/useReportsViewModel";

const SORT_OPTIONS: { label: string; value: ExpenseSortKey }[] = [
  { label: "Newest", value: "date_desc" },
  { label: "Oldest", value: "date_asc" },
  { label: "Highest", value: "amount_desc" },
  { label: "Lowest", value: "amount_asc" },
];

interface ExpenseListTableProps {
  expenses: ReportExpenseRow[];
  currency: string;
  sortBy: ExpenseSortKey;
  onSortChange: (key: ExpenseSortKey) => void;
}

export const ExpenseListTable = ({
  expenses,
  currency,
  sortBy,
  onSortChange,
}: ExpenseListTableProps) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--color-muted-foreground)]">Sort by:</span>
        <div className="flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sortBy === opt.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
          {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-xl border border-[var(--color-border)]">
        <div className="divide-y divide-[var(--color-border)]">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-3 bg-[var(--color-surface)] px-4 py-3"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: expense.category_color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--color-foreground)]">
                  {expense.description}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {expense.category_name} · {format(parseISO(expense.date), "MMM d, yyyy")}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-[var(--color-foreground)]">
                {formatCurrency(expense.amount, currency)}
              </span>
            </div>
          ))}
          {expenses.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              No expenses found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
