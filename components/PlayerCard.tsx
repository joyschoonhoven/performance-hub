"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getRatingColor, initials } from "@/lib/utils";
import type { PlayerWithDetails } from "@/lib/types";
import { ARCHETYPES, SOCIOTYPES, POSITION_LABELS, BADGE_CONFIG } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ARCHETYPE_ICONS, SOCIOTYPE_ICONS } from "@/components/PlayerTypeHero";

interface PlayerCardProps {
  player: PlayerWithDetails;
  variant?: "full" | "compact" | "mini";
  onClick?: () => void;
  selected?: boolean;
}

function CoreValueBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-600 uppercase tracking-wider font-medium">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-hub-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatHex({ label, value }: { label: string; value: number }) {
  const color = value >= 8 ? "#10B981" : value >= 6.5 ? "#4FA9E6" : value >= 5 ? "#f59e0b" : "#ef4444";
  // Hexagon points for a 36×42 viewBox
  const hex = "18,2 34,11 34,31 18,40 2,31 2,11";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-10 h-11">
        <svg viewBox="0 0 36 42" className="w-full h-full">
          {/* Background hex */}
          <polygon points={hex} fill={`${color}15`} stroke={`${color}50`} strokeWidth="1.5" />
          {/* Fill based on value (0–10) */}
          <clipPath id={`hex-clip-${label}`}>
            <polygon points={hex} />
          </clipPath>
          <rect
            x="0" y={42 - (value / 10) * 42} width="36" height={42}
            fill={`${color}30`}
            clipPath={`url(#hex-clip-${label})`}
          />
          {/* Border overlay */}
          <polygon points={hex} fill="none" stroke={color} strokeWidth="1.5" />
          {/* Value text */}
          <text x="18" y="24" textAnchor="middle" fontSize="10" fontWeight="800"
            fill={color} fontFamily="Outfit, sans-serif">
            {value.toFixed(1)}
          </text>
        </svg>
      </div>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// FIFA-style full card
export function PlayerCard({ player, variant = "full", onClick, selected }: PlayerCardProps) {
  const identity = player.identity;
  const archetype = identity?.primary_archetype ? ARCHETYPES[identity.primary_archetype] : null;
  const sociotype = identity?.primary_sociotype ? SOCIOTYPES[identity.primary_sociotype] : null;
  const badge = player.badge ? BADGE_CONFIG[player.badge] : null;
  const ratingColor = getRatingColor(player.overall_rating);
  const scores = player.recent_scores;

  if (variant === "mini") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
          selected
            ? "border-hub-teal/40"
            : "bg-hub-card border-hub-border hover:border-hub-border-light"
        )}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden relative"
          style={player.avatar_url ? {} : { background: `linear-gradient(135deg, ${ratingColor}18, ${ratingColor}35)`, border: `1px solid ${ratingColor}44`, color: ratingColor }}>
          {player.avatar_url
            ? <Image src={player.avatar_url} alt={`${player.first_name} ${player.last_name}`} fill className="object-cover" />
            : initials(`${player.first_name} ${player.last_name}`)
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {player.first_name} {player.last_name}
          </div>
          <div className="text-xs text-slate-600">{POSITION_LABELS[player.position]}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold tabular-nums" style={{ color: ratingColor }}>
            {player.overall_rating}
          </div>
          {player.trend && (
            <div className={cn("flex items-center justify-end", player.trend === "up" ? "text-hub-teal" : player.trend === "down" ? "text-red-400" : "text-slate-600")}>
              {player.trend === "up" ? <TrendingUp size={12} /> : player.trend === "down" ? <TrendingDown size={12} /> : <Minus size={12} />}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "p-4 rounded-2xl border transition-all",
          onClick ? "cursor-pointer" : "",
          selected
            ? "bg-hub-teal/5 border-hub-teal/40"
            : "bg-hub-card border-hub-border hover:border-hub-border-light"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Rating + avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center font-black text-xl"
              style={player.avatar_url ? {} : { background: `linear-gradient(135deg, ${ratingColor}22, ${ratingColor}44)`, border: `2px solid ${ratingColor}66` }}>
              {player.avatar_url
                ? <Image src={player.avatar_url} alt={`${player.first_name} ${player.last_name}`} width={56} height={56} className="object-cover w-full h-full" />
                : initials(`${player.first_name} ${player.last_name}`)
              }
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: ratingColor, color: "#fff" }}>
              {player.overall_rating}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-base">
                {player.first_name} {player.last_name}
              </span>
              {badge && (
                <span className="hub-tag text-xs" style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-hub-surface text-slate-600">
                {POSITION_LABELS[player.position]}
              </span>
              {player.jersey_number && (
                <span className="text-xs text-slate-600">#{player.jersey_number}</span>
              )}
              {player.trend && (
                <span className={cn("flex items-center gap-0.5 text-xs font-medium",
                  player.trend === "up" ? "text-hub-teal" : player.trend === "down" ? "text-red-400" : "text-slate-600")}>
                  {player.trend === "up" ? <TrendingUp size={12} /> : player.trend === "down" ? <TrendingDown size={12} /> : <Minus size={12} />}
                </span>
              )}
            </div>

            {/* Archetype + sociotype badges */}
            {(archetype || sociotype) && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {archetype && (() => {
                  const AIcon = ARCHETYPE_ICONS[archetype.id];
                  return (
                    <span className="hub-tag text-[10px] inline-flex items-center gap-1" style={{ background: `${archetype.color}22`, color: archetype.color }}>
                      <AIcon size={10} strokeWidth={2} /> {archetype.label}
                    </span>
                  );
                })()}
                {sociotype && (() => {
                  const SIcon = SOCIOTYPE_ICONS[sociotype.id];
                  return (
                    <span className="hub-tag text-[10px] inline-flex items-center gap-1" style={{ background: `${sociotype.color_hex}22`, color: sociotype.color_hex }}>
                      <SIcon size={10} strokeWidth={2} /> {sociotype.label}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Stats mini-grid */}
        {scores && (
          <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-hub-border">
            <StatHex label="TEC" value={scores.techniek} />
            <StatHex label="FYS" value={scores.fysiek} />
            <StatHex label="TAC" value={scores.tactiek} />
            <StatHex label="MEN" value={scores.mentaal} />
            <StatHex label="TEA" value={scores.teamplay} />
          </div>
        )}
      </div>
    );
  }

  // Full premium card — light mode
  return (
    <div className={cn(
      "relative rounded-3xl overflow-hidden border transition-all",
      onClick ? "cursor-pointer" : "",
      selected ? "border-hub-teal/60" : "border-hub-border"
    )}
      style={{
        background: "#ffffff",
        boxShadow: "0 4px 24px rgba(10,37,64,0.08), 0 1px 4px rgba(10,37,64,0.04)",
      }}
      onClick={onClick}
    >
      {/* Colored top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
        style={{ background: `linear-gradient(90deg, ${ratingColor}, #4FA9E6)` }} />

      {/* Header area with rating color wash */}
      <div className="relative px-6 pt-7 pb-5"
        style={{ background: `linear-gradient(160deg, ${ratingColor}08 0%, ${ratingColor}04 50%, #ffffff 100%)` }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-5xl font-black tabular-nums leading-none" style={{ color: ratingColor, fontFamily: "Outfit, sans-serif" }}>
              {player.overall_rating}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-widest" style={{ fontFamily: "Outfit, sans-serif" }}>
              {POSITION_LABELS[player.position]}
            </div>
            {player.jersey_number && (
              <div className="text-xs text-slate-400 mt-0.5">#{player.jersey_number}</div>
            )}
          </div>

          {/* Avatar area */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black"
              style={player.avatar_url ? { border: `2px solid ${ratingColor}30` } : {
                background: `linear-gradient(135deg, ${ratingColor}15, ${ratingColor}30)`,
                border: `2px solid ${ratingColor}40`,
                color: ratingColor,
              }}>
              {player.avatar_url
                ? <Image src={player.avatar_url} alt={`${player.first_name} ${player.last_name}`} width={80} height={80} className="object-cover w-full h-full" />
                : initials(`${player.first_name} ${player.last_name}`)
              }
            </div>
            {badge && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap hub-tag text-[10px] font-black"
                style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}33` }}>
                {badge.label}
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="mt-5">
          <div className="text-xl font-black text-slate-900 tracking-tight leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            {player.first_name}
          </div>
          <div className="text-xl font-black tracking-tight leading-tight" style={{ color: ratingColor, fontFamily: "Outfit, sans-serif" }}>
            {player.last_name.toUpperCase()}
          </div>
        </div>

        {/* Archetype + sociotype */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {archetype && (() => {
            const AIcon = ARCHETYPE_ICONS[archetype.id];
            return (
              <span className="hub-tag text-xs font-semibold inline-flex items-center gap-1.5"
                style={{ background: `${archetype.color}12`, color: archetype.color, border: `1px solid ${archetype.color}30` }}>
                <AIcon size={11} strokeWidth={1.75} /> {archetype.label}
              </span>
            );
          })()}
          {sociotype && (() => {
            const SIcon = SOCIOTYPE_ICONS[sociotype.id];
            return (
              <span className="hub-tag text-xs font-semibold inline-flex items-center gap-1.5"
                style={{ background: `${sociotype.color_hex}12`, color: sociotype.color_hex, border: `1px solid ${sociotype.color_hex}30` }}>
                <SIcon size={11} strokeWidth={1.75} /> {sociotype.label}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-hub-border" />

      {/* Stats grid */}
      {scores && (
        <div className="px-6 py-4 grid grid-cols-5 gap-3 bg-hub-bg/40">
          <StatHex label="TEC" value={scores.techniek} />
          <StatHex label="FYS" value={scores.fysiek} />
          <StatHex label="TAC" value={scores.tactiek} />
          <StatHex label="MEN" value={scores.mentaal} />
          <StatHex label="TEA" value={scores.teamplay} />
        </div>
      )}

      {/* Divider */}
      {identity && <div className="mx-6 h-px bg-hub-border" />}

      {/* Core values */}
      {identity && (
        <div className="px-6 py-4 space-y-2.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Kernwaarden</div>
          <CoreValueBar label="Noodzaak" value={identity.core_noodzaak} color="#ef4444" />
          <CoreValueBar label="Creativiteit" value={identity.core_creativiteit} color="#a855f7" />
          <CoreValueBar label="Vertrouwen" value={identity.core_vertrouwen} color="#10B981" />
        </div>
      )}

      {/* Fit score */}
      {identity && identity.ai_fit_score > 0 && (
        <>
          <div className="mx-6 h-px bg-hub-border" />
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Fit Score</div>
              <div className="text-xs text-slate-500 mt-0.5">Scouting analyse</div>
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-black tabular-nums" style={{ color: getRatingColor(identity.ai_fit_score), fontFamily: "Outfit, sans-serif" }}>
                {identity.ai_fit_score}
              </div>
              <div className="text-xs text-slate-400">/100</div>
            </div>
          </div>
        </>
      )}

      {/* Team footer */}
      <div className="px-6 py-3 border-t border-hub-border/60" style={{ background: `${ratingColor}05` }}>
        <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {player.team_name ?? player.club ?? "Schoonhoven FC"}
        </div>
      </div>
    </div>
  );
}
