import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/notify-player
 * Body: { playerId, subject, message, href?, type?, notify? }
 *
 * Sends the player an e-mail (to their own registered address) and — unless
 * notify=false — creates an in-app notification. Coach/admin only. Runs under
 * the caller's own session (same RLS the evaluation flow already relies on), so
 * only RESEND_API_KEY is required.
 */
type NotifType = "evaluation" | "plan_update" | "chat_message" | "reminder";

export async function POST(req: Request) {
  let payload: { playerId?: string; subject?: string; message?: string; href?: string; type?: NotifType; notify?: boolean };
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const { playerId, subject, message, href, type = "reminder", notify = true } = payload;
  if (!playerId || !subject || !message) {
    return NextResponse.json({ error: "playerId, subject en message zijn verplicht" }, { status: 400 });
  }

  const supa = createClient();

  // 1. Auth — caller must be a coach or admin
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const { data: me } = await supa.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!me || !["coach", "admin"].includes(me.role)) {
    return NextResponse.json({ error: "Alleen coaches mogen dit" }, { status: 403 });
  }

  // 2. Look up the player + their e-mail
  const { data: player } = await supa.from("players").select("id, first_name, profile_id").eq("id", playerId).single();
  if (!player) return NextResponse.json({ error: "Speler niet gevonden" }, { status: 404 });

  let email: string | null = null;
  let playerName = player.first_name ?? "";
  if (player.profile_id) {
    const { data: pprof } = await supa.from("profiles").select("email, full_name").eq("id", player.profile_id).maybeSingle();
    email = pprof?.email ?? null;
    playerName = pprof?.full_name ?? playerName;
  }

  // 3. In-app notification (unless the caller already made one)
  if (notify) {
    await supa.from("notifications").insert({
      player_id: playerId, type, title: subject, body: message, href: href ?? "/dashboard/player",
    });
  }

  // 4. E-mail via Resend (best-effort)
  let emailed = false;
  let emailError: string | null = null;
  const resendKey = process.env.RESEND_API_KEY;
  const fromUsed = process.env.NOTIFY_FROM || "Schoonhoven FA <noreply@schoonhovenfootballacademy.com>";
  if (!email) emailError = "geen e-mailadres bij deze speler";
  else if (!resendKey) emailError = "RESEND_API_KEY ontbreekt";
  else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromUsed,
          to: [email],
          subject,
          html: emailHtml({ playerName, subject, message, coachName: me.full_name ?? "Je coach", href }),
        }),
      });
      emailed = res.ok;
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        emailError = `Resend ${res.status}: ${detail.slice(0, 300)}`;
      }
    } catch (e) {
      emailError = e instanceof Error ? e.message : "onbekende fout";
    }
  }

  return NextResponse.json({ ok: true, notified: notify, emailed, emailError, fromUsed });
}

function emailHtml({ playerName, subject, message, coachName, href }: {
  playerName: string; subject: string; message: string; coachName: string; href?: string;
}): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://performance-hub-mu.vercel.app";
  const link = `${base}${href ?? "/dashboard/player"}`;
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
