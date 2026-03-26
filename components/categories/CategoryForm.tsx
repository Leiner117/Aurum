"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryInput } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import type { Category } from "@/types/category.types";

const DEFAULT_COLOR = "#6366f1";
const DEFAULT_ICON = "ellipsis";

interface CategoryFormProps {
  category?: Category;
  isLoading: boolean;
  onSubmit: (data: CategoryInput) => void;
  onCancel: () => void;
}

export function CategoryForm({
  category,
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
    },
  });

  const color = watch("color");
  const icon = watch("icon");

  useEffect(() => {
    if (category) {
      reset({ name: category.name, icon: category.icon, color: category.color });
    }
  }, [category, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
