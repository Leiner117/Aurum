"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { AccountList } from "@/components/accounts/AccountList";
import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountsTotalCard } from "@/components/accounts/AccountsTotalCard";
import { useAccountsViewModel } from "@/viewModels/useAccountsViewModel";
import { useAccountSelectionViewModel } from "@/viewModels/useAccountSelectionViewModel";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import { useToast } from "@/providers/ToastProvider";
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

  const selection = useAccountSelectionViewModel(accounts);

  const totalBalance = selection.selectedAccounts.reduce(
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
        <AccountsTotalCard
          total={totalBalance}
          currency={defaultCurrency}
          isLoadingRates={isLoadingRates || !Object.keys(rates).length}
          selectedCount={selection.selectedAccounts.length}
          totalCount={accounts.length}
          isAllSelected={selection.isAllSelected}
          onSelectAll={selection.selectAll}
          onClearSelection={selection.clearSelection}
        />
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
              isSelected={selection.isSelected}
              onToggleSelect={selection.toggleAccount}
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
