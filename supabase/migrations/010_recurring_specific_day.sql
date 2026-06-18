-- ============================================================
-- Aurum — Recurring Specific Day of Month
-- ============================================================

-- Drop old frequency check constraint and add new one with specific_day_monthly
alter table public.recurring_expenses
  drop constraint if exists recurring_expenses_frequency_check;

alter table public.recurring_expenses
  add constraint recurring_expenses_frequency_check
  check (frequency in ('daily', 'weekly', 'monthly', 'yearly', 'specific_day_monthly'));

-- Add specific_day column (1-31, only used when frequency = 'specific_day_monthly')
alter table public.recurring_expenses
  add column if not exists specific_day integer check (specific_day >= 1 and specific_day <= 31);
