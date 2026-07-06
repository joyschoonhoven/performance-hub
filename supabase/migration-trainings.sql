-- ============================================================
--  TRAININGS — upcoming sessions with dual goals (coach + player)
--  Run this in the Supabase SQL editor. Until it exists the app
--  falls back to localStorage (single-device only).
-- ============================================================

create table if not exists public.player_trainings (
  id           uuid default uuid_generate_v4() primary key,
  player_id    uuid not null references public.players(id) on delete cascade,
  date         date not null,
  type         text not null check (type in ('team','individueel','keeper','wedstrijd','herstel','test')),
  title        text,
  coach_goal   text,   -- trainingsdoel vanuit de trainer
  player_goal  text,   -- trainingsdoel vanuit de speler
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_player_trainings_player_date
  on public.player_trainings (player_id, date);

create or replace function public.set_player_trainings_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_player_trainings_updated_at on public.player_trainings;
create trigger trg_player_trainings_updated_at
  before update on public.player_trainings
  for each row execute function public.set_player_trainings_updated_at();

alter table public.player_trainings enable row level security;

-- Players: full CRUD on their own trainings (add sessions, set their own goal).
drop policy if exists "player_trainings_player_all" on public.player_trainings;
create policy "player_trainings_player_all" on public.player_trainings for all using (
  player_id in (select id from public.players where profile_id = auth.uid())
) with check (
  player_id in (select id from public.players where profile_id = auth.uid())
);

-- Coaches and admins: full CRUD on any training (set the coach goal).
drop policy if exists "player_trainings_coach_all" on public.player_trainings;
create policy "player_trainings_coach_all" on public.player_trainings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);
