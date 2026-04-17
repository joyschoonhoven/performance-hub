-- ============================================================
-- SCHEMA UPDATE — Run in Supabase SQL Editor
-- Adds: challenge_templates, RLS fix for player self-insert,
--       club column on profiles
-- ============================================================

-- Add club column to profiles if not exists
alter table public.profiles add column if not exists club text;

-- Fix RLS: players can insert their own record via onboarding
drop policy if exists "players_insert" on public.players;
create policy "players_insert" on public.players for insert with check (
  profile_id = auth.uid()
  OR exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);

-- CHALLENGE TEMPLATES TABLE
create table if not exists public.challenge_templates (
  id uuid default uuid_generate_v4() primary key,
  month_label text not null,
  title text not null,
  description text,
  category text check (category in ('techniek','fysiek','tactiek','mentaal','teamplay')),
  duration_weeks integer default 4,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.challenge_templates enable row level security;
create policy "templates_select" on public.challenge_templates for select using (auth.role() = 'authenticated');
create policy "templates_admin" on public.challenge_templates for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);

-- ============================================================
-- SEED: 11 MONTHLY CHALLENGES
-- ============================================================
insert into public.challenge_templates (month_label, title, description, category, duration_weeks, sort_order) values
(
  'Maand 1 — Januari',
  'Conditie & Uithoudingsvermogen',
  'Bouw je basisconditie op voor het nieuwe seizoen. Minimaal 3 keer per week 30 minuten cardio (hardlopen, fietsen of zwemmen). Einddoel: 90 minuten wedstrijd zonder vermoeidheid.',
  'fysiek', 4, 1
),
(
  'Maand 2 — Februari',
  'Passnauwkeurigheid',
  'Verbeter de precisie van je korte en middellange passes. Doel: 85% slagingspercentage bij passes op training. Oefen dagelijks 15 minuten passing drills met een partner.',
  'techniek', 4, 2
),
(
  'Maand 3 — Maart',
  '1v1 Duels & Dribbling',
  'Win minimaal 60% van je directe één-op-één situaties. Focus op lichaamsbeweging, timing en richtingsverandering. Wekelijks 20 minuten 1v1 oefeningen.',
  'techniek', 4, 3
),
(
  'Maand 4 — April',
  'Kopvaardigheid',
  'Verbeter aanvallend en verdedigend kopspel. Oefen dagelijks 10 minuten kopduels — zowel gericht koppen als verdedigend wegkoppen. Focus op timing en plaatsing.',
  'techniek', 4, 4
),
(
  'Maand 5 — Mei',
  'Pressing & Balverovering',
  'Actief meepersen bij balverlies. Doel: minimaal 3 succesvolle balovernamen per wedstrijd door druk zetten. Focus op looproutes en juiste pressmoment.',
  'tactiek', 4, 5
),
(
  'Maand 6 — Juni',
  'Afwerken & Schottechniek',
  'Vergroot je doelpuntgemiddelde. Dagelijks 15 doelgerichte schoten op doel (varieer van positie en voet). Focus op plaatsing boven kracht.',
  'techniek', 4, 6
),
(
  'Maand 7 — Juli',
  'Explosiviteit & Sprint',
  'Verbeter je acceleratie en sprintsnelheid. 3x per week sprint- en ploftraining. Meet je 10m en 30m sprinttijden aan begin en einde van de maand.',
  'fysiek', 4, 7
),
(
  'Maand 8 — Augustus',
  'Communicatie & Teamplay',
  'Verbeter verbale en non-verbale communicatie op het veld. Geef minimaal 5 aanwijzingen per training aan medespelers. Focus op aanroepen, aanwijzen en coachen.',
  'teamplay', 4, 8
),
(
  'Maand 9 — September',
  'Positiespel & Tactisch Inzicht',
  'Correct positiespel bij balbezit en balverlies. Wekelijks videoanalyse van eigen wedstrijd (5 min). Doel: geen onnodige balverliezen door slechte positie.',
  'tactiek', 4, 9
),
(
  'Maand 10 — Oktober',
  'Zwakke Voet Ontwikkeling',
  'Minimaal 20 minuten per training zwakke voet oefenen. Passes, schoten en aannames met zwakke voet. Einddoel: 70% van de kwaliteit van je sterke voet bereiken.',
  'techniek', 4, 10
),
(
  'Maand 11 — November',
  'Mentale Weerbaarheid',
  'Positief reageren na een fout, gemiste kans of tegendoelpunt. Gebruik ademhalingstechnieken en herpak je binnen 30 seconden. Bespreek mentale uitdagingen wekelijks met de coach.',
  'mentaal', 4, 11
)
on conflict do nothing;
