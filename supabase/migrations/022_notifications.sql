-- ============================================================
-- Aurum — Notification preferences + notification outbox
-- ============================================================
-- SQL triggers enqueue rows in public.notifications; an AFTER INSERT trigger
-- calls the `send-push` Edge Function through pg_net, which delivers via FCM.
--
-- One-time setup (Dashboard → SQL editor), not stored in migrations:
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<random-secret>', 'push_webhook_secret');
-- Until both secrets exist, notifications are stored but not pushed.

create extension if not exists pg_net with schema extensions;

-- ── Preferences ─────────────────────────────────────────────
create table public.notification_preferences (
  user_id             uuid        primary key references public.profiles(id) on delete cascade,
  budget_alerts       boolean     not null default true,
  recurring_generated boolean     not null default true,
  goal_reached        boolean     not null default true,
  updated_at          timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can view own notification preferences" on public.notification_preferences
  for select using (auth.uid() = user_id);
create policy "Users can insert own notification preferences" on public.notification_preferences
  for insert with check (auth.uid() = user_id);
create policy "Users can update own notification preferences" on public.notification_preferences
  for update using (auth.uid() = user_id);

-- ── Outbox / history ────────────────────────────────────────
create table public.notifications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  type        text        not null check (type in
                ('budget_warning', 'budget_exceeded', 'recurring_generated', 'goal_reached')),
  title       text        not null,
  body        text        not null,
  route       text,
  data        jsonb       not null default '{}'::jsonb,
  push_status text        not null default 'pending'
                check (push_status in ('pending', 'sent', 'skipped', 'failed')),
  push_error  text,
  read_at     timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user_created on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users can mark own notifications as read" on public.notifications
  for update using (auth.uid() = user_id);

-- Clients may only touch read_at; inserts come from security definer functions
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ── Enqueue helper (server-side only) ───────────────────────
create or replace function public.enqueue_notification(
  p_user_id uuid,
  p_type    text,
  p_title   text,
  p_body    text,
  p_route   text  default null,
  p_data    jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefs   public.notification_preferences%rowtype;
  v_enabled boolean;
  v_id      uuid;
begin
  select * into v_prefs from public.notification_preferences where user_id = p_user_id;

  v_enabled := case
    when p_type in ('budget_warning', 'budget_exceeded') then coalesce(v_prefs.budget_alerts, true)
    when p_type = 'recurring_generated' then coalesce(v_prefs.recurring_generated, true)
    when p_type = 'goal_reached' then coalesce(v_prefs.goal_reached, true)
    else true
  end;

  insert into public.notifications (user_id, type, title, body, route, data, push_status)
  values (p_user_id, p_type, p_title, p_body, p_route, coalesce(p_data, '{}'::jsonb),
          case when v_enabled then 'pending' else 'skipped' end)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.enqueue_notification(uuid, text, text, text, text, jsonb)
  from public, anon, authenticated;

-- ── Dispatch to the Edge Function ───────────────────────────
create or replace function public.dispatch_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_webhook_secret';

  if v_url is null or v_secret is null then
    return NEW; -- push not configured yet; keep the row as history
  end if;

  perform net.http_post(
    url     := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body    := jsonb_build_object('notification_id', NEW.id)
  );
  return NEW;
exception when others then
  -- Never block the transaction that produced the notification
  raise warning 'dispatch_push_notification failed: %', sqlerrm;
  return NEW;
end;
$$;

create trigger trg_dispatch_push_notification
  after insert on public.notifications
  for each row
  when (NEW.push_status = 'pending')
  execute function public.dispatch_push_notification();
