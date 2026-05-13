-- ============================================================
-- MIGRATION — MATCHES + PER-PLAYER MATCH STATS
-- Run this in your Supabase SQL Editor
-- ============================================================
--
-- Replaces lib/match-stats.ts hardcoded mock data with real
-- coach-entered match data. Coach fills in /dashboard/coach/matches/new
-- after each game → saves here → analytics + player card show real data.
-- ============================================================

create table if not exists public.matches (
  id uuid default uuid_generate_v4() primary key,
  match_date date not null,
  opponent text not null,
  competition text,
  home_away text check (home_away in ('home','away')),
  result text,                       -- e.g. "2-1"
  notes text,
  coach_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_matches_date on public.matches (match_date desc);

alter table public.matches enable row level security;

drop policy if exists "matches_select" on public.matches;
create policy "matches_select" on public.matches for select using (
  auth.role() = 'authenticated'
);

drop policy if exists "matches_coach_write" on public.matches;
create policy "matches_coach_write" on public.matches for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);

-- ============================================================
-- Per-player match performance (one row per player per match)
-- ============================================================

create table if not exists public.match_player_stats (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  position text,
  minutes_played integer,

  -- Attack
  goals integer default 0,
  assists integer default 0,
  shots integer default 0,
  shots_on_target integer default 0,

  -- Passing
  passes integer default 0,
  pass_accuracy numeric(5,2),
  key_passes integer default 0,

  -- Dribbling
  dribbles_attempted integer default 0,
  dribbles_completed integer default 0,

  -- Duels
  duels_won integer default 0,
  duels_total integer default 0,
  aerial_duels_won integer default 0,
  aerial_duels_total integer default 0,

  -- Defending
  tackles integer default 0,
  interceptions integer default 0,

  -- Discipline
  yellow_cards integer default 0,
  red_cards integer default 0,
  fouls_committed integer default 0,

  -- Overall
  match_rating numeric(3,1) check (match_rating between 0 and 10),
  notes text,

  created_at timestamptz default now(),

  unique (match_id, player_id)
);

create index if not exists idx_match_player_stats_player
  on public.match_player_stats (player_id, match_id);

alter table public.match_player_stats enable row level security;

drop policy if exists "mps_select" on public.match_player_stats;
create policy "mps_select" on public.match_player_stats for select using (
  auth.role() = 'authenticated'
);

drop policy if exists "mps_coach_write" on public.match_player_stats;
create policy "mps_coach_write" on public.match_player_stats for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);
