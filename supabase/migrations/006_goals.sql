-- ============================================================
-- Aurum — Savings Goals Migration
-- ============================================================

create table public.goals (
  id             uuid        default uuid_generate_v4() primary key,
  user_id        uuid        references public.profiles(id) on delete cascade not null,
  name           text        not null,
  description    text,
  target_amount  numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0,
  currency       text        not null default 'USD',
  target_date    date,
  color          text        not null default '#22c55e',
  icon           text        not null default 'piggy-bank',
  is_completed   boolean     not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_goals_user_id on public.goals(user_id);

create table public.goal_contributions (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references public.profiles(id) on delete cascade not null,
  goal_id    uuid        references public.goals(id) on delete cascade not null,
  account_id uuid        references public.accounts(id) on delete set null,
  amount     numeric(14, 2) not null check (amount > 0),
  currency   text        not null default 'USD',
  notes      text,
  date       date        not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_goal_contributions_user_id on public.goal_contributions(user_id);
create index idx_goal_contributions_goal_id on public.goal_contributions(goal_id);

-- RLS
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;

create policy "Users can view own goals"   on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);

create policy "Users can view own contributions"   on public.goal_contributions for select using (auth.uid() = user_id);
create policy "Users can insert own contributions" on public.goal_contributions for insert with check (auth.uid() = user_id);
create policy "Users can delete own contributions" on public.goal_contributions for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Trigger: when a contribution is added/deleted,
--   1. deduct/restore from the linked account balance (with currency conversion)
--   2. add/remove from the goal's current_amount (with currency conversion)
-- ────────────────────────────────────────────────────────────

create or replace function public.handle_goal_contribution()
returns trigger
language plpgsql
security definer
as $$
declare
  v_account_currency text;
  v_goal_currency    text;
  v_rate_to_account  numeric := 1;
  v_rate_to_goal     numeric := 1;
  v_account_delta    numeric;
  v_goal_delta       numeric;
begin
  if TG_OP = 'INSERT' then
    -- Deduct from account (if linked)
    if NEW.account_id is not null then
      select currency into v_account_currency
        from public.accounts where id = NEW.account_id;

      if v_account_currency is distinct from NEW.currency then
        select rate into v_rate_to_account from public.exchange_rates
          where base_currency = NEW.currency and target_currency = v_account_currency limit 1;
        if v_rate_to_account is null then
          select (1.0 / rate) into v_rate_to_account from public.exchange_rates
            where base_currency = v_account_currency and target_currency = NEW.currency limit 1;
        end if;
        if v_rate_to_account is null then v_rate_to_account := 1; end if;
      end if;

      v_account_delta := NEW.amount * v_rate_to_account;
      update public.accounts
        set balance = balance - v_account_delta, updated_at = now()
        where id = NEW.account_id;
    end if;

    -- Add to goal
    select currency into v_goal_currency from public.goals where id = NEW.goal_id;
    if v_goal_currency is distinct from NEW.currency then
      select rate into v_rate_to_goal from public.exchange_rates
        where base_currency = NEW.currency and target_currency = v_goal_currency limit 1;
      if v_rate_to_goal is null then
        select (1.0 / rate) into v_rate_to_goal from public.exchange_rates
          where base_currency = v_goal_currency and target_currency = NEW.currency limit 1;
      end if;
      if v_rate_to_goal is null then v_rate_to_goal := 1; end if;
    end if;

    v_goal_delta := NEW.amount * v_rate_to_goal;
    update public.goals
      set current_amount = current_amount + v_goal_delta,
          is_completed   = (current_amount + v_goal_delta >= target_amount),
          updated_at     = now()
      where id = NEW.goal_id;

  elsif TG_OP = 'DELETE' then
    -- Restore account
    if OLD.account_id is not null then
      select currency into v_account_currency
        from public.accounts where id = OLD.account_id;

      if v_account_currency is distinct from OLD.currency then
        select rate into v_rate_to_account from public.exchange_rates
          where base_currency = OLD.currency and target_currency = v_account_currency limit 1;
        if v_rate_to_account is null then
          select (1.0 / rate) into v_rate_to_account from public.exchange_rates
            where base_currency = v_account_currency and target_currency = OLD.currency limit 1;
        end if;
        if v_rate_to_account is null then v_rate_to_account := 1; end if;
      end if;

      v_account_delta := OLD.amount * v_rate_to_account;
      update public.accounts
        set balance = balance + v_account_delta, updated_at = now()
        where id = OLD.account_id;
    end if;

    -- Remove from goal
    select currency into v_goal_currency from public.goals where id = OLD.goal_id;
    if v_goal_currency is distinct from OLD.currency then
      select rate into v_rate_to_goal from public.exchange_rates
        where base_currency = OLD.currency and target_currency = v_goal_currency limit 1;
      if v_rate_to_goal is null then
        select (1.0 / rate) into v_rate_to_goal from public.exchange_rates
          where base_currency = v_goal_currency and target_currency = OLD.currency limit 1;
      end if;
      if v_rate_to_goal is null then v_rate_to_goal := 1; end if;
    end if;

    v_goal_delta := OLD.amount * v_rate_to_goal;
    update public.goals
      set current_amount = greatest(0, current_amount - v_goal_delta),
          is_completed   = (greatest(0, current_amount - v_goal_delta) >= target_amount),
          updated_at     = now()
      where id = OLD.goal_id;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_goal_contribution
  after insert or delete on public.goal_contributions
  for each row execute function public.handle_goal_contribution();
