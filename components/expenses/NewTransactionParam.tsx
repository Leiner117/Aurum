"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NEW_TRANSACTION_PARAM } from "@/constants/native.constants";
import type { TransactionType } from "@/types/expense.types";

interface NewTransactionParamProps {
  onOpen: (type: TransactionType) => void;
}

// Opens the create form for ?new=expense|income, then clears the param.
// Must be rendered inside <Suspense> (useSearchParams on a static page).
export const NewTransactionParam = ({ onOpen }: NewTransactionParamProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = searchParams.get(NEW_TRANSACTION_PARAM);

  useEffect(() => {
    if (value !== "expense" && value !== "income") return;
    onOpen(value);
    router.replace(pathname);
  }, [value, onOpen, router, pathname]);

  return null;
};
