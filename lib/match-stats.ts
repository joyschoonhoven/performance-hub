// ============================================================
// MATCH STATISTICS — Coach-entered post-match data
// ============================================================
// All data here originates from the coach filling in
// /dashboard/coach/matches/new after a match. No tracking systems
// involved. Data persists in Supabase: matches + match_player_stats.
// ============================================================

import { createClient } from "./supabase/client";
import type { PositionType } from "./types";

export interface MatchStat {
  id: string;
  player_id: string;
  player_name: string;
  position: PositionType;
  coach_id: string;
  match_date: string;
  opponent: string;
  competition: string;
  home_away: "home" | "away";
  result: string;
  minutes_played: number;
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  passes: number;
  pass_accuracy: number;
  key_passes: number;
  dribbles_attempted: number;
  dribbles_completed: number;
  tackles: number;
  interceptions: number;
  duels_won: number;
  duels_total: number;
  aerial_duels_won: number;
  aerial_duels_total: number;
  yellow_cards: number;
  red_cards: number;
  fouls_committed: number;
  saves?: number;
  clean_sheet?: boolean;
  match_rating: number;
  notes?: string;
  player_index?: number;
}

// ============================================================
// PLAYER INDEX CALCULATION (positional weighting)
// ============================================================

const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
  GK:  { saves: 0.30, clean_sheet: 0.25, pass_accuracy: 0.15, aerial_duels_won_pct: 0.10, duels_won_pct: 0.10, match_rating: 0.10 },
  CB:  { duels_won_pct: 0.25, aerial_duels_won_pct: 0.20, interceptions: 0.20, tackles: 0.15, pass_accuracy: 0.12, match_rating: 0.08 },
  LB:  { pass_accuracy: 0.20, key_passes: 0.18, duels_won_pct: 0.18, tackles: 0.15, assists: 0.14, match_rating: 0.15 },
  RB:  { pass_accuracy: 0.20, key_passes: 0.18, duels_won_pct: 0.18, tackles: 0.15, assists: 0.14, match_rating: 0.15 },
  CDM: { duels_won_pct: 0.25, interceptions: 0.20, tackles: 0.18, pass_accuracy: 0.20, key_passes: 0.10, match_rating: 0.07 },
  CM:  { pass_accuracy: 0.22, key_passes: 0.20, duels_won_pct: 0.18, assists: 0.15, interceptions: 0.10, match_rating: 0.15 },
  CAM: { key_passes: 0.25, assists: 0.22, shot_accuracy: 0.18, dribble_success: 0.15, pass_accuracy: 0.10, match_rating: 0.10 },
  LW:  { dribble_success: 0.22, key_passes: 0.20, shot_accuracy: 0.18, goals: 0.18, assists: 0.12, match_rating: 0.10 },
  RW:  { dribble_success: 0.22, key_passes: 0.20, shot_accuracy: 0.18, goals: 0.18, assists: 0.12, match_rating: 0.10 },
  ST:  { goals: 0.30, shot_accuracy: 0.22, duels_won_pct: 0.15, assists: 0.13, key_passes: 0.10, match_rating: 0.10 },
  SS:  { goals: 0.25, assists: 0.22, key_passes: 0.20, dribble_success: 0.15, shot_accuracy: 0.10, match_rating: 0.08 },
};

export function calculatePlayerIndex(stat: MatchStat): number {
  const weights = POSITION_WEIGHTS[stat.position] ?? POSITION_WEIGHTS.CM;
  const metrics: Record<string, number> = {
    goals: Math.min(stat.goals * 25, 100),
    assists: Math.min(stat.assists * 20, 100),
    shot_accuracy: stat.shots > 0 ? (stat.shots_on_target / stat.shots) * 100 : 50,
    key_passes: Math.min(stat.key_passes * 12, 100),
    pass_accuracy: stat.pass_accuracy,
    dribble_success: stat.dribbles_attempted > 0
      ? (stat.dribbles_completed / stat.dribbles_attempted) * 100 : 60,
    duels_won_pct: stat.duels_total > 0 ? (stat.duels_won / stat.duels_total) * 100 : 50,
    aerial_duels_won_pct: stat.aerial_duels_total > 0
      ? (stat.aerial_duels_won / stat.aerial_duels_total) * 100 : 50,
    tackles: Math.min(stat.tackles * 15, 100),
    interceptions: Math.min(stat.interceptions * 15, 100),
    saves: Math.min((stat.saves ?? 0) * 12, 100),
    clean_sheet: stat.clean_sheet ? 100 : 30,
    match_rating: (stat.match_rating / 10) * 100,
  };

  let score = 0;
  let totalWeight = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (metrics[key] ?? 0) * weight;
    totalWeight += weight;
  }
  const raw = totalWeight > 0 ? score / totalWeight : 50;
  const minFactor = stat.minutes_played >= 90 ? 1 : stat.minutes_played >= 60 ? 0.95 : 0.85;
  return Math.round(Math.min(Math.max(raw * minFactor, 10), 100));
}

export function calculateSeasonIndex(stats: MatchStat[]): number {
  if (!stats.length) return 0;
  const indices = stats.map(s => s.player_index ?? calculatePlayerIndex(s));
  return Math.round(indices.reduce((a, b) => a + b, 0) / indices.length);
}

export function getIndexLabel(index: number): { label: string; color: string } {
  if (index >= 85) return { label: "Elite",       color: "#F0A500" };
  if (index >= 75) return { label: "Uitstekend",  color: "#16A34A" };
  if (index >= 65) return { label: "Goed",        color: "#4DAEE5" };
  if (index >= 55) return { label: "Gemiddeld",   color: "#7C3AED" };
  if (index >= 45) return { label: "Matig",       color: "#D97706" };
  return { label: "Laag", color: "#D64045" };
}

// ============================================================
// SUPABASE QUERIES — replace the old mock data layer
// ============================================================

type MatchRow = {
  id: string;
  match_date: string;
  opponent: string;
  competition: string | null;
  home_away: "home" | "away" | null;
  result: string | null;
  notes: string | null;
};

type MpsRow = {
  id: string;
  match_id: string;
  player_id: string;
  position: string | null;
  minutes_played: number | null;
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  passes: number;
  pass_accuracy: number | null;
  key_passes: number;
  dribbles_attempted: number;
  dribbles_completed: number;
  duels_won: number;
  duels_total: number;
  aerial_duels_won: number;
  aerial_duels_total: number;
  tackles: number;
  interceptions: number;
  yellow_cards: number;
  red_cards: number;
  fouls_committed: number;
  match_rating: number | null;
  notes: string | null;
};

function rowsToStats(
  matches: MatchRow[],
  mps: MpsRow[],
  playerNames: Record<string, { name: string; position: PositionType }>,
): MatchStat[] {
  const matchById = new Map(matches.map(m => [m.id, m]));
  return mps.flatMap((row) => {
    const m = matchById.get(row.match_id);
    if (!m) return [];
    const playerInfo = playerNames[row.player_id];
    const stat: MatchStat = {
      id: row.id,
      player_id: row.player_id,
      player_name: playerInfo?.name ?? "—",
      position: (row.position as PositionType) ?? playerInfo?.position ?? "CM",
      coach_id: "",
      match_date: m.match_date,
      opponent: m.opponent,
      competition: m.competition ?? "Competitie",
      home_away: (m.home_away as "home" | "away") ?? "home",
      result: m.result ?? "",
      minutes_played: row.minutes_played ?? 0,
      goals: row.goals,
      assists: row.assists,
      shots: row.shots,
      shots_on_target: row.shots_on_target,
      passes: row.passes,
      pass_accuracy: row.pass_accuracy ?? 0,
      key_passes: row.key_passes,
      dribbles_attempted: row.dribbles_attempted,
      dribbles_completed: row.dribbles_completed,
      duels_won: row.duels_won,
      duels_total: row.duels_total,
      aerial_duels_won: row.aerial_duels_won,
      aerial_duels_total: row.aerial_duels_total,
      tackles: row.tackles,
      interceptions: row.interceptions,
      yellow_cards: row.yellow_cards,
      red_cards: row.red_cards,
      fouls_committed: row.fouls_committed,
      match_rating: row.match_rating ?? 0,
      notes: row.notes ?? undefined,
    };
    stat.player_index = calculatePlayerIndex(stat);
    return [stat];
  }).sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());
}

/** Fetch match stats for a single player from Supabase. */
export async function getPlayerMatchStats(playerId: string): Promise<MatchStat[]> {
  const supabase = createClient();
  const { data: mps } = await supabase
    .from("match_player_stats")
    .select("*")
    .eq("player_id", playerId);
  if (!mps?.length) return [];

  const matchIds = Array.from(new Set(mps.map((r: MpsRow) => r.match_id)));
  const [matchesRes, playerRes] = await Promise.all([
    supabase.from("matches").select("*").in("id", matchIds),
    supabase.from("players").select("id, first_name, last_name, position").eq("id", playerId).maybeSingle(),
  ]);

  const names: Record<string, { name: string; position: PositionType }> = {};
  if (playerRes.data) {
    names[playerId] = {
      name: `${playerRes.data.first_name} ${playerRes.data.last_name}`,
      position: playerRes.data.position as PositionType,
    };
  }
  return rowsToStats((matchesRes.data ?? []) as MatchRow[], mps as MpsRow[], names);
}

/** Fetch all match stats across the squad. */
export async function getAllMatchStats(): Promise<MatchStat[]> {
  const supabase = createClient();
  const { data: mps } = await supabase.from("match_player_stats").select("*");
  if (!mps?.length) return [];

  const matchIds = Array.from(new Set(mps.map((r: MpsRow) => r.match_id)));
  const playerIds = Array.from(new Set(mps.map((r: MpsRow) => r.player_id)));

  const [matchesRes, playersRes] = await Promise.all([
    supabase.from("matches").select("*").in("id", matchIds),
    supabase.from("players").select("id, first_name, last_name, position").in("id", playerIds),
  ]);

  const names: Record<string, { name: string; position: PositionType }> = {};
  (playersRes.data ?? []).forEach((p: { id: string; first_name: string; last_name: string; position: string }) => {
    names[p.id] = {
      name: `${p.first_name} ${p.last_name}`,
      position: p.position as PositionType,
    };
  });
  return rowsToStats((matchesRes.data ?? []) as MatchRow[], mps as MpsRow[], names);
}

/** List all matches (without per-player stats) for the matches list page. */
export async function listMatches() {
  const supabase = createClient();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false });
  return (data ?? []) as MatchRow[];
}

// ============================================================
// Season aggregates — synchronous, work on already-loaded stats
// ============================================================

export interface SeasonStats {
  matches: number;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  avg_pass_accuracy: number;
  key_passes: number;
  dribble_success_pct: number;
  duel_success_pct: number;
  tackles: number;
  interceptions: number;
  yellow_cards: number;
  red_cards: number;
  avg_rating: number;
  season_index: number;
  goals_per_90: number;
  assists_per_90: number;
}

export function aggregateSeasonStats(stats: MatchStat[]): SeasonStats {
  if (!stats.length) {
    return {
      matches: 0, minutes: 0, goals: 0, assists: 0, shots: 0,
      shots_on_target: 0, avg_pass_accuracy: 0, key_passes: 0,
      dribble_success_pct: 0, duel_success_pct: 0, tackles: 0,
      interceptions: 0, yellow_cards: 0, red_cards: 0, avg_rating: 0,
      season_index: 0, goals_per_90: 0, assists_per_90: 0,
    };
  }
  const totals = stats.reduce(
    (acc, s) => ({
      minutes: acc.minutes + s.minutes_played,
      goals: acc.goals + s.goals,
      assists: acc.assists + s.assists,
      shots: acc.shots + s.shots,
      shots_on_target: acc.shots_on_target + s.shots_on_target,
      pass_acc_sum: acc.pass_acc_sum + s.pass_accuracy,
      key_passes: acc.key_passes + s.key_passes,
      dribbles_attempted: acc.dribbles_attempted + s.dribbles_attempted,
      dribbles_completed: acc.dribbles_completed + s.dribbles_completed,
      duels_won: acc.duels_won + s.duels_won,
      duels_total: acc.duels_total + s.duels_total,
      tackles: acc.tackles + s.tackles,
      interceptions: acc.interceptions + s.interceptions,
      yellow_cards: acc.yellow_cards + s.yellow_cards,
      red_cards: acc.red_cards + s.red_cards,
      rating_sum: acc.rating_sum + s.match_rating,
    }),
    {
      minutes: 0, goals: 0, assists: 0, shots: 0, shots_on_target: 0,
      pass_acc_sum: 0, key_passes: 0, dribbles_attempted: 0,
      dribbles_completed: 0, duels_won: 0, duels_total: 0,
      tackles: 0, interceptions: 0, yellow_cards: 0, red_cards: 0,
      rating_sum: 0,
    }
  );
  const n = stats.length;
  const per90 = totals.minutes > 0 ? 90 / totals.minutes : 0;
  return {
    matches: n,
    minutes: totals.minutes,
    goals: totals.goals,
    assists: totals.assists,
    shots: totals.shots,
    shots_on_target: totals.shots_on_target,
    avg_pass_accuracy: Math.round(totals.pass_acc_sum / n),
    key_passes: totals.key_passes,
    dribble_success_pct: totals.dribbles_attempted > 0
      ? Math.round((totals.dribbles_completed / totals.dribbles_attempted) * 100) : 0,
    duel_success_pct: totals.duels_total > 0
      ? Math.round((totals.duels_won / totals.duels_total) * 100) : 0,
    tackles: totals.tackles,
    interceptions: totals.interceptions,
    yellow_cards: totals.yellow_cards,
    red_cards: totals.red_cards,
    avg_rating: Math.round((totals.rating_sum / n) * 10) / 10,
    season_index: calculateSeasonIndex(stats),
    goals_per_90: Math.round(totals.goals * per90 * 100) / 100,
    assists_per_90: Math.round(totals.assists * per90 * 100) / 100,
  };
}
