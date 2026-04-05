"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchGoalsThunk,
  createGoalThunk,
  updateGoalThunk,
  deleteGoalThunk,
  createGoalContributionThunk,
  deleteGoalContributionThunk,
  fetchGoalContributionsThunk,
} from "@/store/slices/goalsSlice";
import type {
  Goal,
  GoalContribution,
  CreateGoalInput,
  UpdateGoalInput,
  CreateGoalContributionInput,
} from "@/types/goal";

export interface GoalsViewModelReturn {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  contributions: GoalContribution[];
  createGoal: (data: CreateGoalInput) => Promise<boolean>;
  updateGoal: (data: UpdateGoalInput) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;
  contribute: (data: CreateGoalContributionInput) => Promise<boolean>;
  deleteContribution: (id: string) => Promise<boolean>;
  fetchContributions: (goalId: string) => Promise<GoalContribution[]>;
  refetch: () => void;
}

export const useGoalsViewModel = (): GoalsViewModelReturn => {
  const dispatch = useAppDispatch();
  const { items: goals, isLoading, error } = useAppSelector((s) => s.goals);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);

  useEffect(() => {
    dispatch(fetchGoalsThunk());
  }, [dispatch]);

  const createGoal = async (data: CreateGoalInput): Promise<boolean> => {
    const result = await dispatch(createGoalThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const updateGoal = async (data: UpdateGoalInput): Promise<boolean> => {
    const result = await dispatch(updateGoalThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    const result = await dispatch(deleteGoalThunk(id));
    return !result.type.endsWith("/rejected");
  };

  const contribute = async (data: CreateGoalContributionInput): Promise<boolean> => {
    const result = await dispatch(createGoalContributionThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const deleteContribution = async (id: string): Promise<boolean> => {
    const result = await dispatch(deleteGoalContributionThunk(id));
    return !result.type.endsWith("/rejected");
  };

  const fetchContributions = async (goalId: string): Promise<GoalContribution[]> => {
    const result = await dispatch(fetchGoalContributionsThunk(goalId));
    if (fetchGoalContributionsThunk.fulfilled.match(result)) {
      setContributions(result.payload);
      return result.payload;
    }
    return [];
  };

  const refetch = () => dispatch(fetchGoalsThunk());

  return {
    goals,
    isLoading,
    error,
    contributions,
    createGoal,
    updateGoal,
    deleteGoal,
    contribute,
    deleteContribution,
    fetchContributions,
    refetch,
  };
};
