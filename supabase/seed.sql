-- ============================================================
-- SCHOONHOVEN SPORTS PERFORMANCE HUB — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- NOTE: In production, users are created via Supabase Auth.
-- These are demo profiles for testing.

-- Demo profiles (created manually after auth signup)
-- Use these emails with password: demo1234

-- To create demo users, run in Supabase Auth dashboard or use:
-- supabase auth admin create-user --email coach@demo.hub --password demo1234

INSERT INTO profiles (id, email, full_name, role, club) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@demo.hub', 'Admin Demo', 'admin', 'Schoonhoven FC'),
  ('00000000-0000-0000-0000-000000000002', 'coach@demo.hub', 'Marco de Vries', 'coach', 'Schoonhoven FC'),
  ('00000000-0000-0000-0000-000000000003', 'player@demo.hub', 'Lars van der Berg', 'player', 'Schoonhoven FC')
ON CONFLICT (id) DO NOTHING;

-- Demo players
INSERT INTO players (id, first_name, last_name, date_of_birth, nationality, position, jersey_number, overall_rating, badge, team_name, club) VALUES
  ('p0000001-0000-0000-0000-000000000001', 'Lars', 'van der Berg', '2007-03-15', 'Nederlands', 'ST', 9, 82, 'talent', 'U17 A', 'Schoonhoven FC'),
  ('p0000002-0000-0000-0000-000000000002', 'Jaylen', 'Martens', '2006-07-22', 'Nederlands', 'CM', 8, 79, 'talent', 'U17 A', 'Schoonhoven FC'),
  ('p0000003-0000-0000-0000-000000000003', 'Daan', 'Kooistra', '2007-11-04', 'Nederlands', 'GK', 1, 77, 'talent', 'U17 A', 'Schoonhoven FC'),
  ('p0000004-0000-0000-0000-000000000004', 'Senna', 'El Hassouni', '2008-02-18', 'Nederlands', 'LW', 11, 74, 'prospect', 'U17 A', 'Schoonhoven FC'),
  ('p0000005-0000-0000-0000-000000000005', 'Tim', 'Schoonhoven', '2007-06-30', 'Nederlands', 'CB', 5, 71, 'prospect', 'U17 A', 'Schoonhoven FC'),
  ('p0000006-0000-0000-0000-000000000006', 'Noah', 'Fernandez', '2006-09-12', 'Spaans', 'CAM', 10, 86, 'elite', 'U18 A', 'Schoonhoven FC'),
  ('p0000007-0000-0000-0000-000000000007', 'Kevin', 'de Jong', '2007-04-05', 'Nederlands', 'RB', 2, 68, 'prospect', 'U17 A', 'Schoonhoven FC'),
  ('p0000008-0000-0000-0000-000000000008', 'Rayan', 'Ouali', '2008-12-01', 'Marokkaans', 'CDM', 6, 70, 'prospect', 'U16 A', 'Schoonhoven FC')
ON CONFLICT (id) DO NOTHING;

-- Assign Lars (player@demo.hub) to his player profile
UPDATE players SET profile_id = '00000000-0000-0000-0000-000000000003'
WHERE id = 'p0000001-0000-0000-0000-000000000001';

-- Coach assignments
INSERT INTO coach_player_assignments (coach_id, player_id, is_primary) VALUES
  ('00000000-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000001', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'p0000002-0000-0000-0000-000000000002', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'p0000003-0000-0000-0000-000000000003', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'p0000004-0000-0000-0000-000000000004', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'p0000005-0000-0000-0000-000000000005', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'p0000006-0000-0000-0000-000000000006', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'p0000007-0000-0000-0000-000000000007', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'p0000008-0000-0000-0000-000000000008', TRUE)
ON CONFLICT (coach_id, player_id) DO NOTHING;

-- Player identity (DNA)
INSERT INTO player_identity (player_id, primary_archetype, secondary_archetype, primary_sociotype, secondary_sociotype, core_noodzaak, core_creativiteit, core_vertrouwen, ai_fit_score, ai_summary) VALUES
  ('p0000001-0000-0000-0000-000000000001', 'complete_forward', 'poacher', 'killer', 'strijder', 75, 60, 82, 88, 'Lars is een complete spits met uitstekende afwerking en een killermentaliteit.'),
  ('p0000002-0000-0000-0000-000000000002', 'progressive_passer', 'engine', 'denker', 'leider', 65, 85, 72, 82, 'Jaylen denkt twee stappen vooruit met zijn visie en passing-range.'),
  ('p0000003-0000-0000-0000-000000000003', 'sweeper_keeper', 'command_keeper', 'leider', 'rustbrenger', 80, 55, 78, 79, 'Daan heeft de mentaliteit van een leider tussen de palen.'),
  ('p0000006-0000-0000-0000-000000000006', 'classic_ten', 'creative_hub', 'kunstenaar', 'leider', 65, 95, 88, 94, 'Noah is een generatietalent. Zijn techniek en creativiteit zijn op een ander niveau.')
ON CONFLICT (player_id) DO NOTHING;

-- Sample evaluations for Lars
INSERT INTO evaluations (id, player_id, coach_id, overall_score, notes, evaluation_date) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 8.2, 'Uitstekende training vandaag. Scherp in de zestien.', '2025-01-15'),
  ('e0000002-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 7.8, 'Goede wedstrijd, kan nog beter positiespel.', '2025-01-01'),
  ('e0000003-0000-0000-0000-000000000003', 'p0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 7.5, 'Consistente prestatie.', '2024-12-15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO evaluation_scores (evaluation_id, category, score) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'techniek', 8.2),
  ('e0000001-0000-0000-0000-000000000001', 'fysiek', 8.5),
  ('e0000001-0000-0000-0000-000000000001', 'tactiek', 7.8),
  ('e0000001-0000-0000-0000-000000000001', 'mentaal', 8.0),
  ('e0000001-0000-0000-0000-000000000001', 'teamplay', 7.5),
  ('e0000002-0000-0000-0000-000000000002', 'techniek', 7.8),
  ('e0000002-0000-0000-0000-000000000002', 'fysiek', 8.0),
  ('e0000002-0000-0000-0000-000000000002', 'tactiek', 7.5),
  ('e0000002-0000-0000-0000-000000000002', 'mentaal', 7.8),
  ('e0000002-0000-0000-0000-000000000002', 'teamplay', 7.8)
ON CONFLICT DO NOTHING;

-- Challenges for Lars
INSERT INTO challenges (player_id, coach_id, title, category, status, progress, deadline) VALUES
  ('p0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '100 vrije trappen per week', 'techniek', 'in_progress', 65, '2025-02-01'),
  ('p0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Sprint snelheid verbeteren', 'fysiek', 'open', 0, '2025-03-01'),
  ('p0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '10 assists in training', 'teamplay', 'completed', 100, '2025-01-10')
ON CONFLICT DO NOTHING;
