"use client";

import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetSchema, type BudgetInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import { BUDGET_ALERT_THRESHOLD_DEFAULT } from "@/constants/budgets.constants";
import type { BudgetSummary } from "@/types/budget.types";
import type { Category } from "@/types/category.types";

const MONTH_OPTIONS = [
  { label: "January", value: "1" }, { label: "February", value: "2" },
  { label: "March", value: "3" }, { label: "April", value: "4" },
  { label: "May", value: "5" }, { label: "June", value: "6" },
  { label: "July", value: "7" }, { label: "August", value: "8" },
  { label: "September", value: "9" }, { label: "October", value: "10" },
  { label: "November", value: "11" }, { label: "December", value: "12" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [0, 1, 2].map((offset) => ({
  label: String(currentYear + offset),
  value: String(currentYear + offset),
}));

interface BudgetFormProps {
  budget?: BudgetSummary;
  categories: Category[];
  defaultMonth?: number;
  defaultYear?: number;
  defaultCurrency?: string;
  isLoading: boolean;
  onSubmit: (data: BudgetInput) => void;
  onCancel: () => void;
}

export const BudgetForm = ({
  budget,
  categories,
  defaultMonth = new Date().getMonth() + 1,
  defaultYear = new Date().getFullYear(),
  defaultCurrency = "USD",
  isLoading,
  onSubmit,
  onCancel,
}: BudgetFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: budget?.category_id ?? "",
      amount: budget?.budget_amount ?? undefined,
      currency: budget?.budget_currency ?? defaultCurrency,
      month: budget?.month ?? defaultMonth,
      year: budget?.year ?? defaultYear,
      alert_threshold: budget?.alert_threshold ?? BUDGET_ALERT_THRESHOLD_DEFAULT,
      is_recurring: budget?.is_recurring ?? false,
    },
  });

  const handleFormSubmit: SubmitHandler<BudgetInput> = (data) => onSubmit(data);

  const categoryOptions = [
    { label: "Select a category", value: "" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.code,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Select
        label="Category"
        options={categoryOptions}
        error={errors.category_id?.message}
        {...register("category_id")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Input
              label="Budget amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              {...field}
              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
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
        <Controller
          name="month"
          control={control}
          render={({ field }) => (
            <Select
              label="Month"
              options={MONTH_OPTIONS}
              value={String(field.value)}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
              error={errors.month?.message}
            />
          )}
        />
        <Controller
          name="year"
          control={control}
          render={({ field }) => (
            <Select
              label="Year"
              options={YEAR_OPTIONS}
              value={String(field.value)}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
              error={errors.year?.message}
            />
          )}
        />
      </div>

      <Controller
        name="alert_threshold"
        control={control}
        render={({ field }) => (
          <Input
            label={`Alert at (%) — currently ${field.value ?? BUDGET_ALERT_THRESHOLD_DEFAULT}%`}
            type="range"
            min="10"
            max="100"
            step="5"
            error={errors.alert_threshold?.message}
            {...field}
            onChange={(e) => field.onChange(parseInt(e.target.value))}
            value={field.value ?? BUDGET_ALERT_THRESHOLD_DEFAULT}
            className="h-2 cursor-pointer accent-[var(--color-primary)]"
          />
        )}
      />

      {/* Recurring toggle */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-foreground)]">Recurring budget</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Auto-renew this budget every month</p>
        </div>
        <Controller
          name="is_recurring"
          control={control}
          render={({ field }) => (
            <button
              type="button"
              role="switch"
              aria-checked={field.value}
              onClick={() => field.onChange(!field.value)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
                field.value ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  field.value ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          )}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {budget ? "Save changes" : "Create budget"}
        </Button>
      </div>
    </form>
  );
};
