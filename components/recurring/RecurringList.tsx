"use client";

import { Pencil, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { formatCurrency } from "@/lib/currency/format";
import { formatDate } from "@/lib/utils";
import type { RecurringExpenseWithCategory } from "@/types/recurring.types";

interface RecurringListProps {
  items: RecurringExpenseWithCategory[];
  onEdit: (item: RecurringExpenseWithCategory) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const RecurringList = ({
  items,
  onEdit,
  onDelete,
  onToggleActive,
}: RecurringListProps) => {
  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 py-4 px-1"
        >
          {/* Category icon */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: item.category
                ? `${item.category.color}22`
                : "var(--color-muted)",
            }}
          >
            {item.category ? (
              <CategoryIcon
                name={item.category.icon}
                color={item.category.color}
                className="h-4 w-4"
              />
            ) : (
              <RefreshCw className="h-4 w-4 text-[var(--color-muted-foreground)]" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`truncate text-sm font-medium ${
                  item.is_active
                    ? "text-[var(--color-foreground)]"
                    : "text-[var(--color-muted-foreground)] line-through"
                }`}
              >
                {item.description}
              </span>
              <Badge variant={item.is_active ? "success" : "default"}>
                {item.is_active ? "Active" : "Paused"}
              </Badge>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--color-muted-foreground)]">
              <span>{FREQUENCY_LABEL[item.frequency]}</span>
              {item.category && <span>{item.category.name}</span>}
              <span>Next: {formatDate(item.next_date)}</span>
            </div>
          </div>

          {/* Amount */}
          <span className="shrink-0 text-sm font-semibold text-[var(--color-foreground)]">
            {formatCurrency(item.amount, item.currency)}
          </span>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              title={item.is_active ? "Pause" : "Activate"}
              onClick={() => onToggleActive(item.id, !item.is_active)}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  item.is_active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)]"
                }`}
              />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Edit"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Delete"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger)]" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};
