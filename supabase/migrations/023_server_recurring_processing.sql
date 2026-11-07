-- ============================================================
-- Aurum — Generate recurring transactions on the server
-- ============================================================
-- Before: the client generated due recurring transactions when the app opened.
-- Now: a daily pg_cron job generates them (and notifies), and the client calls
-- process_my_recurring() as an on-open catch-up. Rows are locked with
-- FOR UPDATE SKIP LOCKED so concurrent runs never insert duplicates.

create extension if not exists pg_cron;

-- Formerly getNextDate() in lib/recurrence.ts (interval math clamps to month end)
create or replace function public.next_recurring_date(
  p_date         date,
  p_frequency    text,
  p_specific_day integer default null
)
returns date
language plpgsql
immutable
as $$
declare
  v_next_month date;
  v_days       integer;
begin
  if p_frequency = 'specific_day_monthly' and p_specific_day is not null then
    v_next_month := (date_trunc('month', p_date) + interval '1 month')::date;
    v_days := extract(day from (v_next_month + interval '1 month - 1 day'))::integer;
    return v_next_month + (least(p_specific_day, v_days) - 1);
  end if;

  return case p_frequency
    when 'daily'  then p_date + 1
    when 'weekly' then p_date + 7
    when 'yearly' then (p_date + interval '1 year')::date
    else (p_date + interval '1 month')::date
  end;
end;
$$;

-- p_user_id null = every user (cron). Returns the number of transactions created.
create or replace function public.process_recurring_internal(
  p_user_id uuid    default null,
  p_notify  boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Same zone the exchange-rate cron uses; recurring dates are calendar days in CR
  v_today      date := (now() at time zone 'America/Costa_Rica')::date;
  v_user       uuid;
  v_item       public.recurring_expenses%rowtype;
  v_date       date;
  v_iterations integer;
  v_user_count integer;
  v_last_desc  text;
  v_total      integer := 0;
begin
  for v_user in
    select distinct r.user_id from public.recurring_expenses r
    where r.is_active and r.next_date <= v_today
      and (p_user_id is null or r.user_id = p_user_id)
  loop
    v_user_count := 0;

    for v_item in
      select * from public.recurring_expenses r
      where r.user_id = v_user and r.is_active and r.next_date <= v_today
      for update skip locked
    loop
      v_date := v_item.next_date;
      v_iterations := 0;

      -- Catch up every missed occurrence (capped to avoid runaway inserts)
      while v_date <= v_today and v_iterations < 60 loop
        insert into public.expenses (
          user_id, category_id, account_id, amount, currency, description,
          date, type, is_recurring, recurring_expense_id
        ) values (
          v_item.user_id, v_item.category_id, v_item.account_id, v_item.amount,
          v_item.currency, v_item.description, v_date, coalesce(v_item.type, 'expense'),
          true, v_item.id
        );
        v_date := public.next_recurring_date(v_date, v_item.frequency, v_item.specific_day);
        v_iterations := v_iterations + 1;
      end loop;

      update public.recurring_expenses
        set next_date = v_date, updated_at = now()
        where id = v_item.id;

      v_user_count := v_user_count + v_iterations;
      v_last_desc := v_item.description;
    end loop;

    if p_notify and v_user_count > 0 then
      perform public.enqueue_notification(
        v_user,
        'recurring_generated',
        'Recurring transactions added',
        case when v_user_count = 1
          then v_last_desc || ' was added automatically.'
          else v_user_count || ' recurring transactions were added automatically.'
        end,
        '/recurring',
        jsonb_build_object('count', v_user_count)
      );
    end if;

    v_total := v_total + v_user_count;
  end loop;

  return v_total;
end;
$$;

-- Client entry point: only processes the caller's own items, without push
create or replace function public.process_my_recurring()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  return public.process_recurring_internal(auth.uid(), false);
end;
$$;

revoke execute on function public.process_recurring_internal(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.process_my_recurring() from public, anon;
grant execute on function public.process_my_recurring() to authenticated;

-- Daily at 06:05 Costa Rica time (12:05 UTC)
select cron.schedule(
  'process-recurring-daily',
  '5 12 * * *',
  $$select public.process_recurring_internal(null, true);$$
);
