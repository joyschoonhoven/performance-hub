"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { POSITION_LABELS, POSITION_COLORS, ARCHETYPES, SOCIOTYPES } from "@/lib/types";
import { getRatingColor, getScoreColor, getAge } from "@/lib/utils";
import { Loader2, ArrowLeft, MapPin } from "lucide-react";
import type { PlayerWithDetails } from "@/lib/types";
import { SOCIOTYPE_ICONS } from "@/components/PlayerTypeHero";

// ─── Heat map data per position ──────────────────────────────────────────────
type Grid = number[][];

const HEAT_MAPS: Record<string, Grid> = {
  GK: [
    [0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
    [0,0,0.05,0.05,0,0],[0.05,0.1,0.3,0.3,0.1,0.05],[0.15,0.35,0.7,0.7,0.35,0.15],[0.3,0.65,1,1,0.65,0.3],
  ],
  CB: [
    [0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0.05,0.05,0,0],[0,0.1,0.2,0.2,0.1,0],
    [0.1,0.3,0.55,0.55,0.3,0.1],[0.2,0.6,0.95,0.95,0.6,0.2],[0.1,0.4,0.75,0.75,0.4,0.1],[0,0.1,0.3,0.3,0.1,0],
  ],
  LB: [
    [0,0,0,0,0,0],[0,0,0,0,0,0],[0.25,0.1,0,0,0,0],[0.45,0.3,0.1,0,0,0],[0.65,0.45,0.2,0,0,0],
    [0.9,0.6,0.25,0.05,0,0],[0.75,0.5,0.2,0,0,0],[0.4,0.2,0.1,0,0,0],[0,0.05,0,0,0,0],
  ],
  RB: [
    [0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0.1,0.25],[0,0,0,0.1,0.3,0.45],[0,0,0,0.2,0.45,0.65],
    [0,0,0.05,0.25,0.6,0.9],[0,0,0,0.2,0.5,0.75],[0,0,0,0.1,0.2,0.4],[0,0,0,0,0.05,0],
  ],
  CDM: [
    [0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0.1,0.1,0,0],[0,0.1,0.3,0.3,0.1,0],[0.05,0.25,0.65,0.65,0.25,0.05],
    [0.05,0.3,0.8,0.8,0.3,0.05],[0,0.15,0.5,0.5,0.15,0],[0,0.05,0.2,0.2,0.05,0],[0,0,0,0,0,0],
  ],
  CM: [
    [0,0,0,0,0,0],[0,0,0.05,0.05,0,0],[0,0.15,0.35,0.35,0.15,0],[0.05,0.3,0.65,0.65,0.3,0.05],
    [0.05,0.25,0.75,0.75,0.25,0.05],[0,0.2,0.55,0.55,0.2,0],[0,0.1,0.3,0.3,0.1,0],[0,0,0.1,0.1,0,0],[0,0,0,0,0,0],
  ],
  CAM: [
    [0,0,0.15,0.15,0,0],[0,0.2,0.5,0.5,0.2,0],[0.05,0.3,0.8,0.8,0.3,0.05],[0.05,0.25,0.7,0.7,0.25,0.05],
    [0,0.15,0.4,0.4,0.15,0],[0,0.05,0.2,0.2,0.05,0],[0,0,0.05,0.05,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
  ],
  LW: [
    [0.4,0.25,0.05,0,0,0],[0.75,0.5,0.2,0.05,0,0],[0.95,0.65,0.3,0.05,0,0],[0.6,0.4,0.15,0,0,0],
    [0.3,0.2,0.05,0,0,0],[0.1,0.05,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
  ],
  RW: [
    [0,0,0,0.05,0.25,0.4],[0,0,0.05,0.2,0.5,0.75],[0,0,0.05,0.3,0.65,0.95],[0,0,0,0.15,0.4,0.6],
    [0,0,0,0.05,0.2,0.3],[0,0,0,0,0.05,0.1],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
  ],
  ST: [
    [0.2,0.4,0.85,0.85,0.4,0.2],[0.25,0.5,1,1,0.5,0.25],[0.1,0.3,0.65,0.65,0.3,0.1],
    [0.05,0.15,0.3,0.3,0.15,0.05],[0,0.05,0.1,0.1,0.05,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
  ],
  SS: [
    [0.1,0.3,0.65,0.65,0.3,0.1],[0.2,0.4,0.9,0.9,0.4,0.2],[0.2,0.4,0.85,0.85,0.4,0.2],
    [0.1,0.3,0.55,0.55,0.3,0.1],[0,0.1,0.3,0.3,0.1,0],[0,0,0.1,0.1,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
  ],
};

function heatColor(v: number): string {
  if (v <= 0) return "transparent";
  const stops = [
    { t: 0,    r: 4,   g: 95,  b: 220 },
    { t: 0.35, r: 0,   g: 160, b: 255 },
    { t: 0.65, r: 0,   g: 200, b: 160 },
    { t: 0.85, r: 255, g: 180, b: 0   },
    { t: 1,    r: 255, g: 60,  b: 0   },
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].t && v <= stops[i + 1].t) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const t = lo.t === hi.t ? 0 : (v - lo.t) / (hi.t - lo.t);
  const r = Math.round(lo.r + (hi.r - lo.r) * t);
  const g = Math.round(lo.g + (hi.g - lo.g) * t);
  const b = Math.round(lo.b + (hi.b - lo.b) * t);
  return `rgba(${r},${g},${b},${Math.min(0.85, v * 0.92)})`;
}

const PW = 260, PH = 400, ROWS = 9, COLS = 6;
const CW = PW / COLS, CH = PH / ROWS;
const LINE = "rgba(10,37,64,0.25)", LINE_THIN = "rgba(10,37,64,0.12)";

function PitchHeatmap({ grid }: { grid: Grid }) {
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} width={PW} height={PH} style={{ display: "block", maxWidth: "100%" }}>
      {/* Pitch surface — light green */}
      <rect x={0} y={0} width={PW} height={PH} fill="#e8f5e0" rx={8} />
      {/* Grass stripes */}
      {Array.from({ length: ROWS }).map((_, r) => (
        <rect key={r} x={0} y={r * CH} width={PW} height={CH}
          fill={r % 2 === 0 ? "rgba(255,255,255,0.18)" : "transparent"} />
      ))}
      {/* Heat cells */}
      {grid.map((row, r) => row.map((val, c) => val > 0.02 ? (
        <rect key={`${r}-${c}`} x={c * CW} y={r * CH} width={CW} height={CH}
          fill={heatColor(val)} rx={2} />
      ) : null))}
      {/* Lines */}
      <rect x={1} y={1} width={PW - 2} height={PH - 2} fill="none" stroke={LINE} strokeWidth={1.5} rx={7} />
      <line x1={0} y1={PH / 2} x2={PW} y2={PH / 2} stroke={LINE} strokeWidth={1} />
      <circle cx={PW / 2} cy={PH / 2} r={32} fill="none" stroke={LINE_THIN} strokeWidth={1} />
      <circle cx={PW / 2} cy={PH / 2} r={2} fill={LINE} />
      {/* Penalty areas top */}
      {(() => { const bw = PW * 0.55, bh = PH * 0.17, bx = (PW - bw) / 2;
        return <rect x={bx} y={0} width={bw} height={bh} fill="none" stroke={LINE} strokeWidth={1} />; })()}
      {(() => { const bw = PW * 0.28, bh = PH * 0.07, bx = (PW - bw) / 2;
        return <rect x={bx} y={0} width={bw} height={bh} fill="none" stroke={LINE_THIN} strokeWidth={1} />; })()}
      <circle cx={PW / 2} cy={PH * 0.13} r={1.5} fill={LINE_THIN} />
      {/* Penalty areas bottom */}
      {(() => { const bw = PW * 0.55, bh = PH * 0.17, bx = (PW - bw) / 2;
        return <rect x={bx} y={PH - bh} width={bw} height={bh} fill="none" stroke={LINE} strokeWidth={1} />; })()}
      {(() => { const bw = PW * 0.28, bh = PH * 0.07, bx = (PW - bw) / 2;
        return <rect x={bx} y={PH - bh} width={bw} height={bh} fill="none" stroke={LINE_THIN} strokeWidth={1} />; })()}
      <circle cx={PW / 2} cy={PH * 0.87} r={1.5} fill={LINE_THIN} />
      {/* Goals */}
      {(() => { const gw = PW * 0.18, gh = 8;
        return <rect x={(PW - gw) / 2} y={-gh + 1} width={gw} height={gh} fill="none" stroke={LINE} strokeWidth={1.5} />; })()}
      {(() => { const gw = PW * 0.18, gh = 8;
        return <rect x={(PW - gw) / 2} y={PH - 1} width={gw} height={gh} fill="none" stroke={LINE} strokeWidth={1.5} />; })()}
      {/* Direction */}
      <text x={PW / 2} y={10} textAnchor="middle" fontSize={6} fill="rgba(10,37,64,0.3)"
        fontFamily="system-ui" letterSpacing="0.08em">AANVAL</text>
      <text x={PW / 2} y={PH - 3} textAnchor="middle" fontSize={6} fill="rgba(10,37,64,0.3)"
        fontFamily="system-ui" letterSpacing="0.08em">VERDEDIGING</text>
    </svg>
  );
}

function HeatLegend() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Laag</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "linear-gradient(to right, rgba(4,92,220,0.6), rgba(0,160,255,0.7), rgba(0,200,160,0.75), rgba(255,180,0,0.8), rgba(255,60,0,0.85))" }} />
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Hoog</span>
    </div>
  );
}

const ZONE_DESC: Record<string, { short: string; tactical: string }> = {
  GK:  { short: "Doelzone & Distributie",
         tactical: "Primaire activiteit beperkt tot de eigen zestien. Sleutelfunctie: positionering op de doellijn en aanzet van de opbouw via korte distributie." },
  CB:  { short: "Centraal Defensief Blok",
         tactical: "Kernpositie in het hart van de defensie. Verantwoordelijk voor afdekking van de dieptelijn en het winnen van kopduels bij stilstaande situaties." },
  LB:  { short: "Linker Flankdekking",
         tactical: "Primair gericht op flankbescherming en ondersteuning van de opbouwfase. Activiteit loopt van de eigen zestien tot de middenlijn." },
  RB:  { short: "Rechter Flankdekking",
         tactical: "Primair gericht op flankbescherming en ondersteuning van de opbouwfase. Activiteit loopt van de eigen zestien tot de middenlijn." },
  CDM: { short: "Defensief Middenveld Schild",
         tactical: "Positiespel gecentreerd voor de eigen verdedigingslinie. Kernfunctie: balverovering en directe herstart van de opbouw." },
  CM:  { short: "Centraal Middenveld",
         tactical: "Breed activiteitspatroon over het totale middenveldsgebied. Betrokken in zowel defensieve als offensieve fases van het spel." },
  CAM: { short: "Aanvallend Middenveld",
         tactical: "Actief in de zone achter de tegenstander. Primaire functie: creëren van kansen en fungeren als schakel tussen middenveld en aanval." },
  LW:  { short: "Linker Vleugelaanval",
         tactical: "Hoge activiteit op de linkerflank in de aanvallende helft. Tactische vrijheid om in te snijden of de breedte te benutten." },
  RW:  { short: "Rechter Vleugelaanval",
         tactical: "Hoge activiteit op de rechterflank in de aanvallende helft. Tactische vrijheid om in te snijden of de breedte te benutten." },
  ST:  { short: "Aanvalspunt",
         tactical: "Activiteit geconcentreerd rondom het vijandelijke strafschopgebied. Aanspeelpunt bij opbouw, finisher bij doelkansen." },
  SS:  { short: "Schaduwspits",
         tactical: "Beweegt tussen de aanvallende linie en het middenveld. Actief zowel als aanspeelpunt als bij diepgaande loopacties." },
};

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
  const zoneDesc = ZONE_DESC[position] ?? { short: position, tactical: "" };

  const posGroups = [
    { label: "Keeper",      keys: ["GK"] },
    { label: "Verdediging", keys: ["CB", "LB", "RB"] },
    { label: "Middenveld",  keys: ["CDM", "CM", "CAM"] },
    { label: "Aanval",      keys: ["LW", "RW", "ST", "SS"] },
  ];

  const identity = player?.identity;
  const arch = identity?.primary_archetype ? ARCHETYPES[identity.primary_archetype] : null;
  const socio = identity?.primary_sociotype ? SOCIOTYPES[identity.primary_sociotype] : null;
  const rColor = getRatingColor(player?.overall_rating ?? 65);
  const latestEval = player?.evaluations?.[0];
  const age = player?.date_of_birth ? getAge(player.date_of_birth) : null;

  const fysiekScore  = latestEval?.scores?.find(s => s.category === "fysiek")?.score;
  const techniekScore = latestEval?.scores?.find(s => s.category === "techniek")?.score;
  const tactiekScore = latestEval?.scores?.find(s => s.category === "tactiek")?.score;

  const flat = grid.flat();
  const maxVal = Math.max(...flat);
  const activeCells = flat.filter(v => v > 0.1).length;
  const coveragePct = Math.round((activeCells / flat.length) * 100);
  const kernZones = flat.filter(v => v >= 0.6).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin" style={{ color: "#4FA9E6" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="hub-page-header px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Link href="/dashboard/player/card"
              className="inline-flex items-center gap-1.5 mb-2 hub-label text-[10px]"
              style={{ color: "#6B7280" }}>
              <ArrowLeft size={11} /> Spelersprofiel
            </Link>
            <h1 className="hub-heading text-xl">Positie Heatmap</h1>
            <p className="hub-subtext text-xs mt-0.5">Activiteitszones op basis van speelpositie</p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
            style={{ background: `${posColor}10`, border: `1px solid ${posColor}30` }}>
            <MapPin size={13} style={{ color: posColor }} />
            <div>
              <div className="hub-label text-[9px]" style={{ color: `${posColor}90` }}>Positie</div>
              <div className="text-sm font-black" style={{ color: posColor, fontFamily: "Outfit, sans-serif" }}>{posLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[220px_auto_1fr] gap-6 items-start">

        {/* ── Column 1: Player Identity ── */}
        <div className="space-y-4">

          {/* Player card */}
          <div className="hub-card overflow-hidden">
            {/* Photo */}
            <div className="relative h-36 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${rColor}10, #F4F5F7)` }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, transparent, ${rColor}60, transparent)` }} />
              {player ? (
                player.avatar_url ? (
                  <Image src={player.avatar_url} alt={player.first_name} width={80} height={80}
                    className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                    style={{ border: `2px solid ${rColor}35` }} />
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${rColor}20, ${rColor}40)`,
                      border: `2px solid ${rColor}40`, color: rColor, fontFamily: "Outfit, sans-serif" }}>
                    {player.first_name[0]}{player.last_name[0]}
                  </div>
                )
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-hub-border" />
              )}
              {player && (
                <div className="absolute top-3 right-3 text-center">
                  <div className="text-xl font-black tabular-nums leading-none"
                    style={{ color: rColor, fontFamily: "Outfit, sans-serif" }}>
                    {player.overall_rating}
                  </div>
                  <div className="hub-label text-[8px]">OVR</div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              {player && (
                <>
                  <div>
                    <div className="text-sm font-black text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {player.first_name} {player.last_name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="hub-tag text-[10px]"
                        style={{ background: `${posColor}12`, color: posColor }}>
                        {player.position}
                      </span>
                      {player.jersey_number && (
                        <span className="text-[10px] text-slate-500">#{player.jersey_number}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-hub-border">
                    {age && (
                      <div className="flex items-center justify-between">
                        <span className="hub-label text-[10px]">Leeftijd</span>
                        <span className="text-xs font-semibold text-slate-700">{age} jaar</span>
                      </div>
                    )}
                    {player.nationality && (
                      <div className="flex items-center justify-between">
                        <span className="hub-label text-[10px]">Nationaliteit</span>
                        <span className="text-xs font-semibold text-slate-700">{player.nationality}</span>
                      </div>
                    )}
                    {player.team_name && (
                      <div className="flex items-center justify-between">
                        <span className="hub-label text-[10px]">Team</span>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px] text-right">
                          {player.team_name}
                        </span>
                      </div>
                    )}
                    {player.secondary_position && (
                      <div className="flex items-center justify-between">
                        <span className="hub-label text-[10px]">Alt. positie</span>
                        <span className="text-xs font-semibold" style={{ color: posColor }}>
                          {POSITION_LABELS[player.secondary_position]}
                        </span>
                      </div>
                    )}
                    {(player.evaluations?.length ?? 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="hub-label text-[10px]">Evaluaties</span>
                        <span className="text-xs font-semibold text-slate-700">{player.evaluations!.length}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DNA */}
          {(arch || socio) && (
            <div className="hub-card p-4 space-y-3">
              <div className="hub-label text-[9px]">Spelersprofiel DNA</div>
              {arch && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${arch.color}12`, border: `1px solid ${arch.color}25` }}>
                    {arch.icon}
                  </div>
                  <div>
                    <div className="hub-label text-[9px]">Archetype</div>
                    <div className="text-xs font-bold text-slate-800">{arch.label}</div>
                  </div>
                </div>
              )}
              {socio && (() => {
                const SocioIcon = SOCIOTYPE_ICONS[socio.id];
                return (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${socio.color_hex}10`, border: `1px solid ${socio.color_hex}20` }}>
                      <SocioIcon size={13} style={{ color: socio.color_hex }} strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="hub-label text-[9px]">Sociotype</div>
                      <div className="text-xs font-bold text-slate-800">{socio.label}</div>
                    </div>
                  </div>
                );
              })()}
              {identity?.ai_fit_score != null && (
                <div className="pt-2 border-t border-hub-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="hub-label text-[9px]">Scouting Index</span>
                    <span className="text-sm font-black tabular-nums" style={{ color: rColor, fontFamily: "Outfit, sans-serif" }}>
                      {identity.ai_fit_score}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-hub-border">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${identity.ai_fit_score}%`, background: `linear-gradient(90deg, ${rColor}50, ${rColor})` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Eval scores */}
          {(fysiekScore != null || techniekScore != null || tactiekScore != null) && (
            <div className="hub-card p-4">
              <div className="hub-label text-[9px] mb-3">Evaluatiescores</div>
              <div className="space-y-2.5">
                {[
                  { label: "Fysiek",   value: fysiekScore },
                  { label: "Techniek", value: techniekScore },
                  { label: "Tactiek",  value: tactiekScore },
                ].filter(s => s.value != null).map((s) => {
                  const c = getScoreColor(s.value!);
                  return (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">{s.label}</span>
                        <span className="text-xs font-black tabular-nums" style={{ color: c, fontFamily: "Outfit, sans-serif" }}>
                          {s.value!.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-hub-border">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${s.value! * 10}%`, background: `linear-gradient(90deg, ${c}60, ${c})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Column 2: Pitch ── */}
        <div className="flex flex-col items-center gap-3">
          <div className="hub-card p-4 inline-flex flex-col items-center gap-3">
            <PitchHeatmap grid={grid} />
            <div className="w-full max-w-[260px]">
              <HeatLegend />
            </div>
          </div>
        </div>

        {/* ── Column 3: Analysis ── */}
        <div className="space-y-5">

          {/* Tactical zone */}
          <div className="hub-card-accent p-5">
            <div className="hub-label text-[9px] mb-1">Tactische Zoneclassificatie</div>
            <div className="text-sm font-bold text-slate-900 mb-2">{zoneDesc.short}</div>
            <p className="text-xs leading-relaxed text-slate-600">{zoneDesc.tactical}</p>
          </div>

          {/* Zone metrics */}
          <div className="hub-card p-5">
            <div className="hub-label text-[9px] mb-3">Zone Intensiteitsindex</div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Piekintensiteit", value: `${Math.round(maxVal * 100)}%` },
                { label: "Velddekking",     value: `${coveragePct}%` },
                { label: "Kernzones",        value: `${kernZones}` },
                { label: "Actieve zones",   value: `${activeCells}` },
              ].map((s) => (
                <div key={s.label} className="hub-surface p-3 rounded-xl">
                  <div className="hub-value text-xl">{s.value}</div>
                  <div className="hub-label text-[9px] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Position selector */}
          <div className="hub-card p-5">
            <div className="hub-label text-[9px] mb-3">Positie Explorer</div>
            <div className="space-y-3">
              {posGroups.map((group) => (
                <div key={group.label}>
                  <div className="text-[9px] uppercase tracking-widest mb-1.5 text-slate-400">
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.keys.map((key) => {
                      const isSelected = position === key;
                      const isPlayerPos = player?.position === key;
                      const kColor = POSITION_COLORS[key as keyof typeof POSITION_COLORS] ?? "#4FA9E6";
                      return (
                        <button key={key} onClick={() => setSelectedPos(key)}
                          className="relative px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                          style={isSelected ? {
                            background: `${kColor}15`, border: `1px solid ${kColor}50`, color: kColor,
                          } : {
                            background: "#F4F5F7", border: "1px solid #E4E7EB", color: "#6B7280",
                          }}>
                          {key}
                          {isPlayerPos && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                              style={{ background: kColor }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {player?.position && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-hub-border">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: posColor }} />
                <span className="text-[10px] text-slate-400">
                  Primaire positie: {POSITION_LABELS[player.position as keyof typeof POSITION_LABELS]}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
