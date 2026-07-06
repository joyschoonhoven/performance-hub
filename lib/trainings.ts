// ============================================================
//  TRAININGS — upcoming sessions with dual goals (coach + player)
//  Supabase-backed (table: player_trainings) with a localStorage
//  fallback so it works immediately in demo/local mode.
// ============================================================

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type TrainingType = "team" | "individueel" | "keeper" | "wedstrijd" | "herstel" | "test";

export interface Training {
  id: string;
  player_id: string;
  date: string;                 // YYYY-MM-DD
  type: TrainingType;
  title?: string | null;        // optional label, e.g. "Techniek onder druk"
  coach_goal?: string | null;   // trainingsdoel vanuit de trainer
  player_goal?: string | null;  // trainingsdoel vanuit de speler
  created_at: string;
  updated_at: string;
}

export interface TrainingInput {
  date: string;
  type: TrainingType;
  title?: string;
  coach_goal?: string;
  player_goal?: string;
}

export const TRAINING_META: Record<TrainingType, { label: string; short: string; color: string; icon: string }> = {
  team:        { label: "Teamtraining",   short: "Team",   color: "#4DAEE5", icon: "⚽" },
  individueel: { label: "Individueel",    short: "Indiv.", color: "#2EC4A8", icon: "🎯" },
  keeper:      { label: "Keeperstraining",short: "Keeper", color: "#9B72FF", icon: "🧤" },
  wedstrijd:   { label: "Wedstrijd",      short: "Match",  color: "#F0A500", icon: "🏆" },
  herstel:     { label: "Herstel",        short: "Rust",   color: "#33C481", icon: "🌿" },
  test:        { label: "Test / Selectie",short: "Test",   color: "#F05060", icon: "🔬" },
};

const LS_KEY = (playerId: string) => `sfa_trainings_${playerId}`;

/* ── localStorage helpers ── */
function lsRead(playerId: string): Training[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY(playerId));
    return raw ? (JSON.parse(raw) as Training[]) : [];
  } catch { return []; }
}
function lsWrite(playerId: string, rows: Training[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LS_KEY(playerId), JSON.stringify(rows)); } catch { /* ignore */ }
}

/* ── CRUD ── */
export async function listTrainings(playerId: string): Promise<Training[]> {
  const local = lsRead(playerId);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("player_trainings")
        .select("*")
        .eq("player_id", playerId)
        .order("date", { ascending: true });
      if (!error && data) {
        // Merge DB rows with any that only reached localStorage (e.g. a write
        // that failed RLS) so a booked training never silently disappears.
        const merged = new Map<string, Training>();
        for (const t of local) merged.set(t.id, t);
        for (const t of data as Training[]) merged.set(t.id, t);
        return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
      }
    } catch { /* fall through */ }
  }
  return local.sort((a, b) => a.date.localeCompare(b.date));
}

export async function addTraining(playerId: string, input: TrainingInput): Promise<Training | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("player_trainings")
        .insert({
          player_id: playerId,
          date: input.date,
          type: input.type,
          title: input.title ?? null,
          coach_goal: input.coach_goal ?? null,
          player_goal: input.player_goal ?? null,
        })
        .select()
        .single();
      if (!error && data) return data as Training;
    } catch { /* fall through */ }
  }
  const now = new Date().toISOString();
  const row: Training = {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    player_id: playerId,
    date: input.date,
    type: input.type,
    title: input.title ?? null,
    coach_goal: input.coach_goal ?? null,
    player_goal: input.player_goal ?? null,
    created_at: now,
    updated_at: now,
  };
  const next = [...lsRead(playerId), row];
  lsWrite(playerId, next);
  return row;
}

export async function updateTraining(playerId: string, id: string, patch: Partial<Training>): Promise<Training | null> {
  const clean = { ...patch, updated_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("player_trainings")
        .update(clean)
        .eq("id", id)
        .eq("player_id", playerId)
        .select()
        .single();
      if (!error && data) return data as Training;
    } catch { /* fall through */ }
  }
  let updated: Training | null = null;
  const next = lsRead(playerId).map((t) => {
    if (t.id !== id) return t;
    updated = { ...t, ...clean } as Training;
    return updated;
  });
  if (updated) lsWrite(playerId, next);
  return updated;
}

export async function removeTraining(playerId: string, id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from("player_trainings").delete().eq("id", id).eq("player_id", playerId);
    } catch { /* fall through */ }
  }
  lsWrite(playerId, lsRead(playerId).filter((t) => t.id !== id));
}

/* today's date as YYYY-MM-DD (local) */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
