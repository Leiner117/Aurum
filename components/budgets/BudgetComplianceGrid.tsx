"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/currency/format";
import type { BudgetComplianceMonth } from "@/types/budget.types";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function buildAllMonths(
  compliance: BudgetComplianceMonth[],
  year: number
): (BudgetComplianceMonth & { isFuture: boolean })[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const byMonth = Object.fromEntries(compliance.map((c) => [c.month, c]));

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
    const data = byMonth[month];
    return data
      ? { ...data, isFuture }
      : { month, totalBudgeted: 0, totalSpent: 0, budgetMet: false, hasData: false, isFuture };
  });
}

interface BudgetComplianceGridProps {
  compliance: BudgetComplianceMonth[];
  year: number;
  currency: string;
  isLoading?: boolean;
}

export const BudgetComplianceGrid = ({
  compliance,
  year,
  currency,
  isLoading,
}: BudgetComplianceGridProps) => {
  const months = buildAllMonths(compliance, year);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          {year} — month by month
        </h2>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {months.map(({ month, totalBudgeted, totalSpent, budgetMet, hasData, isFuture }) => (
              <div
                key={month}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-2"
              >
                <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                  {MONTH_NAMES[month - 1]}
                </p>

                {isFuture ? (
                  <Badge variant="default">Pending</Badge>
                ) : !hasData ? (
                  <Badge variant="default">No data</Badge>
                ) : budgetMet ? (
                  <Badge variant="success">Met</Badge>
                ) : (
                  <Badge variant="danger">Over</Badge>
                )}

                {hasData && !isFuture && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Spent{" "}
                      <span className="font-medium text-[var(--color-foreground)]">
                        {formatCurrency(totalSpent, currency)}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      of{" "}
                      <span className="font-medium text-[var(--color-foreground)]">
                        {formatCurrency(totalBudgeted, currency)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
