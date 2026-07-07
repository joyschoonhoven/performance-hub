-- ============================================================
--  Track when a player was last active (last login / dashboard visit).
--  Run this in the Supabase SQL editor.
-- ============================================================

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- Players update their own profile already (profiles_update: auth.uid() = id),
-- and coaches can read any profile (profiles_select: authenticated), so no new
-- policies are needed.
