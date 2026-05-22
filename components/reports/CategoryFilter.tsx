"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvailableCategory } from "@/viewModels/useReportsViewModel";

interface CategoryFilterProps {
  categories: AvailableCategory[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export const CategoryFilter = ({ categories, selected, onChange }: CategoryFilterProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const label =
    selected.length === 0
      ? "All Categories"
      : selected.length === 1
        ? (categories.find((c) => c.key === selected[0])?.name ?? "1 category")
        : `${selected.length} categories`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
          "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-foreground)]",
          "hover:bg-[var(--color-surface)]",
          selected.length > 0 && "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
        )}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            className="ml-0.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <X className="h-3 w-3" />
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform text-[var(--color-muted-foreground)]",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-lg">
          {categories.map((cat) => {
            const isSelected = selected.includes(cat.key);
            return (
              <button
                key={cat.key}
                onClick={() => toggle(cat.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors",
                  isSelected
                    ? "bg-[var(--color-muted)] text-[var(--color-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 truncate">{cat.name}</span>
                {isSelected && (
                  <span className="text-[var(--color-primary)] text-[10px] font-bold">✓</span>
                )}
              </button>
            );
          })}
          {categories.length === 0 && (
            <p className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">No categories</p>
          )}
        </div>
      )}
    </div>
  );
};
