"use client";

import { useState, useEffect } from "react";
import { getAllPlayers } from "@/lib/supabase/queries";
import { POSITION_LABELS, CATEGORY_LABELS } from "@/lib/types";
import { getRatingColor } from "@/lib/utils";
import { PlayerCard } from "@/components/PlayerCard";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { PlayerComparisonChart } from "@/components/charts/PlayerComparisonChart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, TrendingUp, Users, GitCompare, LayoutGrid, Loader2, Activity } from "lucide-react";
import type { Evaluation, PlayerWithDetails } from "@/lib/types";
import {
  MOCK_MATCH_STATS, getPlayersFromStats,
  aggregateSeasonStats, getIndexLabel, calculateSeasonIndex,
} from "@/lib/match-stats";
import { IndexBadge } from "@/components/PerformanceIndexCard";
import Link from "next/link";

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

type TabType = "overview" | "compare" | "ranking" | "index";

export default function AnalyticsPage() {
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [tab, setTab] = useState<TabType>("overview");

  useEffect(() => {
    getAllPlayers().then((p) => {
      setPlayers(p);
      if (p.length > 0) setCompareA(p[0].id);
      if (p.length > 1) setCompareB(p[1].id);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  if (players.length === 0) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <BarChart3 size={24} className="text-hub-teal" />
          Analytics
        </h1>
      </div>
      <div className="hub-card p-12 text-center">
        <BarChart3 size={40} className="text-slate-300 mx-auto mb-3" />
        <div className="text-slate-600">Nog geen spelers om te analyseren.</div>
      </div>
    </div>
  );

  const playerA = players.find((p) => p.id === compareA) ?? players[0];
  const playerB = players.find((p) => p.id === compareB) ?? players[Math.min(1, players.length - 1)];

  const ratingBuckets = [
    { range: "40–59", count: players.filter((p) => p.overall_rating < 60).length },
    { range: "60–69", count: players.filter((p) => p.overall_rating >= 60 && p.overall_rating < 70).length },
    { range: "70–79", count: players.filter((p) => p.overall_rating >= 70 && p.overall_rating < 80).length },
    { range: "80–89", count: players.filter((p) => p.overall_rating >= 80 && p.overall_rating < 90).length },
    { range: "90+", count: players.filter((p) => p.overall_rating >= 90).length },
  ];

  const bucketColors: Record<string, string> = {
    "40–59": "#94A3B8",
    "60–69": "#4FA9E6",
    "70–79": "#8B5CF6",
    "80–89": "#10B981",
    "90+": "#F59E0B",
  };

  const positionData = Object.entries(
    players.reduce((acc, p) => { acc[p.position] = (acc[p.position] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([pos, count]) => ({ position: pos, count }))
    .sort((a, b) => b.count - a.count);

  const getRadarForPlayer = (p: PlayerWithDetails) =>
    p.recent_scores
      ? Object.entries(p.recent_scores).map(([cat, val]) => ({
          subject: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS],
          value: val,
        }))
      : [];

  const radarA = getRadarForPlayer(playerA);
  const radarB = getRadarForPlayer(playerB);

  const tabs = [
    { id: "overview" as const, label: "Team Overzicht", icon: <LayoutGrid size={14} /> },
    { id: "index" as const, label: "Performance Index", icon: <Activity size={14} /> },
    { id: "ranking" as const, label: "Ranglijst", icon: <BarChart3 size={14} /> },
    { id: "compare" as const, label: "1v1 Vergelijken", icon: <GitCompare size={14} /> },
  ];

  // Build index leaderboard from mock match stats
  const indexPlayers = getPlayersFromStats().map((p) => {
    const stats = MOCK_MATCH_STATS.filter((s) => s.player_id === p.id);
    const season = aggregateSeasonStats(stats);
    const { color, label } = getIndexLabel(season.season_index);
    return { ...p, season, color, indexLabel: label };
  }).sort((a, b) => b.season.season_index - a.season.season_index);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hub-page-header p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-hub-teal mb-0.5" style={{ fontFamily: "Outfit, sans-serif" }}>Coach</p>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              <BarChart3 size={22} className="text-hub-teal" />
              Analytics
            </h1>
            <p className="text-slate-500 text-sm mt-1">Team performance inzichten</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: `${players.length} spelers`, bg: "#E8F4FC", color: "#4FA9E6" },
              { label: `${players.filter(p => p.trend === "up").length} trending ↑`, bg: "#d1fae5", color: "#059669" },
            ].map((s) => (
              <span key={s.label} className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: s.bg, color: s.color }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-hub-bg border border-hub-border rounded-xl w-full sm:w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
            style={tab === t.id
              ? { background: "#0A2540", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(10,37,64,0.2)" }
              : { color: "#64748b" }
            }>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── OVERZICHT ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="hub-label">Top 3 Spelers</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...players].sort((a, b) => b.overall_rating - a.overall_rating).slice(0, 3).map((p) => (
              <PlayerCard key={p.id} player={p} variant="compact" />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating distribution */}
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Rating Verdeling</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingBuckets} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F5F7" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #E4E7EB", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 16px rgba(10,37,64,0.08)" }}
                    cursor={{ fill: "rgba(79,169,230,0.05)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {ratingBuckets.map((entry) => (
                      <Cell key={entry.range} fill={bucketColors[entry.range] ?? "#94A3B8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Position breakdown */}
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Positieverdeling</div>
              <div className="space-y-2.5">
                {positionData.map((pd) => {
                  const pct = (pd.count / players.length) * 100;
                  return (
                    <div key={pd.position} className="flex items-center gap-3">
                      <div className="w-10 text-xs font-bold text-slate-600 flex-shrink-0">{pd.position}</div>
                      <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: "#F4F5F7" }}>
                        <div className="h-full rounded-lg flex items-center px-2 transition-all"
                          style={{ width: `${Math.max(pct, 8)}%`, background: "linear-gradient(90deg, #4FA9E6, #0A2540)" }}>
                          <span className="text-[10px] font-bold text-white">{pd.count}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 w-20 text-right flex-shrink-0">
                        {POSITION_LABELS[pd.position as keyof typeof POSITION_LABELS]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Best progressie */}
          {players.some((p) => p.trend === "up") && (
            <div className="hub-card p-5">
              <div className="hub-label mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-hub-teal" />
                Beste Progressie
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {players.filter((p) => p.trend === "up").map((p) => {
                  const pd = buildProgressData(p.evaluations ?? []);
                  return (
                    <div key={p.id} className="p-4 rounded-xl" style={{ background: "#F4F5F7", border: "1px solid #E4E7EB" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-sm font-bold text-slate-900">{p.first_name} {p.last_name}</div>
                        <span className="hub-tag text-[10px]" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>↑ Progressie</span>
                      </div>
                      {pd.length > 1 && <ProgressLineChart data={pd} height={100} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PERFORMANCE INDEX ── */}
      {tab === "index" && (
        <div className="space-y-5">
          {/* Top index banner */}
          {indexPlayers[0] && (() => {
            const top = indexPlayers[0];
            const { color } = getIndexLabel(top.season.season_index);
            return (
              <div className="relative rounded-3xl overflow-hidden p-6"
                style={{ background: "linear-gradient(150deg, #060e1c 0%, #0A2540 45%, #0d3060 100%)" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, #4FA9E6, transparent)` }} />
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-20"
                  style={{ background: color }} />
                <div className="relative z-10 flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <div className="text-6xl font-black tabular-nums leading-none"
                      style={{ color, fontFamily: "Outfit, sans-serif", textShadow: `0 0 30px ${color}40` }}>
                      {top.season.season_index}
                    </div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Index #1</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color }}>Beste Performance</div>
                    <div className="text-2xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {top.name}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ background: `${color}20`, color }}>{top.indexLabel}</span>
                      <span className="text-xs text-white/40">{top.position} · {top.season.matches} wedstrijden</span>
                    </div>
                    <div className="flex gap-4 mt-3 text-white/60 text-xs">
                      <span><span className="text-white font-bold">{top.season.goals}</span> G</span>
                      <span><span className="text-white font-bold">{top.season.assists}</span> A</span>
                      <span><span className="text-white font-bold">{top.season.avg_rating}</span> Rtg</span>
                      <span><span className="text-white font-bold">{top.season.avg_pass_accuracy}%</span> Pass</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Leaderboard */}
          <div className="hub-card overflow-hidden">
            <div className="px-5 py-4 border-b border-hub-border flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Performance Index Ranglijst</span>
              <Link href="/dashboard/coach/matches"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(79,169,230,0.08)", color: "#4FA9E6" }}>
                Wedstrijdlog →
              </Link>
            </div>
            <div className="divide-y divide-hub-border/50">
              {indexPlayers.map((p, rank) => {
                const maxIdx = indexPlayers[0]?.season.season_index ?? 100;
                const barPct = (p.season.season_index / maxIdx) * 100;
                return (
                  <div key={p.id} className="px-5 py-4 flex items-center gap-4 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(79,169,230,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Rank */}
                    <div className="w-7 text-center flex-shrink-0">
                      {rank === 0 ? (
                        <span className="text-lg font-black" style={{ color: "#f59e0b" }}>🥇</span>
                      ) : rank === 1 ? (
                        <span className="text-lg font-black" style={{ color: "#94a3b8" }}>🥈</span>
                      ) : rank === 2 ? (
                        <span className="text-lg font-black" style={{ color: "#d97706" }}>🥉</span>
                      ) : (
                        <span className="text-sm font-black text-slate-400">#{rank + 1}</span>
                      )}
                    </div>

                    {/* Name + position */}
                    <div className="w-40 flex-shrink-0">
                      <div className="text-sm font-bold text-slate-900">{p.name.split(" ")[0]} {p.name.split(" ").slice(1).join(" ")}</div>
                      <div className="text-[10px] text-slate-400">{p.position} · {p.season.matches} wedstrijden</div>
                    </div>

                    {/* Index bar */}
                    <div className="flex-1 hidden sm:block">
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${barPct}%`, background: `linear-gradient(90deg, ${p.color}60, ${p.color})` }} />
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
                      <span className="tabular-nums"><span className="font-bold text-slate-700">{p.season.goals}</span> G</span>
                      <span className="tabular-nums"><span className="font-bold text-slate-700">{p.season.assists}</span> A</span>
                      <span className="tabular-nums"><span className="font-bold text-slate-700">{p.season.avg_rating}</span> Rtg</span>
                      <span className="tabular-nums"><span className="font-bold text-slate-700">{p.season.avg_pass_accuracy}%</span> Pass</span>
                    </div>

                    {/* Index badge */}
                    <div className="flex-shrink-0 ml-2">
                      <IndexBadge index={p.season.season_index} />
                    </div>
                  </div>
                );
              })}

              {indexPlayers.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Nog geen wedstrijddata beschikbaar.
                  <Link href="/dashboard/coach/matches/new" className="ml-2 text-hub-teal hover:underline">
                    Log een wedstrijd →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RANGLIJST / TEAM RANKING ── */}
      {tab === "ranking" && (
        <div className="hub-card p-5">
          <div className="hub-label mb-1">Team Ranglijst per Kwaliteit</div>
          <p className="text-xs text-slate-500 mb-5">Selecteer een categorie om alle spelers te vergelijken.</p>
          <PlayerComparisonChart players={players} defaultQuality="techniek" />
        </div>
      )}

      {/* ── 1v1 VERGELIJKEN ── */}
      {tab === "compare" && (
        <div className="space-y-6">
          {/* Player selectors */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: compareA, set: setCompareA, label: "Speler A", color: "#4FA9E6" },
              { val: compareB, set: setCompareB, label: "Speler B", color: "#10B981" },
            ].map(({ val, set, label, color }) => (
              <div key={label}>
                <label className="flex items-center gap-2 hub-label mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {label}
                </label>
                <select value={val} onChange={(e) => set(e.target.value)}
                  className="w-full bg-white border border-hub-border rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-hub-teal transition-all">
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.overall_rating})</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Player cards side by side */}
          <div className="grid grid-cols-2 gap-4">
            <PlayerCard player={playerA} variant="compact" />
            <PlayerCard player={playerB} variant="compact" />
          </div>

          {/* Radar side by side */}
          {(radarA.length > 0 || radarB.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { p: playerA, radar: radarA },
                { p: playerB, radar: radarB },
              ].map(({ p, radar }, idx) => {
                const c = idx === 0 ? "#4FA9E6" : "#10B981";
                return (
                  <div key={p.id} className="hub-card p-4">
                    <div className="hub-label mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="flex justify-center">
                      <PlayerRadarChart data={radar} color={c} size={220} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dual radar overlay */}
          {radarA.length > 0 && radarB.length > 0 && (
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Radar Overlay</div>
              <div className="flex justify-center">
                <PlayerRadarChart
                  data={radarA}
                  color="#4FA9E6"
                  secondaryData={radarB}
                  secondaryColor="#10B981"
                  size={300}
                />
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded-full" style={{ background: "#4FA9E6" }} />
                  <span className="text-xs font-medium text-slate-600">{playerA.first_name} {playerA.last_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded-full border border-dashed" style={{ background: "#10B981", borderColor: "#10B981" }} />
                  <span className="text-xs font-medium text-slate-600">{playerB.first_name} {playerB.last_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Head-to-head table */}
          <div className="hub-card p-5">
            <div className="hub-label mb-4">Head-to-Head Vergelijking</div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#4FA9E6" }} />
                      <span className="hub-label">{playerA.first_name}</span>
                    </div>
                  </th>
                  <th className="text-center py-2 hub-label text-slate-400">Categorie</th>
                  <th className="text-right py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="hub-label">{playerB.first_name}</span>
                      <div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Overall Rating", a: playerA.overall_rating, b: playerB.overall_rating, fmt: (v: number) => v.toString() },
                  { label: "Techniek", a: playerA.recent_scores?.techniek ?? 0, b: playerB.recent_scores?.techniek ?? 0, fmt: (v: number) => v.toFixed(1) },
                  { label: "Fysiek", a: playerA.recent_scores?.fysiek ?? 0, b: playerB.recent_scores?.fysiek ?? 0, fmt: (v: number) => v.toFixed(1) },
                  { label: "Tactiek", a: playerA.recent_scores?.tactiek ?? 0, b: playerB.recent_scores?.tactiek ?? 0, fmt: (v: number) => v.toFixed(1) },
                  { label: "Mentaal", a: playerA.recent_scores?.mentaal ?? 0, b: playerB.recent_scores?.mentaal ?? 0, fmt: (v: number) => v.toFixed(1) },
                  { label: "Teamplay", a: playerA.recent_scores?.teamplay ?? 0, b: playerB.recent_scores?.teamplay ?? 0, fmt: (v: number) => v.toFixed(1) },
                ].map((row) => {
                  const aWins = row.a > row.b;
                  const tie = row.a === row.b;
                  return (
                    <tr key={row.label} className="border-t border-hub-border">
                      <td className="py-3">
                        <span className="text-base font-black tabular-nums"
                          style={{ color: aWins ? "#4FA9E6" : tie ? "#111111" : "#CBD5E1", fontFamily: "Outfit, sans-serif" }}>
                          {row.fmt(row.a)}
                        </span>
                        {aWins && <span className="ml-1.5 text-[10px] font-bold text-emerald-500">▲</span>}
                      </td>
                      <td className="py-3 text-center text-xs text-slate-500">{row.label}</td>
                      <td className="py-3 text-right">
                        {!aWins && !tie && <span className="mr-1.5 text-[10px] font-bold text-emerald-500">▲</span>}
                        <span className="text-base font-black tabular-nums"
                          style={{ color: !aWins && !tie ? "#10B981" : tie ? "#111111" : "#CBD5E1", fontFamily: "Outfit, sans-serif" }}>
                          {row.fmt(row.b)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
