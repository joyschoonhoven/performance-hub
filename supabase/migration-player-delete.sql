-- ============================================================
--  Allow coaches (not only admins) to delete players from the
--  coach environment. Run this in the Supabase SQL editor.
-- ============================================================

drop policy if exists "players_delete" on public.players;
create policy "players_delete" on public.players for delete using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('coach','admin')
  )
);
