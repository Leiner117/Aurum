"use client";

import { formatCurrency } from "@/lib/currency/format";

interface AccountsTotalCardProps {
  total: number;
  currency: string;
  isLoadingRates: boolean;
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export const AccountsTotalCard = ({
  total,
  currency,
  isLoadingRates,
  selectedCount,
  totalCount,
  isAllSelected,
  onSelectAll,
  onClearSelection,
}: AccountsTotalCardProps) => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-primary)]/10 px-5 py-4">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {isAllSelected ? "Total balance" : "Selected balance"}
      </p>
      <button
        type="button"
        onClick={isAllSelected ? onClearSelection : onSelectAll}
        className="text-xs font-medium text-[var(--color-primary)] hover:underline"
      >
        {isAllSelected ? "Clear selection" : "Select all"}
      </button>
    </div>
    <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">
      {isLoadingRates ? "—" : formatCurrency(total, currency)}
    </p>
    <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
      {isAllSelected
        ? `Across ${totalCount} account${totalCount !== 1 ? "s" : ""}`
        : `${selectedCount} of ${totalCount} account${totalCount !== 1 ? "s" : ""} selected`}
    </p>
  </div>
);
