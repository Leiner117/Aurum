import type { ExpenseWithCategory } from "@/types/expense.types";
import { isNativePlatform } from "@/lib/native/platform";
import { shareTextFile } from "@/lib/native/file-share";

const CSV_HEADERS = ["Date", "Description", "Category", "Amount", "Currency", "Notes"];

const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;

export const buildExpensesCsv = (expenses: ExpenseWithCategory[]): string => {
  const rows = expenses.map((e) => [
    e.date,
    quote(e.description),
    e.category?.name ?? "Uncategorized",
    e.amount.toString(),
    e.currency,
    quote(e.notes ?? ""),
  ]);
  return [CSV_HEADERS.join(","), ...rows.map((r) => r.join(","))].join("\n");
};

const downloadInBrowser = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Browser: downloads the file. Android app: saves it and opens the share sheet.
export async function exportExpensesToCsv(expenses: ExpenseWithCategory[], filename = "expenses.csv") {
  const csv = buildExpensesCsv(expenses);
  if (isNativePlatform()) {
    await shareTextFile(filename, csv, "Export expenses");
    return;
  }
  downloadInBrowser(csv, filename);
}
