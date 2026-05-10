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
    <div className="mt-3 pt-3 border-t border-hub-border space-y-2.5">
      {!hasReal && (
        <p className="text-[10px] italic mb-1" style={{ color: 'var(--color-text-muted)' }}>
          Individuele subcriteria beschikbaar in nieuwe evaluaties
        </p>
      )}
      {schema.subcategories.map((sub) => {
        const val = hasReal ? (subScores![sub.id] ?? fallbackScore) : fallbackScore;
        const sc = getScoreColor(val);
        return (
          <div key={sub.id} className="flex items-center gap-3">
            <div
              className="w-36 text-[11px] font-medium leading-tight flex-shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {sub.label}
            </div>
            <div className="flex-1 h-1.5 bg-hub-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${val * 10}%`, backgroundColor: hasReal ? sc : `${sc}60` }}
              />
            </div>
            <div
              className="text-xs font-bold w-6 text-right tabular-nums flex-shrink-0"
              style={{ color: hasReal ? sc : `${sc}80` }}
            >
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
    <div className={`hub-card overflow-hidden ${isLatest ? "ring-1 ring-hub-teal/25" : ""}`}>
      {/* ── Top accent bar ──────────────────────────────────────────────── */}
      <div className="h-1 w-full" style={{ background: rColor }} />

      <div className="p-5 space-y-5">
        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            {isLatest && (
              <div
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5"
                style={{ background: "rgba(79,169,230,0.1)", color: "#4FA9E6" }}
              >
                Meest recent
              </div>
            )}
            <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {formatDate(ev.evaluation_date)}
            </div>
            {ev.coach_name && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                door {ev.coach_name}
              </div>
            )}
            {ev.match_context && (
              <div
                className="text-[10px] mt-0.5 uppercase tracking-wider font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {ev.match_context.replace(/_/g, " ")}
              </div>
            )}
          </div>

          {/* Overall score */}
          <div className="text-right">
            <div
              className="text-3xl font-black tabular-nums leading-none"
              style={{ color: rColor, fontFamily: "'Bebas Neue', Inter, sans-serif" }}
            >
              {overallScore.toFixed(1)}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              /10 totaalscore
            </div>
            {prevEv?.overall_score !== undefined && (
              <div className="mt-1">
                <DeltaBadge delta={overallScore - prevEv.overall_score} />
              </div>
            )}
          </div>
        </div>

        {/* ── Profiel badges: positie · archetype · potentieel ─────────── */}
        {(positionLabel || archetypeMeta || potentialLabel) && (
          <div className="flex flex-wrap gap-2">
            {positionLabel && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                <MapPin size={11} />
                {positionLabel}
              </span>
            )}
            {archetypeMeta && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: `${archetypeMeta.color}15`, color: archetypeMeta.color, border: `1px solid ${archetypeMeta.color}30` }}
              >
                {archetypeMeta.icon} {archetypeMeta.label}
              </span>
            )}
            {potentialLabel && (
              <span
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${potentialColor}15`, color: potentialColor, border: `1px solid ${potentialColor}30` }}
              >
                <Zap size={11} />
                {potentialLabel}
              </span>
            )}
          </div>
        )}

        {/* ── Kwalitatieve coach feedback ───────────────────────────────── */}
        {hasQualitative && (
          <div className="space-y-3">
            {/* Spelertype / positiebeschrijving */}
            {(ev.player_type_description || ev.position_description) && (
              <div
                className="p-4 rounded-xl space-y-2"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                {ev.player_type_description && (
                  <div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Coach analyse — spelersprofiel
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                      {ev.player_type_description}
                    </p>
                  </div>
                )}
                {ev.position_description && (
                  <div className={ev.player_type_description ? "pt-2 border-t border-hub-border" : ""}>
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Functioneren op positie
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                      {ev.position_description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sterke punten + verbeterpunten */}
            {(ev.strengths || ev.improvement_points) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ev.strengths && (
                  <div
                    className="p-3.5 rounded-xl"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                        Sterke punten
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-text-primary)' }}>
                      {ev.strengths}
                    </p>
                  </div>
                )}
                {ev.improvement_points && (
                  <div
                    className="p-3.5 rounded-xl"
                    style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target size={14} className="text-orange-400 flex-shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                        Aandachtspunten
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-text-primary)' }}>
                      {ev.improvement_points}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Kwantitatieve scores: radar + categoriebars ───────────────── */}
        {radarData.length > 0 && (
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Categoriscore analyse
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Mini radar */}
              <div className="flex items-center justify-center md:justify-start flex-shrink-0">
                <PlayerRadarChart data={radarData} color={rColor} size={170} />
              </div>

              {/* Score bars */}
              {ev.scores && ev.scores.length > 0 && (
                <div className="flex-1 space-y-1.5">
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
                        className="rounded-xl border transition-all overflow-hidden"
                        style={{
                          borderColor: isOpen ? `${catColor}40` : 'var(--color-border)',
                          background: isOpen ? `${catColor}08` : 'var(--color-surface)',
                        }}
                      >
                        <button
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#F5F6F8] transition-colors"
                          onClick={() => setExpanded(isOpen ? null : s.category)}
                        >
                          <span className="text-sm flex-shrink-0">{schema?.icon ?? "⚽"}</span>
                          <span
                            className="flex-1 text-xs font-semibold"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                          </span>
                          <DeltaBadge delta={delta} />
                          <span
                            className="text-xs font-black tabular-nums px-2 py-0.5 rounded-full"
                            style={{ background: `${catColor}15`, color: catColor }}
                          >
                            {s.score.toFixed(1)}
                          </span>
                          <div className="hidden sm:block w-16 h-1.5 bg-hub-border rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${s.score * 10}%`, backgroundColor: catColor }}
                            />
                          </div>
                          {hasRealSub && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded hidden sm:block"
                              style={{ background: `${catColor}15`, color: catColor }}
                            >
                              DETAIL
                            </span>
                          )}
                          <span className="flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                            {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
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

        {/* ── Coach notities (algemeen) ─────────────────────────────────── */}
        {ev.notes && (
          <div
            className="p-3.5 rounded-xl text-xs italic leading-relaxed"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider not-italic mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Algemene notitie
            </div>
            &ldquo;{ev.notes}&rdquo;
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
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-hub-teal" />
      </div>
    );

  if (noPlayerRecord)
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-black flex items-center gap-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ClipboardList size={24} className="text-hub-teal" />
            Mijn Evaluaties
          </h1>
        </div>
        <div className="hub-card p-12 text-center max-w-md mx-auto space-y-4">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "rgba(79,169,230,0.08)", border: "1px solid rgba(79,169,230,0.2)" }}
          >
            <Activity size={28} style={{ color: "#4FA9E6" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Profiel nog niet aangemaakt
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Je spelersprofiel is nog niet ingesteld. Rond de onboarding af zodat je coach je kan
            vinden en evalueren.
          </p>
          <a
            href="/onboarding"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#4FA9E6" }}
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
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black flex items-center gap-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ClipboardList size={24} className="text-hub-teal" />
            Mijn Evaluaties
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {evaluations.length > 0
              ? `${evaluations.length} ${evaluations.length === 1 ? "evaluatie" : "evaluaties"} — officieel beoordelingsrapport`
              : "Nog geen evaluaties beschikbaar"}
          </p>
        </div>

        {/* Quick stats */}
        {evaluations.length > 0 && (
          <div className="flex gap-3">
            <div className="hub-card px-4 py-3 text-center">
              <div
                className="text-xl font-black tabular-nums"
                style={{ color: latestColor, fontFamily: "'Bebas Neue', Inter, sans-serif" }}
              >
                {latestEval?.overall_score?.toFixed(1) ?? "—"}
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Laatste
              </div>
            </div>
            <div className="hub-card px-4 py-3 text-center">
              <div
                className="text-xl font-black tabular-nums"
                style={{ color: 'var(--color-text-primary)', fontFamily: "'Bebas Neue', Inter, sans-serif" }}
              >
                {avgScore.toFixed(1)}
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Gemiddeld
              </div>
            </div>
            {trend !== null && (
              <div className="hub-card px-4 py-3 text-center">
                <div
                  className="text-xl font-black tabular-nums flex items-center justify-center gap-0.5"
                  style={{ color: trend >= 0 ? "#10b981" : "#ef4444", fontFamily: "'Bebas Neue', Inter, sans-serif" }}
                >
                  {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {trend > 0 ? "+" : ""}{trend.toFixed(1)}
                </div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Trend
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Performance radar (laatste evaluatie) ─────────────────────── */}
      {latestRadarData.length > 0 && (
        <div
          className="hub-card p-6"
          style={{ border: "1px solid rgba(79,169,230,0.18)", background: 'var(--color-surface-2)' }}
        >
          <div className="hub-label mb-0.5">Performance Radar</div>
          <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
            {latestEval ? formatDate(latestEval.evaluation_date) : ""}
            {latestEval?.overall_score !== undefined && (
              <span className="ml-2 font-bold" style={{ color: latestColor }}>
                {latestEval.overall_score.toFixed(1)}/10
              </span>
            )}
            <span className="ml-1" style={{ color: 'var(--color-text-muted)' }}>— meest recente evaluatie</span>
          </p>
          <div className="flex justify-center">
            <PlayerRadarChart data={latestRadarData} color={latestColor} size={280} />
          </div>
        </div>
      )}

      {/* ── Progressie grafiek ─────────────────────────────────────────── */}
      {progressData.length > 1 && (
        <div className="hub-card p-5">
          <div className="hub-label mb-4">Progressie over tijd</div>
          <ProgressLineChart data={progressData} showCategories height={200} />
        </div>
      )}

      {/* ── Individuele evaluaties ─────────────────────────────────────── */}
      <div className="space-y-4">
        {evaluations.length === 0 ? (
          <div className="hub-card p-12 text-center space-y-3">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "rgba(79,169,230,0.08)", border: "1px solid rgba(79,169,230,0.2)" }}
            >
              <ClipboardList size={26} style={{ color: "#4FA9E6" }} />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Nog geen evaluaties
            </h3>
            <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              Je coach heeft nog geen beoordeling ingevuld. Zodra een evaluatie is aangemaakt, zie
              je hier je volledig spelersrapport.
            </p>
            <div
              className="mt-2 px-4 py-3 rounded-xl text-xs text-left space-y-1"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Hoe werkt het?</p>
              <p>1. Coach logt in op Performance Hub</p>
              <p>
                2. Gaat naar <strong>Spelers → jouw naam</strong>
              </p>
              <p>
                3. Klikt op <strong>Evaluatie aanmaken</strong>
              </p>
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
  );
}
