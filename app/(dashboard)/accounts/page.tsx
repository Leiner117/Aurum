"use client";

import { useState } from "react";
import { Plus, Landmark } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { AccountList } from "@/components/accounts/AccountList";
import { AccountForm } from "@/components/accounts/AccountForm";
import { useAccountsViewModel } from "@/viewModels/useAccountsViewModel";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import { useToast } from "@/providers/ToastProvider";
import { formatCurrency } from "@/lib/currency/format";
import type { AccountInput } from "@/lib/validators";
import type { Account } from "@/types/account.types";

export default function AccountsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { showToast } = useToast();

  const { accounts, isLoading, createAccount, updateAccount, deleteAccount } =
    useAccountsViewModel();
  const { convert, defaultCurrency, isLoadingRates, rates } = useCurrencyViewModel();

  const totalBalance = accounts.reduce(
    (sum, a) => sum + convert(a.balance, a.currency),
    0
  );

  const handleCreate = async (data: AccountInput) => {
    setIsSubmitting(true);
    const ok = await createAccount(data);
    setIsSubmitting(false);
    if (ok) {
      setIsCreateOpen(false);
      showToast("Account created", "success");
    } else {
      showToast("Failed to create account", "error");
    }
  };

  const handleUpdate = async (data: AccountInput) => {
    if (!editAccount) return;
    setIsSubmitting(true);
    const ok = await updateAccount({ id: editAccount.id, ...data });
    setIsSubmitting(false);
    if (ok) {
      setEditAccount(null);
      showToast("Account updated", "success");
    } else {
      showToast("Failed to update account", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    const ok = await deleteAccount(id);
    setDeleteId(null);
    if (ok) showToast("Account deleted", "success");
    else showToast("Failed to delete account", "error");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts and wallets."
        actions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New account
          </Button>
        }
      />

      {/* Total balance card */}
      {!isLoading && accounts.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-primary)]/10 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Total balance
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">
            {isLoadingRates || !Object.keys(rates).length
              ? "—"
              : formatCurrency(totalBalance, defaultCurrency)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <AccountList
              accounts={accounts}
              onEdit={setEditAccount}
              onDelete={handleDelete}
            />
          )}
        </CardBody>
      </Card>

      {/* Create modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New account"
        size="sm"
      >
        <AccountForm
          isLoading={isSubmitting}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editAccount}
        onClose={() => setEditAccount(null)}
        title="Edit account"
        size="sm"
      >
        {editAccount && (
          <AccountForm
            account={editAccount}
            isLoading={isSubmitting}
            onSubmit={handleUpdate}
            onCancel={() => setEditAccount(null)}
          />
        )}
      </Modal>
    </div>
  );
}
