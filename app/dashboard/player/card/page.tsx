"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, RefreshCw, Zap, ArrowRight, MessageCircle, Calendar,
  TrendingUp, TrendingDown, Minus, Sparkles, Target,
} from "lucide-react";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { getMyPlayerData } from "@/lib/supabase/queries";
import {
  ARCHETYPES, SOCIOTYPES, POSITION_LABELS, CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/types";
import { getRatingColor, getRatingLabel, formatDate } from "@/lib/utils";
import type { Evaluation, EvaluationCategory, PlayerWithDetails } from "@/lib/types";

/* ───────────────────────────────────────────────────────────── */
/*  Helpers                                                      */
/* ───────────────────────────────────────────────────────────── */

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

function getActivityFeed(player: PlayerWithDetails) {
  type FeedItem = { text: string; meta: string; color: string; date: Date };
  const items: FeedItem[] = [];

  player.evaluations?.slice(0, 4).forEach((ev) => {
    items.push({
      text: `Nieuwe evaluatie ontvangen met overall ${ev.overall_score?.toFixed(1) ?? "—"}.`,
      meta: `Coach beoordeling op ${formatDate(ev.evaluation_date)}`,
      color: "#16A34A",
      date: new Date(ev.evaluation_date),
    });
  });

  player.challenges?.slice(0, 3).forEach((ch) => {
    if (ch.status === "completed") {
      items.push({
        text: `Challenge "${ch.title}" voltooid.`,
        meta: `Voltooid op ${formatDate(ch.updated_at)}`,
        color: "#C4A84F",
        date: new Date(ch.updated_at),
      });
    } else if (ch.status === "in_progress") {
      items.push({
        text: `Bezig met challenge "${ch.title}" — ${ch.progress}% voltooid.`,
        meta: `Gestart op ${formatDate(ch.created_at)}`,
        color: "#2563EB",
        date: new Date(ch.created_at),
      });
    }
  });

  if (player.identity?.last_ai_analysis) {
    items.push({
      text: `AI scouting analyse uitgevoerd — fit-score ${player.identity.ai_fit_score ?? "—"}.`,
      meta: `Geanalyseerd op ${formatDate(player.identity.last_ai_analysis)}`,
      color: "#7C3AED",
      date: new Date(player.identity.last_ai_analysis),
    });
  }

  items.push({
    text: `Aangemeld op het Performance Hub platform.`,
    meta: `Sinds ${formatDate(player.created_at)}`,
    color: "#6B7280",
    date: new Date(player.created_at),
  });

  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
}

/* ───────────────────────────────────────────────────────────── */
/*  Page                                                         */
/* ───────────────────────────────────────────────────────────── */

export default function PlayerCardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profiel" | "feed" | "trend">("feed");

  useEffect(() => {
    async function load() {
      const data = await getMyPlayerData();
      setPlayer(data);
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

  if (!player) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-12">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Geen spelersgegevens</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Vul eerst je profiel aan.</p>
        <Link href="/onboarding" className="btn-primary">Naar onboarding</Link>
      </div>
    );
  }

  const archetype = player.identity?.primary_archetype ? ARCHETYPES[player.identity.primary_archetype] : null;
  const sociotype = player.identity?.primary_sociotype ? SOCIOTYPES[player.identity.primary_sociotype] : null;
  const evals = player.evaluations ?? [];
  const latestEval = evals[0];
  const completedChallenges = player.challenges?.filter(c => c.status === "completed").length ?? 0;
  const totalChallenges = player.challenges?.length ?? 0;
  const avgRating = evals.length
    ? (evals.reduce((s, e) => s + (e.overall_score ?? 0), 0) / evals.length).toFixed(1)
    : "—";
  const age = calculateAge(player.date_of_birth);
  const progressData = buildProgressData(evals);
  const feedItems = getActivityFeed(player);

  const mentaalScore = latestEval?.scores?.find(s => s.category === "mentaal")?.score;
  const fitnessPct = mentaalScore ? Math.round(mentaalScore * 10) : null;

  const trendDelta = evals.length >= 2 && evals[0].overall_score && evals[1].overall_score
    ? evals[0].overall_score - evals[1].overall_score
    : 0;

  const ratingColor = getRatingColor(player.overall_rating);

  return (
    <div
      style={{
        margin: "-28px -28px -40px",
        minHeight: "calc(100vh - 52px)",
        display: "grid",
        gridTemplateColumns: "340px 1fr 320px",
        gap: 0,
        background: "var(--bg)",
      }}
    >
      {/* ═════════════════════════ LEFT IDENTITY PANEL ═════════════════════════ */}
      <aside
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #001B48 0%, #000820 60%, #000510 100%)",
          color: "#fff",
          minHeight: "calc(100vh - 52px)",
        }}
      >
        {/* Decorative angle */}
        <div
          style={{
            position: "absolute", top: -80, right: -80, width: 360, height: 360,
            background: "linear-gradient(135deg, rgba(196,168,79,0.18) 0%, transparent 70%)",
            transform: "rotate(45deg)", pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(196,168,79,0.4), transparent)",
          }}
        />

        {/* Club logo */}
        <div style={{ position: "absolute", top: 24, left: 24, zIndex: 5 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 8,
              background: "rgba(196,168,79,0.15)", border: "1px solid rgba(196,168,79,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}
          >
            <Image src="/logo.png" alt="Logo" width={28} height={28} style={{ objectFit: "contain" }} />
          </div>
        </div>

        {/* Player photo */}
        <div
          style={{
            position: "absolute", top: 30, left: 0, right: 0, bottom: 200,
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
          }}
        >
          {player.avatar_url ? (
            <div style={{ position: "relative", width: 240, height: 280 }}>
              <Image
                src={player.avatar_url}
                alt={player.full_name ?? player.first_name}
                fill
                style={{ objectFit: "cover", objectPosition: "top center", borderRadius: 6 }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, transparent 50%, #000510 100%)",
                borderRadius: 6,
              }} />
            </div>
          ) : (
            <div
              style={{
                width: 220, height: 220, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(196,168,79,0.25), rgba(196,168,79,0.05))",
                border: "2px solid rgba(196,168,79,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 72, fontWeight: 700, color: "#C4A84F", letterSpacing: "-0.04em",
              }}
            >
              {player.first_name?.[0]}{player.last_name?.[0]}
            </div>
          )}
        </div>

        {/* Bottom content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24, zIndex: 5 }}>
          <div
            style={{
              fontSize: 96, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.06em",
              color: "rgba(255,255,255,0.08)", fontFeatureSettings: '"tnum" 1', marginBottom: 4,
            }}
          >
            {player.jersey_number ?? "—"}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>
            {(player.first_name ?? "").toUpperCase()}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.05, marginBottom: 10 }}>
            {(player.last_name ?? "").toUpperCase()}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
            <span
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                padding: "3px 8px", borderRadius: 4,
                background: "rgba(196,168,79,0.16)", color: "#C4A84F",
                border: "1px solid rgba(196,168,79,0.32)",
              }}
            >
              {player.position}
            </span>
            <span
              style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                padding: "3px 8px", borderRadius: 4,
                background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              OVR · {player.overall_rating}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <IdRow label="BIRTHDATE" value={player.date_of_birth ? `${formatDate(player.date_of_birth)}${age ? `  ·  ${age}j` : ""}` : "—"} />
            <IdRow label="NATIONALITY" value={player.nationality} />
            <IdRow label="POSITION" value={POSITION_LABELS[player.position]} />
            <IdRow label="CLUB" value={player.club ?? player.team_name ?? "Schoonhoven Sports"} />
            <IdRow label="JOINED" value={formatDate(player.created_at)} />
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link
              href="/dashboard/player/settings"
              style={{
                fontSize: 11, color: "rgba(255,255,255,0.4)",
                display: "inline-flex", alignItems: "center", gap: 4, letterSpacing: "0.04em",
              }}
            >
              <Target size={11} /> Help Center
            </Link>
          </div>
        </div>
      </aside>

      {/* ═════════════════════════ CENTER COLUMN ═════════════════════════ */}
      <section
        style={{
          padding: "24px 32px",
          overflowY: "auto",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 36,
            paddingBottom: 14, borderBottom: "1px solid var(--border)", marginBottom: 24,
          }}
        >
          {([
            { id: "profiel" as const, label: "Profiel" },
            { id: "feed" as const,    label: "Activity" },
            { id: "trend" as const,   label: "Ontwikkeling" },
          ]).map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  fontSize: 13, fontWeight: active ? 700 : 500, letterSpacing: "0.02em",
                  color: active ? "var(--navy)" : "var(--text-muted)",
                  background: "transparent", border: "none", cursor: "pointer",
                  padding: "0 0 14px 0", marginBottom: -15,
                  borderBottom: active ? "2px solid #C4A84F" : "2px solid transparent",
                  transition: "all 0.15s", textTransform: "uppercase",
                }}
              >
                {t.label}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <button
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Zoek"
          >
            <Sparkles size={13} />
          </button>
        </div>

        {/* PROFIEL */}
        {activeTab === "profiel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: 22 }}>
              <SectionHeader title="Spelersprofiel" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {archetype && (
                  <ProfileBlock
                    label="Archetype" value={archetype.label} sub={archetype.description}
                    icon={archetype.icon} color={archetype.color}
                  />
                )}
                {sociotype && (
                  <ProfileBlock
                    label="Sociotype" value={sociotype.label} sub={sociotype.description}
                    icon={sociotype.icon} color={sociotype.color_hex}
                  />
                )}
              </div>
              {player.identity?.ai_summary && (
                <div style={{
                  marginTop: 18, padding: 14, borderRadius: 8,
                  background: "var(--bg)", borderLeft: "3px solid var(--gold)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--gold-dim)", marginBottom: 6 }}>
                    AI ANALYSE
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-2)" }}>
                    {player.identity.ai_summary}
                  </p>
                </div>
              )}
            </div>

            {player.identity && (
              <div className="card" style={{ padding: 22 }}>
                <SectionHeader title="Core Values" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  <CoreValue label="Noodzaak" value={player.identity.core_noodzaak} color="#DC2626" />
                  <CoreValue label="Creativiteit" value={player.identity.core_creativiteit} color="#7C3AED" />
                  <CoreValue label="Vertrouwen" value={player.identity.core_vertrouwen} color="#16A34A" />
                </div>
              </div>
            )}

            {latestEval?.strengths && (
              <div className="card" style={{ padding: 22 }}>
                <SectionHeader title="Sterke Punten" sub={`Per ${formatDate(latestEval.evaluation_date)}`} />
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-2)" }}>{latestEval.strengths}</p>
              </div>
            )}

            {latestEval?.improvement_points && (
              <div className="card" style={{ padding: 22 }}>
                <SectionHeader title="Verbeterpunten" sub={`Per ${formatDate(latestEval.evaluation_date)}`} />
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-2)" }}>{latestEval.improvement_points}</p>
              </div>
            )}
          </div>
        )}

        {/* FEED */}
        {activeTab === "feed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: 22 }}>
              <SectionHeader title="News Feed" right={
                <button
                  style={{
                    width: 24, height: 24, borderRadius: 5,
                    border: "1px solid var(--border)", background: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-muted)", cursor: "pointer",
                  }}
                >
                  <RefreshCw size={11} />
                </button>
              } />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {feedItems.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", gap: 14, padding: "14px 0",
                      borderBottom: i < feedItems.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div style={{ flexShrink: 0, paddingTop: 6 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: item.color, boxShadow: `0 0 0 3px ${item.color}22`,
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5, marginBottom: 3 }}>
                        {item.text.split(/("[^"]*"|\d+\.\d+|\d+%)/g).map((part, idx) =>
                          /^("[^"]*"|\d+\.\d+|\d+%)$/.test(part)
                            ? <span key={idx} style={{ fontWeight: 700, color: item.color }}>{part}</span>
                            : <span key={idx}>{part}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.01em" }}>
                        {item.meta}
                      </div>
                    </div>
                  </div>
                ))}
                {feedItems.length === 0 && (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                    Nog geen activiteit.
                  </div>
                )}
              </div>
            </div>

            {/* Overall Rating chart */}
            <div className="card" style={{ padding: 22 }}>
              <SectionHeader title="Overall Rating" right={
                <span style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.06em" }}>
                  ↻ {evals.length} EVALUATIES
                </span>
              } />
              <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 14 }}>
                <div style={{
                  fontSize: 56, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95,
                  color: ratingColor, fontFeatureSettings: '"tnum" 1',
                }}>
                  {player.overall_rating}
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                    {getRatingLabel(player.overall_rating)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, marginTop: 2 }}>
                    {trendDelta > 0 ? <TrendingUp size={12} style={{ color: "var(--green)" }} />
                     : trendDelta < 0 ? <TrendingDown size={12} style={{ color: "var(--red)" }} />
                     : <Minus size={12} style={{ color: "var(--text-dim)" }} />}
                    <span style={{ color: trendDelta > 0 ? "var(--green)" : trendDelta < 0 ? "var(--red)" : "var(--text-muted)", fontWeight: 600 }}>
                      {trendDelta > 0 ? "+" : ""}{trendDelta.toFixed(1)} vs vorige
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                {latestEval && (
                  <div style={{ textAlign: "right", paddingBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Laatste update
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600, marginTop: 2 }}>
                      {formatDate(latestEval.evaluation_date)}
                    </div>
                  </div>
                )}
              </div>

              {progressData.length > 1 ? (
                <div style={{ marginLeft: -10, marginRight: -10 }}>
                  <ProgressLineChart data={progressData} height={180} />
                </div>
              ) : (
                <div style={{
                  height: 120, background: "var(--bg)", borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", fontSize: 13,
                }}>
                  Minimaal 2 evaluaties nodig voor trend
                </div>
              )}
            </div>

            {/* Form */}
            <div className="card" style={{ padding: 22 }}>
              <SectionHeader title="Vorm" right={
                latestEval ? <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{formatDate(latestEval.evaluation_date)}</span> : null
              } />
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div
                  style={{
                    width: 56, height: 56, borderRadius: 12,
                    background: fitnessPct && fitnessPct >= 70 ? "rgba(22,163,74,0.1)"
                              : fitnessPct && fitnessPct >= 50 ? "rgba(217,119,6,0.1)"
                              : "rgba(220,38,38,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: fitnessPct && fitnessPct >= 70 ? "var(--green)"
                         : fitnessPct && fitnessPct >= 50 ? "var(--amber)" : "var(--red)",
                    flexShrink: 0,
                  }}
                >
                  <Zap size={26} fill="currentColor" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em",
                        color: fitnessPct && fitnessPct >= 70 ? "var(--green)"
                             : fitnessPct && fitnessPct >= 50 ? "var(--amber)" : "var(--red)",
                        fontFeatureSettings: '"tnum" 1',
                      }}
                    >
                      {fitnessPct ?? "—"}%
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-2)" }}>Vorm</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 4 }}>
                    {fitnessPct && fitnessPct >= 70
                      ? `Sterke mentale vorm. Klaar voor pieken op intensieve trainingen en wedstrijden.`
                      : fitnessPct && fitnessPct >= 50
                      ? `Goede basis. Focus op consistentie en herstel rond de wedstrijden.`
                      : fitnessPct
                      ? `Aandacht voor mentale belasting. Bespreek met coach welke aanpassingen je nodig hebt.`
                      : `Geen recente evaluatiedata. Vraag je coach om een nieuwe evaluatie.`}
                  </p>
                  {latestEval && (
                    <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>
                      Updated by {latestEval.coach_name ?? "coach"} on {formatDate(latestEval.evaluation_date)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TREND */}
        {activeTab === "trend" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: 22 }}>
              <SectionHeader title="Categoriescores" sub="Laatste evaluatie" />
              {latestEval?.scores && latestEval.scores.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(["techniek", "fysiek", "tactiek", "mentaal", "teamplay"] as EvaluationCategory[]).map((cat) => {
                    const sc = latestEval.scores!.find(s => s.category === cat);
                    const value = sc?.score ?? 0;
                    const color = CATEGORY_COLORS[cat];
                    return (
                      <div key={cat}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>
                            {CATEGORY_LABELS[cat]}
                          </span>
                          <span style={{ fontSize: 13, color, fontWeight: 700, fontFeatureSettings: '"tnum" 1' }}>
                            {value.toFixed(1)}
                          </span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${value * 10}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Geen scores beschikbaar.</p>
              )}
            </div>

            {progressData.length > 1 && (
              <div className="card" style={{ padding: 22 }}>
                <SectionHeader title="Ontwikkeling per categorie" />
                <div style={{ marginLeft: -10, marginRight: -10 }}>
                  <ProgressLineChart data={progressData} showCategories height={220} />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═════════════════════════ RIGHT SIDEBAR ═════════════════════════ */}
      <aside
        style={{
          padding: "24px 22px", overflowY: "auto",
          background: "var(--bg)", minHeight: "calc(100vh - 52px)",
          display: "flex", flexDirection: "column", gap: 18,
        }}
      >
        {/* Volgende activiteit */}
        <div className="card" style={{ padding: 18 }}>
          <SectionHeader title="Volgende Activiteit" />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: "rgba(0,27,72,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy)",
            }}>
              <Calendar size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Training Sessie</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Sportcomplex Schoonhoven</div>
            </div>
          </div>

          {/* Mini formation pitch */}
          <div style={{
            position: "relative", borderRadius: 8, overflow: "hidden",
            background: "linear-gradient(180deg, #16A34A 0%, #15803D 100%)",
            padding: "16px 12px", marginBottom: 12,
          }}>
            <div style={{ position: "absolute", inset: 6, border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 4 }} />
            <div style={{ position: "absolute", left: "50%", top: 6, bottom: 6, width: 1, background: "rgba(255,255,255,0.4)" }} />
            <div style={{
              position: "absolute", left: "50%", top: "50%", width: 36, height: 36,
              borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.4)",
              transform: "translate(-50%, -50%)",
            }} />
            <div style={{ position: "relative", height: 110, display: "grid", gridTemplateRows: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {[
                [{ pos: 50 }],
                [{ pos: 20 }, { pos: 40 }, { pos: 60 }, { pos: 80 }],
                [{ pos: 30 }, { pos: 50 }, { pos: 70 }],
                [{ pos: 25 }, { pos: 50, highlight: true }, { pos: 75 }],
              ].map((row, ri) => (
                <div key={ri} style={{ position: "relative" }}>
                  {row.map((p, pi) => (
                    <div
                      key={pi}
                      style={{
                        position: "absolute", left: `${p.pos}%`, top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 10, height: 10, borderRadius: "50%",
                        background: (p as { highlight?: boolean }).highlight ? "#C4A84F" : "#fff",
                        boxShadow: (p as { highlight?: boolean }).highlight ? "0 0 0 3px rgba(196,168,79,0.4)" : "none",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 11, color: "var(--text-muted)", marginBottom: 12,
          }}>
            <span style={{ fontWeight: 600 }}>4-3-3 Aanvallend</span>
            <span>Positie: <span style={{ color: "var(--gold-dim)", fontWeight: 700 }}>{player.position}</span></span>
          </div>

          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Naar Trainingsplan <ArrowRight size={12} />
          </button>
        </div>

        {/* Coach feedback */}
        <div className="card" style={{ padding: 18 }}>
          <SectionHeader title="Coach Feedback" right={
            latestEval ? <span style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>1</span> : null
          } />
          {latestEval?.notes ? (
            <>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", background: "var(--navy)", color: "#fff",
                  fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {(latestEval.coach_name ?? "C")[0]}
                </div>
                <div style={{
                  flex: 1, padding: "10px 12px", background: "var(--bg)", borderRadius: 8, position: "relative",
                }}>
                  <div style={{
                    position: "absolute", left: -5, top: 10, width: 0, height: 0,
                    borderTop: "5px solid transparent", borderBottom: "5px solid transparent",
                    borderRight: "5px solid var(--bg)",
                  }} />
                  <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                    {latestEval.notes.length > 140 ? latestEval.notes.slice(0, 140) + "…" : latestEval.notes}
                  </p>
                </div>
              </div>
              <button style={{
                marginTop: 10, padding: "5px 12px", fontSize: 11, fontWeight: 700,
                background: "var(--gold-dim)", color: "#fff", borderRadius: 5, border: "none",
                cursor: "pointer", letterSpacing: "0.04em", textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <MessageCircle size={11} /> Reply
              </button>
            </>
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Nog geen feedback van je coach.
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="card" style={{ padding: 18 }}>
          <SectionHeader title="Stats" right={
            <div style={{ display: "flex", gap: 4 }}>
              <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, background: "var(--navy)", color: "#fff", fontWeight: 700 }}>
                ALLE
              </span>
              <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, color: "var(--text-dim)", fontWeight: 600 }}>
                SEIZOEN
              </span>
            </div>
          } />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <StatRow label="Gemiddeld Rating" value={avgRating} valueColor={avgRating !== "—" ? "var(--green)" : "var(--text-muted)"} />
            <StatRow label="Evaluaties" value={String(evals.length)} />
            <StatRow label="Challenges Voltooid" value={`${completedChallenges}/${totalChallenges}`} />
            <StatRow label="Cards" value="—" />
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */
/*  Sub-components                                               */
/* ───────────────────────────────────────────────────────────── */

function IdRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "0.01em" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</h3>
        {sub && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function ProfileBlock({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon?: string; color?: string;
}) {
  return (
    <div style={{ padding: 14, borderRadius: 8, background: "var(--bg)", borderLeft: `3px solid ${color ?? "var(--navy)"}` }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
          {value}
        </div>
      </div>
      {sub && <p style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.45 }}>{sub}</p>}
    </div>
  );
}

function CoreValue({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round((value / 10) * 100);
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.03em", fontFeatureSettings: '"tnum" 1', marginBottom: 6, lineHeight: 1 }}>
        {value.toFixed(1)}
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 0", borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--text-2)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor ?? "var(--text)", fontFeatureSettings: '"tnum" 1' }}>
        {value}
      </span>
    </div>
  );
}
