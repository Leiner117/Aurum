export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date: string | null;
  color: string;
  icon: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: string;
  user_id: string;
  goal_id: string;
  account_id: string | null;
  amount: number;
  currency: string;
  notes: string | null;
  date: string;
  created_at: string;
}

export interface CreateGoalInput {
  name: string;
  description?: string;
  target_amount: number;
  currency: string;
  target_date?: string | null;
  color: string;
  icon: string;
}

export interface UpdateGoalInput extends Partial<CreateGoalInput> {
  id: string;
}

export interface CreateGoalContributionInput {
  goal_id: string;
  account_id?: string | null;
  amount: number;
  currency: string;
  notes?: string;
  date: string;
}
