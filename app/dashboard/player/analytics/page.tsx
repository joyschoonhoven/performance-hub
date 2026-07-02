"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS } from "@/lib/types";
import { getRatingColor, getScoreColor } from "@/lib/utils";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import type { PlayerWithDetails, DailyCheckin, EvaluationCategory } from "@/lib/types";
import {
  Activity, TrendingUp, TrendingDown, Loader2, Award, HeartPulse,
  Star, ClipboardList, ChevronRight,
} from "lucide-react";

/* ── check-in metrics (fillable, no device needed) ── */
type CKey = "sleep_quality" | "perceived_recovery" | "energy_level" | "mood" | "motivation" | "soreness";
const CK_METRICS: { key: CKey; label: string; color: string; invert?: boolean }[] = [
  { key: "sleep_quality",      label: "Slaap",     color: "#8b5cf6" },
  { key: "perceived_recovery", label: "Herstel",   color: "#16A34A" },
  { key: "energy_level",       label: "Energie",   color: "#4FA9E6" },
  { key: "mood",               label: "Stemming",  color: "#f59e0b" },
  { key: "motivation",         label: "Motivatie", color: "#6366f1" },
  { key: "soreness",           label: "Spierpijn", color: "#ef4444", invert: true },
];

export default function PlayerAnalyticsPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyPlayerData();
        setPlayer(p);
        if (p?.id) {
          const sb = createClient();
          const { data } = await sb.from("daily_checkins").select("*")
            .eq("player_id", p.id).order("checkin_date", { ascending: false }).limit(30);
          setCheckins((data ?? []) as DailyCheckin[]);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const evaluations = player?.evaluations ?? [];
  const latestEval = evaluations[0];
  const prevEval = evaluations[1];

  const progressData = useMemo(() => [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const m: Record<string, number> = {};
      ev.scores?.forEach((s) => { m[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...m };
    }), [evaluations]);

  const radarData = useMemo(() => {
    if (latestEval?.scores?.length) {
      return latestEval.scores.map((s) => ({
        subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category,
        value: s.score, fullMark: 10,
      }));
    }
    if (player?.recent_scores) {
      return Object.entries(player.recent_scores).map(([cat, score]) => ({
        subject: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat,
        value: score as number, fullMark: 10,
      }));
    }
    return [];
  }, [latestEval, player]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin" style={{ color: "#4FA9E6" }} />
    </div>
  );

  /* KPIs — all from fillable data */
  const overall = player?.overall_rating ?? 0;
  const rColor = getRatingColor(overall);
  const avgScore = evaluations.length
    ? evaluations.reduce((a, e) => a + (e.overall_score ?? 0), 0) / evaluations.filter(e => e.overall_score != null).length || 0
    : 0;
  const streak = calcStreak(checkins);

  // best / weakest category from latest eval
  const catScores = (latestEval?.scores ?? []).map(s => ({
    cat: s.category as EvaluationCategory, label: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS], score: s.score,
  }));
  const bestCat = catScores.length ? [...catScores].sort((a,b)=>b.score-a.score)[0] : null;

  // overall delta vs previous eval
  const delta = latestEval?.overall_score != null && prevEval?.overall_score != null
    ? latestEval.overall_score - prevEval.overall_score : null;

  const noData = evaluations.length === 0 && checkins.length === 0;

  return (
    <motion.div className="space-y-6"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black flex items-center gap-3"
          style={{ color: "var(--color-text-primary)", fontFamily: "Outfit, sans-serif" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(79,169,230,0.1)", border: "1px solid rgba(79,169,230,0.2)" }}>
            <Activity size={18} style={{ color: "#4FA9E6" }} />
          </div>
          Performance Analytics
        </h1>
        <p className="text-sm mt-1 ml-12" style={{ color: "var(--color-text-muted)" }}>
          {evaluations.length} evaluaties · {checkins.length} check-ins · gebaseerd op coach- en check-in data
        </p>
      </div>

      {noData ? (
        <div className="hub-card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(79,169,230,0.1)" }}>
            <ClipboardList size={24} style={{ color: "#4FA9E6" }} />
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Nog geen data</h3>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
            Analytics vult zich met jouw <b>coach-evaluaties</b> en dagelijkse <b>check-ins</b> — geen meetapparatuur nodig.
          </p>
          <Link href="/dashboard/player/checkin"
            className="inline-flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-lg"
            style={{ background: "linear-gradient(135deg,#4FA9E6,#1B6CA8)", color: "#fff" }}>
            Check-in invullen <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          {/* Hero KPIs */}
          <div className="relative hub-card overflow-hidden p-6">
            <div className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, transparent, ${rColor}, #4FA9E6, transparent)` }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Kpi label="Overall" value={overall || "—"} color={rColor} icon={<Award size={13} />}
                sub={delta != null ? `${delta>0?"+":""}${delta.toFixed(1)} vs vorige` : "coach-rating"}
                deltaUp={delta != null ? delta >= 0 : undefined} />
              <Kpi label="Gem. score" value={avgScore ? avgScore.toFixed(1) : "—"} color="#8b5cf6"
                icon={<Activity size={13} />} sub={`${evaluations.length} evaluaties`} />
              <Kpi label="Beste categorie" value={bestCat ? bestCat.score.toFixed(1) : "—"} color="#16A34A"
                icon={<Star size={13} />} sub={bestCat?.label ?? "—"} />
              <Kpi label="Check-ins" value={checkins.length} color="#4FA9E6"
                icon={<HeartPulse size={13} />} sub="ingevuld" />
              <Kpi label="Streak" value={streak} color="#f59e0b"
                icon={<TrendingUp size={13} />} sub={streak === 1 ? "dag" : "dagen"} />
            </div>
          </div>

          {/* Radar + category scores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="hub-card p-5">
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Evaluatie Radar</div>
              {radarData.length > 0 ? (
                <PlayerRadarChart data={radarData} color={rColor} size={260} />
              ) : (
                <EmptyBox text="Nog geen evaluatie ontvangen" />
              )}
            </div>
            <div className="hub-card p-5">
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Categorie Scores</div>
              {catScores.length > 0 ? (
                <div className="space-y-4">
                  {catScores.map((c) => {
                    const sc = getScoreColor(c.score);
                    return (
                      <div key={c.cat}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{c.label}</span>
                          <span className="text-sm font-black tabular-nums" style={{ color: sc }}>{c.score.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${c.score * 10}%`, backgroundColor: sc }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyBox text="Nog geen score data" />
              )}
            </div>
          </div>

          {/* Evaluation progression */}
          {progressData.length > 1 && (
            <div className="hub-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} style={{ color: "#4FA9E6" }} />
                <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Evaluatie Progressie</span>
              </div>
              <ProgressLineChart data={progressData} showCategories height={220} />
            </div>
          )}

          {/* Wellbeing trends from check-ins */}
          {checkins.length > 0 && (
            <div className="hub-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <HeartPulse size={14} style={{ color: "#4FA9E6" }} />
                <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Welzijn trends</span>
                <span className="text-[11px] ml-auto" style={{ color: "var(--color-text-muted)" }}>laatste {Math.min(checkins.length, 14)} check-ins</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {CK_METRICS.map((m) => (
                  <WellbeingTrend key={m.key} metric={m} checkins={checkins} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

/* ── KPI card ── */
function Kpi({ label, value, sub, color, icon, deltaUp }: {
  label: string; value: string | number; sub?: string; color: string;
  icon?: React.ReactNode; deltaUp?: boolean;
}) {
  return (
    <div className="rounded-xl p-3 hub-surface">
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <span className="hub-label text-[10px]">{label}</span>
      </div>
      <div className="text-2xl font-black tabular-nums leading-none"
        style={{ color, fontFamily: "Outfit, sans-serif" }}>{value}</div>
      {sub && (
        <div className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
          {deltaUp !== undefined && (deltaUp ? <TrendingUp size={10} style={{color:"#16A34A"}}/> : <TrendingDown size={10} style={{color:"#ef4444"}}/>)}
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── Wellbeing trend row: mini bars + avg ── */
function WellbeingTrend({ metric, checkins }: {
  metric: { key: CKey; label: string; color: string; invert?: boolean };
  checkins: DailyCheckin[];
}) {
  // chronological last 14
  const series = [...checkins].reverse().slice(-14)
    .map(c => c[metric.key] as number | undefined)
    .filter(v => v != null) as number[];
  const avg = series.length ? series.reduce((a,b)=>a+b,0)/series.length : null;
  const latest = series[series.length-1];
  const W = 200, H = 44;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{metric.label}</span>
        <span className="text-xs font-black tabular-nums" style={{ color: metric.color, fontFamily: "Outfit, sans-serif" }}>
          {avg != null ? avg.toFixed(1) : "—"}<span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}> gem</span>
        </span>
      </div>
      {series.length >= 1 ? (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: H, display: "block" }}>
          {series.map((v, i) => {
            const bw = (W / Math.max(series.length, 1)) * 0.62;
            const gap = (W / Math.max(series.length, 1)) - bw;
            const x = i * (bw + gap) + gap / 2;
            const h = Math.max((v / 10) * (H - 4), 2);
            const isLast = i === series.length - 1;
            return <rect key={i} x={x} y={H - h} width={bw} height={h} rx={1.5}
              fill={metric.color} opacity={isLast ? 1 : 0.35} />;
          })}
        </svg>
      ) : (
        <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Geen data</div>
      )}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--color-text-muted)" }}>
      {text}
    </div>
  );
}

/* consecutive check-in streak */
function calcStreak(checkins: DailyCheckin[]): number {
  if (!checkins.length) return 0;
  const dates = new Set(checkins.map(c => c.checkin_date.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  if (!dates.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (dates.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
