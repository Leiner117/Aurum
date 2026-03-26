-- ============================================================
-- Aurum — Accounts + Recurring Budgets Migration
-- ============================================================

create table public.accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'cash', 'credit')),
  balance numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  color text not null default '#d97706',
  icon text not null default 'wallet',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_accounts_user_id on public.accounts(user_id);

alter table public.expenses
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

alter table public.recurring_expenses
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

alter table public.budgets
  add column if not exists is_recurring boolean not null default false;

alter table public.accounts enable row level security;

create policy "Users can view own accounts" on public.accounts
  for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on public.accounts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on public.accounts
  for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on public.accounts
  for delete using (auth.uid() = user_id);

create or replace function public.update_account_balance()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.account_id is not null then
      update public.accounts
        set balance = balance + (case when NEW.type = 'income' then NEW.amount else -NEW.amount end),
            updated_at = now()
        where id = NEW.account_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.account_id is not null then
      update public.accounts
        set balance = balance + (case when OLD.type = 'income' then -OLD.amount else OLD.amount end),
            updated_at = now()
        where id = OLD.account_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    if OLD.account_id is not null then
      update public.accounts
        set balance = balance + (case when OLD.type = 'income' then -OLD.amount else OLD.amount end)
        where id = OLD.account_id;
    end if;
    if NEW.account_id is not null then
      update public.accounts
        set balance = balance + (case when NEW.type = 'income' then NEW.amount else -NEW.amount end),
            updated_at = now()
        where id = NEW.account_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_expense_balance
  after insert or update or delete on public.expenses
  for each row execute function public.update_account_balance();

create or replace function public.seed_default_accounts(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.accounts (user_id, name, type, balance, currency, color, icon, is_default) values
    (p_user_id, 'Cash',         'cash',     0, 'USD', '#22c55e', 'wallet',    false),
    (p_user_id, 'Main Account', 'checking', 0, 'USD', '#d97706', 'briefcase', true)
  on conflict do nothing;
end;
$$;

do $$
declare profile_row record;
begin
  for profile_row in select id from public.profiles loop
    perform public.seed_default_accounts(profile_row.id);
  end loop;
end $$;
