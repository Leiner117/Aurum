"use client";

import { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import type { ExpenseWithCategory, TransactionType } from "@/types/expense.types";
import type { Category } from "@/types/category.types";
import type { Account } from "@/types/account.types";

interface ExpenseFormProps {
  expense?: ExpenseWithCategory;
  categories: Category[];
  accounts?: Account[];
  type?: TransactionType;
  defaultCurrency?: string;
  hideTypeToggle?: boolean;
  isLoading: boolean;
  onSubmit: (data: ExpenseInput) => void;
  onCancel: () => void;
}

const today = new Date().toISOString().split("T")[0];

export const ExpenseForm = ({
  expense,
  categories,
  accounts = [],
  type = "expense",
  defaultCurrency = "USD",
  hideTypeToggle = false,
  isLoading,
  onSubmit,
  onCancel,
}: ExpenseFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description ?? "",
      amount: expense?.amount ?? undefined,
      currency: expense?.currency ?? defaultCurrency,
      category_id: expense?.category_id ?? null,
      account_id: expense?.account_id ?? null,
      date: expense?.date ?? today,
      notes: expense?.notes ?? "",
      type: expense?.type ?? type,
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        category_id: expense.category_id,
        account_id: expense.account_id ?? null,
        date: expense.date,
        notes: expense.notes ?? "",
        type: expense.type,
      });
    }
  }, [expense, reset]);

  const activeType = watch("type");
  const isIncome = activeType === "income";

  const filteredCategories = categories.filter((c) => c.type === activeType);
  const categoryOptions = [
    { label: "No category", value: "" },
    ...filteredCategories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.code,
  }));

  const accountOptions = [
    { label: "No account", value: "" },
    ...accounts.map((a) => ({ label: `${a.name} (${a.currency})`, value: a.id })),
  ];

  const handleFormSubmit: SubmitHandler<ExpenseInput> = (data) => {
    onSubmit({
      ...data,
      category_id: data.category_id || null,
      account_id: data.account_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Type toggle */}
      {!expense && !hideTypeToggle && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[var(--color-foreground)]">Type</p>
          <div className="flex gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("type", t, { shouldValidate: true })}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
                  activeType === t
                    ? t === "expense"
                      ? "border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)] dark:bg-red-900/20"
                      : "border-[var(--color-success)] bg-green-50 text-[var(--color-success)] dark:bg-green-900/20"
                    : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <Input
        label="Description"
        placeholder={isIncome ? "e.g. Monthly salary" : "e.g. Grocery shopping"}
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              {...field}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
              value={field.value ?? ""}
            />
          )}
        />
        <Select
          label="Currency"
          options={currencyOptions}
          error={errors.currency?.message}
          {...register("currency")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Category"
          options={categoryOptions}
          error={errors.category_id?.message}
          {...register("category_id")}
        />
        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register("date")}
        />
      </div>

      {accounts.length > 0 && (
        <Select
          label="Account (optional)"
          options={accountOptions}
          error={errors.account_id?.message}
          {...register("account_id")}
        />
      )}

      {!isIncome && (
        <Input
          label="Notes (optional)"
          placeholder="Any additional details..."
          error={errors.notes?.message}
          {...register("notes")}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {expense ? "Save changes" : isIncome ? "Add income" : "Add expense"}
        </Button>
      </div>
    </form>
  );
};
