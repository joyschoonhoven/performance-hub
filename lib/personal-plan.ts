"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

// Personal plan storage.
// Primary backend: Supabase `plan_agreements` table (cross-device, realtime).
// Fallback for demo/unauthenticated use: localStorage (per-browser).

export type PlanCategory = "technical" | "tactical" | "mental";
export type PlanStatus = "open" | "in_progress" | "completed" | "missed";
export type PlanAuthor = "coach" | "player";

export interface PlanAgreement {
  id: string;
  player_id: string;
  category: PlanCategory;
  title: string;
  description?: string | null;
  deadline?: string | null;
  status: PlanStatus;
  created_by: PlanAuthor;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  streak?: number;
  xp?: number;
  recurring?: "daily" | "weekly" | "match" | null;
}

export const CATEGORY_META: Record<PlanCategory, {
  id: PlanCategory;
  label: string;
  description: string;
  color: string;
  accent: string;
  icon: string;
  zone: "defense" | "midfield" | "attack";
  zoneLabel: string;
}> = {
  mental: {
    id: "mental",
    label: "Mentaal",
    description: "Mentale afspraken, gedrag, focus",
    color: "#D64045",
    accent: "rgba(214,64,69,0.18)",
    icon: "🧠",
    zone: "defense",
    zoneLabel: "Verdediging",
  },
  technical: {
    id: "technical",
    label: "Voetbalinhoudelijk",
    description: "Techniek, fysiek, individuele kwaliteiten",
    color: "#4DAEE5",
    accent: "rgba(77,174,229,0.18)",
    icon: "⚽",
    zone: "midfield",
    zoneLabel: "Middenveld",
  },
  tactical: {
    id: "tactical",
    label: "Tactisch",
    description: "Positiespel, teamafspraken, beslissingen",
    color: "#F0A500",
    accent: "rgba(240,165,0,0.18)",
    icon: "🎯",
    zone: "attack",
    zoneLabel: "Aanval",
  },
};

// ── localStorage fallback ────────────────────────────────────────────
const STORAGE_PREFIX = "sfa.plan.v1.";
const BROADCAST_EVENT = "sfa:plan-changed";

function lsKey(playerId: string) { return `${STORAGE_PREFIX}${playerId}`; }

function lsRead(playerId: string): PlanAgreement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(lsKey(playerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlanAgreement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function lsWrite(playerId: string, items: PlanAgreement[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(lsKey(playerId), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: { playerId } }));
  } catch { /* ignore */ }
}

// ── Public API (all async) ───────────────────────────────────────────

export async function listAgreements(playerId: string): Promise<PlanAgreement[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("plan_agreements")
        .select("*")
        .eq("player_id", playerId)
        .order("updated_at", { ascending: false });
      if (data) return data as PlanAgreement[];
    } catch { /* fall through */ }
  }
  return lsRead(playerId).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export async function getAgreement(playerId: string, id: string): Promise<PlanAgreement | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("plan_agreements")
        .select("*")
        .eq("id", id)
        .eq("player_id", playerId)
        .maybeSingle();
      if (data) return data as PlanAgreement;
    } catch { /* fall through */ }
  }
  return lsRead(playerId).find((a) => a.id === id) ?? null;
}

export interface AgreementInput {
  category: PlanCategory;
  title: string;
  description?: string;
  deadline?: string;
  created_by: PlanAuthor;
  created_by_name?: string;
  recurring?: PlanAgreement["recurring"];
  xp?: number;
}

export async function addAgreement(playerId: string, input: AgreementInput): Promise<PlanAgreement | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("plan_agreements")
        .insert({
          player_id: playerId,
          category: input.category,
          title: input.title,
          description: input.description ?? null,
          deadline: input.deadline ?? null,
          status: "open",
          created_by: input.created_by,
          created_by_name: input.created_by_name ?? null,
          recurring: input.recurring ?? null,
          streak: 0,
          xp: input.xp ?? 100,
        })
        .select()
        .single();
      if (!error && data) return data as PlanAgreement;
    } catch { /* fall through */ }
  }

  const now = new Date().toISOString();
  const agreement: PlanAgreement = {
    id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    player_id: playerId,
    status: "open",
    streak: 0,
    xp: input.xp ?? 100,
    created_at: now,
    updated_at: now,
    recurring: input.recurring ?? null,
    ...input,
  };
  const items = lsRead(playerId);
  items.unshift(agreement);
  lsWrite(playerId, items.slice(0, 200));
  return agreement;
}

export async function updateAgreement(playerId: string, id: string, patch: Partial<PlanAgreement>): Promise<PlanAgreement | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("plan_agreements")
        .update(patch)
        .eq("id", id)
        .eq("player_id", playerId)
        .select()
        .single();
      if (!error && data) return data as PlanAgreement;
    } catch { /* fall through */ }
  }

  const items = lsRead(playerId);
  let updated: PlanAgreement | null = null;
  const next = items.map((a) => {
    if (a.id !== id) return a;
    updated = { ...a, ...patch, updated_at: new Date().toISOString() };
    return updated;
  });
  if (updated) lsWrite(playerId, next);
  return updated;
}

export async function setStatus(playerId: string, id: string, status: PlanStatus): Promise<PlanAgreement | null> {
  const patch: Partial<PlanAgreement> = { status };
  if (status === "completed") {
    patch.completed_at = new Date().toISOString();
    const existing = await getAgreement(playerId, id);
    if (existing) patch.streak = (existing.streak ?? 0) + 1;
  }
  return updateAgreement(playerId, id, patch);
}

export async function removeAgreement(playerId: string, id: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from("plan_agreements").delete().eq("id", id).eq("player_id", playerId);
      return;
    } catch { /* fall through */ }
  }
  const items = lsRead(playerId).filter((a) => a.id !== id);
  lsWrite(playerId, items);
}

// Subscribe to changes (Supabase realtime when available + localStorage events).
export function subscribe(playerId: string, listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let cleanupSupabase: (() => void) | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`plan_agreements:${playerId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "plan_agreements", filter: `player_id=eq.${playerId}` },
          () => listener(),
        )
        .subscribe();
      cleanupSupabase = () => { supabase.removeChannel(channel); };
    } catch { /* fall back */ }
  }

  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as { playerId?: string } | undefined;
    if (!detail?.playerId || detail.playerId === playerId) listener();
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key && e.key === lsKey(playerId)) listener();
  };
  window.addEventListener(BROADCAST_EVENT, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    cleanupSupabase?.();
    window.removeEventListener(BROADCAST_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

// Aggregated stats — computed from a snapshot the caller already has, so
// stats stay synchronous and we don't need a second round-trip.
export interface PlanStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  missed: number;
  xpEarned: number;
  completionRate: number;
  byCategory: Record<PlanCategory, { total: number; completed: number }>;
}

export function computeStats(items: PlanAgreement[]): PlanStats {
  const byCategory = {
    mental: { total: 0, completed: 0 },
    technical: { total: 0, completed: 0 },
    tactical: { total: 0, completed: 0 },
  } as PlanStats["byCategory"];
  let xpEarned = 0;
  let open = 0, inProgress = 0, completed = 0, missed = 0;

  items.forEach((a) => {
    byCategory[a.category].total += 1;
    if (a.status === "completed") {
      byCategory[a.category].completed += 1;
      completed += 1;
      xpEarned += a.xp ?? 0;
    } else if (a.status === "in_progress") inProgress += 1;
    else if (a.status === "missed") missed += 1;
    else open += 1;
  });

  const total = items.length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, open, inProgress, completed, missed, xpEarned, completionRate, byCategory };
}
