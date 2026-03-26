"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/providers/ToastProvider";
import type { BudgetSummary } from "@/types/budget.types";

export const useBudgetAlertsViewModel = (summaries: BudgetSummary[]) => {
  const { showToast } = useToast();
  const alertedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    summaries.forEach((summary) => {
      if (alertedIds.current.has(summary.id)) return;

      if (summary.status === "exceeded") {
        showToast(
          `Budget exceeded: ${summary.category_name} is ${Math.round(summary.percentage)}% spent`,
          "error"
        );
        alertedIds.current.add(summary.id);
      } else if (summary.status === "warning") {
        showToast(
          `Heads up: ${summary.category_name} is ${Math.round(summary.percentage)}% of budget`,
          "warning"
        );
        alertedIds.current.add(summary.id);
      }
    });
  }, [summaries, showToast]);
};
