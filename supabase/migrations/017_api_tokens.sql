create table public.api_tokens (
  id           uuid        default uuid_generate_v4() primary key,
  user_id      uuid        references public.profiles(id) on delete cascade not null,
  token        text        not null unique,
  name         text        not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  is_active    boolean     not null default true
);

create index idx_api_tokens_token   on public.api_tokens(token);
create index idx_api_tokens_user_id on public.api_tokens(user_id);

alter table public.api_tokens enable row level security;

create policy "Users can view own api_tokens"
  on public.api_tokens for select using (auth.uid() = user_id);

create policy "Users can insert own api_tokens"
  on public.api_tokens for insert with check (auth.uid() = user_id);

create policy "Users can delete own api_tokens"
  on public.api_tokens for delete using (auth.uid() = user_id);
