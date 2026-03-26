import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: SummaryCardProps) {
  const trendColor =
    trend === "up"
      ? "text-[var(--color-danger)]"
      : trend === "down"
      ? "text-[var(--color-success)]"
      : "text-[var(--color-muted-foreground)]";

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
            {value}
          </p>
          {subtitle && (
            <p className={cn("mt-1 text-xs", trendColor)}>{subtitle}</p>
          )}
        </div>
        <div className="rounded-lg bg-[var(--color-muted)] p-2 text-[var(--color-muted-foreground)]">
          {icon}
        </div>
      </div>
    </div>
  );
}
