-- ============================================================
--  Laat spelers hun eigen profiel opslaan (instellingen-pagina).
--  1. Ontbrekende kolommen toevoegen (indien nog niet aanwezig)
--  2. RLS: speler mag zijn EIGEN spelersrij bijwerken
--  Run dit in de Supabase SQL-editor.
-- ============================================================

-- 1. Kolommen die de instellingen-pagina opslaat
alter table public.players add column if not exists height_cm        integer;
alter table public.players add column if not exists weight_kg        integer;
alter table public.players add column if not exists dominant_foot    text;
alter table public.players add column if not exists injury_locations jsonb default '[]'::jsonb;

-- 2. Speler mag zijn eigen rij updaten (naast coach/admin)
drop policy if exists "players_update" on public.players;
create policy "players_update" on public.players for update using (
  profile_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
) with check (
  profile_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);
