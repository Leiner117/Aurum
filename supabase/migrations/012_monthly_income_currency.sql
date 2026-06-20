ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_income_currency text NOT NULL DEFAULT 'USD'
  CHECK (char_length(monthly_income_currency) = 3);

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
  SELECT
    b.month,
    SUM(b.amount)::numeric                         AS total_budgeted,
    COALESCE(SUM(e.amount), 0)::numeric            AS total_spent,
    (COALESCE(SUM(e.amount), 0) <= SUM(b.amount)) AS budget_met
  FROM public.budgets b
  LEFT JOIN public.expenses e
    ON  e.user_id  = p_user_id
    AND e.type     = 'expense'
    AND e.currency = b.currency
    AND EXTRACT(month FROM e.date) = b.month
    AND EXTRACT(year  FROM e.date) = p_year
  WHERE b.user_id = p_user_id
    AND b.year    = p_year
    AND (p_currency IS NULL OR b.currency = p_currency)
  GROUP BY b.month
  ORDER BY b.month;
END;
$$;
