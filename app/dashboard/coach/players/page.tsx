"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { POSITION_LABELS, BADGE_CONFIG } from "@/lib/types";
import { getRatingColor } from "@/lib/utils";
import { PlayerCard } from "@/components/PlayerCard";
import { Search, Plus, TrendingUp, TrendingDown, Minus, Loader2, UserPlus } from "lucide-react";
import type { PositionType, PlayerWithDetails } from "@/lib/types";
import { getAllPlayers } from "@/lib/supabase/queries";

type SortKey = "rating" | "name" | "position" | "trend";
type FilterPosition = PositionType | "all";

export default function PlayersPage() {
  const [allPlayers, setAllPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<FilterPosition>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [view, setView] = useState<"cards" | "list">("cards");

  useEffect(() => {
    getAllPlayers().then((data) => { setAllPlayers(data); setLoading(false); });
  }, []);

  const positions = useMemo(() => Array.from(new Set(allPlayers.map((p) => p.position))), [allPlayers]);

  const filtered = useMemo(() => {
    let result = [...allPlayers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q)
      );
    }
    if (positionFilter !== "all") {
      result = result.filter((p) => p.position === positionFilter);
    }
    result.sort((a, b) => {
      if (sortKey === "rating") return b.overall_rating - a.overall_rating;
      if (sortKey === "name") return a.last_name.localeCompare(b.last_name);
      if (sortKey === "position") return a.position.localeCompare(b.position);
      if (sortKey === "trend") {
        const order = { up: 0, stable: 1, down: 2 };
        return (order[a.trend ?? "stable"] ?? 1) - (order[b.trend ?? "stable"] ?? 1);
      }
      return 0;
    });
    return result;
  }, [search, positionFilter, sortKey]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  if (!allPlayers.length) return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-black text-white">Spelers</h1></div>
      </div>
      <div className="hub-card p-12 text-center max-w-md mx-auto">
        <UserPlus size={40} className="mx-auto mb-4 text-slate-600" />
        <h2 className="text-lg font-bold text-white mb-2">Nog geen spelers</h2>
        <p className="text-slate-400 text-sm">Zodra spelers zich registreren en hun profiel invullen, verschijnen ze hier.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Spelers</h1>
          <p className="text-slate-400 text-sm mt-1">{allPlayers.length} spelers in jouw squad</p>
        </div>
        <Link href="/dashboard/coach/players/new" className="hub-btn-primary flex items-center gap-2">
          <Plus size={16} />
          Speler toevoegen
        </Link>
      </div>

      {/* Filters */}
      <div className="hub-card p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek speler..."
            className="w-full bg-hub-surface border border-hub-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-hub-teal transition-all"
          />
        </div>

        {/* Position filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setPositionFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${positionFilter === "all" ? "bg-hub-teal text-hub-bg" : "bg-hub-surface text-slate-400 hover:text-white border border-hub-border"}`}
          >
            Alle
          </button>
          {positions.map((pos) => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${positionFilter === pos ? "bg-hub-teal text-hub-bg" : "bg-hub-surface text-slate-400 hover:text-white border border-hub-border"}`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-hub-surface border border-hub-border rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-hub-teal transition-all"
        >
          <option value="rating">Sorteer: Rating</option>
          <option value="name">Sorteer: Naam</option>
          <option value="position">Sorteer: Positie</option>
          <option value="trend">Sorteer: Trend</option>
        </select>

        {/* View toggle */}
        <div className="flex bg-hub-surface border border-hub-border rounded-xl overflow-hidden">
          {(["cards", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 text-xs font-medium transition-all ${view === v ? "bg-hub-teal text-hub-bg" : "text-slate-400 hover:text-white"}`}
            >
              {v === "cards" ? "Cards" : "Lijst"}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-500">
        {filtered.length} speler{filtered.length !== 1 ? "s" : ""} gevonden
      </div>

      {/* Player grid/list */}
      {view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((player) => (
            <Link key={player.id} href={`/dashboard/coach/players/${player.id}`}>
              <PlayerCard player={player} variant="compact" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="hub-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hub-border">
                {["#", "Speler", "Positie", "Rating", "Archetype", "Trend", "Evaluaties", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 hub-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((player, i) => {
                const rColor = getRatingColor(player.overall_rating);
                const badge = player.badge ? BADGE_CONFIG[player.badge] : null;
                const arch = player.identity?.primary_archetype;
                return (
                  <tr key={player.id} className="border-b border-hub-border hover:bg-hub-surface transition-colors group">
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `${rColor}20`, color: rColor }}>
                          {player.first_name[0]}{player.last_name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{player.first_name} {player.last_name}</div>
                          {badge && (
                            <span className="hub-tag text-[9px]" style={{ background: badge.bg, color: badge.color }}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{POSITION_LABELS[player.position]}</td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-black tabular-nums" style={{ color: rColor }}>
                        {player.overall_rating}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {arch && (
                        <span className="text-xs text-slate-400">
                          {arch.replace(/_/g, " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${player.trend === "up" ? "text-hub-teal" : player.trend === "down" ? "text-red-400" : "text-slate-500"}`}>
                        {player.trend === "up" ? <TrendingUp size={12} /> : player.trend === "down" ? <TrendingDown size={12} /> : <Minus size={12} />}
                        {player.trend ?? "stable"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {player.evaluations?.length ?? 0}x
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/coach/players/${player.id}`}
                        className="text-xs text-hub-teal opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                      >
                        Bekijk →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-600">Geen spelers gevonden</div>
          )}
        </div>
      )}
    </div>
  );
}
