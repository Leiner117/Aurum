"use client";

import { Pencil, Trash2, Landmark, CreditCard, PiggyBank, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/currency/format";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/account.types";

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

const ACCOUNT_TYPE_ICONS: Record<string, React.ReactNode> = {
  checking: <Landmark className="h-5 w-5" />,
  savings: <PiggyBank className="h-5 w-5" />,
  cash: <Wallet className="h-5 w-5" />,
  credit: <CreditCard className="h-5 w-5" />,
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit: "Credit",
};

export const AccountCard = ({ account, onEdit, onDelete }: AccountCardProps) => {
  const isNegative = account.balance < 0;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: account.color }}
      >
        {ACCOUNT_TYPE_ICONS[account.type] ?? <Wallet className="h-5 w-5" />}
      </div>

      {/* Name + type — takes all remaining space */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-[var(--color-foreground)]">{account.name}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">{ACCOUNT_TYPE_LABELS[account.type]}</p>
      </div>

      {/* Balance — fixed width, right-aligned */}
      <div className="w-24 shrink-0 text-right sm:w-36">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            isNegative ? "text-[var(--color-danger)]" : "text-[var(--color-foreground)]"
          )}
        >
          {formatCurrency(account.balance, account.currency)}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">{account.currency}</p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onEdit(account)}
          className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)] transition-colors"
          aria-label="Edit account"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(account.id)}
          className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-red-500/10 hover:text-[var(--color-danger)] transition-colors"
          aria-label="Delete account"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
