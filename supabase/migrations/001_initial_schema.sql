-- ============================================================
-- Finance App — Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  default_currency text not null default 'USD',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text not null default 'ellipsis',
  color text not null default '#64748b',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_categories_user_id on public.categories(user_id);

-- ============================================================
-- EXPENSES
-- ============================================================
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  description text not null,
  date date not null,
  notes text,
  is_recurring boolean not null default false,
  recurring_expense_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_expenses_user_id on public.expenses(user_id);
create index idx_expenses_date on public.expenses(date);
create index idx_expenses_category_id on public.expenses(category_id);

-- ============================================================
-- BUDGETS
-- ============================================================
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year >= 2000),
  alert_threshold smallint not null default 80 check (alert_threshold between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month, year)
);

create index idx_budgets_user_id on public.budgets(user_id);

-- ============================================================
-- RECURRING EXPENSES
-- ============================================================
create table public.recurring_expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  description text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  next_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recurring_user_id on public.recurring_expenses(user_id);

-- ============================================================
-- EXCHANGE RATES CACHE
-- ============================================================
create table public.exchange_rates (
  id uuid default uuid_generate_v4() primary key,
  base_currency text not null,
  target_currency text not null,
  rate numeric(20, 8) not null,
  fetched_at timestamptz not null default now(),
  unique (base_currency, target_currency)
);

-- ============================================================
-- BUDGET SUMMARY FUNCTION
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
    and extract(month from e.date) = p_month
    and extract(year from e.date) = p_year
  where b.user_id = p_user_id
    and b.month = p_month
    and b.year = p_year
  group by b.id, c.id, c.name, c.icon, c.color, b.amount, b.currency, b.alert_threshold;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.exchange_rates enable row level security;

-- Profiles: users manage their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Categories
create policy "Users can view own categories" on public.categories
  for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.categories
  for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on public.categories
  for delete using (auth.uid() = user_id);

-- Expenses
create policy "Users can view own expenses" on public.expenses
  for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on public.expenses
  for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on public.expenses
  for delete using (auth.uid() = user_id);

-- Budgets
create policy "Users can view own budgets" on public.budgets
  for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on public.budgets
  for update using (auth.uid() = user_id);
create policy "Users can delete own budgets" on public.budgets
  for delete using (auth.uid() = user_id);

-- Recurring expenses
create policy "Users can view own recurring" on public.recurring_expenses
  for select using (auth.uid() = user_id);
create policy "Users can insert own recurring" on public.recurring_expenses
  for insert with check (auth.uid() = user_id);
create policy "Users can update own recurring" on public.recurring_expenses
  for update using (auth.uid() = user_id);
create policy "Users can delete own recurring" on public.recurring_expenses
  for delete using (auth.uid() = user_id);

-- Exchange rates: read by all authenticated users
create policy "Authenticated users can view exchange rates" on public.exchange_rates
  for select using (auth.role() = 'authenticated');
