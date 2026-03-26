export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithCategory extends Budget {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

// Matches the shape returned by the get_budget_summary() DB function
export interface BudgetSummary {
  id: string; // mapped from budget_id for convenience
  budget_id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  budget_amount: number;
  budget_currency: string;
  alert_threshold: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
}

export interface CreateBudgetInput {
  category_id: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  alert_threshold?: number;
}

export interface UpdateBudgetInput extends Partial<CreateBudgetInput> {
  id: string;
}
