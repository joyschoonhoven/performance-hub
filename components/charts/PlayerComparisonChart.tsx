"use client";

import { useMemo, useState } from "react";
import type { PlayerWithDetails } from "@/lib/types";
import { POSITION_LABELS } from "@/lib/types";

const QUALITIES = [
  { key: "techniek", label: "Techniek" },
  { key: "fysiek", label: "Fysiek" },
  { key: "tactiek", label: "Tactiek" },
  { key: "mentaal", label: "Mentaal" },
  { key: "teamplay", label: "Teamplay" },
] as const;

type QualityKey = typeof QUALITIES[number]["key"];

const POSITION_COLORS: Record<string, { color: string; bg: string }> = {
  GK:  { color: "#f59e0b", bg: "#fef3c7" },
  CB:  { color: "#3b82f6", bg: "#dbeafe" },
  LB:  { color: "#3b82f6", bg: "#dbeafe" },
  RB:  { color: "#3b82f6", bg: "#dbeafe" },
  CDM: { color: "#8b5cf6", bg: "#ede9fe" },
  CM:  { color: "#8b5cf6", bg: "#ede9fe" },
  CAM: { color: "#ec4899", bg: "#fce7f3" },
  LW:  { color: "#10b981", bg: "#d1fae5" },
  RW:  { color: "#10b981", bg: "#d1fae5" },
  SS:  { color: "#10b981", bg: "#d1fae5" },
  ST:  { color: "#ef4444", bg: "#fee2e2" },
};

function getPositionStyle(pos: string) {
  return POSITION_COLORS[pos] ?? { color: "#64748b", bg: "#f1f5f9" };
}

interface PlayerComparisonChartProps {
  players: PlayerWithDetails[];
  /** If set, this player's dot is highlighted */
  currentPlayerId?: string;
  /** If true, other player names are hidden (player-facing view) */
  anonymizeOthers?: boolean;
  defaultQuality?: QualityKey;
}

export function PlayerComparisonChart({
  players,
  currentPlayerId,
  anonymizeOthers = false,
  defaultQuality = "techniek",
}: PlayerComparisonChartProps) {
  const [selected, setSelected] = useState<QualityKey>(defaultQuality);

  const sorted = useMemo(() => {
    return [...players]
      .filter((p) => p.recent_scores?.[selected] !== undefined)
      .sort((a, b) => (b.recent_scores![selected]! - a.recent_scores![selected]!));
  }, [players, selected]);

  const max = 10;

  if (sorted.length === 0) {
    return (
      <div className="hub-card p-8 text-center text-slate-500 text-sm">
        Geen score data beschikbaar voor deze categorie.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quality selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
          Vergelijking per kwaliteit
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {QUALITIES.map((q) => (
            <button
              key={q.key}
              onClick={() => setSelected(q.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={selected === q.key
                ? { background: "#0A2540", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(10,37,64,0.2)" }
                : { background: "#F4F5F7", color: "#64748b", border: "1px solid #E4E7EB" }
              }
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-2">
        {sorted.map((player, idx) => {
          const score = player.recent_scores![selected]!;
          const isCurrent = player.id === currentPlayerId;
          const pct = (score / max) * 100;
          const pos = getPositionStyle(player.position);
          const rank = idx + 1;

          const name = anonymizeOthers && !isCurrent
            ? `Speler ${rank}`
            : `${player.first_name} ${player.last_name}`;

          return (
            <div
              key={player.id}
              className="group relative"
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background: isCurrent ? "rgba(79,169,230,0.06)" : "#ffffff",
                border: isCurrent ? "1.5px solid rgba(79,169,230,0.3)" : "1px solid #E4E7EB",
                transition: "all 0.2s",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-5 text-center text-xs font-black tabular-nums flex-shrink-0"
                  style={{ color: rank <= 3 ? "#0A2540" : "#9CA3AF" }}>
                  {rank}
                </div>

                {/* Position badge */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{ background: isCurrent ? "rgba(79,169,230,0.15)" : pos.bg, color: isCurrent ? "#4FA9E6" : pos.color }}>
                  {player.position}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold truncate"
                      style={{ color: isCurrent ? "#0A2540" : "#111111", fontFamily: "Outfit, sans-serif" }}>
                      {name}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: "#4FA9E6", color: "#fff" }}>JIJ</span>
                    )}
                    {!anonymizeOthers && (
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {POSITION_LABELS[player.position]}
                      </span>
                    )}
                  </div>

                  {/* Bar */}
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "#E4E7EB" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: isCurrent
                          ? "linear-gradient(90deg, #4FA9E6, #0A2540)"
                          : score >= 8 ? "#10b981" : score >= 6 ? "#4FA9E6" : score >= 4 ? "#f59e0b" : "#ef4444",
                        transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                      }}
                    />
                  </div>
                </div>

                {/* Score */}
                <div className="text-lg font-black tabular-nums flex-shrink-0 w-10 text-right"
                  style={{
                    color: isCurrent ? "#4FA9E6" :
                      score >= 8 ? "#10b981" : score >= 6 ? "#0A2540" : score >= 4 ? "#f59e0b" : "#ef4444",
                    fontFamily: "Outfit, sans-serif",
                  }}>
                  {score.toFixed(1)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#10b981" }} />
          <span className="text-[10px] text-slate-500 font-medium">Uitstekend (8+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#4FA9E6" }} />
          <span className="text-[10px] text-slate-500 font-medium">Goed (6-8)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
          <span className="text-[10px] text-slate-500 font-medium">Matig (4-6)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
          <span className="text-[10px] text-slate-500 font-medium">Aandacht nodig (&lt;4)</span>
        </div>
      </div>
    </div>
  );
}
