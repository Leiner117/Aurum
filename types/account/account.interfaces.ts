import type { AccountType } from "./account.types";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
}

export interface UpdateAccountInput extends Partial<CreateAccountInput> {
  id: string;
}
