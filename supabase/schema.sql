-- Trade Journal: database schema for Supabase. Run this once in the
-- Supabase SQL Editor (README step 2).
-- One row per trade (the trade as typed, in `data`) and one settings row per
-- user. Row Level Security: a signed-in user can only see and change their
-- own rows; signed-out visitors (the public anon/publishable key) get nothing.

create table if not exists public.trades (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists trades_user_id_idx on public.trades (user_id);

create table if not exists public.settings (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.trades   enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Owner can manage own trades" on public.trades;
create policy "Owner can manage own trades" on public.trades
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owner can manage own settings" on public.settings;
create policy "Owner can manage own settings" on public.settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.trades, public.settings from anon;
grant select, insert, update, delete on public.trades, public.settings to authenticated;
