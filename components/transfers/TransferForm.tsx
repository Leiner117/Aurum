"use client";

import { useEffect } from "react";
import { useForm, type SubmitHandler, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferSchema, type TransferInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatCurrency } from "@/lib/currency/format";
import { format } from "date-fns";
import type { Account } from "@/types/account";

interface TransferFormProps {
  accounts: Account[];
  isLoading: boolean;
  convert: (amount: number, from: string, to?: string) => number;
  onSubmit: (data: TransferInput) => void;
  onCancel: () => void;
}

export const TransferForm = ({ accounts, isLoading, convert, onSubmit, onCancel }: TransferFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_account_id: accounts[0]?.id ?? "",
      to_account_id: accounts[1]?.id ?? "",
      amount: 0,
      notes: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const amount = useWatch({ control, name: "amount" });
  const fromId = useWatch({ control, name: "from_account_id" });
  const toId = useWatch({ control, name: "to_account_id" });

  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = accounts.find((a) => a.id === toId);

  const fromCurrency = fromAccount?.currency ?? "USD";
  const toCurrency = toAccount?.currency ?? "USD";
  const showConversion = fromCurrency !== toCurrency && amount > 0;
  const convertedAmount = showConversion ? convert(amount, fromCurrency, toCurrency) : amount;

  const handleFormSubmit: SubmitHandler<TransferInput> = (data) => onSubmit(data);

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} — ${formatCurrency(a.balance, a.currency)}`,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Select
        label="From account"
        error={errors.from_account_id?.message}
        options={accountOptions}
        {...register("from_account_id")}
      />

      <Select
        label="To account"
        error={errors.to_account_id?.message}
        options={accountOptions}
        {...register("to_account_id")}
      />

      <Input
        label="Amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register("amount", { valueAsNumber: true })}
      />

      {showConversion && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          ≈ {formatCurrency(convertedAmount, toCurrency)} received
        </p>
      )}

      <Input
        label="Date"
        type="date"
        error={errors.date?.message}
        {...register("date")}
      />

      <Input
        label="Notes (optional)"
        placeholder="Optional note"
        error={errors.notes?.message}
        {...register("notes")}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Transfer
        </Button>
      </div>
    </form>
  );
};
