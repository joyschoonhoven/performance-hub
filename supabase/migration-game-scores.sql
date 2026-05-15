-- ============================================================
-- MIGRATION — TACTICAL IQ GAME SCORES
-- Persists each completed game for high-score tracking.
-- ============================================================

create table if not exists public.game_scores (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  mode text not null check (mode in ('classic', 'infinite')),
  total_score integer not null,
  max_possible integer not null,
  scenarios_played integer not null,
  accuracy_pct numeric(5,2),
  iq_label text,
  created_at timestamptz default now()
);

create index if not exists idx_game_scores_player
  on public.game_scores (player_id, total_score desc);

create index if not exists idx_game_scores_player_date
  on public.game_scores (player_id, created_at desc);

alter table public.game_scores enable row level security;

-- Players manage their own scores
drop policy if exists "game_scores_player_own" on public.game_scores;
create policy "game_scores_player_own" on public.game_scores for all using (
  player_id in (select id from public.players where profile_id = auth.uid())
) with check (
  player_id in (select id from public.players where profile_id = auth.uid())
);

-- Coaches + admins can read all scores
drop policy if exists "game_scores_coach_read" on public.game_scores;
create policy "game_scores_coach_read" on public.game_scores for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);
