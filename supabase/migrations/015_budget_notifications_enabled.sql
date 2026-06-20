-- Add per-budget notifications toggle.
-- Existing budgets default to notifications enabled (true).
ALTER TABLE public.budgets
  ADD COLUMN notifications_enabled boolean NOT NULL DEFAULT true;

-- Update get_budget_summary to return notifications_enabled.
CREATE OR REPLACE FUNCTION public.get_budget_summary(
  p_user_id uuid,
  p_month   smallint,
  p_year    smallint
)
RETURNS TABLE (
  budget_id             uuid,
  category_id           uuid,
  category_name         text,
  category_icon         text,
  category_color        text,
  budget_amount         numeric,
  budget_currency       text,
  alert_threshold       smallint,
  spent                 numeric,
  remaining             numeric,
  percentage            numeric,
  status                text,
  is_recurring          boolean,
  notifications_enabled boolean
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
      b.notifications_enabled,
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
             b.amount, b.currency, b.alert_threshold, b.is_recurring, b.notifications_enabled
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
    r.is_recurring,
    r.notifications_enabled
  FROM raw r;
END;
$$;
