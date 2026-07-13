"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Plus, ArrowRight, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { getAllPlayers } from "@/lib/supabase/queries";
import { POSITION_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import type { PlayerWithDetails } from "@/lib/types";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

const ACCENT = "#5A90BA";

export default function CoachDashboardPage() {
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachName, setCoachName] = useState("");

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        setCoachName(profile?.full_name ?? "");
      }
      const data = await getAllPlayers();
      setPlayers(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Loader2 size={26} className="animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  // ── Kerncijfers ─────────────────────────────────────────────
  const now = Date.now();
  const monthMs = 30 * 24 * 60 * 60 * 1000;

  const allEvals = players.flatMap(p => (p.evaluations ?? []).map(ev => ({
    date: ev.evaluation_date,
    overall: ev.overall_score ?? 0,
  }))).filter(e => e.overall > 0);

  const evalsThisMonth = allEvals.filter(e => now - new Date(e.date).getTime() <= monthMs).length;
  const squadAvg = allEvals.length
    ? (allEvals.reduce((a, b) => a + b.overall, 0) / allEvals.length).toFixed(1)
    : "—";

  const trendOf = (p: PlayerWithDetails): "up" | "down" | "flat" => {
    const evs = p.evaluations ?? [];
    if (evs.length < 2) return "flat";
    const a = evs[0].overall_score ?? 0;
    const b = evs[1].overall_score ?? 0;
    return a > b ? "up" : a < b ? "down" : "flat";
  };
  const trendingUp = players.filter(p => trendOf(p) === "up").length;

  const needsAttention = players.filter(p => (p.evaluations?.length ?? 0) < 2).length;

  const series = [...allEvals]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12);

  const sorted = [...players].sort((a, b) => b.overall_rating - a.overall_rating);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1080, margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .cd-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .cd-split { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; }
        @media (max-width: 1023px) { .cd-split { grid-template-columns: 1fr; } }
        @media (max-width: 640px)  { .cd-kpis { grid-template-columns: repeat(2, 1fr); } }
        .cd-row { transition: background 0.15s; }
        .cd-row:hover { background: var(--surface-2); }
      ` }} />

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
            {coachName ? `Welkom, ${coachName.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
            {new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Link href="/dashboard/coach/evaluations/new" style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          height: 38, padding: "0 16px", borderRadius: 9,
          background: ACCENT, color: "#fff",
          fontSize: 13, fontWeight: 600, textDecoration: "none",
        }}>
          <Plus size={14} /> Nieuwe evaluatie
        </Link>
      </div>

      {/* ── Kerncijfers ── */}
      <div className="cd-kpis">
        <Kpi label="Spelers" value={String(players.length)} />
        <Kpi label="Evaluaties · 30 dagen" value={String(evalsThisMonth)} />
        <Kpi label="Teamgemiddelde" value={squadAvg} />
        <Kpi label="In ontwikkeling" value={String(trendingUp)} sub={`van ${players.length}`} />
      </div>

      {/* ── Verloop + aandachtspunten ── */}
      <div className="cd-split">
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Teamscore per evaluatie</h2>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Gemiddelde van de laatste {series.length} evaluaties</p>
            </div>
          </div>
          <TrendChart series={series} />
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>Aandachtspunten</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <AttentionRow
              value={needsAttention}
              label="spelers met minder dan 2 evaluaties"
              href="/dashboard/coach/players"
            />
            <AttentionRow
              value={players.filter(p => trendOf(p) === "down").length}
              label="spelers met dalende score"
              href="/dashboard/coach/players"
            />
            <AttentionRow
              value={players.filter(p => !p.mbti_type).length}
              label="spelers zonder persoonlijkheidsprofiel"
              href="/dashboard/coach/players"
            />
          </div>
          <Link href="/dashboard/coach/analytics" style={{
            marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)",
            fontSize: 12.5, fontWeight: 600, color: ACCENT, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            Volledige analyse <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Selectie ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Selectie</h2>
          <Link href="/dashboard/coach/players" style={{
            fontSize: 12.5, fontWeight: 600, color: ACCENT, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            Alle spelers <ArrowRight size={13} />
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
            Zodra spelers zich registreren, verschijnen ze hier.
          </div>
        ) : (
          sorted.slice(0, 6).map(p => {
            const trend = trendOf(p);
            const lastEval = p.evaluations?.[0]?.evaluation_date;
            return (
              <Link key={p.id} href={`/dashboard/coach/players/${p.id}`} className="cd-row" style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "11px 20px", borderBottom: "1px solid var(--border)",
                textDecoration: "none",
              }}>
                <PlayerAvatar
                  photoUrl={p.photo_url ?? p.avatar_url}
                  name={`${p.first_name} ${p.last_name}`}
                  position={p.position}
                  size="sm"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.first_name} {p.last_name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 }}>
                    {POSITION_LABELS[p.position]}
                  </div>
                </div>
                <div className="hidden sm:block" style={{ fontSize: 11.5, color: "var(--text-muted)", width: 110, textAlign: "right" }}>
                  {lastEval ? formatDate(lastEval) : "Nog geen evaluatie"}
                </div>
                <span style={{ width: 20, display: "flex", justifyContent: "center" }}>
                  {trend === "up" ? <TrendingUp size={14} style={{ color: "var(--green)" }} />
                    : trend === "down" ? <TrendingDown size={14} style={{ color: "var(--red)" }} />
                    : <Minus size={14} style={{ color: "var(--text-dim)" }} />}
                </span>
                <span style={{
                  fontSize: 15, fontWeight: 700, color: "var(--text)",
                  fontFeatureSettings: '"tnum" 1', width: 34, textAlign: "right",
                }}>
                  {p.overall_rating}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Kerncijfer-tegel ── */
function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: "var(--surface)", padding: "18px 20px" }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
        color: "var(--text-muted)", marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{
          fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em",
          color: "var(--text)", lineHeight: 1, fontFeatureSettings: '"tnum" 1',
        }}>
          {value}
        </span>
        {sub && <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ── Aandachtspunt-regel ── */
function AttentionRow({ value, label, href }: { value: number; label: string; href: string }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
    }}>
      <span style={{
        minWidth: 34, height: 34, borderRadius: 8,
        background: value > 0 ? "var(--surface-2)" : "var(--surface-2)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700, color: value > 0 ? "var(--text)" : "var(--text-dim)",
        fontFeatureSettings: '"tnum" 1',
      }}>
        {value}
      </span>
      <span style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.4 }}>{label}</span>
    </Link>
  );
}

/* ── Verloopgrafiek — één accentkleur ── */
function TrendChart({ series }: { series: { date: string; overall: number }[] }) {
  const W = 460;
  const H = 160;
  const PAD = 24;

  if (series.length < 2) {
    return (
      <div style={{
        height: H, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: 12.5,
      }}>
        Minimaal 2 evaluaties nodig voor het verloop
      </div>
    );
  }

  const xs = (i: number) => PAD + (i / Math.max(series.length - 1, 1)) * (W - 2 * PAD);
  const ys = (v: number) => H - PAD - ((v - 4) / 6) * (H - 2 * PAD);

  const line = series.map((s, i) => `${i === 0 ? "M" : "L"}${xs(i)},${ys(s.overall)}`).join(" ");
  const fill = `${line} L${xs(series.length - 1)},${H - PAD} L${PAD},${H - PAD} Z`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="cdFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.14" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[5, 7, 9].map(v => (
        <g key={v}>
          <line x1={PAD} x2={W - PAD} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth={1} />
          <text x={PAD - 6} y={ys(v) + 3} fontSize={10} fill="var(--text-dim)" textAnchor="end">{v}</text>
        </g>
      ))}

      <path d={fill} fill="url(#cdFill)" />
      <path d={line} fill="none" stroke={ACCENT} strokeWidth={2} />
      {series.map((s, i) => (
        <circle key={i} cx={xs(i)} cy={ys(s.overall)} r={2.5} fill={ACCENT} />
      ))}
    </svg>
  );
}
