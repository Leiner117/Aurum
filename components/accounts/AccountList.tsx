"use client";

import { AccountCard } from "./AccountCard";
import { Landmark } from "lucide-react";
import type { Account } from "@/types/account.types";

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export const AccountList = ({ accounts, onEdit, onDelete }: AccountListProps) => {
  if (!accounts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-hover)]">
          <Landmark className="h-6 w-6 text-[var(--color-muted-foreground)]" />
        </div>
        <p className="text-sm font-medium text-[var(--color-foreground)]">No accounts yet</p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Add your bank accounts and wallets to track balances
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};
