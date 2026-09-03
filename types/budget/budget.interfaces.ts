import type { BudgetStatus } from "./budget.types";

export type BudgetPeriodType = "monthly" | "weekly";

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  currency: string;
  month: number | null;
  year: number;
  week_number: number | null;
  period_type: BudgetPeriodType;
  alert_threshold: number;
  is_recurring: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetSummary {
  id: string;
  budget_id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  budget_amount: number;
  budget_currency: string;
  alert_threshold: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  month: number | null;
  year: number;
  week_number: number | null;
  period_type: BudgetPeriodType;
  is_recurring: boolean;
  notifications_enabled: boolean;
}

export interface CreateBudgetInput {
  category_id: string;
  amount: number;
  currency: string;
  year: number;
  period_type: BudgetPeriodType;
  month?: number | null;
  week_number?: number | null;
  alert_threshold?: number;
  is_recurring?: boolean;
  notifications_enabled?: boolean;
}

export interface UpdateBudgetInput extends Partial<CreateBudgetInput> {
  id: string;
}

export interface BudgetOverview {
  monthlyIncome: number | null;
  monthlyIncomeCurrency: string;
  totalBudgeted: number;
  impliedSavings: number | null;
  currency: string;
}

export interface BudgetComplianceMonth {
  month: number;
  totalBudgeted: number;
  totalSpent: number;
  budgetMet: boolean;
  hasData: boolean;
}
