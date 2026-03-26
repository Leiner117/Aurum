"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAccountsThunk,
  createAccountThunk,
  updateAccountThunk,
  deleteAccountThunk,
} from "@/store/slices/accountsSlice";
import type { CreateAccountInput, UpdateAccountInput } from "@/types/account.types";

export interface AccountsViewModelReturn {
  accounts: ReturnType<typeof useAppSelector<ReturnType<typeof useAppSelector>>>;
  isLoading: boolean;
  error: string | null;
  createAccount: (data: CreateAccountInput) => Promise<boolean>;
  updateAccount: (data: UpdateAccountInput) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;
  refetch: () => void;
}

export const useAccountsViewModel = () => {
  const dispatch = useAppDispatch();
  const { items: accounts, isLoading, error } = useAppSelector((s) => s.accounts);

  useEffect(() => {
    dispatch(fetchAccountsThunk());
  }, [dispatch]);

  const createAccount = async (data: CreateAccountInput): Promise<boolean> => {
    const result = await dispatch(createAccountThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const updateAccount = async (data: UpdateAccountInput): Promise<boolean> => {
    const result = await dispatch(updateAccountThunk(data));
    return !result.type.endsWith("/rejected");
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    const result = await dispatch(deleteAccountThunk(id));
    return !result.type.endsWith("/rejected");
  };

  const refetch = () => dispatch(fetchAccountsThunk());

  return { accounts, isLoading, error, createAccount, updateAccount, deleteAccount, refetch };
};
