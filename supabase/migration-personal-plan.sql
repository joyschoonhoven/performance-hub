-- ============================================================
-- MIGRATION — PERSONAL PLAN + NOTIFICATIONS + CHAT
-- Run this in your Supabase SQL Editor
-- ============================================================
--
-- Adds three tables that power the new "Persoonlijk Plan" feature:
--   1. notifications   — in-app notification feed per player
--   2. plan_agreements — coach/player agreements on the stadium board
--   3. plan_messages   — chat thread between a player and their coach(es)
--
-- Each table has RLS so a player only sees their own data, and any
-- coach/admin can see + manage data for every player.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid default uuid_generate_v4() primary key,
  player_id   uuid not null references public.players(id) on delete cascade,
  type        text not null check (type in ('evaluation','plan_update','chat_message','reminder')),
  title       text not null,
  body        text not null,
  href        text,
  meta        jsonb default '{}'::jsonb,
  read        boolean not null default false,
  created_at  timestamptz default now()
);

create index if not exists idx_notifications_player_created
  on public.notifications (player_id, created_at desc);

alter table public.notifications enable row level security;

-- Player can read + update (mark read) + delete their own notifications.
drop policy if exists "notifications_player_own" on public.notifications;
create policy "notifications_player_own" on public.notifications for all using (
  player_id in (select id from public.players where profile_id = auth.uid())
) with check (
  player_id in (select id from public.players where profile_id = auth.uid())
);

-- Coaches and admins can read + insert + update notifications for any player.
drop policy if exists "notifications_coach_all" on public.notifications;
create policy "notifications_coach_all" on public.notifications for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);


-- ─────────────────────────────────────────────────────────────
-- 2. PLAN AGREEMENTS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.plan_agreements (
  id              uuid default uuid_generate_v4() primary key,
  player_id       uuid not null references public.players(id) on delete cascade,
  category        text not null check (category in ('mental','technical','tactical')),
  title           text not null,
  description     text,
  deadline        date,
  status          text not null default 'open' check (status in ('open','in_progress','completed','missed')),
  created_by      text not null check (created_by in ('coach','player')),
  created_by_name text,
  recurring       text check (recurring in ('daily','weekly','match')),
  streak          integer not null default 0,
  xp              integer not null default 100,
  completed_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_plan_agreements_player_updated
  on public.plan_agreements (player_id, updated_at desc);

-- Auto-update `updated_at` on any UPDATE.
create or replace function public.set_plan_agreements_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_plan_agreements_updated_at on public.plan_agreements;
create trigger trg_plan_agreements_updated_at
  before update on public.plan_agreements
  for each row execute function public.set_plan_agreements_updated_at();

alter table public.plan_agreements enable row level security;

-- Players: read their own agreements + update status fields on their own.
drop policy if exists "plan_agreements_player_read" on public.plan_agreements;
create policy "plan_agreements_player_read" on public.plan_agreements for select using (
  player_id in (select id from public.players where profile_id = auth.uid())
);

drop policy if exists "plan_agreements_player_update" on public.plan_agreements;
create policy "plan_agreements_player_update" on public.plan_agreements for update using (
  player_id in (select id from public.players where profile_id = auth.uid())
) with check (
  player_id in (select id from public.players where profile_id = auth.uid())
);

-- Coaches and admins: full CRUD on any agreement.
drop policy if exists "plan_agreements_coach_all" on public.plan_agreements;
create policy "plan_agreements_coach_all" on public.plan_agreements for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);


-- ─────────────────────────────────────────────────────────────
-- 3. PLAN MESSAGES (chat between player and coach)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.plan_messages (
  id            uuid default uuid_generate_v4() primary key,
  player_id     uuid not null references public.players(id) on delete cascade,
  agreement_id  uuid references public.plan_agreements(id) on delete set null,
  author_id     uuid references public.profiles(id) on delete set null,
  author_role   text not null check (author_role in ('coach','player')),
  author_name   text,
  body          text not null,
  created_at    timestamptz default now()
);

create index if not exists idx_plan_messages_player_created
  on public.plan_messages (player_id, created_at);

alter table public.plan_messages enable row level security;

-- Players can read + write their own thread.
drop policy if exists "plan_messages_player_own" on public.plan_messages;
create policy "plan_messages_player_own" on public.plan_messages for all using (
  player_id in (select id from public.players where profile_id = auth.uid())
) with check (
  player_id in (select id from public.players where profile_id = auth.uid())
);

-- Coaches and admins can read + write any thread.
drop policy if exists "plan_messages_coach_all" on public.plan_messages;
create policy "plan_messages_coach_all" on public.plan_messages for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);


-- ─────────────────────────────────────────────────────────────
-- 4. REALTIME — publish all three tables so the UI can subscribe.
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'plan_agreements'
  ) then
    execute 'alter publication supabase_realtime add table public.plan_agreements';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'plan_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.plan_messages';
  end if;
end $$;
