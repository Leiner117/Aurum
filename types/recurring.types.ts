export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringExpense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  description: string;
  frequency: RecurringFrequency;
  next_date: string;
  is_active: boolean;
  type: "expense" | "income";
  created_at: string;
  updated_at: string;
}

export interface RecurringExpenseWithCategory extends RecurringExpense {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
}

export interface CreateRecurringExpenseInput {
  category_id: string | null;
  amount: number;
  currency: string;
  description: string;
  frequency: RecurringFrequency;
  next_date: string;
  type: "expense" | "income";
}

export interface UpdateRecurringExpenseInput
  extends Partial<CreateRecurringExpenseInput> {
  id: string;
}
