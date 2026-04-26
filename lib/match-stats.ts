// ============================================================
// MATCH STATISTICS — SciSports-style data layer
// ============================================================

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
  result: string; // e.g. "2-1"
  minutes_played: number;
  // Attack
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  // Passing
  passes: number;
  pass_accuracy: number; // 0-100 %
  key_passes: number;
  // Dribbling
  dribbles_attempted: number;
  dribbles_completed: number;
  // Defence
  tackles: number;
  interceptions: number;
  duels_won: number;
  duels_total: number;
  aerial_duels_won: number;
  aerial_duels_total: number;
  // Discipline
  yellow_cards: number;
  red_cards: number;
  fouls_committed: number;
  // GK only
  saves?: number;
  clean_sheet?: boolean;
  // Match rating
  match_rating: number; // 1-10
  notes?: string;
  // Computed (filled by calculatePlayerIndex)
  player_index?: number; // 0-100 SciSports-style
}

// ============================================================
// PLAYER INDEX CALCULATION (positional weighting)
// ============================================================

const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
  GK: {
    saves: 0.30, clean_sheet: 0.25, pass_accuracy: 0.15,
    aerial_duels_won_pct: 0.10, duels_won_pct: 0.10, match_rating: 0.10,
  },
  CB: {
    duels_won_pct: 0.25, aerial_duels_won_pct: 0.20, interceptions: 0.20,
    tackles: 0.15, pass_accuracy: 0.12, match_rating: 0.08,
  },
  LB: {
    pass_accuracy: 0.20, key_passes: 0.18, duels_won_pct: 0.18,
    tackles: 0.15, assists: 0.14, match_rating: 0.15,
  },
  RB: {
    pass_accuracy: 0.20, key_passes: 0.18, duels_won_pct: 0.18,
    tackles: 0.15, assists: 0.14, match_rating: 0.15,
  },
  CDM: {
    duels_won_pct: 0.25, interceptions: 0.20, tackles: 0.18,
    pass_accuracy: 0.20, key_passes: 0.10, match_rating: 0.07,
  },
  CM: {
    pass_accuracy: 0.22, key_passes: 0.20, duels_won_pct: 0.18,
    assists: 0.15, interceptions: 0.10, match_rating: 0.15,
  },
  CAM: {
    key_passes: 0.25, assists: 0.22, shot_accuracy: 0.18,
    dribble_success: 0.15, pass_accuracy: 0.10, match_rating: 0.10,
  },
  LW: {
    dribble_success: 0.22, key_passes: 0.20, shot_accuracy: 0.18,
    goals: 0.18, assists: 0.12, match_rating: 0.10,
  },
  RW: {
    dribble_success: 0.22, key_passes: 0.20, shot_accuracy: 0.18,
    goals: 0.18, assists: 0.12, match_rating: 0.10,
  },
  ST: {
    goals: 0.30, shot_accuracy: 0.22, duels_won_pct: 0.15,
    assists: 0.13, key_passes: 0.10, match_rating: 0.10,
  },
  SS: {
    goals: 0.25, assists: 0.22, key_passes: 0.20,
    dribble_success: 0.15, shot_accuracy: 0.10, match_rating: 0.08,
  },
};

export function calculatePlayerIndex(stat: MatchStat): number {
  const pos = stat.position;
  const weights = POSITION_WEIGHTS[pos] ?? POSITION_WEIGHTS.CM;

  // Normalise raw metrics to 0-100
  const metrics: Record<string, number> = {
    goals: Math.min(stat.goals * 25, 100),
    assists: Math.min(stat.assists * 20, 100),
    shot_accuracy: stat.shots > 0
      ? (stat.shots_on_target / stat.shots) * 100 : 50,
    key_passes: Math.min(stat.key_passes * 12, 100),
    pass_accuracy: stat.pass_accuracy,
    dribble_success: stat.dribbles_attempted > 0
      ? (stat.dribbles_completed / stat.dribbles_attempted) * 100 : 60,
    duels_won_pct: stat.duels_total > 0
      ? (stat.duels_won / stat.duels_total) * 100 : 50,
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
    const value = metrics[key] ?? 0;
    score += value * weight;
    totalWeight += weight;
  }

  const raw = totalWeight > 0 ? score / totalWeight : 50;
  // Minutes penalty (scale down if < 60 min)
  const minFactor = stat.minutes_played >= 90 ? 1 : stat.minutes_played >= 60 ? 0.95 : 0.85;
  return Math.round(Math.min(Math.max(raw * minFactor, 10), 100));
}

export function calculateSeasonIndex(stats: MatchStat[]): number {
  if (!stats.length) return 0;
  const indices = stats.map((s) => s.player_index ?? calculatePlayerIndex(s));
  return Math.round(indices.reduce((a, b) => a + b, 0) / indices.length);
}

export function getIndexLabel(index: number): { label: string; color: string } {
  if (index >= 85) return { label: "Elite", color: "#f59e0b" };
  if (index >= 75) return { label: "Uitstekend", color: "#10B981" };
  if (index >= 65) return { label: "Goed", color: "#4FA9E6" };
  if (index >= 55) return { label: "Gemiddeld", color: "#8b5cf6" };
  if (index >= 45) return { label: "Matig", color: "#f97316" };
  return { label: "Laag", color: "#ef4444" };
}

// ============================================================
// MOCK DATA
// ============================================================

// Compact helper — fouls defaults to 0
function makeMatch(
  id: string, player_id: string, player_name: string, position: PositionType,
  date: string, opponent: string, competition: string, home_away: "home" | "away",
  result: string, min: number, goals: number, assists: number,
  shots: number, sot: number, passes: number, pass_acc: number,
  kp: number, da: number, dc: number,
  dw: number, dt: number, adw: number, adt: number,
  tackles: number, int_: number, yc: number, rc: number,
  rating: number, notes?: string,
): MatchStat {
  const stat: MatchStat = {
    id, player_id, player_name, position,
    coach_id: "00000000-0000-0000-0000-000000000002",
    match_date: date, opponent, competition, home_away, result,
    minutes_played: min, goals, assists, shots,
    shots_on_target: sot, passes, pass_accuracy: pass_acc,
    key_passes: kp, dribbles_attempted: da, dribbles_completed: dc,
    duels_won: dw, duels_total: dt,
    aerial_duels_won: adw, aerial_duels_total: adt,
    tackles, interceptions: int_, yellow_cards: yc, red_cards: rc,
    fouls_committed: 0, match_rating: rating, notes,
  };
  stat.player_index = calculatePlayerIndex(stat);
  return stat;
}

export const MOCK_MATCH_STATS: MatchStat[] = [
  // ── Lars van der Berg (ST) ─────────────────────────────
  makeMatch("m001","p0000001","Lars van der Berg","ST","2025-01-18","Gouda FC","KNVB U17","home","3-1",90,2,1,5,4,22,72,2,4,3,7,10,2,3,1,0,0,1,8.5,"Twee doelpunten en een assist. Uitstekende dag."),
  makeMatch("m002","p0000001","Lars van der Berg","ST","2025-01-11","Rijnmond Jeugd","Competitie","away","0-2",90,0,0,3,1,18,65,1,3,1,5,9,1,2,0,1,0,2,5.5,"Moeilijke wedstrijd. Weinig balbezit."),
  makeMatch("m003","p0000001","Lars van der Berg","ST","2025-01-04","FC Dordrecht U17","Competitie","home","2-0",90,1,0,4,3,24,70,2,5,4,8,11,3,4,0,0,1,1,7.8),
  makeMatch("m004","p0000001","Lars van der Berg","ST","2024-12-21","Rotterdam U17","Competitie","away","1-1",85,1,1,4,3,20,68,3,4,3,6,10,2,3,0,0,0,2,7.2),
  makeMatch("m005","p0000001","Lars van der Berg","ST","2024-12-14","Ajax U17","Cup","home","1-3",90,1,0,6,3,19,64,1,6,4,7,12,3,5,1,0,0,3,6.5,"Goed gescoord maar Ajax was te sterk."),
  makeMatch("m006","p0000001","Lars van der Berg","ST","2024-12-07","PSV U17","Competitie","away","0-1",70,0,0,2,1,15,62,0,3,2,5,9,1,3,1,0,1,2,5.8),
  makeMatch("m007","p0000001","Lars van der Berg","ST","2024-11-30","Feyenoord U17","Competitie","home","2-2",90,1,2,5,4,21,71,3,4,3,7,10,2,3,0,0,0,1,7.6,"Twee assists. Goede samenwerking met middenvelders."),
  makeMatch("m008","p0000001","Lars van der Berg","ST","2024-11-23","Den Haag U17","Competitie","away","4-0",90,3,1,7,6,26,74,4,5,4,8,12,2,4,0,0,0,1,9.1,"Hat-trick! Beste wedstrijd van het seizoen."),

  // ── Jaylen Martens (CM) ────────────────────────────────
  makeMatch("m009","p0000002","Jaylen Martens","CM","2025-01-18","Gouda FC","KNVB U17","home","3-1",90,0,2,2,1,58,88,5,3,2,10,15,3,5,2,0,0,1,8.2,"Domineerde het middenveld. 2 assists."),
  makeMatch("m010","p0000002","Jaylen Martens","CM","2025-01-11","Rijnmond Jeugd","Competitie","away","0-2",90,0,0,1,0,45,82,2,2,1,7,12,2,4,1,1,0,2,5.2),
  makeMatch("m011","p0000002","Jaylen Martens","CM","2025-01-04","FC Dordrecht U17","Competitie","home","2-0",90,1,1,3,2,62,90,6,4,3,11,14,2,3,0,0,0,1,8.8,"Schitterende pass range vandaag."),
  makeMatch("m012","p0000002","Jaylen Martens","CM","2024-12-21","Rotterdam U17","Competitie","away","1-1",90,0,1,1,1,55,85,4,2,2,8,13,1,3,1,0,0,2,7.1),
  makeMatch("m013","p0000002","Jaylen Martens","CM","2024-12-14","Ajax U17","Cup","home","1-3",90,0,0,2,0,48,80,3,3,2,6,11,2,4,1,1,1,3,6.0),
  makeMatch("m014","p0000002","Jaylen Martens","CM","2024-12-07","PSV U17","Competitie","away","0-1",90,0,0,1,0,42,78,2,1,1,5,10,0,2,2,0,1,2,5.5),
  makeMatch("m015","p0000002","Jaylen Martens","CM","2024-11-30","Feyenoord U17","Competitie","home","2-2",90,1,0,3,2,60,87,5,3,3,9,14,1,3,0,0,0,1,7.8),
  makeMatch("m016","p0000002","Jaylen Martens","CM","2024-11-23","Den Haag U17","Competitie","away","4-0",90,0,2,2,1,65,91,7,4,3,12,15,2,4,0,0,0,0,8.5,"Beste passgame van het seizoen."),

  // ── Noah Fernandez (CAM) ───────────────────────────────
  makeMatch("m017","p0000006","Noah Fernandez","CAM","2025-01-18","Gouda FC","KNVB U17","home","3-1",90,1,2,4,3,48,85,7,6,5,8,12,1,2,1,0,0,1,9.2,"Absolute klasse. Tiki-taka op zijn best."),
  makeMatch("m018","p0000006","Noah Fernandez","CAM","2025-01-11","Rijnmond Jeugd","Competitie","away","0-2",90,0,0,3,1,40,80,4,4,2,5,10,1,2,1,1,0,3,5.5),
  makeMatch("m019","p0000006","Noah Fernandez","CAM","2025-01-04","FC Dordrecht U17","Competitie","home","2-0",90,2,1,5,4,52,87,8,7,6,9,13,0,1,0,0,0,0,8.9,"Twee doelpunten en creativiteit op topniveau."),
  makeMatch("m020","p0000006","Noah Fernandez","CAM","2024-12-21","Rotterdam U17","Competitie","away","1-1",90,0,1,3,2,46,83,6,5,4,7,11,1,2,0,0,0,1,7.4),
  makeMatch("m021","p0000006","Noah Fernandez","CAM","2024-12-14","Ajax U17","Cup","home","1-3",90,1,0,5,3,44,81,5,5,4,6,11,0,1,0,0,1,2,7.0,"Scoorde maar ploeg verloor."),
  makeMatch("m022","p0000006","Noah Fernandez","CAM","2024-12-07","PSV U17","Competitie","away","0-1",80,0,0,2,1,38,79,3,4,2,5,9,0,1,0,0,0,2,6.2),
  makeMatch("m023","p0000006","Noah Fernandez","CAM","2024-11-30","Feyenoord U17","Competitie","home","2-2",90,1,1,4,3,50,86,7,6,5,8,12,1,2,0,0,0,1,8.3),
  makeMatch("m024","p0000006","Noah Fernandez","CAM","2024-11-23","Den Haag U17","Competitie","away","4-0",90,2,3,6,5,55,89,9,7,6,10,13,1,2,0,0,0,0,9.5,"Man of the Match. 5 directe bijdragen."),
];

// Get stats for a specific player
export function getPlayerMatchStats(playerId: string): MatchStat[] {
  return MOCK_MATCH_STATS.filter((s) => s.player_id === playerId)
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());
}

// Get all unique players from stats
export function getPlayersFromStats(): { id: string; name: string; position: PositionType }[] {
  const seen = new Set<string>();
  const result: { id: string; name: string; position: PositionType }[] = [];
  for (const s of MOCK_MATCH_STATS) {
    if (!seen.has(s.player_id)) {
      seen.add(s.player_id);
      result.push({ id: s.player_id, name: s.player_name, position: s.position });
    }
  }
  return result;
}

// Season aggregates
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
