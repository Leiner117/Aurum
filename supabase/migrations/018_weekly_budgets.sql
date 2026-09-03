-- Add weekly budget support

-- period_type: 'monthly' (default) or 'weekly'
ALTER TABLE public.budgets
  ADD COLUMN period_type text NOT NULL DEFAULT 'monthly'
  CONSTRAINT budgets_period_type_check CHECK (period_type IN ('monthly', 'weekly'));

-- week_number: ISO week 1-53, NULL for monthly budgets
ALTER TABLE public.budgets
  ADD COLUMN week_number smallint
  CONSTRAINT budgets_week_number_check CHECK (week_number BETWEEN 1 AND 53);

-- Replace the old unique constraint with period-aware partial indexes
ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS budgets_user_id_category_id_month_year_key;

CREATE UNIQUE INDEX budgets_monthly_uniq
  ON public.budgets (user_id, category_id, month, year)
  WHERE period_type = 'monthly';

CREATE UNIQUE INDEX budgets_weekly_uniq
  ON public.budgets (user_id, category_id, week_number, year)
  WHERE period_type = 'weekly';

-- Update get_budget_summary to handle both monthly and weekly periods
CREATE OR REPLACE FUNCTION public.get_budget_summary(
  p_user_id     uuid,
  p_month       smallint,
  p_year        smallint,
  p_period_type text     DEFAULT 'monthly',
  p_week_number smallint DEFAULT NULL
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
  notifications_enabled boolean,
  period_type           text,
  week_number           smallint
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
      b.period_type,
      b.week_number,
      COALESCE(SUM(
        public.convert_currency(e.amount, e.currency, b.currency)
      ), 0)::numeric                                            AS spent
    FROM public.budgets b
    JOIN public.categories c ON c.id = b.category_id
    LEFT JOIN public.expenses e
      ON  e.category_id = b.category_id
      AND e.user_id     = p_user_id
      AND e.type        = 'expense'
      AND (
        CASE
          WHEN p_period_type = 'weekly' THEN
            EXTRACT(week FROM e.date) = p_week_number
            AND EXTRACT(year FROM e.date) = p_year
          ELSE
            EXTRACT(month FROM e.date) = p_month
            AND EXTRACT(year  FROM e.date) = p_year
        END
      )
    WHERE b.user_id     = p_user_id
      AND b.year        = p_year
      AND b.period_type = p_period_type
      AND (
        CASE
          WHEN p_period_type = 'weekly' THEN b.week_number = p_week_number
          ELSE b.month = p_month
        END
      )
    GROUP BY b.id, c.id, c.name, c.icon, c.color,
             b.amount, b.currency, b.alert_threshold, b.is_recurring,
             b.notifications_enabled, b.period_type, b.week_number
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
    (r.budget_amount - r.spent)::numeric                             AS remaining,
    ROUND((r.spent / NULLIF(r.budget_amount, 0) * 100)::numeric, 2) AS percentage,
    CASE
      WHEN r.spent >= r.budget_amount THEN 'exceeded'
      WHEN r.spent >= (r.budget_amount * r.alert_threshold / 100) THEN 'warning'
      ELSE 'ok'
    END                                                              AS status,
    r.is_recurring,
    r.notifications_enabled,
    r.period_type,
    r.week_number
  FROM raw r;
END;
$$;
