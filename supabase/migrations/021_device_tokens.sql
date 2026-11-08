-- ============================================================
-- Aurum — Device tokens for push notifications (FCM)
-- ============================================================
-- One row per installed app. A token belongs to whoever is signed in on that
-- device, so re-registering the same token under another user moves it.

create table public.device_tokens (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  token        text        not null unique,
  platform     text        not null check (platform in ('android', 'ios', 'web')),
  app_version  text,
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index idx_device_tokens_user_id on public.device_tokens(user_id);

alter table public.device_tokens enable row level security;

create policy "Users can view own device tokens" on public.device_tokens
  for select using (auth.uid() = user_id);
create policy "Users can delete own device tokens" on public.device_tokens
  for delete using (auth.uid() = user_id);
-- Inserts/updates go through register_device_token() so a token can change owner

create or replace function public.register_device_token(
  p_token       text,
  p_platform    text,
  p_app_version text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.device_tokens (user_id, token, platform, app_version, last_seen_at)
  values (auth.uid(), p_token, p_platform, p_app_version, now())
  on conflict (token) do update
    set user_id      = excluded.user_id,
        platform     = excluded.platform,
        app_version  = excluded.app_version,
        last_seen_at = now();
end;
$$;

create or replace function public.unregister_device_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.device_tokens
  where token = p_token and user_id = auth.uid();
$$;

revoke execute on function public.register_device_token(text, text, text) from public, anon;
revoke execute on function public.unregister_device_token(text) from public, anon;
grant execute on function public.register_device_token(text, text, text) to authenticated;
grant execute on function public.unregister_device_token(text) to authenticated;
