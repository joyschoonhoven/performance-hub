"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

// In-app notification store.
// Primary backend: Supabase `notifications` table (cross-device, realtime).
// Fallback for demo/unauthenticated use: localStorage (per-browser).

export type NotificationType =
  | "evaluation"
  | "plan_update"
  | "chat_message"
  | "reminder";

export interface AppNotification {
  id: string;
  player_id: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  meta?: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

// ── localStorage fallback ────────────────────────────────────────────
const STORAGE_PREFIX = "sfa.notifications.v1.";
const BROADCAST_EVENT = "sfa:notifications-changed";

function lsKey(playerId: string) { return `${STORAGE_PREFIX}${playerId}`; }

function lsRead(playerId: string): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(lsKey(playerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function lsWrite(playerId: string, items: AppNotification[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(lsKey(playerId), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: { playerId } }));
  } catch { /* ignore */ }
}

// ── Public API (all async) ───────────────────────────────────────────

export async function listNotifications(playerId: string): Promise<AppNotification[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("player_id", playerId)
        .order("created_at", { ascending: false });
      if (data) return data as AppNotification[];
    } catch { /* fall through */ }
  }
  return lsRead(playerId).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function unreadCount(playerId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("player_id", playerId)
        .eq("read", false);
      if (typeof count === "number") return count;
    } catch { /* fall through */ }
  }
  return lsRead(playerId).filter((n) => !n.read).length;
}

export async function addNotification(
  input: Omit<AppNotification, "id" | "created_at" | "read"> & { read?: boolean },
): Promise<AppNotification | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          player_id: input.player_id,
          type: input.type,
          title: input.title,
          body: input.body,
          href: input.href ?? null,
          meta: input.meta ?? {},
          read: input.read ?? false,
        })
        .select()
        .single();
      if (!error && data) return data as AppNotification;
    } catch { /* fall through */ }
  }

  // localStorage fallback
  const notif: AppNotification = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    read: input.read ?? false,
    ...input,
  };
  const items = lsRead(input.player_id);
  items.unshift(notif);
  lsWrite(input.player_id, items.slice(0, 100));
  return notif;
}

export async function markRead(playerId: string, notificationId: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("player_id", playerId);
      return;
    } catch { /* fall through */ }
  }
  const items = lsRead(playerId).map((n) => n.id === notificationId ? { ...n, read: true } : n);
  lsWrite(playerId, items);
}

export async function markAllRead(playerId: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("player_id", playerId)
        .eq("read", false);
      return;
    } catch { /* fall through */ }
  }
  const items = lsRead(playerId).map((n) => ({ ...n, read: true }));
  lsWrite(playerId, items);
}

export async function removeNotification(playerId: string, notificationId: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("player_id", playerId);
      return;
    } catch { /* fall through */ }
  }
  const items = lsRead(playerId).filter((n) => n.id !== notificationId);
  lsWrite(playerId, items);
}

// Subscribe to changes (Supabase realtime when available, plus localStorage events).
// Returns an unsubscribe function.
export function subscribe(playerId: string, listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let cleanupSupabase: (() => void) | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`notifications:${playerId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `player_id=eq.${playerId}` },
          () => listener(),
        )
        .subscribe();
      cleanupSupabase = () => { supabase.removeChannel(channel); };
    } catch { /* fall back to localStorage events */ }
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
