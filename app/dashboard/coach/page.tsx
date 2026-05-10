"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, Users, Plus, ChevronRight, Download, Share2,
  TrendingUp, TrendingDown, Minus, Trophy, ClipboardList,
  Activity, Calendar, Sparkles, ArrowRight,
} from "lucide-react";
import { getAllPlayers } from "@/lib/supabase/queries";
import {
  CATEGORY_LABELS, CATEGORY_COLORS, POSITION_LABELS,
} from "@/lib/types";
import { getRatingColor, formatDate } from "@/lib/utils";
import type { PlayerWithDetails, EvaluationCategory } from "@/lib/types";

/* ───────────────────────────────────────────────────────────── */
/*  Page                                                         */
/* ───────────────────────────────────────────────────────────── */

export default function CoachDashboardPage() {
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachName, setCoachName] = useState("");
  const [view, setView] = useState<"month" | "current">("current");

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single();
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
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--navy)" }} />
      </div>
    );
  }

  // ── Aggregations ───────────────────────────────────────────
  const categories: EvaluationCategory[] = ["techniek", "fysiek", "tactiek", "mentaal", "teamplay"];

  // Team performance per category — current vs last month
  const computeAvg = (filterFn: (date: string) => boolean) => {
    const cats: Record<EvaluationCategory, number[]> = {
      techniek: [], fysiek: [], tactiek: [], mentaal: [], teamplay: [],
    };
    players.forEach(p => {
      p.evaluations?.forEach(ev => {
        if (filterFn(ev.evaluation_date)) {
          ev.scores?.forEach(s => {
            const c = s.category as EvaluationCategory;
            if (cats[c]) cats[c].push(s.score);
          });
        }
      });
    });
    return categories.map(c => {
      const arr = cats[c];
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    });
  };

  const now = Date.now();
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const currentAvg = computeAvg(d => now - new Date(d).getTime() <= monthMs);
  const lastMonthAvg = computeAvg(d => {
    const t = new Date(d).getTime();
    return now - t > monthMs && now - t <= 2 * monthMs;
  });

  // Top performer (highest overall_rating)
  const topPerformer = [...players].sort((a, b) => b.overall_rating - a.overall_rating)[0];

  // Squad effectiveness over time (avg overall per evaluation across all players in last 6 months)
  const allEvals = players.flatMap(p => (p.evaluations ?? []).map(ev => ({
    date: ev.evaluation_date,
    overall: ev.overall_score ?? 0,
  }))).filter(e => e.overall > 0);

  const sortedEvals = [...allEvals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const effectivenessSeries = sortedEvals.slice(-12);

  // Wins/losses approximation: positive vs. negative trends
  const wins = players.filter(p => {
    const evs = p.evaluations ?? [];
    return evs.length >= 2 && (evs[0].overall_score ?? 0) > (evs[1].overall_score ?? 0);
  }).length;
  const losses = players.filter(p => {
    const evs = p.evaluations ?? [];
    return evs.length >= 2 && (evs[0].overall_score ?? 0) < (evs[1].overall_score ?? 0);
  }).length;

  // Player commitment distribution (donut)
  const reliable = players.filter(p => (p.evaluations?.length ?? 0) >= 5).length;
  const committed = players.filter(p => {
    const n = p.evaluations?.length ?? 0;
    return n >= 2 && n < 5;
  }).length;
  const helpful = players.filter(p => {
    const n = p.evaluations?.length ?? 0;
    return n < 2;
  }).length;
  const totalDist = Math.max(reliable + committed + helpful, 1);

  // Lineup: top 11 players by rating
  const lineup = [...players].sort((a, b) => b.overall_rating - a.overall_rating).slice(0, 11);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ═════════════════════ HEADER ═════════════════════ */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            padding: "3px 8px", borderRadius: 4,
            background: "rgba(0,27,72,0.06)", color: "var(--navy)",
            marginBottom: 8, textTransform: "uppercase",
          }}>
            <Sparkles size={11} /> Coach Dashboard
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
            Goedemorgen{coachName ? `, ${coachName.split(" ")[0]}` : ""}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Schoonhoven Sports · Performance overzicht van je squad
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="btn-ghost"
            style={{ padding: "7px 10px" }}
            title="Download"
          >
            <Download size={13} />
          </button>
          <button
            className="btn-ghost"
            style={{ padding: "7px 10px" }}
            title="Share"
          >
            <Share2 size={13} />
          </button>
          <Link href="/dashboard/coach/players" className="btn-ghost">
            <Plus size={13} /> Speler
          </Link>
          <Link href="/dashboard/coach/evaluations" className="btn-primary">
            <ClipboardList size={13} /> Evaluatie
          </Link>
        </div>
      </div>

      {/* ═════════════════════ KPI ROW ═════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KpiTile
          label="Spelers"
          value={String(players.length)}
          accent="var(--navy)"
          icon={<Users size={14} />}
        />
        <KpiTile
          label="Evaluaties (30d)"
          value={String(allEvals.filter(e => now - new Date(e.date).getTime() <= monthMs).length)}
          accent="#2563EB"
          icon={<ClipboardList size={14} />}
        />
        <KpiTile
          label="Squad Avg"
          value={(allEvals.length
            ? allEvals.reduce((a, b) => a + b.overall, 0) / allEvals.length
            : 0).toFixed(1)}
          accent="var(--green)"
          icon={<Activity size={14} />}
        />
        <KpiTile
          label="Active Challenges"
          value={String(players.reduce((s, p) =>
            s + (p.challenges?.filter(c => c.status === "in_progress").length ?? 0), 0))}
          accent="var(--gold)"
          icon={<Trophy size={14} />}
        />
      </div>

      {/* ═════════════════════ MAIN GRID ═════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* ── TEAM PERFORMANCE RADAR ── */}
        <div className="card-lg" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Team Performance</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)" }} />
                Vorige Maand
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--navy)" }} />
                Huidig
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <TeamRadar
              labels={categories.map(c => CATEGORY_LABELS[c])}
              current={currentAvg}
              previous={lastMonthAvg}
            />
          </div>
        </div>

        {/* ── KEY PLAYER ── */}
        <div className="card-lg" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 12 }}>Key Player</h3>

          {topPerformer ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0, position: "relative" }}>
                <button style={{
                  position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)",
                  width: 24, height: 24, borderRadius: "50%",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--text-muted)",
                }}>
                  <ChevronRight size={12} style={{ transform: "rotate(180deg)" }} />
                </button>
                <div style={{
                  width: 84, height: 84, borderRadius: "50%", overflow: "hidden",
                  background: "linear-gradient(135deg, var(--navy), var(--navy-mid))",
                  border: "3px solid var(--gold)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 26, fontWeight: 700,
                }}>
                  {topPerformer.avatar_url ? (
                    <Image src={topPerformer.avatar_url} alt={topPerformer.first_name} width={84} height={84} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  ) : (
                    <span>{topPerformer.first_name[0]}{topPerformer.last_name[0]}</span>
                  )}
                </div>
                <div style={{ textAlign: "center", marginTop: 6, fontSize: 12, fontWeight: 600 }}>
                  {topPerformer.first_name} {topPerformer.last_name}
                </div>
              </div>

              {/* Stats bars */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {(["techniek", "fysiek", "tactiek", "mentaal"] as EvaluationCategory[]).map(cat => {
                  const sc = topPerformer.evaluations?.[0]?.scores?.find(s => s.category === cat)?.score ?? 0;
                  const pct = Math.round(sc * 10);
                  return (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 60 }}>{CATEGORY_LABELS[cat]}</span>
                      <div style={{
                        flex: 1, height: 8, borderRadius: 4,
                        background: "var(--bg)", overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${CATEGORY_COLORS[cat]}, ${CATEGORY_COLORS[cat]}aa)`,
                          borderRadius: 4,
                          transition: "width 0.7s",
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, width: 30, textAlign: "right", fontFeatureSettings: '"tnum" 1' }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>

              <button style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "var(--surface)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-muted)", flexShrink: 0,
              }}>
                <ChevronRight size={12} />
              </button>
            </div>
          ) : (
            <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)" }}>
              Nog geen spelers
            </div>
          )}

          {/* Snap stats */}
          {topPerformer && (
            <div style={{
              marginTop: 16, paddingTop: 14,
              borderTop: "1px solid var(--border)",
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
            }}>
              <SnapStat label="Overall" value={String(topPerformer.overall_rating)} color={getRatingColor(topPerformer.overall_rating)} />
              <SnapStat label="Positie" value={POSITION_LABELS[topPerformer.position]} />
              <SnapStat label="Evaluaties" value={String(topPerformer.evaluations?.length ?? 0)} />
            </div>
          )}
        </div>
      </div>

      {/* ═════════════════════ SECOND ROW ═════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 0.9fr", gap: 14 }}>
        {/* ── TEAM EFFECTIVENESS LINE ── */}
        <div className="card-lg" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Team Effectiveness</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "var(--text-muted)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 16, height: 2, background: "var(--navy)", borderRadius: 1 }} />
                Theoretisch
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 16, borderTop: "2px dashed var(--gold)" }} />
                Huidig
              </span>
            </div>
          </div>
          <EffectivenessChart series={effectivenessSeries} />
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: 8, fontSize: 10, color: "var(--text-dim)",
            letterSpacing: "0.04em",
          }}>
            <span>Tijd →</span>
            <span>Effectiviteit ↑</span>
          </div>
        </div>

        {/* ── TEAM LINEUP ── */}
        <div className="card-lg" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Team Lineup Summary</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>Wins <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 13 }}>{wins}</span></span>
              <span style={{ color: "var(--text-muted)" }}>Loses <span style={{ color: "var(--red)", fontWeight: 700, fontSize: 13 }}>{losses}</span></span>
            </div>
          </div>
          <FormationPitch lineup={lineup} />
        </div>

        {/* ── PLAYER STATS DONUT ── */}
        <div className="card-lg" style={{ padding: 20, position: "relative", overflow: "hidden" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 4 }}>Team Player Stat</h3>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>Verdeling spelers</div>

          <Donut
            slices={[
              { label: "Reliable", value: reliable, color: "#FFD23F", pct: Math.round((reliable / totalDist) * 100) },
              { label: "Committed", value: committed, color: "#FB923C", pct: Math.round((committed / totalDist) * 100) },
              { label: "Helpful", value: helpful, color: "#FCE38A", pct: Math.round((helpful / totalDist) * 100) },
            ]}
          />
        </div>
      </div>

      {/* ═════════════════════ SQUAD TABLE ═════════════════════ */}
      <div className="card-lg" style={{ padding: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Squad Overzicht</h3>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              padding: "2px 7px", borderRadius: 4,
              background: "var(--bg)", color: "var(--text-muted)",
            }}>
              {players.length} SPELERS
            </span>
          </div>
          <Link
            href="/dashboard/coach/players"
            style={{ fontSize: 11, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            Alle spelers <ArrowRight size={11} />
          </Link>
        </div>

        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(180px, 2fr) 80px 60px repeat(5, 1fr) 60px 80px",
          gap: 10,
          padding: "10px 20px",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
          color: "var(--text-dim)", textTransform: "uppercase",
          borderBottom: "1px solid var(--border)", background: "var(--bg)",
        }}>
          <span>Speler</span>
          <span>Positie</span>
          <span style={{ textAlign: "right" }}>Overall</span>
          {categories.map(c => (
            <span key={c} style={{ textAlign: "right" }}>{CATEGORY_LABELS[c].slice(0, 3)}</span>
          ))}
          <span style={{ textAlign: "center" }}>Trend</span>
          <span style={{ textAlign: "right" }}>Acties</span>
        </div>

        {/* Rows */}
        {players.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            Geen spelers in je squad. <Link href="/dashboard/coach/players" style={{ color: "var(--navy)", fontWeight: 600 }}>Voeg er een toe</Link>.
          </div>
        ) : (
          players.slice(0, 8).map((p, i) => {
            const last = p.evaluations?.[0];
            const prev = p.evaluations?.[1];
            const trend = last && prev
              ? (last.overall_score ?? 0) > (prev.overall_score ?? 0) ? "up"
              : (last.overall_score ?? 0) < (prev.overall_score ?? 0) ? "down" : "flat"
              : "flat";

            return (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px, 2fr) 80px 60px repeat(5, 1fr) 60px 80px",
                  gap: 10,
                  padding: "12px 20px",
                  fontSize: 12.5,
                  alignItems: "center",
                  background: i % 2 === 0 ? "var(--surface)" : "var(--bg)",
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,27,72,0.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "var(--surface)" : "var(--bg)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", overflow: "hidden",
                    background: "var(--navy)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {p.avatar_url ? (
                      <Image src={p.avatar_url} alt="" width={30} height={30} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                    ) : (
                      <span>{p.first_name[0]}{p.last_name[0]}</span>
                    )}
                  </div>
                  <span style={{ fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.first_name} {p.last_name}
                  </span>
                </div>

                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  padding: "2px 7px", borderRadius: 3,
                  background: "rgba(0,27,72,0.06)", color: "var(--navy)",
                  width: "fit-content",
                }}>
                  {p.position}
                </span>

                <span style={{
                  textAlign: "right", fontWeight: 700,
                  color: getRatingColor(p.overall_rating),
                  fontFeatureSettings: '"tnum" 1',
                }}>
                  {p.overall_rating}
                </span>

                {categories.map(c => {
                  const sc = last?.scores?.find(s => s.category === c)?.score ?? 0;
                  return (
                    <span key={c} style={{
                      textAlign: "right",
                      color: sc > 0 ? CATEGORY_COLORS[c] : "var(--text-dim)",
                      fontWeight: sc > 0 ? 600 : 500,
                      fontSize: 12,
                      fontFeatureSettings: '"tnum" 1',
                    }}>
                      {sc > 0 ? sc.toFixed(1) : "—"}
                    </span>
                  );
                })}

                <span style={{ display: "flex", justifyContent: "center" }}>
                  {trend === "up" ? <TrendingUp size={14} style={{ color: "var(--green)" }} />
                   : trend === "down" ? <TrendingDown size={14} style={{ color: "var(--red)" }} />
                   : <Minus size={14} style={{ color: "var(--text-dim)" }} />}
                </span>

                <Link
                  href={`/dashboard/coach/evaluations?player=${p.id}`}
                  style={{
                    textAlign: "right", fontSize: 11, fontWeight: 600,
                    color: "var(--navy)", textDecoration: "none",
                  }}
                >
                  Evalueer
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */
/*  Sub-components                                               */
/* ───────────────────────────────────────────────────────────── */

function KpiTile({ label, value, accent, icon }: {
  label: string; value: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 18, position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 3, height: "100%", background: accent,
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          color: "var(--text-muted)", textTransform: "uppercase",
        }}>
          {label}
        </span>
        <span style={{
          width: 24, height: 24, borderRadius: 6,
          background: `${accent}10`, color: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </span>
      </div>
      <div style={{
        fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em",
        color: "var(--text)", lineHeight: 1, fontFeatureSettings: '"tnum" 1',
      }}>
        {value}
      </div>
    </div>
  );
}

function SnapStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
        color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 700, color: color ?? "var(--text)",
        fontFeatureSettings: '"tnum" 1', letterSpacing: "-0.01em",
      }}>
        {value}
      </div>
    </div>
  );
}

function TeamRadar({ labels, current, previous }: {
  labels: string[]; current: number[]; previous: number[];
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const R = 95;
  const n = labels.length;

  const toPoints = (vals: number[]) => vals.map((v, i) => {
    const ratio = Math.max(0, Math.min(1, v / 10));
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * R * ratio,
      y: cy + Math.sin(angle) * R * ratio,
    };
  });

  const labelPoints = labels.map((_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * (R + 18),
      y: cy + Math.sin(angle) * (R + 18),
    };
  });

  const currentPath = toPoints(current).map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  const prevPath = toPoints(previous).map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Pentagon grid rings */}
      {[0.25, 0.5, 0.75, 1].map(ring => {
        const path = Array.from({ length: n }).map((_, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          return `${i === 0 ? "M" : "L"}${cx + Math.cos(a) * R * ring},${cy + Math.sin(a) * R * ring}`;
        }).join(" ") + " Z";
        return (
          <path
            key={ring}
            d={path}
            fill="none"
            stroke="var(--border)"
            strokeWidth={ring === 1 ? 1 : 0.7}
            strokeDasharray={ring === 1 ? "none" : "2 3"}
          />
        );
      })}

      {/* Spokes */}
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(a) * R}
            y2={cy + Math.sin(a) * R}
            stroke="var(--border)"
            strokeWidth={0.7}
          />
        );
      })}

      {/* Previous (dashed gold) */}
      <path d={prevPath} fill="rgba(196,168,79,0.15)" stroke="#C4A84F" strokeWidth={1.5} strokeDasharray="5 3" />

      {/* Current (filled navy) */}
      <path d={currentPath} fill="rgba(0,27,72,0.18)" stroke="var(--navy)" strokeWidth={2} />

      {/* Vertices */}
      {toPoints(current).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--navy)" stroke="#fff" strokeWidth={2} />
      ))}

      {/* Labels */}
      {labelPoints.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          fontSize={11}
          fill="var(--text-2)"
          fontWeight={600}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ letterSpacing: "0.02em" }}
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}

function EffectivenessChart({ series }: { series: { date: string; overall: number }[] }) {
  const W = 360;
  const H = 140;
  const PAD = 20;

  if (series.length === 0) {
    return (
      <div style={{
        height: H, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: 12,
      }}>
        Geen data beschikbaar
      </div>
    );
  }

  const xs = (i: number) => PAD + (i / Math.max(series.length - 1, 1)) * (W - 2 * PAD);
  const ys = (v: number) => H - PAD - ((v - 4) / 6) * (H - 2 * PAD);

  // Theoretical: smooth ascending curve
  const theoreticalPath = series.map((_, i) => {
    const v = 5 + Math.sin((i / series.length) * Math.PI) * 2 + i * 0.15;
    return `${i === 0 ? "M" : "L"}${xs(i)},${ys(Math.min(v, 9))}`;
  }).join(" ");

  // Current: actual data
  const actualPath = series.map((s, i) => `${i === 0 ? "M" : "L"}${xs(i)},${ys(s.overall)}`).join(" ");

  // Fill under actual
  const fillPath = `${actualPath} L${xs(series.length - 1)},${H - PAD} L${PAD},${H - PAD} Z`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="effFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4A84F" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#C4A84F" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y axis */}
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth={1} />
      {/* X axis */}
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth={1} />

      {/* Theoretical line */}
      <path d={theoreticalPath} fill="none" stroke="var(--navy)" strokeWidth={2} />

      {/* Fill under actual */}
      <path d={fillPath} fill="url(#effFill)" />

      {/* Actual line */}
      <path d={actualPath} fill="none" stroke="#C4A84F" strokeWidth={2} strokeDasharray="5 3" />

      {/* Dots on actual */}
      {series.map((s, i) => (
        <circle key={i} cx={xs(i)} cy={ys(s.overall)} r={2.5} fill="#C4A84F" />
      ))}
    </svg>
  );
}

function FormationPitch({ lineup }: { lineup: PlayerWithDetails[] }) {
  // 4-3-3 formation positions (relative %)
  const formations = [
    [{ x: 50, y: 92, role: "GK" }],
    [{ x: 18, y: 75, role: "LB" }, { x: 38, y: 78, role: "CB" }, { x: 62, y: 78, role: "CB" }, { x: 82, y: 75, role: "RB" }],
    [{ x: 30, y: 52, role: "CM" }, { x: 50, y: 56, role: "CM" }, { x: 70, y: 52, role: "CM" }],
    [{ x: 22, y: 25, role: "LW" }, { x: 50, y: 18, role: "ST" }, { x: 78, y: 25, role: "RW" }],
  ];

  const allPositions = formations.flat();

  return (
    <div style={{
      position: "relative",
      borderRadius: 8,
      overflow: "hidden",
      background: "linear-gradient(180deg, #2C7A2C 0%, #1B5E1B 100%)",
      padding: "14px 18px",
      aspectRatio: "1.4 / 1",
      minHeight: 200,
    }}>
      {/* Pitch lines */}
      <div style={{ position: "absolute", inset: 8, border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 4 }} />
      <div style={{ position: "absolute", left: "50%", top: 8, bottom: 8, width: 1, background: "rgba(255,255,255,0.35)" }} />
      <div style={{
        position: "absolute", left: "50%", top: "50%", width: 60, height: 60,
        borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.35)",
        transform: "translate(-50%, -50%)",
      }} />
      {/* Penalty boxes */}
      <div style={{ position: "absolute", left: "20%", right: "20%", top: 8, height: "18%", border: "1.5px solid rgba(255,255,255,0.35)", borderTop: "none" }} />
      <div style={{ position: "absolute", left: "20%", right: "20%", bottom: 8, height: "18%", border: "1.5px solid rgba(255,255,255,0.35)", borderBottom: "none" }} />

      {/* Player dots */}
      {allPositions.map((pos, i) => {
        const player = lineup[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}
          >
            <div
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: i === 0 ? "#C4A84F" : "#fff",
                border: "1.5px solid rgba(255,255,255,0.7)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                fontSize: 9, fontWeight: 700,
                color: i === 0 ? "#001B48" : "var(--navy)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {player?.jersey_number ?? pos.role.slice(0, 2)}
            </div>
            {player && (
              <div style={{
                fontSize: 8, fontWeight: 600, color: "#fff",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                letterSpacing: "0.02em",
              }}>
                {player.last_name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Donut({ slices }: { slices: { label: string; value: number; color: string; pct: number }[] }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const R = 65;
  const r = 38;

  const total = slices.reduce((a, b) => a + b.value, 0);

  let cumulative = 0;
  const arcs = slices.map(s => {
    const startAngle = (cumulative / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
    cumulative += s.value;
    const endAngle = (cumulative / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;

    const x1 = cx + Math.cos(startAngle) * R;
    const y1 = cy + Math.sin(startAngle) * R;
    const x2 = cx + Math.cos(endAngle) * R;
    const y2 = cy + Math.sin(endAngle) * R;
    const x3 = cx + Math.cos(endAngle) * r;
    const y3 = cy + Math.sin(endAngle) * r;
    const x4 = cx + Math.cos(startAngle) * r;
    const y4 = cy + Math.sin(startAngle) * r;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return {
      d: `M${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${largeArc} 0 ${x4},${y4} Z`,
      color: s.color,
      label: s.label,
      pct: s.pct,
      midAngle: (startAngle + endAngle) / 2,
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        {arcs.map((a, i) => (
          <g key={i}>
            <path d={a.d} fill={a.color} stroke="#fff" strokeWidth={2} />
            {a.pct > 5 && (
              <text
                x={cx + Math.cos(a.midAngle) * ((R + r) / 2)}
                y={cy + Math.sin(a.midAngle) * ((R + r) / 2)}
                fontSize={11}
                fontWeight={700}
                fill="#fff"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {a.pct}%
              </text>
            )}
          </g>
        ))}
      </svg>

      <div style={{
        marginTop: 14, display: "flex", flexDirection: "column", gap: 6, width: "100%",
      }}>
        {slices.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 11, color: "var(--text-2)",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: "var(--text-muted)", fontFeatureSettings: '"tnum" 1' }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
