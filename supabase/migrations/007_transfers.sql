-- ============================================================
-- Aurum — Account Transfers Migration
-- ============================================================

create table public.transfers (
  id               uuid        default uuid_generate_v4() primary key,
  user_id          uuid        references public.profiles(id) on delete cascade not null,
  from_account_id  uuid        references public.accounts(id) on delete set null,
  to_account_id    uuid        references public.accounts(id) on delete set null,
  amount           numeric(14, 2) not null check (amount > 0),
  from_currency    text        not null,
  to_currency      text        not null,
  converted_amount numeric(14, 2) not null check (converted_amount > 0),
  notes            text,
  date             date        not null default current_date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_transfers_user_id         on public.transfers(user_id);
create index idx_transfers_from_account_id on public.transfers(from_account_id);
create index idx_transfers_to_account_id   on public.transfers(to_account_id);

-- RLS
alter table public.transfers enable row level security;

create policy "Users can view own transfers"   on public.transfers for select using (auth.uid() = user_id);
create policy "Users can insert own transfers" on public.transfers for insert with check (auth.uid() = user_id);
create policy "Users can delete own transfers" on public.transfers for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Trigger: on INSERT deduct `amount` from source account,
--          add `converted_amount` to destination account.
--          converted_amount is computed by the app layer.
-- ────────────────────────────────────────────────────────────

create or replace function public.handle_transfer_balance()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.from_account_id is not null then
      update public.accounts
        set balance = balance - NEW.amount, updated_at = now()
        where id = NEW.from_account_id;
    end if;
    if NEW.to_account_id is not null then
      update public.accounts
        set balance = balance + NEW.converted_amount, updated_at = now()
        where id = NEW.to_account_id;
    end if;

  elsif TG_OP = 'DELETE' then
    if OLD.from_account_id is not null then
      update public.accounts
        set balance = balance + OLD.amount, updated_at = now()
        where id = OLD.from_account_id;
    end if;
    if OLD.to_account_id is not null then
      update public.accounts
        set balance = balance - OLD.converted_amount, updated_at = now()
        where id = OLD.to_account_id;
    end if;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_transfer_balance
  after insert or delete on public.transfers
  for each row execute function public.handle_transfer_balance();
