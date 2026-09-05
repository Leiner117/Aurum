-- Fix: creating a weekly budget fails with
-- "null value in column "month" of relation "budgets" violates not-null constraint"
-- because 018_weekly_budgets.sql added period_type/week_number but never
-- relaxed the original NOT NULL on month (weekly budgets store month = NULL).

ALTER TABLE public.budgets
  ALTER COLUMN month DROP NOT NULL;

-- Keep the two period shapes consistent: monthly budgets must carry a month
-- and no week_number, weekly budgets must carry a week_number and no month.
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_period_fields_check CHECK (
    (period_type = 'monthly' AND month IS NOT NULL AND week_number IS NULL)
    OR
    (period_type = 'weekly' AND week_number IS NOT NULL AND month IS NULL)
  );
