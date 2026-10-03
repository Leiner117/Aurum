"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ACCOUNTS_EXCLUDED_STORAGE_KEY } from "@/constants/accounts.constants";
import type { Account } from "@/types/account.types";

export interface AccountSelectionViewModelReturn {
  selectedAccounts: Account[];
  isSelected: (id: string) => boolean;
  toggleAccount: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
}

const readExcluded = (): string[] => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_EXCLUDED_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
};

const writeExcluded = (ids: string[]) => {
  try {
    localStorage.setItem(ACCOUNTS_EXCLUDED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — selection just won't persist
  }
};

// Tracks excluded (not selected) IDs so newly created accounts are included by default.
export const useAccountSelectionViewModel = (
  accounts: Account[]
): AccountSelectionViewModelReturn => {
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  useEffect(() => {
    setExcludedIds(readExcluded());
  }, []);

  const updateExcluded = useCallback((next: string[]) => {
    setExcludedIds(next);
    writeExcluded(next);
  }, []);

  const isSelected = useCallback((id: string) => !excludedIds.includes(id), [excludedIds]);

  const toggleAccount = useCallback(
    (id: string) =>
      updateExcluded(
        excludedIds.includes(id) ? excludedIds.filter((x) => x !== id) : [...excludedIds, id]
      ),
    [excludedIds, updateExcluded]
  );

  const selectAll = useCallback(() => updateExcluded([]), [updateExcluded]);

  const clearSelection = useCallback(
    () => updateExcluded(accounts.map((a) => a.id)),
    [accounts, updateExcluded]
  );

  const selectedAccounts = useMemo(
    () => accounts.filter((a) => !excludedIds.includes(a.id)),
    [accounts, excludedIds]
  );

  return {
    selectedAccounts,
    isSelected,
    toggleAccount,
    selectAll,
    clearSelection,
    isAllSelected: selectedAccounts.length === accounts.length,
  };
};
