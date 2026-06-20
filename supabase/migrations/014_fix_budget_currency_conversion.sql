-- Fix: budget calculations ignored currency mismatches.
-- Both get_budget_summary and get_budget_compliance summed expense amounts
-- directly, without converting to the budget's currency first.
-- Fix: introduce a convert_currency helper that mirrors the pattern used
-- in migration 005 (account balance trigger), then use it in both functions.

-- Helper: convert p_amount from p_src currency to p_tgt currency.
-- Looks up the direct rate first, then the inverse, then falls back to 1.0.
CREATE OR REPLACE FUNCTION public.convert_currency(
  p_amount numeric,
  p_src    text,
  p_tgt    text
)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p_amount * CASE
    WHEN p_src = p_tgt THEN 1.0
    ELSE COALESCE(
      (SELECT rate FROM public.exchange_rates
        WHERE base_currency = p_src AND target_currency = p_tgt LIMIT 1),
      (SELECT 1.0 / rate FROM public.exchange_rates
        WHERE base_currency = p_tgt AND target_currency = p_src LIMIT 1),
      1.0
    )
  END
$$;

-- Fix get_budget_summary: convert each expense to the budget's currency.
-- Uses a CTE so the converted `spent` amount is computed once and reused
-- for `remaining`, `percentage`, and `status` without repeating the expression.
CREATE OR REPLACE FUNCTION public.get_budget_summary(
  p_user_id uuid,
  p_month   smallint,
  p_year    smallint
)
RETURNS TABLE (
  budget_id       uuid,
  category_id     uuid,
  category_name   text,
  category_icon   text,
  category_color  text,
  budget_amount   numeric,
  budget_currency text,
  alert_threshold smallint,
  spent           numeric,
  remaining       numeric,
  percentage      numeric,
  status          text,
  is_recurring    boolean
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH raw AS (
    SELECT
      b.id                                                      AS budget_id,
      c.id                                                      AS category_id,
      c.name                                                    AS category_name,
      c.icon                                                    AS category_icon,
      c.color                                                   AS category_color,
      b.amount                                                  AS budget_amount,
      b.currency                                                AS budget_currency,
      b.alert_threshold,
      b.is_recurring,
      COALESCE(SUM(
        public.convert_currency(e.amount, e.currency, b.currency)
      ), 0)::numeric                                            AS spent
    FROM public.budgets b
    JOIN public.categories c ON c.id = b.category_id
    LEFT JOIN public.expenses e
      ON  e.category_id = b.category_id
      AND e.user_id     = p_user_id
      AND e.type        = 'expense'
      AND EXTRACT(month FROM e.date) = p_month
      AND EXTRACT(year  FROM e.date) = p_year
    WHERE b.user_id = p_user_id
      AND b.month   = p_month
      AND b.year    = p_year
    GROUP BY b.id, c.id, c.name, c.icon, c.color,
             b.amount, b.currency, b.alert_threshold, b.is_recurring
  )
  SELECT
    r.budget_id,
    r.category_id,
    r.category_name,
    r.category_icon,
    r.category_color,
    r.budget_amount,
    r.budget_currency,
    r.alert_threshold,
    r.spent,
    (r.budget_amount - r.spent)::numeric                          AS remaining,
    ROUND((r.spent / NULLIF(r.budget_amount, 0) * 100)::numeric, 2) AS percentage,
    CASE
      WHEN r.spent >= r.budget_amount THEN 'exceeded'
      WHEN r.spent >= (r.budget_amount * r.alert_threshold / 100) THEN 'warning'
      ELSE 'ok'
    END                                                           AS status,
    r.is_recurring
  FROM raw r;
END;
$$;

-- Fix get_budget_compliance: convert all expenses to p_currency before summing.
-- Previously the expense_totals CTE filtered by currency (discarding non-matching
-- expenses). Now it converts every expense amount to p_currency so the comparison
-- against total_budgeted is apples-to-apples.
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
