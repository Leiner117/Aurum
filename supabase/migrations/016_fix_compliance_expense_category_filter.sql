-- Fix: get_budget_compliance counted ALL expenses regardless of whether
-- the expense's category had a budget. This inflated total_spent when
-- users had spending in un-budgeted categories.
-- Fix: filter expense_totals to only include expenses whose category has
-- a budget in that month (matched by user, year, month, category, currency).
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
      SUM(b.amount)::numeric AS total_budgeted
    FROM public.budgets b
    WHERE b.user_id = p_user_id
      AND b.year    = p_year
      AND (p_currency IS NULL OR b.currency = p_currency)
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
          AND (p_currency IS NULL OR b.currency = p_currency)
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
