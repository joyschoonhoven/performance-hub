import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * POST /api/notify-player
 * Body: { playerId, subject, message, href?, type? }
 *
 * Sends the player an e-mail (to their own registered address) AND creates an
 * in-app notification. Only callable by an authenticated coach/admin.
 *
 * Requires env:
 *   SUPABASE_SERVICE_ROLE_KEY   (server-only, for cross-user reads/writes)
 *   RESEND_API_KEY              (e-mail sending)
 *   NOTIFY_FROM                 (optional, e.g. "Schoonhoven FA <coach@jouwdomein.nl>")
 */
type NotifType = "evaluation" | "plan_update" | "chat_message" | "reminder";

export async function POST(req: Request) {
  let payload: { playerId?: string; subject?: string; message?: string; href?: string; type?: NotifType };
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const { playerId, subject, message, href, type = "reminder" } = payload;
  if (!playerId || !subject || !message) {
    return NextResponse.json({ error: "playerId, subject en message zijn verplicht" }, { status: 400 });
  }

  // 1. Auth — caller must be a coach or admin
  const supa = createServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const { data: me } = await supa.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!me || !["coach", "admin"].includes(me.role)) {
    return NextResponse.json({ error: "Alleen coaches mogen dit" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Server niet geconfigureerd (SUPABASE_SERVICE_ROLE_KEY ontbreekt)" }, { status: 500 });
  }
  const admin = createAdminClient(url, serviceKey, { auth: { persistSession: false } });

  // 2. Look up player + their e-mail address
  const { data: player } = await admin.from("players").select("id, first_name, profile_id").eq("id", playerId).single();
  if (!player) return NextResponse.json({ error: "Speler niet gevonden" }, { status: 404 });

  let email: string | null = null;
  let playerName = player.first_name ?? "";
  if (player.profile_id) {
    const { data: pprof } = await admin.from("profiles").select("email, full_name").eq("id", player.profile_id).single();
    email = pprof?.email ?? null;
    playerName = pprof?.full_name ?? playerName;
  }

  // 3. In-app notification (always)
  await admin.from("notifications").insert({
    player_id: playerId, type, title: subject, body: message, href: href ?? "/dashboard/player",
  });

  // 4. E-mail via Resend (best-effort)
  let emailed = false;
  let emailError: string | null = null;
  const resendKey = process.env.RESEND_API_KEY;
  if (!email) {
    emailError = "geen e-mailadres bij deze speler";
  } else if (!resendKey) {
    emailError = "RESEND_API_KEY ontbreekt";
  } else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.NOTIFY_FROM || "Schoonhoven FA <onboarding@resend.dev>",
          to: [email],
          subject,
          html: emailHtml({ playerName, subject, message, coachName: me.full_name ?? "Je coach", href }),
        }),
      });
      emailed = res.ok;
      if (!res.ok) emailError = `Resend ${res.status}`;
    } catch (e) {
      emailError = e instanceof Error ? e.message : "onbekende fout";
    }
  }

  return NextResponse.json({ ok: true, notified: true, emailed, emailError });
}

function emailHtml({ playerName, subject, message, coachName, href }: {
  playerName: string; subject: string; message: string; coachName: string; href?: string;
}): string {
  const link = `https://performance-hub.vercel.app${href ?? "/dashboard/player"}`;
  return `<!doctype html><html><body style="margin:0;background:#F4F7FA;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:28px 20px;">
      <div style="height:4px;width:40px;background:#1B6CA8;border-radius:2px;margin-bottom:14px;"></div>
      <div style="font-size:13px;font-weight:bold;letter-spacing:2px;color:#0D1B2A;">SCHOONHOVEN</div>
      <div style="font-size:8px;letter-spacing:4px;color:#1B6CA8;margin-bottom:22px;">FOOTBALL ACADEMY</div>
      <div style="background:#fff;border:1px solid rgba(13,27,42,0.08);border-radius:14px;padding:24px;">
        <div style="font-size:12px;color:#5A6B80;margin-bottom:4px;">Hoi ${escapeHtml(playerName)},</div>
        <h1 style="font-size:19px;color:#0D1B2A;margin:0 0 12px;">${escapeHtml(subject)}</h1>
        <p style="font-size:14px;line-height:1.6;color:#334155;white-space:pre-wrap;margin:0 0 20px;">${escapeHtml(message)}</p>
        <a href="${link}" style="display:inline-block;background:#1B6CA8;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 22px;border-radius:10px;">Bekijk in je dashboard</a>
        <div style="font-size:12px;color:#94A3B8;margin-top:18px;">— ${escapeHtml(coachName)}</div>
      </div>
      <div style="font-size:11px;color:#94A3B8;text-align:center;margin-top:16px;">Schoonhoven Football Academy · Performance Hub</div>
    </div></body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
