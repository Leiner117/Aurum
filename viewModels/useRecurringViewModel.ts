"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchRecurringThunk,
  processRecurringThunk,
  createRecurringThunk,
  updateRecurringThunk,
  toggleActiveThunk,
  deleteRecurringThunk,
} from "@/store/slices/recurringSlice";
import type {
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from "@/types/recurring.types";

export interface RecurringViewModelReturn {
  recurring: ReturnType<typeof useAppSelector<ReturnType<typeof useAppSelector>>>;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  generatedCount: number;
  createRecurring: (data: CreateRecurringExpenseInput) => Promise<boolean>;
  updateRecurring: (data: UpdateRecurringExpenseInput) => Promise<boolean>;
  toggleActive: (id: string, isActive: boolean) => Promise<boolean>;
  deleteRecurring: (id: string) => Promise<boolean>;
  refetch: () => void;
}

export const useRecurringViewModel = () => {
  const dispatch = useAppDispatch();
  const { items: recurring, isLoading, isProcessing, error, generatedCount } = useAppSelector(
    (s) => s.recurring
  );

  useEffect(() => {
    dispatch(fetchRecurringThunk());
    dispatch(processRecurringThunk());
  }, [dispatch]);

  const createRecurring = async (data: CreateRecurringExpenseInput): Promise<boolean> => {
    const result = await dispatch(createRecurringThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const updateRecurring = async (data: UpdateRecurringExpenseInput): Promise<boolean> => {
    const result = await dispatch(updateRecurringThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const toggleActive = async (id: string, isActive: boolean): Promise<boolean> => {
    const result = await dispatch(toggleActiveThunk({ id, isActive }));
    return !result.type.endsWith("/rejected");
  };

  const deleteRecurring = async (id: string): Promise<boolean> => {
    const result = await dispatch(deleteRecurringThunk(id));
    return !result.type.endsWith("/rejected");
  };

  const refetch = () => dispatch(fetchRecurringThunk());

  return {
    recurring,
    isLoading,
    isProcessing,
    error,
    generatedCount,
    createRecurring,
    updateRecurring,
    toggleActive,
    deleteRecurring,
    refetch,
  };
};
