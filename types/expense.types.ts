export type TransactionType = "expense" | "income";

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  description: string;
  date: string;
  notes: string | null;
  type: TransactionType;
  is_recurring: boolean;
  recurring_expense_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithCategory extends Expense {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
}

export interface CreateExpenseInput {
  category_id: string | null;
  amount: number;
  currency: string;
  description: string;
  date: string;
  notes?: string;
  type: TransactionType;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  id: string;
}

export interface ExpenseFilters {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  type?: TransactionType;
}
