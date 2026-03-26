"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category.types";

const DEFAULT_COLOR = "#6366f1";
const DEFAULT_ICON = "ellipsis";

interface CategoryFormProps {
  category?: Category;
  defaultType?: "expense" | "income";
  isLoading: boolean;
  onSubmit: (data: CategoryInput) => void;
  onCancel: () => void;
}

export function CategoryForm({
  category,
  defaultType = "expense",
  isLoading,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      icon: category?.icon ?? DEFAULT_ICON,
      color: category?.color ?? DEFAULT_COLOR,
      type: category?.type ?? defaultType,
    },
  });

  const color = watch("color");
  const icon = watch("icon");
  const type = watch("type");

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
      });
    }
  }, [category, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                type === t
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
        {/* Hidden register for type */}
        <input type="hidden" {...register("type")} />
      </div>

      <Input
        label="Category name"
        placeholder="e.g. Food & Dining"
        error={errors.name?.message}
        {...register("name")}
      />

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--color-foreground)]">Color</p>
        <ColorPicker
          value={color}
          onChange={(c) => setValue("color", c, { shouldValidate: true })}
        />
        {errors.color && (
          <p className="text-xs text-[var(--color-danger)]">{errors.color.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--color-foreground)]">Icon</p>
        <IconPicker
          value={icon}
          color={color}
          onChange={(i) => setValue("icon", i, { shouldValidate: true })}
        />
        {errors.icon && (
          <p className="text-xs text-[var(--color-danger)]">{errors.icon.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {category ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}
