"use client";

import { useState, useEffect } from "react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  EVALUATION_SCHEMA,
  ARCHETYPES,
  POSITION_LABELS,
  POTENTIAL_LEVELS,
} from "@/lib/types";
import { formatDate, getRatingColor, getScoreColor } from "@/lib/utils";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import {
  ClipboardList,
  Loader2,
  ChevronDown,
  ChevronUp,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Target,
  Zap,
  MapPin,
} from "lucide-react";
import type { Evaluation, EvaluationCategory, PlayerWithDetails } from "@/lib/types";

// ── helpers ─────────────────────────────────────────────────────────────────

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

function parseSubScores(subNotes?: string): Record<string, number> | null {
  if (!subNotes) return null;
  try { return JSON.parse(subNotes); } catch { return null; }
}

function getPotentialLabel(value?: string) {
  if (!value) return null;
  return POTENTIAL_LEVELS.find((p) => p.value === value)?.label ?? value;
}

function getPotentialColor(value?: string) {
  const map: Record<string, string> = {
    lokaal: "#94a3b8",
    regionaal: "#4FA9E6",
    nationaal: "#10b981",
    internationaal: "#f59e0b",
    wereldklasse: "#ef4444",
  };
  return map[value ?? ""] ?? "#4FA9E6";
}

// ── sub-criteria breakdown ───────────────────────────────────────────────────

function SubCriteriaBreakdown({
  categoryId,
  subNotes,
  fallbackScore,
}: {
  categoryId: string;
  subNotes?: string;
  fallbackScore: number;
}) {
  const schema = EVALUATION_SCHEMA.find((c) => c.id === categoryId);
  if (!schema) return null;
  const subScores = parseSubScores(subNotes);
  const hasReal = !!subScores && Object.keys(subScores).length > 0;

  return (
    <div style={{
      padding: "14px 16px 4px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {!hasReal && (
        <p style={{ fontSize: 10.5, fontStyle: "italic", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
          Individuele subcriteria beschikbaar in nieuwe evaluaties
        </p>
      )}
      {schema.subcategories.map((sub) => {
        const val = hasReal ? (subScores![sub.id] ?? fallbackScore) : fallbackScore;
        const sc = getScoreColor(val);
        return (
          <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 132, fontSize: 11, fontWeight: 500, lineHeight: 1.3,
              color: "rgba(255,255,255,0.55)", flexShrink: 0,
            }}>
              {sub.label}
            </div>
            <div style={{
              flex: 1, height: 4, borderRadius: 999,
              background: "rgba(255,255,255,0.05)", overflow: "hidden",
            }}>
              <div
                style={{
                  height: "100%", width: `${val * 10}%`,
                  background: hasReal
                    ? `linear-gradient(90deg, ${sc}, ${sc}99)`
                    : `${sc}40`,
                  borderRadius: 999,
                  boxShadow: hasReal ? `0 0 6px ${sc}66` : "none",
                  transition: "width 0.5s",
                }}
              />
            </div>
            <div style={{
              width: 28, fontSize: 12, fontWeight: 700, textAlign: "right",
              fontFamily: '"JetBrains Mono", monospace',
              color: hasReal ? sc : `${sc}88`,
            }}>
              {hasReal ? val : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── delta badge ─────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (Math.abs(delta) < 0.05) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
        <Minus size={10} /> =
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className="flex items-center gap-0.5 text-[10px] font-bold"
      style={{ color: up ? "#10b981" : "#ef4444" }}
    >
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
}

// ── main evaluation card ─────────────────────────────────────────────────────

function EvaluationCard({
  ev,
  prevEv,
  isLatest,
}: {
  ev: Evaluation;
  prevEv?: Evaluation;
  isLatest: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const overallScore = ev.overall_score ?? 7;
  const rColor = getRatingColor(((overallScore - 1) / 9) * 59 + 40);
  const potentialColor = getPotentialColor(ev.potential_level);
  const potentialLabel = getPotentialLabel(ev.potential_level);

  const radarData =
    ev.scores?.map((s) => ({
      subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category,
      value: s.score,
      fullMark: 10,
    })) ?? [];

  const archetypeMeta = ev.assessed_archetype ? ARCHETYPES[ev.assessed_archetype] : null;
  const positionLabel = ev.assessed_position ? POSITION_LABELS[ev.assessed_position] : null;

  // Calculate per-category delta vs previous evaluation
  const getScoreDelta = (category: EvaluationCategory): number | null => {
    if (!prevEv?.scores?.length) return null;
    const curr = ev.scores?.find((s) => s.category === category)?.score;
    const prev = prevEv.scores?.find((s) => s.category === category)?.score;
    if (curr === undefined || prev === undefined) return null;
    return curr - prev;
  };

  const hasQualitative =
    ev.strengths || ev.improvement_points || ev.player_type_description || ev.position_description;

  return (
    <div style={{
      position: "relative",
      borderRadius: 18,
      overflow: "hidden",
      background: "linear-gradient(180deg, #0D1B2A 0%, #0A1421 100%)",
      border: `1px solid ${isLatest ? "rgba(77,174,229,0.3)" : "rgba(255,255,255,0.06)"}`,
      boxShadow: isLatest
        ? "0 20px 50px rgba(13,27,42,0.4), 0 0 0 1px rgba(77,174,229,0.15), 0 8px 32px rgba(77,174,229,0.18)"
        : "0 12px 32px rgba(13,27,42,0.25)",
      color: "#fff",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        top: -60, right: -60,
        width: 220, height: 220,
        background: `radial-gradient(circle, ${rColor}1C 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Top accent bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${rColor} 0%, ${rColor}66 100%)`,
        boxShadow: `0 0 12px ${rColor}80`,
      }} />

      <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 22, position: "relative", zIndex: 1 }}>
        {/* ── Header row ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 16, flexWrap: "wrap",
        }}>
          <div>
            {isLatest && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                padding: "4px 10px", borderRadius: 999,
                background: "rgba(240,165,0,0.1)",
                border: "1px solid rgba(240,165,0,0.3)",
                color: "#F0A500", textTransform: "uppercase", marginBottom: 10,
              }}>
                <Zap size={11} /> Meest recent
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
              {formatDate(ev.evaluation_date)}
            </div>
            {ev.coach_name && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
                door <span style={{ color: "rgba(255,255,255,0.7)" }}>{ev.coach_name}</span>
              </div>
            )}
            {ev.match_context && (
              <div style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: 6,
              }}>
                {ev.match_context.replace(/_/g, " ")}
              </div>
            )}
          </div>

          {/* Overall score — huge mono */}
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 64, fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: "-0.04em", lineHeight: 0.9,
              color: rColor,
              textShadow: `0 4px 24px ${rColor}50`,
            }}>
              {overallScore.toFixed(1)}
            </div>
            <div style={{
              fontSize: 9, letterSpacing: "0.18em", fontWeight: 700,
              color: "rgba(255,255,255,0.4)", marginTop: 4,
              textTransform: "uppercase",
            }}>
              Totaalscore /10
            </div>
            {prevEv?.overall_score !== undefined && (
              <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
                <DeltaBadge delta={overallScore - prevEv.overall_score} />
              </div>
            )}
          </div>
        </div>

        {/* ── Profile badges ── */}
        {(positionLabel || archetypeMeta || potentialLabel) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {positionLabel && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 600,
                padding: "5px 11px", borderRadius: 999,
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <MapPin size={11} />
                {positionLabel}
              </span>
            )}
            {archetypeMeta && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700,
                padding: "5px 11px", borderRadius: 999,
                background: `${archetypeMeta.color}14`,
                color: archetypeMeta.color,
                border: `1px solid ${archetypeMeta.color}30`,
              }}>
                {archetypeMeta.icon} {archetypeMeta.label}
              </span>
            )}
            {potentialLabel && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700,
                padding: "5px 11px", borderRadius: 999,
                background: `${potentialColor}14`,
                color: potentialColor,
                border: `1px solid ${potentialColor}30`,
              }}>
                <Zap size={11} />
                {potentialLabel}
              </span>
            )}
          </div>
        )}

        {/* ── Coach feedback (qualitative) ── */}
        {hasQualitative && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(ev.player_type_description || ev.position_description) && (
              <div style={{
                padding: 18, borderRadius: 12,
                background: "rgba(77,174,229,0.04)",
                border: "1px solid rgba(77,174,229,0.12)",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                {ev.player_type_description && (
                  <div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                      color: "#4DAEE5", textTransform: "uppercase", marginBottom: 6,
                    }}>
                      Coach analyse · Spelersprofiel
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.88)" }}>
                      {ev.player_type_description}
                    </p>
                  </div>
                )}
                {ev.position_description && (
                  <div style={ev.player_type_description ? {
                    paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)",
                  } : {}}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                      color: "#4DAEE5", textTransform: "uppercase", marginBottom: 6,
                    }}>
                      Functioneren op positie
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.88)" }}>
                      {ev.position_description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(ev.strengths || ev.improvement_points) && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
              }}>
                {ev.strengths && (
                  <div style={{
                    padding: 16, borderRadius: 12,
                    background: "rgba(22,163,74,0.06)",
                    border: "1px solid rgba(22,163,74,0.2)",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
                    }}>
                      <CheckCircle2 size={14} style={{ color: "#16A34A" }} />
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                        color: "#16A34A", textTransform: "uppercase",
                      }}>
                        Sterke punten
                      </span>
                    </div>
                    <p style={{
                      fontSize: 12.5, lineHeight: 1.6,
                      color: "rgba(255,255,255,0.85)", whiteSpace: "pre-line",
                    }}>
                      {ev.strengths}
                    </p>
                  </div>
                )}
                {ev.improvement_points && (
                  <div style={{
                    padding: 16, borderRadius: 12,
                    background: "rgba(240,165,0,0.06)",
                    border: "1px solid rgba(240,165,0,0.2)",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
                    }}>
                      <Target size={14} style={{ color: "#F0A500" }} />
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                        color: "#F0A500", textTransform: "uppercase",
                      }}>
                        Aandachtspunten
                      </span>
                    </div>
                    <p style={{
                      fontSize: 12.5, lineHeight: 1.6,
                      color: "rgba(255,255,255,0.85)", whiteSpace: "pre-line",
                    }}>
                      {ev.improvement_points}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Quantitative scores ── */}
        {radarData.length > 0 && (
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
              marginBottom: 14,
            }}>
              Categoriscore analyse
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              gap: 24,
              alignItems: "start",
            }} className="evcard-radar-row">
              {/* Radar */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
                <PlayerRadarChart data={radarData} color={rColor} size={180} />
              </div>

              {/* Score bars */}
              {ev.scores && ev.scores.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {ev.scores.map((s) => {
                    const catColor = CATEGORY_COLORS[s.category as EvaluationCategory] ?? rColor;
                    const isOpen = expanded === s.category;
                    const subNotes = (s as { sub_notes?: string }).sub_notes;
                    const hasRealSub = !!parseSubScores(subNotes);
                    const schema = EVALUATION_SCHEMA.find((c) => c.id === s.category);
                    const delta = getScoreDelta(s.category as EvaluationCategory);

                    return (
                      <div
                        key={s.category}
                        style={{
                          borderRadius: 12,
                          border: `1px solid ${isOpen ? `${catColor}40` : "rgba(255,255,255,0.06)"}`,
                          background: isOpen
                            ? `linear-gradient(180deg, ${catColor}10 0%, ${catColor}04 100%)`
                            : "rgba(255,255,255,0.02)",
                          overflow: "hidden",
                          transition: "all 0.2s",
                        }}
                      >
                        <button
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 14px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#fff",
                            textAlign: "left",
                          }}
                          onClick={() => setExpanded(isOpen ? null : s.category)}
                        >
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{schema?.icon ?? "⚽"}</span>
                          <span style={{
                            flex: 1, fontSize: 13, fontWeight: 600,
                            color: "rgba(255,255,255,0.92)",
                            letterSpacing: "-0.01em",
                          }}>
                            {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                          </span>
                          <DeltaBadge delta={delta} />
                          <span style={{
                            fontSize: 14, fontWeight: 800,
                            fontFamily: '"JetBrains Mono", monospace',
                            color: catColor, letterSpacing: "-0.02em",
                            padding: "2px 8px", borderRadius: 6,
                            background: `${catColor}14`,
                            border: `1px solid ${catColor}28`,
                          }}>
                            {s.score.toFixed(1)}
                          </span>
                          <div style={{
                            width: 72, height: 4,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.06)",
                            overflow: "hidden", flexShrink: 0,
                          }} className="hidden sm:block">
                            <div
                              style={{
                                height: "100%", width: `${s.score * 10}%`,
                                background: `linear-gradient(90deg, ${catColor}, ${catColor}99)`,
                                borderRadius: 999,
                                boxShadow: `0 0 8px ${catColor}66`,
                              }}
                            />
                          </div>
                          {hasRealSub && (
                            <span
                              className="hidden sm:block"
                              style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                                padding: "2px 6px", borderRadius: 4,
                                background: `${catColor}1A`,
                                color: catColor,
                              }}
                            >
                              DETAIL
                            </span>
                          )}
                          <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-3">
                            <SubCriteriaBreakdown
                              categoryId={s.category}
                              subNotes={subNotes}
                              fallbackScore={s.score}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Coach notities (algemeen) ── */}
        {ev.notes && (
          <div style={{
            padding: 18, borderRadius: 12,
            background: "rgba(240,165,0,0.04)",
            border: "1px solid rgba(240,165,0,0.18)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              color: "#F0A500", textTransform: "uppercase", marginBottom: 8,
            }}>
              Algemene Notitie · Coach
            </div>
            <p style={{
              fontSize: 13.5, lineHeight: 1.6,
              color: "rgba(255,255,255,0.85)",
              fontStyle: "italic",
            }}>
              &ldquo;{ev.notes}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function PlayerEvaluationsPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [noPlayerRecord, setNoPlayerRecord] = useState(false);

  useEffect(() => {
    getMyPlayerData().then((p) => {
      if (p === null) setNoPlayerRecord(true);
      setPlayer(p);
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <div style={{
        minHeight: "calc(100vh - 52px)", background: "#0A0E14",
        margin: "-28px -28px -40px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#4DAEE5" }} />
      </div>
    );

  if (noPlayerRecord)
    return (
      <div style={{
        margin: "-28px -28px -40px",
        minHeight: "calc(100vh - 52px)",
        background: "#0A0E14",
        color: "#fff",
        padding: "40px 28px",
      }}>
        <div style={{ maxWidth: 460, margin: "60px auto 0", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "rgba(77,174,229,0.1)",
            border: "1px solid rgba(77,174,229,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#4DAEE5", margin: "0 auto 18px",
          }}>
            <Activity size={28} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Profiel nog niet aangemaakt
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 22, lineHeight: 1.55 }}>
            Je spelersprofiel is nog niet ingesteld. Rond de onboarding af zodat
            je coach je kan vinden en evalueren.
          </p>
          <a
            href="/onboarding"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 22px", borderRadius: 8,
              background: "linear-gradient(180deg, #4DAEE5 0%, #1B6CA8 100%)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(77,174,229,0.3)",
            }}
          >
            Profiel instellen
          </a>
        </div>
      </div>
    );

  const evaluations = player?.evaluations ?? [];
  const progressData = buildProgressData(evaluations);

  const latestEval = evaluations[0];
  const latestRadarData =
    latestEval?.scores?.map((s) => ({
      subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category,
      value: s.score,
      fullMark: 10,
    })) ?? [];
  const latestColor = latestEval
    ? getRatingColor(((latestEval.overall_score ?? 7) - 1) / 9 * 59 + 40)
    : "#4FA9E6";

  // Summary stats
  const avgScore =
    evaluations.length > 0
      ? evaluations.reduce((acc, ev) => acc + (ev.overall_score ?? 0), 0) / evaluations.length
      : 0;
  const trend =
    evaluations.length >= 2
      ? (evaluations[0].overall_score ?? 0) - (evaluations[1].overall_score ?? 0)
      : null;

  return (
    <div style={{
      margin: "-28px -28px -40px",
      minHeight: "calc(100vh - 52px)",
      background: "#0A0E14",
      color: "#fff",
      padding: "36px 28px 60px",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient background mesh */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse at 15% 0%, rgba(27,108,168,0.15), transparent 50%),
          radial-gradient(ellipse at 85% 30%, rgba(240,165,0,0.06), transparent 55%),
          radial-gradient(ellipse at 50% 100%, rgba(77,174,229,0.06), transparent 60%)
        `,
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 1280, margin: "0 auto", position: "relative",
        display: "flex", flexDirection: "column", gap: 28,
      }}>
        {/* ── Page header ── */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 20, flexWrap: "wrap",
        }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
              padding: "4px 10px", borderRadius: 999,
              background: "rgba(77,174,229,0.1)",
              color: "#4DAEE5", textTransform: "uppercase", marginBottom: 12,
            }}>
              <ClipboardList size={11} /> Coach beoordelingsrapport
            </div>
            <h1 style={{
              fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em",
              lineHeight: 1, marginBottom: 8, color: "#fff",
            }}>
              Mijn Evaluaties
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
              {evaluations.length > 0
                ? `${evaluations.length} ${evaluations.length === 1 ? "evaluatie" : "evaluaties"} · van je coach`
                : "Nog geen evaluaties beschikbaar"}
            </p>
          </div>

          {/* Quick stats */}
          {evaluations.length > 0 && (
            <div style={{ display: "flex", gap: 12 }}>
              <StatBubble label="Laatste" value={latestEval?.overall_score?.toFixed(1) ?? "—"} color={latestColor} />
              <StatBubble label="Gemiddeld" value={avgScore.toFixed(1)} color="#fff" />
              {trend !== null && (
                <StatBubble
                  label="Trend"
                  value={`${trend > 0 ? "+" : ""}${trend.toFixed(1)}`}
                  color={trend >= 0 ? "#16A34A" : "#D64045"}
                  icon={trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Performance radar (laatste evaluatie) ── */}
        {latestRadarData.length > 0 && (
          <div style={{
            padding: 32, borderRadius: 18,
            background: "linear-gradient(180deg, #0D1B2A 0%, #0A1421 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -60, right: -60,
              width: 240, height: 240,
              background: `radial-gradient(circle, ${latestColor}1A 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
              color: "#4DAEE5", textTransform: "uppercase", marginBottom: 4,
            }}>
              Performance Radar
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
              {latestEval ? formatDate(latestEval.evaluation_date) : ""}
              {latestEval?.overall_score !== undefined && (
                <span style={{ marginLeft: 8, fontWeight: 700, color: latestColor }}>
                  {latestEval.overall_score.toFixed(1)}/10
                </span>
              )}
              <span style={{ marginLeft: 6 }}>— meest recente evaluatie</span>
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PlayerRadarChart data={latestRadarData} color={latestColor} size={280} />
            </div>
          </div>
        )}

        {/* ── Progressie grafiek ── */}
        {progressData.length > 1 && (
          <div style={{
            padding: 24, borderRadius: 18,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 14,
            }}>
              Progressie over tijd
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "12px 8px" }}>
              <ProgressLineChart data={progressData} showCategories height={200} />
            </div>
          </div>
        )}

        {/* ── Individuele evaluaties ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {evaluations.length === 0 ? (
            <div style={{
              padding: "48px 32px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.1)",
              textAlign: "center",
              maxWidth: 560, margin: "0 auto",
              display: "flex", flexDirection: "column", gap: 12,
              alignItems: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "rgba(77,174,229,0.1)",
                border: "1px solid rgba(77,174,229,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#4DAEE5",
              }}>
                <ClipboardList size={26} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                Nog geen evaluaties
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.55, maxWidth: 380 }}>
                Je coach heeft nog geen beoordeling ingevuld. Zodra een evaluatie
                is aangemaakt, verschijnt je rapport hier.
              </p>
              <div style={{
                marginTop: 12, padding: "14px 18px", borderRadius: 12,
                background: "rgba(77,174,229,0.04)",
                border: "1px solid rgba(77,174,229,0.15)",
                fontSize: 11.5, color: "rgba(255,255,255,0.6)",
                lineHeight: 1.7, textAlign: "left",
              }}>
                <p style={{ fontWeight: 700, color: "#4DAEE5", marginBottom: 4 }}>Hoe werkt het?</p>
                <p>1. Coach logt in op Performance Hub</p>
                <p>2. Gaat naar <strong style={{ color: "rgba(255,255,255,0.85)" }}>Spelers → jouw naam</strong></p>
                <p>3. Klikt op <strong style={{ color: "rgba(255,255,255,0.85)" }}>Evaluatie aanmaken</strong></p>
                <p>4. Jij ontvangt het rapport hier automatisch</p>
              </div>
            </div>
          ) : (
            evaluations.map((ev, i) => (
              <EvaluationCard
                key={ev.id}
                ev={ev}
                prevEv={evaluations[i + 1]}
                isLatest={i === 0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatBubble({ label, value, color, icon }: {
  label: string; value: string; color: string; icon?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: "14px 18px",
      borderRadius: 12,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      textAlign: "center", minWidth: 90,
    }}>
      <div style={{
        fontSize: 22, fontWeight: 800,
        fontFamily: '"JetBrains Mono", monospace',
        color, letterSpacing: "-0.03em", lineHeight: 1,
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        {icon}
        {value}
      </div>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
        color: "rgba(255,255,255,0.4)", marginTop: 6,
        textTransform: "uppercase",
      }}>
        {label}
      </div>
    </div>
  );
}
