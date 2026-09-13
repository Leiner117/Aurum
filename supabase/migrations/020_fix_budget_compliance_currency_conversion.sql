-- Fix: get_budget_compliance dropped budgets whose currency didn't match
-- p_currency instead of converting them, so e.g. USD budgets were silently
-- excluded from total_budgeted whenever the reference currency wasn't USD
-- (and vice versa) — the monthly total never reflected those budgets.
-- Fix: convert each budget's amount to p_currency (via convert_currency,
-- introduced in 014) before summing, mirroring how expense_totals already
-- converts expenses.
CREATE OR REPLACE FUNCTION public.get_budget_compliance(
  p_user_id  uuid,
  p_year     smallint,
  p_currency text DEFAULT NULL
)
RETURNS TABLE (
  month          smallint,
  total_budgeted numeric,
  total_spent    numeric,
  budget_met     boolean
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH budget_totals AS (
    SELECT
      b.month,
      SUM(
        CASE
          WHEN p_currency IS NULL THEN b.amount
          ELSE public.convert_currency(b.amount, b.currency, p_currency)
        END
      )::numeric AS total_budgeted
    FROM public.budgets b
    WHERE b.user_id = p_user_id
      AND b.year    = p_year
    GROUP BY b.month
  ),
  expense_totals AS (
    SELECT
      EXTRACT(month FROM e.date)::smallint AS month,
      SUM(
        CASE
          WHEN p_currency IS NULL THEN e.amount
          ELSE public.convert_currency(e.amount, e.currency, p_currency)
        END
      )::numeric AS total_spent
    FROM public.expenses e
    WHERE e.user_id = p_user_id
      AND e.type    = 'expense'
      AND EXTRACT(year FROM e.date) = p_year
      AND EXISTS (
        SELECT 1 FROM public.budgets b
        WHERE b.user_id     = p_user_id
          AND b.year        = p_year
          AND b.month       = EXTRACT(month FROM e.date)::smallint
          AND b.category_id = e.category_id
      )
    GROUP BY EXTRACT(month FROM e.date)
  )
  SELECT
    bt.month,
    bt.total_budgeted,
    COALESCE(et.total_spent, 0)::numeric               AS total_spent,
    (COALESCE(et.total_spent, 0) <= bt.total_budgeted) AS budget_met
  FROM budget_totals bt
  LEFT JOIN expense_totals et ON et.month = bt.month
  ORDER BY bt.month;
END;
$$;
