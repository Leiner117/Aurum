"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category.types";

export interface CategoriesViewModelReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  createCategory: (data: CreateCategoryInput) => Promise<boolean>;
  updateCategory: (data: UpdateCategoryInput) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useCategoriesViewModel(): CategoriesViewModelReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from(SUPABASE_TABLES.CATEGORIES)
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");

      if (dbError) throw dbError;
      setCategories(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function createCategory(input: CreateCategoryInput): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.CATEGORIES)
        .insert({ ...input, user_id: user.id });

      if (dbError) throw dbError;
      await fetchCategories();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
      return false;
    }
  }

  async function updateCategory({ id, ...input }: UpdateCategoryInput): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.CATEGORIES)
        .update(input)
        .eq("id", id);

      if (dbError) throw dbError;
      await fetchCategories();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
      return false;
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from(SUPABASE_TABLES.CATEGORIES)
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
      return false;
    }
  }

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
