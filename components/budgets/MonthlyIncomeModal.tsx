"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { monthlyIncomeSchema, type MonthlyIncomeInput } from "@/lib/validators";

const IncomeInput = ({
  field,
  initialValue,
  error,
}: {
  field: ControllerRenderProps<MonthlyIncomeInput, "monthly_income">;
  initialValue?: number | null;
  error?: string;
}) => {
  const [raw, setRaw] = useState(initialValue != null ? String(initialValue) : "");

  useEffect(() => {
    setRaw(initialValue != null ? String(initialValue) : "");
  }, [initialValue]);

  return (
    <Input
      ref={field.ref}
      name={field.name}
      label="Monthly income"
      type="number"
      step="0.01"
      min="0.01"
      placeholder="0.00"
      error={error}
      onBlur={field.onBlur}
      value={raw}
      onChange={(e) => {
        const val = e.target.value;
        setRaw(val);
        const num = parseFloat(val);
        if (!isNaN(num)) field.onChange(num);
        else field.onChange(undefined);
      }}
    />
  );
};

interface MonthlyIncomeModalProps {
  isOpen: boolean;
  currentIncome: number | null;
  currency: string;
  isLoading: boolean;
  onSubmit: (data: MonthlyIncomeInput) => void;
  onClose: () => void;
}

export const MonthlyIncomeModal = ({
  isOpen,
  currentIncome,
  isLoading,
  onSubmit,
  onClose,
}: MonthlyIncomeModalProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MonthlyIncomeInput>({
    resolver: zodResolver(monthlyIncomeSchema),
    defaultValues: { monthly_income: currentIncome ?? undefined },
  });

  useEffect(() => {
    if (isOpen) reset({ monthly_income: currentIncome ?? undefined });
  }, [isOpen, currentIncome, reset]);

  const handleFormSubmit: SubmitHandler<MonthlyIncomeInput> = (data) => onSubmit(data);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Monthly income" size="sm">
      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
        Set your fixed monthly income to calculate savings and track budget compliance.
      </p>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Controller
          name="monthly_income"
          control={control}
          render={({ field }) => (
            <IncomeInput
              field={field}
              initialValue={currentIncome}
              error={errors.monthly_income?.message}
            />
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
