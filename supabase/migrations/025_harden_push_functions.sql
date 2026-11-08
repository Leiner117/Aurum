-- ============================================================
-- Aurum — Harden functions added in 021–024 (Supabase security advisor)
-- ============================================================

-- Fixed search_path on the helper functions
alter function public.next_recurring_date(date, text, integer) set search_path = public;
alter function public.budget_status_rank(text) set search_path = public;

-- Trigger functions must never be callable through /rest/v1/rpc
revoke execute on function public.dispatch_push_notification() from public, anon, authenticated;
revoke execute on function public.handle_expense_budget_alerts() from public, anon, authenticated;
revoke execute on function public.handle_goal_reached() from public, anon, authenticated;
