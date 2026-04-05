"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goalContributionSchema, type GoalContributionInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import { formatCurrency } from "@/lib/currency/format";
import { format } from "date-fns";
import type { Goal } from "@/types/goal";
import type { Account } from "@/types/account";

interface GoalContributionFormProps {
  goal: Goal;
  accounts: Account[];
  defaultCurrency?: string;
  isLoading: boolean;
  onSubmit: (data: GoalContributionInput) => void;
  onCancel: () => void;
}

export const GoalContributionForm = ({
  goal,
  accounts,
  defaultCurrency,
  isLoading,
  onSubmit,
  onCancel,
}: GoalContributionFormProps) => {
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalContributionInput>({
    resolver: zodResolver(goalContributionSchema),
    defaultValues: {
      goal_id: goal.id,
      account_id: accounts[0]?.id ?? null,
      amount: 0,
      currency: defaultCurrency ?? goal.currency,
      notes: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const handleFormSubmit: SubmitHandler<GoalContributionInput> = (data) => onSubmit(data);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Goal info */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-3">
        <p className="text-sm font-medium text-[var(--color-foreground)]">{goal.name}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Remaining: {formatCurrency(remaining, goal.currency)}
        </p>
      </div>

      <input type="hidden" {...register("goal_id")} />

      {accounts.length > 0 && (
        <Select
          label="From account"
          error={errors.account_id?.message}
          options={[
            { value: "", label: "No account (manual)" },
            ...accounts.map((a) => ({
              value: a.id,
              label: `${a.name} (${formatCurrency(a.balance, a.currency)})`,
            })),
          ]}
          {...register("account_id")}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Select
          label="Currency"
          error={errors.currency?.message}
          options={SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
          {...register("currency")}
        />
      </div>

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
          Add funds
        </Button>
      </div>
    </form>
  );
};
