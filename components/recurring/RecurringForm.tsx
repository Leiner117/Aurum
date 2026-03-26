"use client";

import { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recurringExpenseSchema, type RecurringExpenseInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import { cn } from "@/lib/utils";
import type { RecurringExpenseWithCategory } from "@/types/recurring.types";
import type { Category } from "@/types/category.types";
import type { Account } from "@/types/account.types";

const FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

interface RecurringFormProps {
  recurring?: RecurringExpenseWithCategory;
  categories: Category[];
  accounts?: Account[];
  defaultCurrency?: string;
  isLoading: boolean;
  onSubmit: (data: RecurringExpenseInput) => void;
  onCancel: () => void;
}

export const RecurringForm = ({
  recurring,
  categories,
  accounts = [],
  defaultCurrency = "USD",
  isLoading,
  onSubmit,
  onCancel,
}: RecurringFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecurringExpenseInput>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      description: recurring?.description ?? "",
      amount: recurring?.amount ?? undefined,
      currency: recurring?.currency ?? defaultCurrency,
      category_id: recurring?.category_id ?? null,
      account_id: recurring?.account_id ?? null,
      frequency: recurring?.frequency ?? "monthly",
      next_date: recurring?.next_date ?? "",
      type: recurring?.type ?? "expense",
    },
  });

  useEffect(() => {
    if (recurring) {
      reset({
        description: recurring.description,
        amount: recurring.amount,
        currency: recurring.currency,
        category_id: recurring.category_id,
        account_id: recurring.account_id ?? null,
        frequency: recurring.frequency,
        next_date: recurring.next_date,
        type: recurring.type,
      });
    }
  }, [recurring, reset]);

  const handleFormSubmit: SubmitHandler<RecurringExpenseInput> = (data) => onSubmit(data);

  const activeType = watch("type");
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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Type toggle */}
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
        <input type="hidden" {...register("type")} />
      </div>

      <Input
        label="Description"
        placeholder="e.g. Netflix, Rent, Salary"
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
        <Select
          label="Frequency"
          options={FREQUENCY_OPTIONS}
          error={errors.frequency?.message}
          {...register("frequency")}
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

      <Input
        label="Next date"
        type="date"
        error={errors.next_date?.message}
        {...register("next_date")}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {recurring ? "Save changes" : "Add recurring"}
        </Button>
      </div>
    </form>
  );
};
