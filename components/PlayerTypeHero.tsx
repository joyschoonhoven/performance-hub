"use client";

import {
  Shield, Crown, Target, Navigation, Lock, ArrowUp,
  Zap, RotateCcw, Swords, BrainCircuit, Activity,
  ArrowRightFromLine, Gauge, Wind, Star, Eye,
  Sparkles, Crosshair, Trophy, Layers, Waves,
  Laugh, Flame, Briefcase, Palette,
} from "lucide-react";
import type { ArchetypeType, SociotypeName, ArchetypeMeta, SociotypeMeta } from "@/lib/types";
import { getRatingColor } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ── Icon map: archetype → Lucide icon ──────────────────────────────────────
const ARCHETYPE_ICONS: Record<ArchetypeType, LucideIcon> = {
  // GK
  sweeper_keeper: Shield,
  command_keeper: Crown,
  shot_stopper: Target,
  // CB
  ball_playing_cb: Navigation,
  defensive_blocker: Lock,
  aerial_dominant: ArrowUp,
  // Backs
  attacking_fullback: Zap,
  defensive_fullback: Shield,
  inverted_winger_back: RotateCcw,
  // CDM
  destroyer: Swords,
  deep_lying_playmaker: BrainCircuit,
  box_to_box: Activity,
  // CM
  progressive_passer: ArrowRightFromLine,
  engine: Gauge,
  press_master: Wind,
  // CAM
  classic_ten: Star,
  shadow_striker: Eye,
  creative_hub: Sparkles,
  // Winger
  pace_dribbler: Zap,
  crossing_winger: Crosshair,
  inverted_forward: RotateCcw,
  // ST
  target_man: Layers,
  poacher: Target,
  complete_forward: Trophy,
};

// ── Icon map: sociotype → Lucide icon ──────────────────────────────────────
const SOCIOTYPE_ICONS: Record<SociotypeName, LucideIcon> = {
  leider: Crown,
  strijder: Swords,
  denker: BrainCircuit,
  kunstenaar: Palette,
  professional: Briefcase,
  rustbrenger: Waves,
  joker: Laugh,
  killer: Flame,
};

interface PlayerTypeHeroProps {
  archetype: ArchetypeMeta;
  sociotype?: SociotypeMeta;
  overallRating: number;
  position: string;
}

export function PlayerTypeHero({ archetype, sociotype, overallRating, position }: PlayerTypeHeroProps) {
  const ArchIcon = ARCHETYPE_ICONS[archetype.id] ?? Star;
  const SocioIcon = sociotype ? SOCIOTYPE_ICONS[sociotype.id] : null;
  const ratingColor = getRatingColor(overallRating);

  const ratingLabel =
    overallRating >= 85 ? "Elite" :
    overallRating >= 75 ? "Gevorderd" :
    overallRating >= 65 ? "Gemiddeld" :
    overallRating >= 55 ? "Ontwikkelend" : "Beginner";

  return (
    <div className="relative overflow-hidden rounded-2xl border"
      style={{
        background: `linear-gradient(135deg, ${archetype.color}10 0%, #162040 60%, #0d1424 100%)`,
        borderColor: `${archetype.color}30`,
      }}>

      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 pointer-events-none"
        style={{ background: archetype.color, filter: "blur(60px)", transform: "translate(30%, -30%)" }} />

      <div className="relative p-6 flex items-start gap-5">

        {/* Large icon block */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: `${archetype.color}18`, border: `1.5px solid ${archetype.color}35` }}>
            <ArchIcon size={38} style={{ color: archetype.color }} strokeWidth={1.5} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: `${archetype.color}99` }}>
                {position} — Spelerstype
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">{archetype.label}</h2>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed max-w-xs">
                {archetype.description}
              </p>
            </div>

            {/* Rating badge */}
            <div className="flex-shrink-0 text-right">
              <div className="inline-flex flex-col items-center justify-center w-16 h-16 rounded-xl border"
                style={{ background: `${ratingColor}12`, borderColor: `${ratingColor}30` }}>
                <span className="text-2xl font-black tabular-nums leading-none"
                  style={{ color: ratingColor }}>{overallRating}</span>
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Rating</span>
              </div>
              <div className="text-[10px] font-semibold mt-1.5" style={{ color: ratingColor }}>
                {ratingLabel}
              </div>
            </div>
          </div>

          {/* Traits */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {archetype.traits.map((trait) => (
              <span key={trait}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: `${archetype.color}12`, color: `${archetype.color}cc`, border: `1px solid ${archetype.color}20` }}>
                {trait}
              </span>
            ))}

            {/* Sociotype pill */}
            {sociotype && SocioIcon && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ml-1"
                style={{ background: `${sociotype.color_hex}10`, color: `${sociotype.color_hex}cc`, border: `1px solid ${sociotype.color_hex}20` }}>
                <SocioIcon size={11} strokeWidth={2} />
                {sociotype.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Export icon maps for reuse elsewhere ───────────────────────────────────
export { ARCHETYPE_ICONS, SOCIOTYPE_ICONS };
