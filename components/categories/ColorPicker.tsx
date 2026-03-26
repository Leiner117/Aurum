"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/constants/categories.constants";
import { Check } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
            value === color && "ring-2 ring-offset-2 ring-[var(--color-primary)]"
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        >
          {value === color && (
            <Check className="mx-auto h-3.5 w-3.5 text-white" strokeWidth={3} />
          )}
        </button>
      ))}
    </div>
  );
};
