-- ============================================================
-- Aurum — Push triggers: budget thresholds and goals reached
-- ============================================================

-- Last status we alerted for, per budget row (each row is one month/week),
-- so a threshold is notified once and re-armed if spending drops back.
alter table public.budgets
  add column if not exists last_alert_status text
  check (last_alert_status in ('ok', 'warning', 'exceeded'));

create or replace function public.budget_status_rank(p_status text)
returns integer
language sql
immutable
as $$
  select case p_status when 'exceeded' then 2 when 'warning' then 1 else 0 end;
$$;

-- Re-evaluates every budget covering (user, category, date) and enqueues alerts
create or replace function public.evaluate_budget_alerts(
  p_user_id     uuid,
  p_category_id uuid,
  p_date        date,
  p_notify      boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_budget  public.budgets%rowtype;
  v_summary record;
  v_last    text;
begin
  for v_budget in
    select * from public.budgets b
    where b.user_id = p_user_id
      and b.category_id = p_category_id
      and b.year = extract(year from p_date)
      and (
        (b.period_type = 'monthly' and b.month = extract(month from p_date))
        or (b.period_type = 'weekly' and b.week_number = extract(week from p_date))
      )
  loop
    select s.* into v_summary
    from public.get_budget_summary(
      p_user_id,
      coalesce(v_budget.month, extract(month from p_date))::smallint,
      v_budget.year::smallint,
      v_budget.period_type,
      v_budget.week_number::smallint
    ) s
    where s.budget_id = v_budget.id;

    continue when not found;
    v_last := coalesce(v_budget.last_alert_status, 'ok');
    continue when v_summary.status = v_last;

    update public.budgets set last_alert_status = v_summary.status where id = v_budget.id;

    if p_notify
       and v_budget.notifications_enabled
       and public.budget_status_rank(v_summary.status) > public.budget_status_rank(v_last) then
      perform public.enqueue_notification(
        p_user_id,
        'budget_' || v_summary.status,
        case v_summary.status
          when 'exceeded' then 'Budget exceeded: ' || v_summary.category_name
          else 'Heads up: ' || v_summary.category_name
        end,
        'You''ve spent ' || round(v_summary.percentage) || '% of your '
          || v_budget.period_type || ' ' || v_summary.category_name || ' budget.',
        '/budgets',
        jsonb_build_object('budget_id', v_budget.id, 'percentage', v_summary.percentage)
      );
    end if;
  end loop;
end;
$$;

revoke execute on function public.evaluate_budget_alerts(uuid, uuid, date, boolean)
  from public, anon, authenticated;

create or replace function public.handle_expense_budget_alerts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP in ('INSERT', 'UPDATE') and NEW.type = 'expense' and NEW.category_id is not null then
    perform public.evaluate_budget_alerts(NEW.user_id, NEW.category_id, NEW.date);
  end if;

  -- Moved/removed spending can lower the old budget's status (re-arms the alert)
  if TG_OP in ('UPDATE', 'DELETE') and OLD.type = 'expense' and OLD.category_id is not null
     and (TG_OP = 'DELETE' or OLD.category_id is distinct from NEW.category_id
          or OLD.date is distinct from NEW.date) then
    perform public.evaluate_budget_alerts(OLD.user_id, OLD.category_id, OLD.date);
  end if;

  return null;
exception when others then
  raise warning 'handle_expense_budget_alerts failed: %', sqlerrm;
  return null;
end;
$$;

create trigger trg_expense_budget_alerts
  after insert or update or delete on public.expenses
  for each row execute function public.handle_expense_budget_alerts();

-- Goal reached: is_completed flips to true (set by handle_goal_contribution)
create or replace function public.handle_goal_reached()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.is_completed and not OLD.is_completed then
    perform public.enqueue_notification(
      NEW.user_id,
      'goal_reached',
      'Goal reached: ' || NEW.name,
      'You saved ' || to_char(NEW.target_amount, 'FM999,999,999,990.00') || ' ' || NEW.currency || '. Congratulations!',
      '/goals',
      jsonb_build_object('goal_id', NEW.id)
    );
  end if;
  return null;
exception when others then
  raise warning 'handle_goal_reached failed: %', sqlerrm;
  return null;
end;
$$;

create trigger trg_goal_reached
  after update of is_completed on public.goals
  for each row execute function public.handle_goal_reached();

-- Backfill: record the current status so existing over-budget rows don't alert
do $$
declare
  v_row record;
begin
  for v_row in
    select distinct user_id, category_id,
      case when period_type = 'weekly'
        -- Thursday of the ISO week always falls inside that ISO year
        then to_date(year || '-' || week_number, 'IYYY-IW') + 3
        else make_date(year, month, 1)
      end as ref_date
    from public.budgets
  loop
    perform public.evaluate_budget_alerts(v_row.user_id, v_row.category_id, v_row.ref_date, false);
  end loop;
end;
$$;
