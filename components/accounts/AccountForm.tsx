"use client";

import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema, type AccountInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES, ACCOUNT_COLORS, ACCOUNT_COLOR_DEFAULT } from "@/constants/accounts.constants";
import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import { Check } from "lucide-react";
import type { Account } from "@/types/account.types";

interface AccountFormProps {
  account?: Account;
  isLoading: boolean;
  onSubmit: (data: AccountInput) => void;
  onCancel: () => void;
}

export const AccountForm = ({ account, isLoading, onSubmit, onCancel }: AccountFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "checking",
      balance: account?.balance ?? 0,
      currency: account?.currency ?? "USD",
      color: account?.color ?? ACCOUNT_COLOR_DEFAULT,
      icon: account?.icon ?? "wallet",
    },
  });

  const color = watch("color");

  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        color: account.color,
        icon: account.icon,
      });
    }
  }, [account, reset]);

  const handleFormSubmit: SubmitHandler<AccountInput> = (data) => onSubmit(data);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Account name"
        placeholder="e.g. Main Checking"
        error={errors.name?.message}
        {...register("name")}
      />

      <Select
        label="Account type"
        error={errors.type?.message}
        options={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        {...register("type")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Initial balance"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.balance?.message}
          {...register("balance", { valueAsNumber: true })}
        />

        <Select
          label="Currency"
          error={errors.currency?.message}
          options={SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
          {...register("currency")}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--color-foreground)]">Color</p>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((c) => (
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

      <input type="hidden" {...register("icon")} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {account ? "Save changes" : "Create account"}
        </Button>
      </div>
    </form>
  );
};
