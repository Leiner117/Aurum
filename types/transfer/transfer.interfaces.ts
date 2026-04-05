export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string | null;
  to_account_id: string | null;
  amount: number;
  from_currency: string;
  to_currency: string;
  converted_amount: number;
  notes: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransferInput {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  from_currency: string;
  to_currency: string;
  converted_amount: number;
  notes?: string;
  date: string;
}
