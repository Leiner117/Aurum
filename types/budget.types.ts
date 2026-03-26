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

export interface BudgetSummary extends BudgetWithCategory {
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
