export const EXPENSES_PAGE_SIZE = 20;

export const EXPENSE_SORT_OPTIONS = [
  { label: "Date (newest)", value: "date_desc" },
  { label: "Date (oldest)", value: "date_asc" },
  { label: "Amount (highest)", value: "amount_desc" },
  { label: "Amount (lowest)", value: "amount_asc" },
] as const;

export const EXPENSE_SORT_VALUES = {
  DATE_DESC: "date_desc",
  DATE_ASC: "date_asc",
  AMOUNT_DESC: "amount_desc",
  AMOUNT_ASC: "amount_asc",
} as const;
