"use client";

import { Pencil, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/currency/format";
import type { BudgetOverview } from "@/types/budget.types";

interface BudgetOverviewCardProps {
  overview: BudgetOverview;
  onEditIncome: () => void;
  isLoading?: boolean;
}

export const BudgetOverviewCard = ({ overview, onEditIncome, isLoading }: BudgetOverviewCardProps) => {
  const { monthlyIncome, monthlyIncomeCurrency, totalBudgeted, impliedSavings, currency } = overview;
  const currenciesDiffer = monthlyIncomeCurrency !== currency;

  if (isLoading) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          Monthly overview
        </h2>
      </CardHeader>
      <CardBody className="space-y-3">
        {/* Income row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <Wallet className="h-4 w-4 shrink-0" />
            <span>Monthly income</span>
          </div>
          <div className="flex items-center gap-2">
            {monthlyIncome !== null ? (
              <span className="font-semibold text-[var(--color-foreground)]">
                {formatCurrency(monthlyIncome, monthlyIncomeCurrency)}
              </span>
            ) : (
              <span className="text-sm text-[var(--color-muted-foreground)]">Not set</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onEditIncome}
              aria-label="Edit monthly income"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Budgeted row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>
              Total budgeted
              {currenciesDiffer && (
                <span className="ml-1 text-xs">({currency})</span>
              )}
            </span>
          </div>
          <span className="font-semibold text-[var(--color-foreground)]">
            {formatCurrency(totalBudgeted, currency)}
          </span>
        </div>

        {/* Savings row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <PiggyBank className="h-4 w-4 shrink-0" />
            <span>Projected savings</span>
          </div>
          {impliedSavings !== null ? (
            <span
              className={`font-semibold ${
                impliedSavings >= 0
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-danger)]"
              }`}
            >
              {formatCurrency(impliedSavings, currency)}
            </span>
          ) : currenciesDiffer && monthlyIncome !== null ? (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              Set income in {currency} to see savings
            </span>
          ) : (
            <button
              onClick={onEditIncome}
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              Set income to see savings
            </button>
          )}
        </div>

        {/* Income allocation bar — only when currencies match */}
        {impliedSavings !== null && monthlyIncome !== null && monthlyIncome > 0 && (
          <div className="pt-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${Math.min((totalBudgeted / monthlyIncome) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {Math.round((totalBudgeted / monthlyIncome) * 100)}% of income allocated
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
