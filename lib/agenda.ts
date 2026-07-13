// ============================================================
//  AGENDA — beschikbaarheid van de trainer (tijdslots) en
//  boekingen door spelers. Supabase-backed (coach_slots,
//  slot_bookings), zie supabase/migration-agenda.sql.
// ============================================================

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface SlotBooking {
  id: string;
  slot_id: string;
  player_id: string;
  player_name?: string;
  created_at: string;
}

export interface CoachSlot {
  id: string;
  coach_id: string;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:MM(:SS)
  end_time: string;
  capacity: number;
  note?: string | null;
  created_at: string;
  bookings: SlotBooking[];
}

export interface SlotInput {
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  note?: string;
}

/** Alle slots vanaf een datum, inclusief boekingen + spelersnamen. */
export async function listSlots(fromDate: string): Promise<CoachSlot[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createClient();
    const { data: slots, error } = await supabase
      .from("coach_slots")
      .select("*")
      .gte("date", fromDate)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error || !slots) return [];

    const ids = slots.map((s) => s.id);
    let bookings: (SlotBooking & { players?: { first_name: string; last_name: string } | null })[] = [];
    if (ids.length) {
      const { data } = await supabase
        .from("slot_bookings")
        .select("*, players(first_name, last_name)")
        .in("slot_id", ids);
      bookings = (data ?? []) as typeof bookings;
    }

    return slots.map((s) => ({
      ...s,
      bookings: bookings
        .filter((b) => b.slot_id === s.id)
        .map((b) => ({
          id: b.id, slot_id: b.slot_id, player_id: b.player_id, created_at: b.created_at,
          player_name: b.players ? `${b.players.first_name} ${b.players.last_name}` : undefined,
        })),
    })) as CoachSlot[];
  } catch { return []; }
}

export async function createSlot(input: SlotInput): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Geen databaseverbinding" };
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Niet ingelogd" };
    const { error } = await supabase.from("coach_slots").insert({
      coach_id: user.id,
      date: input.date,
      start_time: input.start_time,
      end_time: input.end_time,
      capacity: input.capacity,
      note: input.note ?? null,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Onbekende fout" };
  }
}

export async function deleteSlot(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await createClient().from("coach_slots").delete().eq("id", id);
    return !error;
  } catch { return false; }
}

export async function bookSlot(slotId: string, playerId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Geen databaseverbinding" };
  try {
    const { error } = await createClient().from("slot_bookings").insert({ slot_id: slotId, player_id: playerId });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Je staat al ingeschreven voor dit moment" };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Onbekende fout" };
  }
}

export async function cancelBooking(slotId: string, playerId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await createClient()
      .from("slot_bookings").delete()
      .eq("slot_id", slotId).eq("player_id", playerId);
    return !error;
  } catch { return false; }
}

/** Alle geplande trainingen van alle spelers (coach-overzicht). */
export interface TeamTraining {
  id: string;
  player_id: string;
  player_name?: string;
  date: string;
  type: string;
  title?: string | null;
  coach_goal?: string | null;
  player_goal?: string | null;
}

export async function listAllTrainings(fromDate: string): Promise<TeamTraining[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await createClient()
      .from("player_trainings")
      .select("id, player_id, date, type, title, coach_goal, player_goal, players(first_name, last_name)")
      .gte("date", fromDate)
      .order("date", { ascending: true });
    return (data ?? []).map((t) => {
      const p = t.players as unknown as { first_name: string; last_name: string } | null;
      return {
        id: t.id, player_id: t.player_id, date: t.date, type: t.type,
        title: t.title, coach_goal: t.coach_goal, player_goal: t.player_goal,
        player_name: p ? `${p.first_name} ${p.last_name}` : undefined,
      };
    });
  } catch { return []; }
}

/* HH:MM:SS → HH:MM */
export function fmtTime(t: string): string {
  return t.slice(0, 5);
}
