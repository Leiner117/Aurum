"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardBody } from "@/components/ui/Card";
import { TransferForm } from "@/components/transfers/TransferForm";
import { TransferList } from "@/components/transfers/TransferList";
import { useTransfersViewModel } from "@/viewModels/useTransfersViewModel";
import { useAccountsViewModel } from "@/viewModels/useAccountsViewModel";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import { useToast } from "@/providers/ToastProvider";
import type { TransferInput } from "@/lib/validators";

const TransfersPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { showToast } = useToast();

  const { transfers, isLoading, createTransfer, deleteTransfer } = useTransfersViewModel();
  const { accounts } = useAccountsViewModel();
  const { convert } = useCurrencyViewModel();

  const handleTransfer = async (data: TransferInput) => {
    setFormLoading(true);
    const ok = await createTransfer(data, accounts);
    setFormLoading(false);
    if (ok) {
      setIsFormOpen(false);
      showToast("Transfer completed", "success");
    } else {
      showToast("Transfer failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteTransfer(id);
    if (ok) showToast("Transfer deleted", "success");
    else showToast("Failed to delete transfer", "error");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfers"
        description="Move money between your accounts"
        actions={
          <Button
            size="sm"
            onClick={() => setIsFormOpen(true)}
            disabled={accounts.length < 2}
          >
            <ArrowLeftRight className="h-4 w-4" />
            New Transfer
          </Button>
        }
      />

      {accounts.length < 2 && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          You need at least 2 accounts to make a transfer.
        </p>
      )}

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <TransferList
              transfers={transfers}
              accounts={accounts}
              onDelete={handleDelete}
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="New Transfer"
        size="sm"
      >
        <TransferForm
          accounts={accounts}
          isLoading={formLoading}
          convert={convert}
          onSubmit={handleTransfer}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default TransfersPage;
