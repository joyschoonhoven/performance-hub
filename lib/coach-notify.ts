"use client";

/**
 * Send a player an update: e-mail (to their own address) + in-app notification.
 * Backed by /api/notify-player (server-side, Resend). Coach/admin only.
 */
export type CoachUpdateType = "evaluation" | "plan_update" | "chat_message" | "reminder";

export async function sendCoachUpdate(input: {
  playerId: string;
  subject: string;
  message: string;
  href?: string;
  type?: CoachUpdateType;
  /** false = only send the e-mail (caller already made the in-app notification) */
  notify?: boolean;
}): Promise<{ ok: boolean; emailed?: boolean; emailError?: string | null; error?: string }> {
  try {
    const res = await fetch("/api/notify-player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    return { ok: true, emailed: data.emailed, emailError: data.emailError };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "netwerkfout" };
  }
}
