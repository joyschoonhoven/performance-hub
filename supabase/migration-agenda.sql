-- ============================================================
--  AGENDA + MBTI-SCORES
--  Draai dit blok in de Supabase SQL Editor.
-- ============================================================

-- 1. Persoonlijkheidsscores per as (voor de persoonlijkheidsradar)
alter table public.players add column if not exists mbti_scores jsonb;

-- 2. Beschikbaarheid van de trainer (tijdslots)
create table if not exists public.coach_slots (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  capacity    int  not null default 1 check (capacity between 1 and 30),
  note        text,
  created_at  timestamptz not null default now()
);

-- 3. Boekingen van spelers op een tijdslot
create table if not exists public.slot_bookings (
  id          uuid primary key default gen_random_uuid(),
  slot_id     uuid not null references public.coach_slots(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (slot_id, player_id)
);

-- ── RLS ──
alter table public.coach_slots   enable row level security;
alter table public.slot_bookings enable row level security;

-- Slots: iedereen die is ingelogd mag ze zien; alleen coach/admin beheert eigen slots
drop policy if exists coach_slots_select on public.coach_slots;
create policy coach_slots_select on public.coach_slots
  for select using (auth.role() = 'authenticated');

drop policy if exists coach_slots_insert on public.coach_slots;
create policy coach_slots_insert on public.coach_slots
  for insert with check (
    coach_id = auth.uid()
    and exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('coach','admin'))
  );

drop policy if exists coach_slots_delete on public.coach_slots;
create policy coach_slots_delete on public.coach_slots
  for delete using (
    coach_id = auth.uid()
    or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
  );

-- Boekingen: speler boekt/annuleert zichzelf; coach/admin ziet en beheert alles
drop policy if exists slot_bookings_select on public.slot_bookings;
create policy slot_bookings_select on public.slot_bookings
  for select using (auth.role() = 'authenticated');

drop policy if exists slot_bookings_insert on public.slot_bookings;
create policy slot_bookings_insert on public.slot_bookings
  for insert with check (
    exists (select 1 from public.players p where p.id = player_id and p.profile_id = auth.uid())
  );

drop policy if exists slot_bookings_delete on public.slot_bookings;
create policy slot_bookings_delete on public.slot_bookings
  for delete using (
    exists (select 1 from public.players p where p.id = player_id and p.profile_id = auth.uid())
    or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('coach','admin'))
  );
