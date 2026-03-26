"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EXPENSE_SORT_OPTIONS } from "@/constants/expenses.constants";
import type { ExpenseFilters } from "@/types/expense.types";
import type { Category } from "@/types/category.types";

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  categories: Category[];
  onChange: (filters: ExpenseFilters) => void;
}

export const ExpenseFiltersBar = ({ filters, categories, onChange }: ExpenseFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categoryOptions = [
    { label: "All categories", value: "" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const sortOptions = EXPENSE_SORT_OPTIONS.map((o) => ({
    label: o.label,
    value: o.value,
  }));

  const handleReset = () => {
    onChange({});
  };

  const hasActiveFilters =
    filters.search ||
    filters.categoryId ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-3">
      {/* Main row */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={filters.search ?? ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <Select
          options={sortOptions}
          value={filters.sortBy ?? "date_desc"}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
          className="w-full sm:w-44"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAdvanced((v) => !v)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="shrink-0">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Category"
            options={categoryOptions}
            value={filters.categoryId ?? ""}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value || undefined })}
          />
          <Input
            label="From date"
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value || undefined })}
          />
          <Input
            label="To date"
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value || undefined })}
          />
          <Input
            label="Max amount"
            type="number"
            placeholder="e.g. 100"
            value={filters.maxAmount ?? ""}
            onChange={(e) =>
              onChange({ ...filters, maxAmount: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      )}
    </div>
  );
};
