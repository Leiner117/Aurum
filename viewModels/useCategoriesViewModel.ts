"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCategoriesThunk,
  createCategoryThunk,
  updateCategoryThunk,
  deleteCategoryThunk,
} from "@/store/slices/categoriesSlice";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/types/category.types";

export interface CategoriesViewModelReturn {
  categories: ReturnType<typeof useAppSelector<ReturnType<typeof useAppSelector>>>;
  isLoading: boolean;
  error: string | null;
  createCategory: (data: CreateCategoryInput) => Promise<boolean>;
  updateCategory: (data: UpdateCategoryInput) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  refetch: () => void;
}

export const useCategoriesViewModel = () => {
  const dispatch = useAppDispatch();
  const { items: categories, isLoading, error } = useAppSelector((s) => s.categories);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
  }, [dispatch]);

  const createCategory = async (data: CreateCategoryInput): Promise<boolean> => {
    const result = await dispatch(createCategoryThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const updateCategory = async (data: UpdateCategoryInput): Promise<boolean> => {
    const result = await dispatch(updateCategoryThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    const result = await dispatch(deleteCategoryThunk(id));
    return !result.type.endsWith("/rejected");
  };

  const refetch = () => dispatch(fetchCategoriesThunk());

  return { categories, isLoading, error, createCategory, updateCategory, deleteCategory, refetch };
};
