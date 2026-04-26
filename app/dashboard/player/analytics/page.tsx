"use client";

import { useState, useEffect, useMemo } from "react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { CATEGORY_LABELS } from "@/lib/types";
import { getRatingColor, getScoreColor } from "@/lib/utils";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { PerformanceIndexCard } from "@/components/PerformanceIndexCard";
import {
  getPlayerMatchStats, aggregateSeasonStats,
  getIndexLabel, calculatePlayerIndex,
  type MatchStat,
} from "@/lib/match-stats";
import type { PlayerWithDetails } from "@/lib/types";
import {
  Activity, TrendingUp, Loader2, Target, Shield,
  Footprints, Swords, ChevronRight, Calendar,
} from "lucide-react";

// ── Percentile bar ───────────────────────────────────────────
function PercentileBar({
  label, value, max, format, color, icon,
}: {
  label: string; value: number; max: number; format?: string; color: string;
  icon?: React.ReactNode;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 flex-shrink-0" style={{ color }}>{icon}</div>
      <div className="w-28 flex-shrink-0">
        <span className="text-xs text-slate-600 font-medium">{label}</span>
      </div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(15,40,70,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
        />
      </div>
      <div className="w-14 text-right text-xs font-black tabular-nums" style={{ color, fontFamily: "Outfit, sans-serif" }}>
        {value}{format ?? ""}
      </div>
    </div>
  );
}

// ── Match row ────────────────────────────────────────────────
function MatchRow({ stat }: { stat: MatchStat }) {
  const myGoals = stat.home_away === "home"
    ? parseInt(stat.result.split("-")[0])
    : parseInt(stat.result.split("-")[1]);
  const theirGoals = stat.home_away === "home"
    ? parseInt(stat.result.split("-")[1])
    : parseInt(stat.result.split("-")[0]);
  const outcome = myGoals > theirGoals ? "W" : myGoals === theirGoals ? "G" : "V";
  const outcomeColor = outcome === "W" ? "#10B981" : outcome === "G" ? "#f59e0b" : "#ef4444";
  const { color: idxColor } = getIndexLabel(stat.player_index ?? 0);

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(79,169,230,0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Date */}
      <div className="w-14 flex-shrink-0">
        <div className="text-[11px] font-bold text-slate-700">
          {new Date(stat.match_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
        </div>
      </div>
      {/* Result badge */}
      <span className="w-6 h-6 flex items-center justify-center text-[10px] font-black rounded flex-shrink-0"
        style={{ background: `${outcomeColor}20`, color: outcomeColor }}>
        {outcome}
      </span>
      {/* Opponent */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-800 truncate">{stat.opponent}</div>
        <div className="text-[10px] text-slate-400">{stat.competition} · {stat.result}</div>
      </div>
      {/* Quick stats */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-center w-6">
          <div className="text-xs font-black tabular-nums"
            style={{ color: stat.goals > 0 ? "#10B981" : "#cbd5e1" }}>
            {stat.goals}G
          </div>
        </div>
        <div className="text-center w-6">
          <div className="text-xs font-black tabular-nums"
            style={{ color: stat.assists > 0 ? "#f59e0b" : "#cbd5e1" }}>
            {stat.assists}A
          </div>
        </div>
        <div className="text-center w-10">
          <div className="text-[11px] text-slate-500 tabular-nums">{stat.pass_accuracy}%</div>
        </div>
        {/* Rating */}
        <div className="text-center w-8">
          <span className="text-sm font-black tabular-nums"
            style={{
              color: stat.match_rating >= 8 ? "#10B981" : stat.match_rating >= 6.5 ? "#f59e0b" : "#ef4444",
              fontFamily: "Outfit, sans-serif",
            }}>
            {stat.match_rating.toFixed(1)}
          </span>
        </div>
        {/* Index */}
        <div className="w-9 h-6 flex items-center justify-center rounded-md text-[11px] font-black"
          style={{ background: `${idxColor}18`, color: idxColor }}>
          {stat.player_index}
        </div>
      </div>
    </div>
  );
}

// ── Index trend chart (simple SVG sparkline) ─────────────────
function IndexSparkline({ stats }: { stats: MatchStat[] }) {
  const indices = [...stats].reverse().map((s) => s.player_index ?? 0);
  if (indices.length < 2) return null;

  const W = 300, H = 60;
  const pad = 8;
  const min = Math.max(0, Math.min(...indices) - 5);
  const max = Math.min(100, Math.max(...indices) + 5);
  const range = max - min || 1;

  const pts = indices.map((v, i) => {
    const x = pad + (i / (indices.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });

  const pathD = pts.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(" ");
  const fillD = `${pathD} L${pts[pts.length - 1].split(",")[0]},${H} L${pts[0].split(",")[0]},${H} Z`;

  const lastIndex = indices[indices.length - 1];
  const { color } = getIndexLabel(lastIndex);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }}>
      <defs>
        <linearGradient id="idx-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#idx-fill)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {indices.map((v, i) => {
        const x = pad + (i / (indices.length - 1)) * (W - pad * 2);
        const y = H - pad - ((v - min) / range) * (H - pad * 2);
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
export default function PlayerAnalyticsPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"season" | "matches" | "radar">("radar");

  useEffect(() => {
    getMyPlayerData().then((p) => { setPlayer(p); setLoading(false); });
  }, []);

  // For demo: use Lars (p0000001) stats
  const playerId = "p0000001";
  const matchStats = useMemo(() => getPlayerMatchStats(playerId), []);
  const season = useMemo(() => aggregateSeasonStats(matchStats), [matchStats]);
  const { color: idxColor } = getIndexLabel(season.season_index);

  const evaluations = player?.evaluations ?? [];
  const progressData = [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });

  const latestEval = evaluations[0];

  // Build radar from latest evaluation — fallback to recent_scores (the 5 training scores always present)
  const SCORE_LABEL_MAP: Record<string, string> = {
    techniek: "Techniek",
    fysiek: "Fysiek",
    tactiek: "Tactiek",
    mentaal: "Mentaal",
    teamplay: "Teamplay",
  };

  const radarData: { subject: string; value: number; fullMark: number }[] =
    latestEval?.scores?.length
      ? latestEval.scores.map((s) => ({
          subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category,
          value: s.score,
          fullMark: 10,
        }))
      : player?.recent_scores
      ? Object.entries(player.recent_scores).map(([cat, score]) => ({
          subject: SCORE_LABEL_MAP[cat] ?? cat,
          value: score as number,
          fullMark: 10,
        }))
      : [];

  const rColor = getRatingColor(player?.overall_rating ?? 65);

  // Previous index (3 matches ago)
  const prevIndex = matchStats.length >= 4
    ? (matchStats[3].player_index ?? calculatePlayerIndex(matchStats[3]))
    : undefined;

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black flex items-center gap-3"
          style={{ color: "#0A2540", fontFamily: "Outfit, sans-serif" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(79,169,230,0.1)", border: "1px solid rgba(79,169,230,0.2)" }}>
            <Activity size={18} style={{ color: "#4FA9E6" }} />
          </div>
          Performance Analytics
        </h1>
        <p className="text-slate-500 text-sm mt-1 ml-12">
          Seizoen 2024/25 · {season.matches} wedstrijden · {season.minutes} minuten
        </p>
      </div>

      {/* Hero strip: Index + key stats */}
      <div className="relative rounded-3xl overflow-hidden p-6"
        style={{ background: "linear-gradient(150deg, #060e1c 0%, #0A2540 45%, #0d3060 100%)" }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: idxColor }} />
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${idxColor}, #4FA9E6, transparent)` }} />

        <div className="relative z-10 flex items-start gap-8">
          {/* Index ring */}
          <div className="flex-shrink-0">
            <PerformanceIndexCard
              index={season.season_index}
              previousIndex={prevIndex}
              matches={season.matches}
              position={player?.position}
              size="lg"
            />
          </div>

          {/* Season stats grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Doelpunten", value: season.goals, sub: `${season.goals_per_90}/90'`, color: "#10B981", icon: <Target size={13} /> },
              { label: "Assists", value: season.assists, sub: `${season.assists_per_90}/90'`, color: "#f59e0b", icon: <TrendingUp size={13} /> },
              { label: "Rating", value: season.avg_rating, sub: "gemiddeld", color: "#8b5cf6", icon: <Activity size={13} />, suffix: "/10" },
              { label: "Pass%", value: `${season.avg_pass_accuracy}%`, sub: "nauwkeurigheid", color: "#4FA9E6", icon: <Footprints size={13} /> },
              { label: "Key passes", value: season.key_passes, sub: "kansen gecreëerd", color: "#6366f1", icon: <ChevronRight size={13} /> },
              { label: "Duel%", value: `${season.duel_success_pct}%`, sub: "gewonnen", color: "#ef4444", icon: <Swords size={13} /> },
              { label: "Tackles", value: season.tackles, sub: "totaal", color: "#64748b", icon: <Shield size={13} /> },
              { label: "Wedstrijden", value: season.matches, sub: `${season.minutes}'`, color: "#4FA9E6", icon: <Calendar size={13} /> },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-1.5 mb-1.5" style={{ color: s.color }}>
                  {s.icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{s.label}</span>
                </div>
                <div className="text-2xl font-black tabular-nums leading-none"
                  style={{ color: s.color, fontFamily: "Outfit, sans-serif" }}>
                  {s.value}{(s as { suffix?: string }).suffix ?? ""}
                </div>
                <div className="text-[10px] text-white/25 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Index sparkline */}
        {matchStats.length >= 3 && (
          <div className="relative z-10 mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Performance Index verloop</div>
            <IndexSparkline stats={matchStats} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl w-fit"
        style={{ background: "rgba(15,40,70,0.05)" }}>
        {([
          { key: "season", label: "Seizoen Stats" },
          { key: "matches", label: "Wedstrijden" },
          { key: "radar", label: "Evaluatie Radar" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={tab === t.key
              ? { background: "white", color: "#0A2540", boxShadow: "0 1px 4px rgba(15,40,70,0.1)" }
              : { color: "#64748b" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Season tab */}
      {tab === "season" && (
        <div className="space-y-4">
          {/* Attacking */}
          <div className="hub-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={14} className="text-hub-teal" />
              <span className="text-sm font-bold text-slate-900">Aanval</span>
            </div>
            <div className="space-y-3.5">
              <PercentileBar label="Doelpunten" value={season.goals} max={15} color="#10B981" icon={<Target size={12} />} />
              <PercentileBar label="Assists" value={season.assists} max={15} color="#f59e0b" icon={<TrendingUp size={12} />} />
              <PercentileBar label="Schoten" value={season.shots} max={50} color="#6366f1" icon={<Activity size={12} />} />
              <PercentileBar label="Schoten op doel" value={season.shots_on_target} max={30} color="#8b5cf6" icon={<Target size={12} />} />
              <PercentileBar label="Key passes" value={season.key_passes} max={40} color="#4FA9E6" icon={<ChevronRight size={12} />} />
            </div>
          </div>

          {/* Passing */}
          <div className="hub-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Footprints size={14} className="text-hub-teal" />
              <span className="text-sm font-bold text-slate-900">Passing & Techniek</span>
            </div>
            <div className="space-y-3.5">
              <PercentileBar label="Pass%" value={season.avg_pass_accuracy} max={100} color="#4FA9E6" format="%" icon={<Footprints size={12} />} />
              <PercentileBar label="Dribble%" value={season.dribble_success_pct} max={100} color="#f59e0b" format="%" icon={<Activity size={12} />} />
              <PercentileBar label="Gem. rating" value={season.avg_rating} max={10} color="#10B981" icon={<Activity size={12} />} />
            </div>
          </div>

          {/* Defensive */}
          <div className="hub-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-hub-teal" />
              <span className="text-sm font-bold text-slate-900">Defensief & Duels</span>
            </div>
            <div className="space-y-3.5">
              <PercentileBar label="Duel%" value={season.duel_success_pct} max={100} color="#ef4444" format="%" icon={<Swords size={12} />} />
              <PercentileBar label="Tackles" value={season.tackles} max={50} color="#64748b" icon={<Shield size={12} />} />
              <PercentileBar label="Intercepties" value={season.interceptions} max={30} color="#8b5cf6" icon={<Shield size={12} />} />
            </div>
          </div>

          {/* Progression chart */}
          {progressData.length > 1 && (
            <div className="hub-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-hub-teal" />
                <span className="text-sm font-bold text-slate-900">Evaluatie Progressie</span>
              </div>
              <ProgressLineChart data={progressData} showCategories height={200} />
            </div>
          )}
        </div>
      )}

      {/* Matches tab */}
      {tab === "matches" && (
        <div className="hub-card overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-hub-border"
            style={{ background: "rgba(10,37,64,0.03)" }}>
            <div className="w-14 text-[10px] font-bold uppercase tracking-wider text-slate-400">Datum</div>
            <div className="w-6" />
            <div className="flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tegenstander</div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="w-6 text-[10px] font-bold text-slate-400 text-center">G</span>
              <span className="w-6 text-[10px] font-bold text-slate-400 text-center">A</span>
              <span className="w-10 text-[10px] font-bold text-slate-400 text-center">Pass%</span>
              <span className="w-8 text-[10px] font-bold text-slate-400 text-center">Rtg</span>
              <span className="w-9 text-[10px] font-bold text-slate-400 text-center">Idx</span>
            </div>
          </div>
          <div className="divide-y divide-hub-border/50 p-1">
            {matchStats.map((s) => <MatchRow key={s.id} stat={s} />)}
          </div>
        </div>
      )}

      {/* Radar tab */}
      {tab === "radar" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="hub-card p-5">
            <div className="text-sm font-bold text-slate-900 mb-4">Performance Radar</div>
            {radarData.length > 0 ? (
              <PlayerRadarChart data={radarData} color={rColor} size={260} />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                Nog geen evaluatiedata
              </div>
            )}
          </div>
          <div className="hub-card p-5">
            <div className="text-sm font-bold text-slate-900 mb-4">Categorie Scores</div>
            {player?.recent_scores ? (
              <div className="space-y-4">
                {Object.entries(player.recent_scores).map(([cat, score]) => {
                  const sc = getScoreColor(score as number);
                  const label = CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS];
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-slate-700 font-medium">{label}</span>
                        <span className="text-sm font-black tabular-nums" style={{ color: sc }}>
                          {(score as number).toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-hub-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(score as number) * 10}%`, backgroundColor: sc }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                Nog geen score data
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
