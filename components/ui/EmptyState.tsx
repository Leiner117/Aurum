import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-[var(--color-muted)] p-4 text-[var(--color-muted-foreground)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--color-foreground)]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)] max-w-xs">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
