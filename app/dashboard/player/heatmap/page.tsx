"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { POSITION_LABELS, POSITION_COLORS } from "@/lib/types";
import { Loader2, ArrowLeft, MapPin, Flame } from "lucide-react";
import type { PlayerWithDetails } from "@/lib/types";

// ─── Heat map data per position ──────────────────────────────────────────────
// Grid: 9 rows × 6 cols. Row 0 = opponent goal, Row 8 = own goal.
// Values 0..1 (0 = cold, 1 = hot).
type Grid = number[][];

const HEAT_MAPS: Record<string, Grid> = {
  GK: [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0.05, 0.05, 0, 0],
    [0.05, 0.1, 0.3, 0.3, 0.1, 0.05],
    [0.15, 0.35, 0.7, 0.7, 0.35, 0.15],
    [0.3, 0.65, 1, 1, 0.65, 0.3],
  ],
  CB: [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0.05, 0.05, 0, 0],
    [0, 0.1, 0.2, 0.2, 0.1, 0],
    [0.1, 0.3, 0.55, 0.55, 0.3, 0.1],
    [0.2, 0.6, 0.95, 0.95, 0.6, 0.2],
    [0.1, 0.4, 0.75, 0.75, 0.4, 0.1],
    [0, 0.1, 0.3, 0.3, 0.1, 0],
  ],
  LB: [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0.25, 0.1, 0, 0, 0, 0],
    [0.45, 0.3, 0.1, 0, 0, 0],
    [0.65, 0.45, 0.2, 0, 0, 0],
    [0.9, 0.6, 0.25, 0.05, 0, 0],
    [0.75, 0.5, 0.2, 0, 0, 0],
    [0.4, 0.2, 0.1, 0, 0, 0],
    [0, 0.05, 0, 0, 0, 0],
  ],
  RB: [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0.1, 0.25],
    [0, 0, 0, 0.1, 0.3, 0.45],
    [0, 0, 0, 0.2, 0.45, 0.65],
    [0, 0, 0.05, 0.25, 0.6, 0.9],
    [0, 0, 0, 0.2, 0.5, 0.75],
    [0, 0, 0, 0.1, 0.2, 0.4],
    [0, 0, 0, 0, 0.05, 0],
  ],
  CDM: [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0.1, 0.1, 0, 0],
    [0, 0.1, 0.3, 0.3, 0.1, 0],
    [0.05, 0.25, 0.65, 0.65, 0.25, 0.05],
    [0.05, 0.3, 0.8, 0.8, 0.3, 0.05],
    [0, 0.15, 0.5, 0.5, 0.15, 0],
    [0, 0.05, 0.2, 0.2, 0.05, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  CM: [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0.05, 0.05, 0, 0],
    [0, 0.15, 0.35, 0.35, 0.15, 0],
    [0.05, 0.3, 0.65, 0.65, 0.3, 0.05],
    [0.05, 0.25, 0.75, 0.75, 0.25, 0.05],
    [0, 0.2, 0.55, 0.55, 0.2, 0],
    [0, 0.1, 0.3, 0.3, 0.1, 0],
    [0, 0, 0.1, 0.1, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  CAM: [
    [0, 0, 0.15, 0.15, 0, 0],
    [0, 0.2, 0.5, 0.5, 0.2, 0],
    [0.05, 0.3, 0.8, 0.8, 0.3, 0.05],
    [0.05, 0.25, 0.7, 0.7, 0.25, 0.05],
    [0, 0.15, 0.4, 0.4, 0.15, 0],
    [0, 0.05, 0.2, 0.2, 0.05, 0],
    [0, 0, 0.05, 0.05, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  LW: [
    [0.4, 0.25, 0.05, 0, 0, 0],
    [0.75, 0.5, 0.2, 0.05, 0, 0],
    [0.95, 0.65, 0.3, 0.05, 0, 0],
    [0.6, 0.4, 0.15, 0, 0, 0],
    [0.3, 0.2, 0.05, 0, 0, 0],
    [0.1, 0.05, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  RW: [
    [0, 0, 0, 0.05, 0.25, 0.4],
    [0, 0, 0.05, 0.2, 0.5, 0.75],
    [0, 0, 0.05, 0.3, 0.65, 0.95],
    [0, 0, 0, 0.15, 0.4, 0.6],
    [0, 0, 0, 0.05, 0.2, 0.3],
    [0, 0, 0, 0, 0.05, 0.1],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  ST: [
    [0.2, 0.4, 0.85, 0.85, 0.4, 0.2],
    [0.25, 0.5, 1, 1, 0.5, 0.25],
    [0.1, 0.3, 0.65, 0.65, 0.3, 0.1],
    [0.05, 0.15, 0.3, 0.3, 0.15, 0.05],
    [0, 0.05, 0.1, 0.1, 0.05, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  SS: [
    [0.1, 0.3, 0.65, 0.65, 0.3, 0.1],
    [0.2, 0.4, 0.9, 0.9, 0.4, 0.2],
    [0.2, 0.4, 0.85, 0.85, 0.4, 0.2],
    [0.1, 0.3, 0.55, 0.55, 0.3, 0.1],
    [0, 0.1, 0.3, 0.3, 0.1, 0],
    [0, 0, 0.1, 0.1, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
};

// ─── Color interpolation ──────────────────────────────────────────────────────
function heatColor(v: number): string {
  if (v <= 0) return "transparent";
  // Cold → Warm → Hot: dark-blue → cyan → yellow
  const stops = [
    { t: 0,    r: 4,   g: 95,  b: 220 },  // #045cdc blue
    { t: 0.35, r: 0,   g: 200, b: 255 },  // #00c8ff cyan
    { t: 0.65, r: 0,   g: 230, b: 180 },  // #00e6b4 teal
    { t: 0.85, r: 255, g: 200, b: 0   },  // #ffc800 yellow
    { t: 1,    r: 255, g: 80,  b: 0   },  // #ff5000 orange-red
  ];

  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].t && v <= stops[i + 1].t) {
      lo = stops[i]; hi = stops[i + 1]; break;
    }
  }
  const t = lo.t === hi.t ? 0 : (v - lo.t) / (hi.t - lo.t);
  const r = Math.round(lo.r + (hi.r - lo.r) * t);
  const g = Math.round(lo.g + (hi.g - lo.g) * t);
  const b = Math.round(lo.b + (hi.b - lo.b) * t);
  const a = Math.min(0.85, v * 0.9);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── Pitch SVG ───────────────────────────────────────────────────────────────
const PW = 300;   // pitch width
const PH = 460;   // pitch height
const ROWS = 9;
const COLS = 6;
const CW = PW / COLS;
const CH = PH / ROWS;

// Pitch markings in normalized coords (0..1)
const LINE = "rgba(255,255,255,0.35)";
const LINE_THIN = "rgba(255,255,255,0.18)";

function PitchHeatmap({ grid, posColor }: { grid: Grid; posColor: string }) {
  return (
    <svg
      viewBox={`0 0 ${PW} ${PH}`}
      width={PW}
      height={PH}
      style={{ display: "block", maxWidth: "100%" }}
    >
      {/* Pitch background */}
      <rect x={0} y={0} width={PW} height={PH} fill="#0a1628" rx={6} />

      {/* Grass stripes */}
      {Array.from({ length: ROWS }).map((_, r) => (
        <rect
          key={r}
          x={0} y={r * CH} width={PW} height={CH}
          fill={r % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent"}
        />
      ))}

      {/* Heat cells */}
      {grid.map((row, r) =>
        row.map((val, c) => val > 0.02 ? (
          <rect
            key={`${r}-${c}`}
            x={c * CW} y={r * CH}
            width={CW} height={CH}
            fill={heatColor(val)}
            rx={2}
          />
        ) : null)
      )}

      {/* Pitch outline */}
      <rect x={1} y={1} width={PW - 2} height={PH - 2} fill="none" stroke={LINE} strokeWidth={1.5} rx={5} />

      {/* Halfway line */}
      <line x1={0} y1={PH / 2} x2={PW} y2={PH / 2} stroke={LINE} strokeWidth={1} />

      {/* Center circle */}
      <circle cx={PW / 2} cy={PH / 2} r={38} fill="none" stroke={LINE_THIN} strokeWidth={1} />
      <circle cx={PW / 2} cy={PH / 2} r={2} fill={LINE} />

      {/* Opponent penalty area (top) */}
      {(() => {
        const bw = PW * 0.55, bh = PH * 0.17;
        const bx = (PW - bw) / 2, by = 0;
        return <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke={LINE} strokeWidth={1} />;
      })()}
      {/* Opponent 6-yard box (top) */}
      {(() => {
        const bw = PW * 0.28, bh = PH * 0.07;
        const bx = (PW - bw) / 2, by = 0;
        return <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke={LINE_THIN} strokeWidth={1} />;
      })()}
      {/* Opponent penalty spot */}
      <circle cx={PW / 2} cy={PH * 0.13} r={2} fill={LINE_THIN} />

      {/* Own penalty area (bottom) */}
      {(() => {
        const bw = PW * 0.55, bh = PH * 0.17;
        const bx = (PW - bw) / 2, by = PH - bh;
        return <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke={LINE} strokeWidth={1} />;
      })()}
      {/* Own 6-yard box */}
      {(() => {
        const bw = PW * 0.28, bh = PH * 0.07;
        const bx = (PW - bw) / 2, by = PH - bh;
        return <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke={LINE_THIN} strokeWidth={1} />;
      })()}
      {/* Own penalty spot */}
      <circle cx={PW / 2} cy={PH * 0.87} r={2} fill={LINE_THIN} />

      {/* Opponent goal (top) */}
      {(() => {
        const gw = PW * 0.18, gh = 10;
        return <rect x={(PW - gw) / 2} y={-gh + 1} width={gw} height={gh} fill="none" stroke={LINE} strokeWidth={1.5} />;
      })()}
      {/* Own goal (bottom) */}
      {(() => {
        const gw = PW * 0.18, gh = 10;
        return <rect x={(PW - gw) / 2} y={PH - 1} width={gw} height={gh} fill="none" stroke={LINE} strokeWidth={1.5} />;
      })()}

      {/* Corner arcs */}
      {[[0, 0], [PW, 0], [0, PH], [PW, PH]].map(([cx, cy], i) => (
        <path
          key={i}
          d={`M ${cx + (cx === 0 ? 8 : -8)} ${cy} A 8 8 0 0 ${cx === 0 ? 1 : 0} ${cx} ${cy + (cy === 0 ? 8 : -8)}`}
          fill="none" stroke={LINE_THIN} strokeWidth={1}
        />
      ))}

      {/* Direction label */}
      <text x={PW / 2} y={12} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.3)" fontFamily="system-ui">
        AANVAL ↑
      </text>
      <text x={PW / 2} y={PH - 4} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.3)" fontFamily="system-ui">
        VERDEDIGING ↓
      </text>

      {/* Glow under hottest cell */}
      <defs>
        <radialGradient id="hotglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={posColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={posColor} stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function HeatLegend() {
  const stops = ["#045cdc", "#00c8ff", "#00e6b4", "#ffc800", "#ff5000"];
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Koud</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `linear-gradient(to right, ${stops.join(",")})` }} />
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Heet</span>
    </div>
  );
}

// ─── Position zone descriptions ───────────────────────────────────────────────
const ZONE_DESC: Record<string, string> = {
  GK:  "Actief in en rond de eigen doelzone. Stuurt de verdediging aan en beheerst de penaltylijn.",
  CB:  "Domineert het hart van de verdediging. Sterk in de lucht en in 1-op-1 duels.",
  LB:  "Dekt de linkerflank af en ondersteunt aanvallen via de buitenlijn.",
  RB:  "Dekt de rechterflank af en ondersteunt aanvallen via de buitenlijn.",
  CDM: "Schild voor de verdediging. Breekt aanvallen af en verdeelt het spel.",
  CM:  "Het hart van het middenveld. Betrokken in zowel opbouw als druk zetten.",
  CAM: "Speelt tussen de linies. Creëert ruimte en kansen voor de aanval.",
  LW:  "Snelle acties op de linkervleugel. Trekt naar binnen of geeft de dieptepass.",
  RW:  "Snelle acties op de rechtervleugel. Trekt naar binnen of geeft de dieptepass.",
  ST:  "Aanspeelpunt in de aanval. Altijd gevaarlijk in de penaltyruimte.",
  SS:  "Diepe aanvaller die tussen linies beweegt. Combineert met de spits.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HeatmapPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPos, setSelectedPos] = useState<string | null>(null);

  useEffect(() => {
    getMyPlayerData().then((p) => {
      setPlayer(p);
      if (p?.position) setSelectedPos(p.position);
      setLoading(false);
    });
  }, []);

  const position = selectedPos ?? player?.position ?? "CM";
  const grid = HEAT_MAPS[position] ?? HEAT_MAPS.CM;
  const posColor = POSITION_COLORS[position as keyof typeof POSITION_COLORS] ?? "#4FA9E6";
  const posLabel = POSITION_LABELS[position as keyof typeof POSITION_LABELS] ?? position;

  const positions = Object.keys(POSITION_LABELS) as (keyof typeof POSITION_LABELS)[];

  // Group positions
  const posGroups = [
    { label: "Keepers",      keys: ["GK"] },
    { label: "Verdedigers",  keys: ["CB", "LB", "RB"] },
    { label: "Middenvelders",keys: ["CDM", "CM", "CAM"] },
    { label: "Aanvallers",   keys: ["LW", "RW", "ST", "SS"] },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin" style={{ color: "#4FA9E6" }} />
      </div>
    );
  }

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8" style={{ background: "#0e1a2b", minHeight: "100vh" }}>

      {/* Header */}
      <div
        className="px-6 sm:px-8 lg:px-10 pt-8 pb-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link
          href="/dashboard/player/card"
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-4"
          style={{ color: "rgba(255,255,255,0.35)" }}>
          <ArrowLeft size={13} /> Terug naar Spelerskaart
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={16} style={{ color: posColor }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: posColor }}>
                Positie Heatmap
              </span>
            </div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
              {player ? `${player.first_name} ${player.last_name}` : "Heatmap"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Activiteitszones op basis van speelpositie
            </p>
          </div>

          {/* Position badge */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: `${posColor}12`, border: `1px solid ${posColor}30` }}>
            <MapPin size={14} style={{ color: posColor }} />
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: `${posColor}90` }}>Positie</div>
              <div className="font-black text-sm" style={{ color: posColor, fontFamily: "Outfit, sans-serif" }}>{posLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 sm:px-8 lg:px-10 py-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Pitch ── */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4">
            <PitchHeatmap grid={grid} posColor={posColor} />
            <div className="w-full max-w-[300px]">
              <HeatLegend />
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 space-y-6 min-w-0">

            {/* Position zone description */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: `${posColor}0d`, border: `1px solid ${posColor}20` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: posColor }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: posColor }}>
                  {posLabel}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                {ZONE_DESC[position] ?? "Activiteitspatroon op basis van positie."}
              </p>
            </div>

            {/* Position selector */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                Kies positie
              </div>
              <div className="space-y-3">
                {posGroups.map((group) => (
                  <div key={group.label}>
                    <div className="text-[10px] uppercase tracking-widest mb-1.5"
                      style={{ color: "rgba(255,255,255,0.2)" }}>
                      {group.label}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.keys.map((key) => {
                        const isSelected = position === key;
                        const kColor = POSITION_COLORS[key as keyof typeof POSITION_COLORS] ?? "#4FA9E6";
                        const isPlayerPos = player?.position === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedPos(key)}
                            className="relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            style={isSelected ? {
                              background: `${kColor}20`,
                              border: `1px solid ${kColor}60`,
                              color: kColor,
                            } : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.4)",
                            }}>
                            {key}
                            {isPlayerPos && (
                              <span
                                className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                                style={{ background: kColor }}
                                title="Jouw positie"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {player?.position && (
                <p className="text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                  <span className="w-2 h-2 rounded-full inline-block mr-1.5"
                    style={{ background: posColor, verticalAlign: "middle" }} />
                  Jouw vaste positie: {POSITION_LABELS[player.position as keyof typeof POSITION_LABELS]}
                </p>
              )}
            </div>

            {/* Zone intensity stats */}
            {(() => {
              const flatVals = grid.flat();
              const maxVal = Math.max(...flatVals);
              const avgVal = flatVals.reduce((a, b) => a + b, 0) / flatVals.length;
              const hotCells = flatVals.filter((v) => v >= 0.6).length;
              const coveragePct = Math.round((flatVals.filter((v) => v > 0.1).length / flatVals.length) * 100);

              return (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-3"
                    style={{ color: "rgba(255,255,255,0.3)" }}>
                    Zone Statistieken
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Piek intensiteit", value: `${Math.round(maxVal * 100)}%`, color: heatColor(maxVal) },
                      { label: "Gem. activiteit",  value: `${Math.round(avgVal * 100)}%`, color: heatColor(avgVal * 2) },
                      { label: "Actieve zones",    value: `${hotCells}`,                  color: posColor },
                      { label: "Velddekking",      value: `${coveragePct}%`,              color: posColor },
                    ].map((s) => (
                      <div key={s.label}
                        className="p-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="text-xl font-black tabular-nums" style={{ color: s.color, fontFamily: "Outfit, sans-serif" }}>
                          {s.value}
                        </div>
                        <div className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </div>
  );
}
