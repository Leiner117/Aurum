"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTransfersThunk,
  createTransferThunk,
  deleteTransferThunk,
} from "@/store/slices/transfersSlice";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import type { Transfer } from "@/types/transfer";
import type { TransferInput } from "@/lib/validators";
import type { Account } from "@/types/account";

export interface TransfersViewModelReturn {
  transfers: Transfer[];
  isLoading: boolean;
  error: string | null;
  createTransfer: (data: TransferInput, accounts: Account[]) => Promise<boolean>;
  deleteTransfer: (id: string) => Promise<boolean>;
  refetch: () => void;
}

export const useTransfersViewModel = (): TransfersViewModelReturn => {
  const dispatch = useAppDispatch();
  const { items: transfers, isLoading, error } = useAppSelector((s) => s.transfers);
  const { convert } = useCurrencyViewModel();

  useEffect(() => {
    dispatch(fetchTransfersThunk());
  }, [dispatch]);

  const createTransfer = async (data: TransferInput, accounts: Account[]): Promise<boolean> => {
    const fromAccount = accounts.find((a) => a.id === data.from_account_id);
    const toAccount = accounts.find((a) => a.id === data.to_account_id);
    if (!fromAccount || !toAccount) return false;

    const fromCurrency = fromAccount.currency;
    const toCurrency = toAccount.currency;

    const convertedAmount = fromCurrency === toCurrency
      ? data.amount
      : convert(data.amount, fromCurrency, toCurrency) || data.amount;

    const result = await dispatch(createTransferThunk({
      from_account_id: data.from_account_id,
      to_account_id: data.to_account_id,
      amount: data.amount,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      converted_amount: convertedAmount,
      notes: data.notes,
      date: data.date,
    }));
    return !result.type.endsWith("/rejected");
  };

  const deleteTransfer = async (id: string): Promise<boolean> => {
    const result = await dispatch(deleteTransferThunk(id));
    return !result.type.endsWith("/rejected");
  };

  const refetch = () => dispatch(fetchTransfersThunk());

  return { transfers, isLoading, error, createTransfer, deleteTransfer, refetch };
};
