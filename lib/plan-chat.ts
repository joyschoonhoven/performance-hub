"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type ChatAuthorRole = "coach" | "player";

export interface ChatMessage {
  id: string;
  player_id: string;
  agreement_id: string | null;
  author_id: string | null;
  author_role: ChatAuthorRole;
  author_name: string | null;
  body: string;
  created_at: string;
}

// ── localStorage fallback (per browser, demo only) ──────────────────
const STORAGE_PREFIX = "sfa.chat.v1.";
const BROADCAST_EVENT = "sfa:chat-changed";

function lsKey(playerId: string, agreementId: string | null) {
  return `${STORAGE_PREFIX}${playerId}::${agreementId ?? "general"}`;
}

function lsRead(playerId: string, agreementId: string | null): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(lsKey(playerId, agreementId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function lsWrite(playerId: string, agreementId: string | null, items: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(lsKey(playerId, agreementId), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: { playerId, agreementId } }));
  } catch { /* ignore */ }
}

// ── Public API ──────────────────────────────────────────────────────

export async function listMessages(
  playerId: string,
  agreementId: string | null,
): Promise<ChatMessage[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase
        .from("plan_messages")
        .select("*")
        .eq("player_id", playerId)
        .order("created_at", { ascending: true });

      query = agreementId
        ? query.eq("agreement_id", agreementId)
        : query.is("agreement_id", null);

      const { data } = await query;
      if (data) return data as ChatMessage[];
    } catch { /* fall through */ }
  }
  return lsRead(playerId, agreementId).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export interface SendMessageInput {
  playerId: string;
  agreementId: string | null;
  authorId: string | null;
  authorRole: ChatAuthorRole;
  authorName: string;
  body: string;
}

export async function sendMessage(input: SendMessageInput): Promise<ChatMessage | null> {
  const body = input.body.trim();
  if (!body) return null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("plan_messages")
        .insert({
          player_id: input.playerId,
          agreement_id: input.agreementId,
          author_id: input.authorId,
          author_role: input.authorRole,
          author_name: input.authorName,
          body,
        })
        .select()
        .single();
      if (!error && data) return data as ChatMessage;
    } catch { /* fall through */ }
  }

  const msg: ChatMessage = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    player_id: input.playerId,
    agreement_id: input.agreementId,
    author_id: input.authorId,
    author_role: input.authorRole,
    author_name: input.authorName,
    body,
    created_at: new Date().toISOString(),
  };
  const items = lsRead(input.playerId, input.agreementId);
  items.push(msg);
  lsWrite(input.playerId, input.agreementId, items.slice(-200));
  return msg;
}

export function subscribe(
  playerId: string,
  agreementId: string | null,
  listener: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  let cleanupSupabase: (() => void) | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`plan_messages:${playerId}:${agreementId ?? "general"}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "plan_messages",
            filter: `player_id=eq.${playerId}`,
          },
          (payload) => {
            const row = payload.new as ChatMessage;
            // Only refresh when the inserted row matches our thread filter.
            if ((row.agreement_id ?? null) === agreementId) listener();
          },
        )
        .subscribe();
      cleanupSupabase = () => { supabase.removeChannel(channel); };
    } catch { /* fall back */ }
  }

  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as { playerId?: string; agreementId?: string | null } | undefined;
    if (!detail) return;
    if (detail.playerId === playerId && (detail.agreementId ?? null) === agreementId) listener();
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key && e.key === lsKey(playerId, agreementId)) listener();
  };
  window.addEventListener(BROADCAST_EVENT, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    cleanupSupabase?.();
    window.removeEventListener(BROADCAST_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
