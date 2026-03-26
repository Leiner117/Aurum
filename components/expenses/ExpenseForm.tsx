"use client";

import { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import type { ExpenseWithCategory, TransactionType } from "@/types/expense.types";
import type { Category } from "@/types/category.types";

interface ExpenseFormProps {
  expense?: ExpenseWithCategory;
  categories: Category[];
  type?: TransactionType;
  defaultCurrency?: string;
  isLoading: boolean;
  onSubmit: (data: ExpenseInput) => void;
  onCancel: () => void;
}

const today = new Date().toISOString().split("T")[0];

export function ExpenseForm({
  expense,
  categories,
  type = "expense",
  defaultCurrency = "USD",
  isLoading,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const activeType = expense?.type ?? type;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description ?? "",
      amount: expense?.amount ?? undefined,
      currency: expense?.currency ?? defaultCurrency,
      category_id: expense?.category_id ?? null,
      date: expense?.date ?? today,
      notes: expense?.notes ?? "",
      type: activeType,
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        category_id: expense.category_id,
        date: expense.date,
        notes: expense.notes ?? "",
        type: expense.type,
      });
    }
  }, [expense, reset]);

  // Only show categories that match the active type
  const filteredCategories = categories.filter((c) => c.type === activeType);
  const categoryOptions = [
    { label: "No category", value: "" },
    ...filteredCategories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.code,
  }));

  const handleFormSubmit: SubmitHandler<ExpenseInput> = (data) => {
    onSubmit({ ...data, category_id: data.category_id || null, type: activeType });
  };

  const isIncome = activeType === "income";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Hidden type field */}
      <input type="hidden" {...register("type")} value={activeType} />

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
          {expense
            ? "Save changes"
            : isIncome
            ? "Add income"
            : "Add expense"}
        </Button>
      </div>
    </form>
  );
}
