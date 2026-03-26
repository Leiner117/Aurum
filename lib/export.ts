import type { ExpenseWithCategory } from "@/types/expense.types";

export function exportExpensesToCsv(expenses: ExpenseWithCategory[], filename = "expenses.csv") {
  const headers = ["Date", "Description", "Category", "Amount", "Currency", "Notes"];

  const rows = expenses.map((e) => [
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    e.category?.name ?? "Uncategorized",
    e.amount.toString(),
    e.currency,
    `"${(e.notes ?? "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
