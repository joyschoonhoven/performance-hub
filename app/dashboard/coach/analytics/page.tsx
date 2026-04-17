"use client";

import { useState, useEffect } from "react";
import { getAllPlayers } from "@/lib/supabase/queries";
import { POSITION_LABELS, CATEGORY_LABELS } from "@/lib/types";
import { getRatingColor } from "@/lib/utils";
import { PlayerCard } from "@/components/PlayerCard";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, TrendingUp, Users, GitCompare, Loader2 } from "lucide-react";
import type { Evaluation, PlayerWithDetails } from "@/lib/types";

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

export default function AnalyticsPage() {
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [tab, setTab] = useState<"overview" | "compare">("overview");

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
          <BarChart3 size={24} className="text-indigo-400" />
          Analytics
        </h1>
      </div>
      <div className="hub-card p-12 text-center">
        <BarChart3 size={40} className="text-slate-700 mx-auto mb-3" />
        <div className="text-slate-600">Nog geen spelers om te analyseren.</div>
      </div>
    </div>
  );

  const playerA = players.find((p) => p.id === compareA) ?? players[0];
  const playerB = players.find((p) => p.id === compareB) ?? players[Math.min(1, players.length - 1)];

  const ratingBuckets = [
    { range: "40-59", count: players.filter((p) => p.overall_rating < 60).length },
    { range: "60-69", count: players.filter((p) => p.overall_rating >= 60 && p.overall_rating < 70).length },
    { range: "70-79", count: players.filter((p) => p.overall_rating >= 70 && p.overall_rating < 80).length },
    { range: "80-89", count: players.filter((p) => p.overall_rating >= 80 && p.overall_rating < 90).length },
    { range: "90+", count: players.filter((p) => p.overall_rating >= 90).length },
  ];

  const positionData = Object.entries(
    players.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([pos, count]) => ({ position: pos, count }));

  const getRadarForPlayer = (p: PlayerWithDetails) =>
    p.recent_scores
      ? Object.entries(p.recent_scores).map(([cat, val]) => ({
          subject: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS],
          value: val,
        }))
      : [];

  const radarA = getRadarForPlayer(playerA);
  const radarB = getRadarForPlayer(playerB);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <BarChart3 size={24} className="text-indigo-400" />
          Analytics
        </h1>
        <p className="text-slate-600 text-sm mt-1">Team performance inzichten</p>
      </div>

      <div className="flex gap-1 bg-hub-surface border border-hub-border rounded-xl p-1 w-fit">
        {[
          { id: "overview" as const, label: "Team Overzicht", icon: <Users size={14} /> },
          { id: "compare" as const, label: "Vergelijken", icon: <GitCompare size={14} /> },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? "bg-hub-teal text-hub-bg" : "text-slate-600 hover:text-slate-900"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div>
            <div className="hub-label mb-3">Top 3 Spelers</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...players].sort((a, b) => b.overall_rating - a.overall_rating).slice(0, 3).map((p) => (
                <PlayerCard key={p.id} player={p} variant="compact" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Rating Verdeling</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingBuckets} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2d47" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#20243a", border: "1px solid #1a2d47", borderRadius: "12px", color: "#1e293b", fontSize: "12px" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {ratingBuckets.map((entry) => (
                      <Cell key={entry.range} fill={
                        entry.range === "90+" ? "#f59e0b" :
                        entry.range === "80-89" ? "#00d4aa" :
                        entry.range === "70-79" ? "#6366f1" : "#64748b"
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="hub-card p-5">
              <div className="hub-label mb-4">Positieverdeling</div>
              <div className="space-y-2">
                {positionData.map((pd) => (
                  <div key={pd.position} className="flex items-center gap-3">
                    <div className="w-10 text-xs font-semibold text-slate-600">{pd.position}</div>
                    <div className="flex-1 h-6 bg-hub-border rounded-lg overflow-hidden">
                      <div className="h-full rounded-lg bg-indigo-500/60 flex items-center px-2"
                        style={{ width: `${(pd.count / players.length) * 100}%` }}>
                        <span className="text-[10px] font-bold text-slate-900">{pd.count}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 w-12 text-right">
                      {POSITION_LABELS[pd.position as keyof typeof POSITION_LABELS]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
                    <div key={p.id} className="p-4 rounded-xl bg-hub-surface border border-hub-border">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-sm font-bold text-slate-900">{p.first_name} {p.last_name}</div>
                        <span className="hub-tag text-[10px] bg-hub-teal/10 text-hub-teal">Progressie</span>
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

      {tab === "compare" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: compareA, set: setCompareA, label: "Speler A" },
              { val: compareB, set: setCompareB, label: "Speler B" },
            ].map(({ val, set, label }) => (
              <div key={label}>
                <label className="hub-label mb-2 block">{label}</label>
                <select value={val} onChange={(e) => set(e.target.value)}
                  className="w-full bg-hub-surface border border-hub-border rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-hub-teal transition-all">
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.overall_rating})</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PlayerCard player={playerA} variant="compact" />
            <PlayerCard player={playerB} variant="compact" />
          </div>

          {(radarA.length > 0 || radarB.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="hub-card p-4">
                <div className="hub-label mb-2 text-center">{playerA.first_name}</div>
                <PlayerRadarChart data={radarA} color={getRatingColor(playerA.overall_rating)} size={200} />
              </div>
              <div className="hub-card p-4">
                <div className="hub-label mb-2 text-center">{playerB.first_name}</div>
                <PlayerRadarChart data={radarB} color={getRatingColor(playerB.overall_rating)} size={200} />
              </div>
            </div>
          )}

          <div className="hub-card p-5">
            <div className="hub-label mb-4">Head-to-Head Vergelijking</div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 hub-label">{playerA.first_name}</th>
                  <th className="text-center py-2 hub-label">Categorie</th>
                  <th className="text-right py-2 hub-label">{playerB.first_name}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Overall Rating", a: playerA.overall_rating, b: playerB.overall_rating, format: (v: number) => v.toString() },
                  { label: "Techniek", a: playerA.recent_scores?.techniek ?? 0, b: playerB.recent_scores?.techniek ?? 0, format: (v: number) => v.toFixed(1) },
                  { label: "Fysiek", a: playerA.recent_scores?.fysiek ?? 0, b: playerB.recent_scores?.fysiek ?? 0, format: (v: number) => v.toFixed(1) },
                  { label: "Tactiek", a: playerA.recent_scores?.tactiek ?? 0, b: playerB.recent_scores?.tactiek ?? 0, format: (v: number) => v.toFixed(1) },
                  { label: "Mentaal", a: playerA.recent_scores?.mentaal ?? 0, b: playerB.recent_scores?.mentaal ?? 0, format: (v: number) => v.toFixed(1) },
                  { label: "Teamplay", a: playerA.recent_scores?.teamplay ?? 0, b: playerB.recent_scores?.teamplay ?? 0, format: (v: number) => v.toFixed(1) },
                ].map((row) => {
                  const aWins = row.a > row.b;
                  const tie = row.a === row.b;
                  return (
                    <tr key={row.label} className="border-t border-hub-border">
                      <td className="py-3">
                        <span className={`text-sm font-bold tabular-nums ${aWins ? "text-hub-teal" : tie ? "text-slate-900" : "text-slate-600"}`}>
                          {row.format(row.a)}
                        </span>
                      </td>
                      <td className="py-3 text-center text-xs text-slate-600">{row.label}</td>
                      <td className="py-3 text-right">
                        <span className={`text-sm font-bold tabular-nums ${!aWins && !tie ? "text-hub-teal" : tie ? "text-slate-900" : "text-slate-600"}`}>
                          {row.format(row.b)}
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
