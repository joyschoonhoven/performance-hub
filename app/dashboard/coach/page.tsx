"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, Users, Plus, ChevronRight, Download, Share2,
  TrendingUp, TrendingDown, Minus, Trophy, ClipboardList,
  Activity, Sparkles, ArrowRight,
} from "lucide-react";
import { getAllPlayers } from "@/lib/supabase/queries";
import {
  CATEGORY_LABELS, CATEGORY_COLORS, POSITION_LABELS,
} from "@/lib/types";
import { getRatingColor, formatDate } from "@/lib/utils";
import type { PlayerWithDetails, EvaluationCategory } from "@/lib/types";
import { FifaPlayerCard } from "@/components/ui/FifaPlayerCard";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

/* ───────────────────────────────────────────────────────────── */
/*  Page                                                         */
/* ───────────────────────────────────────────────────────────── */

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

  // Trending up vs down (echte data)
  const trendingUp = players.filter(p => {
    const evs = p.evaluations ?? [];
    return evs.length >= 2 && (evs[0].overall_score ?? 0) > (evs[1].overall_score ?? 0);
  }).length;
  const trendingDown = players.filter(p => {
    const evs = p.evaluations ?? [];
    return evs.length >= 2 && (evs[0].overall_score ?? 0) < (evs[1].overall_score ?? 0);
  }).length;

  // Verdeling op basis van aantal evaluaties (transparant gelabeld)
  const wellEvaluated = players.filter(p => (p.evaluations?.length ?? 0) >= 5).length;
  const someEvaluations = players.filter(p => {
    const n = p.evaluations?.length ?? 0;
    return n >= 2 && n < 5;
  }).length;
  const notEvaluated = players.filter(p => {
    const n = p.evaluations?.length ?? 0;
    return n < 2;
  }).length;
  const totalDist = Math.max(wellEvaluated + someEvaluations + notEvaluated, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .coach-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .coach-main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .coach-header-actions { display: flex; align-items: center; gap: 8px; }
        .coach-row3 { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 14px; }
        .coach-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .coach-table-inner { min-width: 720px; }
        @media (max-width: 1023px) {
          .coach-kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .coach-main-grid { grid-template-columns: 1fr; }
          .coach-row3 { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .coach-header-actions .btn-ghost:not(.btn-ghost-primary) { display: none; }
          .coach-title { font-size: 22px !important; }
        }
      ` }} />

      {/* ═════════════════════ HEADER ═════════════════════ */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            padding: "3px 8px", borderRadius: 4,
            background: "rgba(0,27,72,0.06)", color: "var(--navy)",
            marginBottom: 8, textTransform: "uppercase",
          }}>
            <Sparkles size={11} /> Coach Dashboard
          </div>
          <h1 className="coach-title" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
            {coachName ? `Hallo, ${coachName.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
            Performance overzicht van je squad
          </p>
        </div>

        <div className="coach-header-actions" style={{ flexShrink: 0 }}>
          <button className="btn-ghost" style={{ padding: "7px 10px" }} title="Download">
            <Download size={13} />
          </button>
          <button className="btn-ghost" style={{ padding: "7px 10px" }} title="Share">
            <Share2 size={13} />
          </button>
          <Link href="/dashboard/coach/evaluations/new" className="btn-primary" style={{ whiteSpace: "nowrap" }}>
            <Plus size={13} /> <span className="hidden sm:inline">Evaluatie</span>
          </Link>
        </div>
      </div>

      {/* ═════════════════════ KPI ROW ═════════════════════ */}
      <div className="coach-kpi-grid">
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
          accent="var(--sfa-sky)"
          icon={<Trophy size={14} />}
        />
      </div>

      {/* ═════════════════════ FIFA-STYLE TOP PERFORMERS ═════════════════════ */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--sfa-navy)" }}>
              Top Performers
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Beste spelers in je squad — op basis van overall rating
            </p>
          </div>
          <Link href="/dashboard/coach/players" style={{
            fontSize: 12, color: "var(--sfa-blue)", fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            Alle spelers <ArrowRight size={12} />
          </Link>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 14,
        }}>
          {[...players]
            .sort((a, b) => b.overall_rating - a.overall_rating)
            .slice(0, 6)
            .map((p, i) => {
              const last = p.evaluations?.[0];
              const tech = last?.scores?.find(s => s.category === "techniek")?.score;
              const fys = last?.scores?.find(s => s.category === "fysiek")?.score;
              const tac = last?.scores?.find(s => s.category === "tactiek")?.score;
              return (
                <FifaPlayerCard
                  key={p.id}
                  href={`/dashboard/coach/players/${p.id}`}
                  photoUrl={p.photo_url ?? p.avatar_url}
                  firstName={p.first_name}
                  lastName={p.last_name}
                  position={p.position}
                  rating={p.overall_rating}
                  club={p.team_name ?? p.club ?? "SFA"}
                  highlight={i === 0}
                  stats={[
                    { label: "TEC", value: tech ? tech.toFixed(1) : "—" },
                    { label: "FYS", value: fys ? fys.toFixed(1) : "—" },
                    { label: "TAC", value: tac ? tac.toFixed(1) : "—" },
                  ]}
                />
              );
            })}
        </div>
      </div>

      {/* ═════════════════════ MAIN GRID ═════════════════════ */}
      <div className="coach-main-grid">
        {/* ── TEAM PERFORMANCE RADAR ── */}
        <div className="card-lg" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Team Performance</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--sfa-sky)" }} />
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
                  border: "3px solid var(--sfa-sky)",
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
      <div className="coach-row3">
        {/* ── EFFECTIVENESS LINE — alleen actuele data ── */}
        <div className="card-lg" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Squad Score Verloop</h3>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Gemiddelde overall score per evaluatie
              </p>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-muted)" }}>
              <span style={{ width: 16, height: 2, background: "#4DAEE5", borderRadius: 1 }} />
              {effectivenessSeries.length} datapunten
            </span>
          </div>
          <EffectivenessChart series={effectivenessSeries} />
        </div>

        {/* ── TREND COUNTER — vervangt fake lineup pitch ── */}
        <div className="card-lg" style={{ padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Speler Trends</h3>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Laatste vs. voorlaatste evaluatie
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <TrendCounter
              label="Stijgend"
              value={trendingUp}
              total={players.length}
              color="var(--green)"
              icon={<TrendingUp size={16} />}
            />
            <TrendCounter
              label="Dalend"
              value={trendingDown}
              total={players.length}
              color="var(--red)"
              icon={<TrendingDown size={16} />}
            />
            <TrendCounter
              label="Stabiel / Onbekend"
              value={Math.max(0, players.length - trendingUp - trendingDown)}
              total={players.length}
              color="var(--text-muted)"
              icon={<Minus size={16} />}
            />
          </div>
        </div>

        {/* ── EVALUATIE-VERDELING DONUT — eerlijk gelabeld ── */}
        <div className="card-lg" style={{ padding: 20, position: "relative", overflow: "hidden" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 4 }}>Evaluatie Dekking</h3>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
            Hoeveel spelers zijn voldoende beoordeeld?
          </p>

          <Donut
            slices={[
              { label: "≥ 5 evaluaties", value: wellEvaluated, color: "#16A34A", pct: Math.round((wellEvaluated / totalDist) * 100) },
              { label: "2 – 4 evaluaties", value: someEvaluations, color: "#D97706", pct: Math.round((someEvaluations / totalDist) * 100) },
              { label: "< 2 evaluaties", value: notEvaluated, color: "#DC2626", pct: Math.round((notEvaluated / totalDist) * 100) },
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

        {/* Table (horizontal scroll on mobile so columns keep their proportions) */}
        <div className="coach-table-scroll">
        <div className="coach-table-inner">
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
                  <PlayerAvatar
                    photoUrl={p.photo_url ?? p.avatar_url}
                    name={`${p.first_name} ${p.last_name}`}
                    position={p.position}
                    size="sm"
                  />
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
      <path d={prevPath} fill="rgba(77,174,229,0.15)" stroke="#4DAEE5" strokeWidth={1.5} strokeDasharray="5 3" />

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

  if (series.length < 2) {
    return (
      <div style={{
        height: H, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: 12, textAlign: "center",
      }}>
        Minimaal 2 evaluaties nodig voor verloop
      </div>
    );
  }

  const xs = (i: number) => PAD + (i / Math.max(series.length - 1, 1)) * (W - 2 * PAD);
  const ys = (v: number) => H - PAD - ((v - 4) / 6) * (H - 2 * PAD);

  const actualPath = series.map((s, i) => `${i === 0 ? "M" : "L"}${xs(i)},${ys(s.overall)}`).join(" ");
  const fillPath = `${actualPath} L${xs(series.length - 1)},${H - PAD} L${PAD},${H - PAD} Z`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="effFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DAEE5" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#4DAEE5" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines at 5/7/9 */}
      {[5, 7, 9].map(v => (
        <g key={v}>
          <line
            x1={PAD} x2={W - PAD}
            y1={ys(v)} y2={ys(v)}
            stroke="var(--border)"
            strokeWidth={0.7}
            strokeDasharray="2 3"
          />
          <text x={PAD - 4} y={ys(v) + 3} fontSize={9} fill="var(--text-dim)" textAnchor="end">{v}</text>
        </g>
      ))}

      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth={1} />
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth={1} />

      <path d={fillPath} fill="url(#effFill)" />
      <path d={actualPath} fill="none" stroke="#4DAEE5" strokeWidth={2.5} />

      {series.map((s, i) => (
        <circle key={i} cx={xs(i)} cy={ys(s.overall)} r={3} fill="#4DAEE5" stroke="#fff" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

function TrendCounter({ label, value, total, color, icon }: {
  label: string; value: number; total: number; color: string; icon: React.ReactNode;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)" }}>
          <span style={{ color }}>{icon}</span>
          {label}
        </span>
        <span style={{
          fontSize: 14, fontWeight: 700, color, letterSpacing: "-0.01em",
          fontFeatureSettings: '"tnum" 1',
        }}>
          {value} <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 500 }}>· {pct}%</span>
        </span>
      </div>
      <div className="progress-track" style={{ height: 4 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
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
