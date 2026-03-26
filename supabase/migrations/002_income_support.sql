-- ============================================================
-- Aurum — Income Support Migration
-- ============================================================

-- Add type column to categories (expense | income)
alter table public.categories
  add column if not exists type text not null default 'expense'
  check (type in ('expense', 'income'));

-- Add type column to expenses (expense | income)
alter table public.expenses
  add column if not exists type text not null default 'expense'
  check (type in ('expense', 'income'));

-- Add type column to recurring_expenses (expense | income)
alter table public.recurring_expenses
  add column if not exists type text not null default 'expense'
  check (type in ('expense', 'income'));

-- ============================================================
-- Update get_budget_summary — only count expense-type rows
-- ============================================================
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
  status text
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
    end as status
  from public.budgets b
  join public.categories c on c.id = b.category_id
  left join public.expenses e
    on e.category_id = b.category_id
    and e.user_id = p_user_id
    and e.type = 'expense'
    and extract(month from e.date) = p_month
    and extract(year from e.date) = p_year
  where b.user_id = p_user_id
    and b.month = p_month
    and b.year = p_year
  group by b.id, c.id, c.name, c.icon, c.color, b.amount, b.currency, b.alert_threshold;
end;
$$;

-- ============================================================
-- Update seed function — add default income categories
-- ============================================================
create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Expense categories
  insert into public.categories (user_id, name, icon, color, is_default, type) values
    (p_user_id, 'Food & Dining',    'utensils',     '#f97316', true, 'expense'),
    (p_user_id, 'Transportation',   'car',           '#3b82f6', true, 'expense'),
    (p_user_id, 'Housing',          'home',          '#8b5cf6', true, 'expense'),
    (p_user_id, 'Healthcare',       'heart-pulse',   '#ef4444', true, 'expense'),
    (p_user_id, 'Entertainment',    'tv',            '#ec4899', true, 'expense'),
    (p_user_id, 'Shopping',         'shopping-bag',  '#f59e0b', true, 'expense'),
    (p_user_id, 'Education',        'book-open',     '#10b981', true, 'expense'),
    (p_user_id, 'Travel',           'plane',         '#06b6d4', true, 'expense'),
    (p_user_id, 'Savings',          'piggy-bank',    '#22c55e', true, 'expense'),
    (p_user_id, 'Other',            'ellipsis',      '#64748b', true, 'expense'),
    -- Income categories
    (p_user_id, 'Salary',           'briefcase',     '#22c55e', true, 'income'),
    (p_user_id, 'Freelance',        'wallet',        '#3b82f6', true, 'income'),
    (p_user_id, 'Investments',      'piggy-bank',    '#f59e0b', true, 'income'),
    (p_user_id, 'Other Income',     'ellipsis',      '#64748b', true, 'income')
  on conflict do nothing;
end;
$$;

-- Backfill income categories for existing users (who already have expense categories seeded)
do $$
declare
  profile_row record;
begin
  for profile_row in select id from public.profiles loop
    insert into public.categories (user_id, name, icon, color, is_default, type) values
      (profile_row.id, 'Salary',        'briefcase', '#22c55e', true, 'income'),
      (profile_row.id, 'Freelance',     'wallet',    '#3b82f6', true, 'income'),
      (profile_row.id, 'Investments',   'piggy-bank','#f59e0b', true, 'income'),
      (profile_row.id, 'Other Income',  'ellipsis',  '#64748b', true, 'income')
    on conflict do nothing;
  end loop;
end $$;
