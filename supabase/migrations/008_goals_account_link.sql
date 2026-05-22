-- ============================================================
-- Aurum — Link goals to a default account
-- ============================================================
-- Adds an optional account_id to goals so the user can designate
-- which account holds the funds for a given savings goal.
-- The column is nullable: existing goals keep working without changes.
-- ============================================================

alter table public.goals
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

create index if not exists idx_goals_account_id on public.goals(account_id);
