import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Name must be at least 2 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Categories ────────────────────────────────────────────
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(40, "Name must be 40 characters or less"),
  icon: z.string().min(1, "Icon is required"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  type: z.enum(["expense", "income"]),
});

// ── Expenses ──────────────────────────────────────────────
export const expenseSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(100, "Description must be 100 characters or less"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Max 2 decimal places"),
  currency: z.string().length(3, "Must be a valid currency code"),
  category_id: z.string().uuid("Invalid category").nullable(),
  account_id: z.string().uuid("Invalid account").nullable().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  type: z.enum(["expense", "income"]),
});

// ── Budgets ───────────────────────────────────────────────
export const budgetSchema = z.object({
  category_id: z.string().uuid("Select a category"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Max 2 decimal places"),
  currency: z.string().length(3, "Must be a valid currency code"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  alert_threshold: z.number().int().min(1).max(100).optional(),
  is_recurring: z.boolean(),
});

// ── Recurring Expenses ────────────────────────────────────
export const recurringExpenseSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(100, "Description must be 100 characters or less"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Max 2 decimal places"),
  currency: z.string().length(3, "Must be a valid currency code"),
  category_id: z.string().uuid("Invalid category").nullable(),
  account_id: z.string().uuid("Invalid account").nullable().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  next_date: z.string().min(1, "Next date is required"),
  type: z.enum(["expense", "income"]),
});

// ── Accounts ─────────────────────────────────────────────
export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Max 50 characters"),
  type: z.enum(["checking", "savings", "cash", "credit"]),
  balance: z.number().multipleOf(0.01, "Max 2 decimal places"),
  currency: z.string().length(3, "Must be a valid currency code"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  icon: z.string().min(1, "Icon is required"),
});

// ── Inferred types ────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
