-- ============================================================
-- SCHOONHOVEN SPORTS PERFORMANCE HUB — Database Schema
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

create extension if not exists "uuid-ossp";

-- PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('coach','player','admin')) default 'player',
  avatar_url text,
  phone text,
  location text,
  bio text,
  coaching_license text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PLAYERS
create table if not exists public.players (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  nationality text default 'Nederlands',
  position text not null check (position in ('GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST','SS')),
  secondary_position text,
  jersey_number integer,
  overall_rating integer default 70,
  badge text check (badge in ('elite','talent','prospect','rising_star','veteran')),
  is_active boolean default true,
  club text default 'Schoonhoven FC',
  team_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PLAYER DNA / IDENTITY
create table if not exists public.player_identities (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references public.players(id) on delete cascade not null unique,
  primary_archetype text,
  secondary_archetype text,
  primary_sociotype text,
  secondary_sociotype text,
  core_noodzaak integer default 50,
  core_creativiteit integer default 50,
  core_vertrouwen integer default 50,
  ai_fit_score integer default 0,
  ai_summary text,
  coach_notes text,
  last_ai_analysis timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- COACH <-> PLAYER assignments
create table if not exists public.coach_player_assignments (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  assigned_at timestamptz default now(),
  unique(coach_id, player_id)
);

-- EVALUATIONS
create table if not exists public.evaluations (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references public.players(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete set null,
  coach_name text,
  overall_score numeric(4,2),
  notes text,
  match_context text,
  opponent text,
  potential_level text,
  strengths text,
  improvement_points text,
  player_type_description text,
  position_description text,
  assessed_archetype text,
  assessed_sociotype text,
  assessed_position text,
  evaluation_date date not null default current_date,
  created_at timestamptz default now()
);

-- EVALUATION SCORES (category averages)
create table if not exists public.evaluation_scores (
  id uuid default uuid_generate_v4() primary key,
  evaluation_id uuid references public.evaluations(id) on delete cascade not null,
  category text not null check (category in ('techniek','fysiek','tactiek','mentaal','teamplay')),
  score numeric(4,2) not null
);

-- EVALUATION SUBCATEGORY SCORES
create table if not exists public.evaluation_sub_scores (
  id uuid default uuid_generate_v4() primary key,
  evaluation_id uuid references public.evaluations(id) on delete cascade not null,
  category text not null,
  sub_id text not null,
  score integer not null
);

-- CHALLENGES
create table if not exists public.challenges (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references public.players(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  category text check (category in ('techniek','fysiek','tactiek','mentaal','teamplay')),
  status text not null check (status in ('open','in_progress','completed','expired')) default 'open',
  deadline date,
  progress integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.player_identities enable row level security;
alter table public.coach_player_assignments enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_scores enable row level security;
alter table public.evaluation_sub_scores enable row level security;
alter table public.challenges enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Players
create policy "players_select" on public.players for select using (auth.role() = 'authenticated');
create policy "players_insert" on public.players for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);
create policy "players_update" on public.players for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);
create policy "players_delete" on public.players for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Player identities
create policy "identity_select" on public.player_identities for select using (auth.role() = 'authenticated');
create policy "identity_all" on public.player_identities for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);

-- Assignments
create policy "assignments_select" on public.coach_player_assignments for select using (auth.role() = 'authenticated');
create policy "assignments_all" on public.coach_player_assignments for all using (
  coach_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Evaluations
create policy "evaluations_select" on public.evaluations for select using (auth.role() = 'authenticated');
create policy "evaluations_insert" on public.evaluations for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);
create policy "evaluations_update" on public.evaluations for update using (coach_id = auth.uid());

-- Scores
create policy "eval_scores_select" on public.evaluation_scores for select using (auth.role() = 'authenticated');
create policy "eval_scores_insert" on public.evaluation_scores for insert with check (auth.role() = 'authenticated');
create policy "eval_sub_select" on public.evaluation_sub_scores for select using (auth.role() = 'authenticated');
create policy "eval_sub_insert" on public.evaluation_sub_scores for insert with check (auth.role() = 'authenticated');

-- Challenges
create policy "challenges_select" on public.challenges for select using (auth.role() = 'authenticated');
create policy "challenges_all" on public.challenges for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach','admin'))
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'player')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- AUTO-UPDATE updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger players_updated_at before update on public.players for each row execute procedure public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger challenges_updated_at before update on public.challenges for each row execute procedure public.set_updated_at();
