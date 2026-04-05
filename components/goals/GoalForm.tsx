"use client";

import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goalSchema, type GoalInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { GOAL_COLORS, GOAL_ICONS, GOAL_DEFAULT_COLOR, GOAL_DEFAULT_ICON } from "@/constants/goals.constants";
import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { Check } from "lucide-react";
import type { Goal } from "@/types/goal";

interface GoalFormProps {
  goal?: Goal;
  defaultCurrency?: string;
  isLoading: boolean;
  onSubmit: (data: GoalInput) => void;
  onCancel: () => void;
}

export const GoalForm = ({ goal, defaultCurrency, isLoading, onSubmit, onCancel }: GoalFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name ?? "",
      description: goal?.description ?? "",
      target_amount: goal?.target_amount ?? 0,
      currency: goal?.currency ?? defaultCurrency ?? "USD",
      target_date: goal?.target_date ?? null,
      color: goal?.color ?? GOAL_DEFAULT_COLOR,
      icon: goal?.icon ?? GOAL_DEFAULT_ICON,
    },
  });

  const color = watch("color");
  const icon = watch("icon");

  useEffect(() => {
    if (goal) {
      reset({
        name: goal.name,
        description: goal.description ?? "",
        target_amount: goal.target_amount,
        currency: goal.currency,
        target_date: goal.target_date ?? null,
        color: goal.color,
        icon: goal.icon,
      });
    }
  }, [goal, reset]);

  const handleFormSubmit: SubmitHandler<GoalInput> = (data) => onSubmit(data);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Goal name"
        placeholder="e.g. Emergency fund"
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="Description (optional)"
        placeholder="What are you saving for?"
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Target amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.target_amount?.message}
          {...register("target_amount", { valueAsNumber: true })}
        />
        <Select
          label="Currency"
          error={errors.currency?.message}
          options={SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
          {...register("currency")}
        />
      </div>

      <Input
        label="Target date (optional)"
        type="date"
        error={errors.target_date?.message}
        {...register("target_date")}
      />

      {/* Color picker */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--color-foreground)]">Color</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("color", c, { shouldValidate: true })}
              className={cn(
                "h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                color === c && "ring-2 ring-offset-2 ring-[var(--color-primary)]"
              )}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            >
              {color === c && <Check className="mx-auto h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
        {errors.color && <p className="text-xs text-[var(--color-danger)]">{errors.color.message}</p>}
      </div>

      {/* Icon picker */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--color-foreground)]">Icon</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setValue("icon", ic, { shouldValidate: true })}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]",
                icon === ic && "border-[var(--color-primary)] bg-[var(--color-surface-hover)]"
              )}
              aria-label={`Select icon ${ic}`}
            >
              <CategoryIcon name={ic} className="h-4 w-4" color={icon === ic ? color : "var(--color-muted-foreground)"} />
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" {...register("icon")} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {goal ? "Save changes" : "Create goal"}
        </Button>
      </div>
    </form>
  );
};
