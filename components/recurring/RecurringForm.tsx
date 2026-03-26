"use client";

import { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recurringExpenseSchema, type RecurringExpenseInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import type { RecurringExpenseWithCategory } from "@/types/recurring.types";
import type { Category } from "@/types/category.types";

const FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

interface RecurringFormProps {
  recurring?: RecurringExpenseWithCategory;
  categories: Category[];
  defaultCurrency?: string;
  isLoading: boolean;
  onSubmit: (data: RecurringExpenseInput) => void;
  onCancel: () => void;
}

export function RecurringForm({
  recurring,
  categories,
  defaultCurrency = "USD",
  isLoading,
  onSubmit,
  onCancel,
}: RecurringFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RecurringExpenseInput>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      description: recurring?.description ?? "",
      amount: recurring?.amount ?? undefined,
      currency: recurring?.currency ?? defaultCurrency,
      category_id: recurring?.category_id ?? null,
      frequency: recurring?.frequency ?? "monthly",
      next_date: recurring?.next_date ?? "",
    },
  });

  useEffect(() => {
    if (recurring) {
      reset({
        description: recurring.description,
        amount: recurring.amount,
        currency: recurring.currency,
        category_id: recurring.category_id,
        frequency: recurring.frequency,
        next_date: recurring.next_date,
      });
    }
  }, [recurring, reset]);

  const handleFormSubmit: SubmitHandler<RecurringExpenseInput> = (data) =>
    onSubmit(data);

  const categoryOptions = [
    { label: "No category", value: "" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.code,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Description"
        placeholder="e.g. Netflix, Rent, Gym"
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
}
