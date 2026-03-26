"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_ICONS } from "@/constants/categories.constants";
import { CategoryIcon } from "./CategoryIcon";

interface IconPickerProps {
  value: string;
  color: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, color, onChange }: IconPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border transition-all",
            "hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]",
            value === icon
              ? "border-transparent shadow-sm"
              : "border-[var(--color-border)] bg-[var(--color-surface)]"
          )}
          style={value === icon ? { backgroundColor: color } : undefined}
          aria-label={`Select icon ${icon}`}
          title={icon}
        >
          <CategoryIcon
            name={icon}
            className="h-4 w-4"
            color={value === icon ? "#ffffff" : "var(--color-muted-foreground)"}
          />
        </button>
      ))}
    </div>
  );
}
