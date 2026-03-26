import type { BudgetStatus } from "./budget.types";

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  alert_threshold: number;
  is_recurring: boolean;
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
  month: number;
  year: number;
  is_recurring: boolean;
}

export interface CreateBudgetInput {
  category_id: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  alert_threshold?: number;
  is_recurring?: boolean;
}

export interface UpdateBudgetInput extends Partial<CreateBudgetInput> {
  id: string;
}
