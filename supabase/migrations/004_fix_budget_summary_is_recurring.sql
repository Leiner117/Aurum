-- Fix get_budget_summary to include is_recurring field
drop function if exists public.get_budget_summary(uuid, smallint, smallint);

create or replace function public.get_budget_summary(
  p_user_id uuid,
  p_month smallint,
  p_year smallint
)
returns table (
  budget_id uuid,
  category_id uuid,
  category_name text,
  category_icon text,
  category_color text,
  budget_amount numeric,
  budget_currency text,
  alert_threshold smallint,
  spent numeric,
  remaining numeric,
  percentage numeric,
  status text,
  is_recurring boolean
)
language plpgsql
security definer
as $$
begin
  return query
  select
    b.id as budget_id,
    c.id as category_id,
    c.name as category_name,
    c.icon as category_icon,
    c.color as category_color,
    b.amount as budget_amount,
    b.currency as budget_currency,
    b.alert_threshold,
    coalesce(sum(e.amount), 0)::numeric as spent,
    (b.amount - coalesce(sum(e.amount), 0))::numeric as remaining,
    round((coalesce(sum(e.amount), 0) / b.amount * 100)::numeric, 2) as percentage,
    case
      when coalesce(sum(e.amount), 0) >= b.amount then 'exceeded'
      when coalesce(sum(e.amount), 0) >= (b.amount * b.alert_threshold / 100) then 'warning'
      else 'ok'
    end as status,
    b.is_recurring
  from public.budgets b
  join public.categories c on c.id = b.category_id
  left join public.expenses e
    on e.category_id = b.category_id
    and e.user_id = p_user_id
    and extract(month from e.date) = p_month
    and extract(year from e.date) = p_year
  where b.user_id = p_user_id
    and b.month = p_month
    and b.year = p_year
  group by b.id, c.id, c.name, c.icon, c.color, b.amount, b.currency, b.alert_threshold, b.is_recurring;
end;
$$;
