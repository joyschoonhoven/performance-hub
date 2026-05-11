-- ============================================================
-- MIGRATION — PLAYER PHOTOS
-- Run this in your Supabase SQL Editor
-- ============================================================
--
-- Adds:
--   1. photo_url column on players table
--   2. Storage bucket 'player-photos' (public, max 5MB, JPEG/PNG)
--   3. RLS policies so:
--      - Coaches/admins can upload/update photos for any player
--      - Players can upload/update their own photo
--      - All authenticated users can read photos
-- ============================================================

-- 1. Column
alter table public.players
  add column if not exists photo_url text;

-- 2. Storage bucket (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-photos',
  'player-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. RLS policies on storage.objects scoped to this bucket
drop policy if exists "player_photos_read" on storage.objects;
create policy "player_photos_read"
  on storage.objects for select
  using (bucket_id = 'player-photos');

drop policy if exists "player_photos_coach_write" on storage.objects;
create policy "player_photos_coach_write"
  on storage.objects for all
  using (
    bucket_id = 'player-photos'
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
  )
  with check (
    bucket_id = 'player-photos'
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
  );

drop policy if exists "player_photos_self_write" on storage.objects;
create policy "player_photos_self_write"
  on storage.objects for all
  using (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] = (
      select id::text from public.players where profile_id = auth.uid() limit 1
    )
  )
  with check (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] = (
      select id::text from public.players where profile_id = auth.uid() limit 1
    )
  );
