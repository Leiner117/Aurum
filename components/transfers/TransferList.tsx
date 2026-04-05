"use client";

import { ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/currency/format";
import { formatDate } from "@/lib/utils";
import type { Transfer } from "@/types/transfer";
import type { Account } from "@/types/account";

interface TransferListProps {
  transfers: Transfer[];
  accounts: Account[];
  onDelete: (id: string) => void;
}

export const TransferList = ({ transfers, accounts, onDelete }: TransferListProps) => {
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  if (transfers.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        No transfers yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {transfers.map((t) => {
        const from = t.from_account_id ? accountMap[t.from_account_id] : null;
        const to = t.to_account_id ? accountMap[t.to_account_id] : null;
        const sameCurrency = t.from_currency === t.to_currency;

        return (
          <li key={t.id} className="flex items-center gap-4 px-5 py-3">
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
                <span className="truncate">{from?.name ?? "Deleted account"}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" />
                <span className="truncate">{to?.name ?? "Deleted account"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <span>{formatDate(t.date)}</span>
                {t.notes && <span>· {t.notes}</span>}
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                {formatCurrency(t.amount, t.from_currency)}
              </p>
              {!sameCurrency && (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  → {formatCurrency(t.converted_amount, t.to_currency)}
                </p>
              )}
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(t.id)}
              aria-label="Delete transfer"
            >
              <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
};
