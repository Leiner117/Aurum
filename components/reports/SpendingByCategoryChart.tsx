"use client";

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/currency/format";
import type { CategorySpending } from "@/viewModels/useReportsViewModel";

interface SpendingByCategoryChartProps {
  data: CategorySpending[];
  currency: string;
}

export const SpendingByCategoryChart = ({ data, currency }: SpendingByCategoryChartProps) => {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        No spending data for this period.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category_name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.category_id ?? "none"} fill={entry.category_color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value ?? 0), currency)}
          contentStyle={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
