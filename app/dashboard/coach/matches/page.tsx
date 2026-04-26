"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MOCK_MATCH_STATS, getPlayersFromStats, aggregateSeasonStats,
  getIndexLabel, type MatchStat,
} from "@/lib/match-stats";
import { IndexBadge } from "@/components/PerformanceIndexCard";
import {
  Plus, Filter, ChevronDown, Calendar, Target, Trophy,
  TrendingUp, Swords, Shield, Footprints, Activity,
} from "lucide-react";
import { POSITION_LABELS } from "@/lib/types";

const COMPETITIONS = ["Alle", "Competitie", "KNVB U17", "Cup"];

function ResultBadge({ result, home_away }: { result: string; home_away: "home" | "away" }) {
  const parts = result.split("-");
  const myGoals = home_away === "home" ? parseInt(parts[0]) : parseInt(parts[1]);
  const theirGoals = home_away === "home" ? parseInt(parts[1]) : parseInt(parts[0]);
  const outcome = myGoals > theirGoals ? "W" : myGoals === theirGoals ? "G" : "V";
  const color = outcome === "W" ? "#10B981" : outcome === "G" ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-black px-1.5 py-0.5 rounded"
        style={{ background: `${color}20`, color }}>
        {outcome}
      </span>
      <span className="text-xs text-white/60 font-mono">{result}</span>
    </div>
  );
}

export default function CoachMatchesPage() {
  const players = getPlayersFromStats();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [selectedComp, setSelectedComp] = useState("Alle");
  const [sortKey, setSortKey] = useState<keyof MatchStat>("match_date");

  const filteredStats = useMemo(() => {
    let stats = [...MOCK_MATCH_STATS];
    if (selectedPlayer !== "all") stats = stats.filter((s) => s.player_id === selectedPlayer);
    if (selectedComp !== "Alle") stats = stats.filter((s) => s.competition === selectedComp);
    return stats.sort((a, b) => {
      if (sortKey === "match_date") return new Date(b.match_date).getTime() - new Date(a.match_date).getTime();
      const av = a[sortKey] as number ?? 0;
      const bv = b[sortKey] as number ?? 0;
      return bv - av;
    });
  }, [selectedPlayer, selectedComp, sortKey]);

  const season = aggregateSeasonStats(filteredStats);
  const { color: idxColor } = getIndexLabel(season.season_index);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3"
            style={{ color: "#0A2540", fontFamily: "Outfit, sans-serif" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(79,169,230,0.1)", border: "1px solid rgba(79,169,230,0.2)" }}>
              <Swords size={18} style={{ color: "#4FA9E6" }} />
            </div>
            Wedstrijdlog
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-12">SciSports Performance Index · Seizoen 2024/25</p>
        </div>
        <Link
          href="/dashboard/coach/matches/new"
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          style={{ background: "#4FA9E6", color: "white" }}
        >
          <Plus size={15} /> Wedstrijd loggen
        </Link>
      </div>

      {/* Season KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Performance Index", value: season.season_index, color: idxColor, suffix: "", icon: <Activity size={13} /> },
          { label: "Wedstrijden", value: season.matches, color: "#4FA9E6", suffix: "", icon: <Calendar size={13} /> },
          { label: "Doelpunten", value: season.goals, color: "#10B981", suffix: "", icon: <Target size={13} /> },
          { label: "Assists", value: season.assists, color: "#f59e0b", suffix: "", icon: <Trophy size={13} /> },
          { label: "Gem. Rating", value: season.avg_rating, color: "#8b5cf6", suffix: "/10", icon: <TrendingUp size={13} /> },
          { label: "Pass%", value: season.avg_pass_accuracy, color: "#4FA9E6", suffix: "%", icon: <Footprints size={13} /> },
          { label: "Duel%", value: season.duel_success_pct, color: "#ef4444", suffix: "%", icon: <Shield size={13} /> },
        ].map((kpi) => (
          <div key={kpi.label} className="hub-card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
              style={{ background: kpi.color }} />
            <div className="flex items-center gap-1.5 mb-2" style={{ color: kpi.color }}>
              {kpi.icon}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{kpi.label}</span>
            </div>
            <div className="text-2xl font-black tabular-nums leading-none"
              style={{ color: kpi.color, fontFamily: "Outfit, sans-serif" }}>
              {kpi.value}{kpi.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Player picker */}
        <div className="relative">
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="pl-3 pr-8 py-2 text-sm font-medium rounded-xl border appearance-none cursor-pointer"
            style={{
              background: "white", borderColor: "rgba(15,40,70,0.1)",
              color: "#0A2540", fontFamily: "Outfit, sans-serif",
            }}
          >
            <option value="all">Alle spelers</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>

        {/* Competition filter */}
        <div className="flex gap-1.5">
          {COMPETITIONS.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedComp(c)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={selectedComp === c
                ? { background: "#4FA9E6", color: "white" }
                : { background: "rgba(15,40,70,0.05)", color: "#64748b" }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Filter size={13} className="text-slate-400" />
          <span className="text-xs text-slate-500">{filteredStats.length} wedstrijden</span>
        </div>
      </div>

      {/* Match table */}
      <div className="hub-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(15,40,70,0.07)", background: "rgba(10,37,64,0.025)" }}>
                {[
                  { key: "match_date", label: "Datum" },
                  { key: "player_name", label: "Speler" },
                  { key: "opponent", label: "Tegenstander" },
                  { key: "result", label: "Uitslag" },
                  { key: "minutes_played", label: "Min" },
                  { key: "goals", label: "G" },
                  { key: "assists", label: "A" },
                  { key: "shots_on_target", label: "SOT" },
                  { key: "pass_accuracy", label: "Pass%" },
                  { key: "key_passes", label: "KP" },
                  { key: "duels_won", label: "Duels" },
                  { key: "tackles", label: "Tkl" },
                  { key: "match_rating", label: "Rating" },
                  { key: "player_index", label: "Index" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => setSortKey(col.key as keyof MatchStat)}
                    className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
                    style={{
                      color: sortKey === col.key ? "#4FA9E6" : "rgba(15,40,70,0.35)",
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && <span className="ml-1">↓</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((s, i) => (
                <tr
                  key={s.id}
                  className="transition-colors"
                  style={{
                    borderBottom: i < filteredStats.length - 1 ? "1px solid rgba(15,40,70,0.05)" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(79,169,230,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="text-xs font-semibold text-slate-700">{formatDate(s.match_date)}</div>
                    <div className="text-[10px] text-slate-400">{s.competition}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 text-xs">{s.player_name.split(" ")[0]}</div>
                    <div className="text-[10px] text-slate-400">{POSITION_LABELS[s.position] ?? s.position}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          background: s.home_away === "home" ? "rgba(79,169,230,0.1)" : "rgba(15,40,70,0.06)",
                          color: s.home_away === "home" ? "#4FA9E6" : "#64748b",
                        }}>
                        {s.home_away === "home" ? "T" : "U"}
                      </span>
                      <span className="text-xs text-slate-700">{s.opponent}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <ResultBadge result={s.result} home_away={s.home_away} />
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 tabular-nums">{s.minutes_played}'</td>
                  <td className="px-3 py-3 text-xs font-bold tabular-nums"
                    style={{ color: s.goals > 0 ? "#10B981" : "#94a3b8" }}>
                    {s.goals}
                  </td>
                  <td className="px-3 py-3 text-xs font-bold tabular-nums"
                    style={{ color: s.assists > 0 ? "#f59e0b" : "#94a3b8" }}>
                    {s.assists}
                  </td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600">{s.shots_on_target}/{s.shots}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${s.pass_accuracy}%`,
                            background: s.pass_accuracy >= 80 ? "#10B981" : s.pass_accuracy >= 65 ? "#f59e0b" : "#ef4444",
                          }} />
                      </div>
                      <span className="text-[11px] tabular-nums text-slate-600">{s.pass_accuracy}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600">{s.key_passes}</td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600">
                    {s.duels_won}/{s.duels_total}
                  </td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600">{s.tackles}</td>
                  <td className="px-3 py-3">
                    <span className="text-sm font-black tabular-nums"
                      style={{
                        color: s.match_rating >= 8 ? "#10B981" : s.match_rating >= 6.5 ? "#f59e0b" : "#ef4444",
                        fontFamily: "Outfit, sans-serif",
                      }}>
                      {s.match_rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <IndexBadge index={s.player_index ?? 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStats.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-sm">
              Geen wedstrijden gevonden
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
