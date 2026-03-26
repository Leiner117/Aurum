import type { CategoryType } from "./category.types";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  type: CategoryType;
  created_at: string;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}
