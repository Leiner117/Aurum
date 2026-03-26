export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}
