import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/invite-mbti — coach/admin.
 * Stuurt alle actieve spelers zonder MBTI-type een in-app melding + e-mail
 * met het verzoek de persoonlijkheidstest in te vullen.
 */
const FROM = "Schoonhoven FA <noreply@schoonhovenfootballacademy.com>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://performance-hub-mu.vercel.app";

export async function POST() {
  const supa = createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const { data: me } = await supa.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!me || !["coach", "admin"].includes(me.role)) return NextResponse.json({ error: "Alleen coaches" }, { status: 403 });

  const { data: players } = await supa
    .from("players")
    .select("id, first_name, profile_id, mbti_type")
    .eq("is_active", true);

  const targets = (players ?? []).filter((p) => !p.mbti_type && p.profile_id);
  const resendKey = process.env.RESEND_API_KEY;
  let invited = 0, emailed = 0;

  for (const p of targets) {
    // in-app melding
    await supa.from("notifications").insert({
      player_id: p.id, type: "reminder",
      title: "Vul je persoonlijkheidstest in",
      body: "Ontdek je speler-type met de persoonlijkheidstest. Je type en tips verschijnen daarna op je dashboard.",
      href: "/dashboard/player/mbti",
    });
    invited++;

    // e-mail
    if (resendKey && p.profile_id) {
      const { data: prof } = await supa.from("profiles").select("email, full_name").eq("id", p.profile_id).maybeSingle();
      if (prof?.email) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: FROM, to: [prof.email],
              subject: "Vul je persoonlijkheidstest in ⚽",
              html: emailHtml(prof.full_name ?? p.first_name ?? "speler", me.full_name ?? "Je coach"),
            }),
          });
          if (res.ok) emailed++;
        } catch { /* best effort */ }
      }
    }
  }

  return NextResponse.json({ ok: true, invited, emailed, total: targets.length });
}

function emailHtml(name: string, coach: string): string {
  const link = `${SITE}/dashboard/player/mbti`;
  return `<!doctype html><html><body style="margin:0;background:#F4F7FA;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:28px 20px;">
      <div style="height:4px;width:40px;background:#1B6CA8;border-radius:2px;margin-bottom:14px;"></div>
      <div style="font-size:13px;font-weight:bold;letter-spacing:2px;color:#0D1B2A;">SCHOONHOVEN</div>
      <div style="font-size:8px;letter-spacing:4px;color:#1B6CA8;margin-bottom:22px;">FOOTBALL ACADEMY</div>
      <div style="background:#fff;border:1px solid rgba(13,27,42,0.08);border-radius:14px;padding:24px;">
        <div style="font-size:12px;color:#5A6B80;margin-bottom:4px;">Hoi ${escapeHtml(name)},</div>
        <h1 style="font-size:19px;color:#0D1B2A;margin:0 0 12px;">Ontdek je speler-type</h1>
        <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 16px;">Doe de persoonlijkheidstest (16 korte vragen). Je krijgt je type, je krachten en valkuilen — met per situatie op het veld een concrete tip.</p>
        <a href="${link}" style="display:inline-block;background:#1B6CA8;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 22px;border-radius:10px;">Start de test</a>
        <div style="font-size:12px;color:#94A3B8;margin-top:18px;">— ${escapeHtml(coach)}</div>
      </div>
    </div></body></html>`;
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
