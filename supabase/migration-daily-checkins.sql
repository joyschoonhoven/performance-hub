-- ============================================================
-- MIGRATION — DAILY CHECK-INS (player self-assessment)
-- Run this in your Supabase SQL Editor
-- ============================================================
--
-- This adds a daily wellness questionnaire for players:
-- sleep quality, perceived recovery, energy, soreness, stress, mood.
-- Replaces the need for tracking systems (no kilometers/HR data
-- — only what the player can self-report).
-- ============================================================

create table if not exists public.daily_checkins (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  checkin_date date not null default current_date,

  -- Wellness metrics (1–10 scale, optional individually)
  sleep_quality          integer check (sleep_quality          between 1 and 10),
  sleep_hours            numeric(3,1),
  perceived_recovery     integer check (perceived_recovery     between 1 and 10),
  energy_level           integer check (energy_level           between 1 and 10),
  mood                   integer check (mood                   between 1 and 10),
  soreness               integer check (soreness               between 1 and 10),
  stress_level           integer check (stress_level           between 1 and 10),
  motivation             integer check (motivation             between 1 and 10),

  -- Locator for soreness ('hamstring', 'calves', 'lower_back', 'shoulders', etc.)
  soreness_locations     text[],

  notes                  text,

  created_at             timestamptz default now(),

  -- One check-in per player per day
  unique (player_id, checkin_date)
);

create index if not exists idx_daily_checkins_player_date
  on public.daily_checkins (player_id, checkin_date desc);

-- RLS
alter table public.daily_checkins enable row level security;

-- Players can manage their own check-ins
drop policy if exists "checkins_player_own" on public.daily_checkins;
create policy "checkins_player_own" on public.daily_checkins for all using (
  player_id in (select id from public.players where profile_id = auth.uid())
) with check (
  player_id in (select id from public.players where profile_id = auth.uid())
);

-- Coaches and admins can read all check-ins
drop policy if exists "checkins_coach_read" on public.daily_checkins;
create policy "checkins_coach_read" on public.daily_checkins for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);
