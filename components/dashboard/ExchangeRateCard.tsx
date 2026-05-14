"use client";

import { ArrowLeftRight } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ExchangeRateCardProps {
  buyRate: number | null;
  sellRate: number | null;
  rateUpdatedAt: string | null;
  isLoading: boolean;
}

const formatColones = (rate: number) =>
  new Intl.NumberFormat("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rate);

export const ExchangeRateCard = ({
  buyRate,
  sellRate,
  rateUpdatedAt,
  isLoading,
}: ExchangeRateCardProps) => {
  const updatedLabel = rateUpdatedAt
    ? format(parseISO(rateUpdatedAt), "dd MMM yyyy")
    : null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
        <ArrowLeftRight className="h-4 w-4 text-[var(--color-primary)]" />
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1">
        <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
          USD / CRC
        </p>

        {isLoading || buyRate === null ? (
          <div className="flex gap-4">
            <div className="h-4 w-28 animate-pulse rounded bg-[var(--color-muted)]" />
            <div className="h-4 w-28 animate-pulse rounded bg-[var(--color-muted)]" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="text-sm text-[var(--color-foreground)]">
              <span className="text-[var(--color-muted-foreground)]">Compra</span>{" "}
              <span className="font-semibold">₡{formatColones(buyRate)}</span>
            </span>
            {sellRate !== null && (
              <span className="text-sm text-[var(--color-foreground)]">
                <span className="text-[var(--color-muted-foreground)]">Venta</span>{" "}
                <span className="font-semibold">₡{formatColones(sellRate)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {updatedLabel && (
        <p className="hidden text-xs text-[var(--color-muted-foreground)] sm:block shrink-0">
          {updatedLabel}
        </p>
      )}
    </div>
  );
};
