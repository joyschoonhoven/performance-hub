-- ============================================================
--  MBTI-persoonlijkheidstype per speler. Run in de Supabase SQL-editor.
--  (De self-update policy uit migration-player-self-edit.sql laat de
--   speler zijn eigen mbti_type opslaan.)
-- ============================================================

alter table public.players add column if not exists mbti_type text;
