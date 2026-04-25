"use client";

import { useState, useEffect, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMyPlayerData, getAllPlayers } from "@/lib/supabase/queries";
import { ARCHETYPES, SOCIOTYPES, POSITION_LABELS, CATEGORY_LABELS, EVALUATION_SCHEMA } from "@/lib/types";
import { getRatingColor, getRatingLabel, getAge, formatDate, getScoreColor } from "@/lib/utils";
import { Loader2, Settings, Sparkles, Activity, BarChart3, ShieldAlert, Bookmark, GitCompare, Camera, Wand2 } from "lucide-react";
import type { PlayerWithDetails } from "@/lib/types";
import { SOCIOTYPE_ICONS } from "@/components/PlayerTypeHero";
import { AvatarUpload } from "@/components/AvatarUpload";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { PlayerComparisonChart } from "@/components/charts/PlayerComparisonChart";
import { InjuryBodyMap, type BodyRegion, type DominantFoot } from "@/components/InjuryBodyMap";
import { DUTCH_CLUBS } from "@/lib/dutch-clubs";

/* ─── helpers ─────────────────────────────────────────────────── */
function parseSubScores(n?: string): Record<string, number> | null {
  if (!n) return null; try { return JSON.parse(n); } catch { return null; }
}
function toFifa(v: number) { return Math.round(v * 10); }

/* ─── FIFA FUT Card ─────────────────────────────────────────────
   Real FIFA Ultimate Team card shape — simple rounded rect only.
──────────────────────────────────────────────────────────────── */
const CW = 210;   // card width
const CH = 296;   // card height
const CR = 11;    // outer corner radius
const BD = 4;     // border thickness

const IW = CW - BD * 2;   // 202
const IH = CH - BD * 2;   // 288
const IR = CR - BD;        // 7

function cardPath(w: number, h: number, r: number) {
  return `M ${r},0 L ${w - r},0 Q ${w},0 ${w},${r} L ${w},${h - r} Q ${w},${h} ${w - r},${h} L ${r},${h} Q 0,${h} 0,${h - r} L 0,${r} Q 0,0 ${r},0 Z`;
}

const OUTER_PATH = cardPath(CW, CH, CR);
const INNER_PATH = cardPath(IW, IH, IR);

/* ── FIFA tier colours per rating range ──────────────────────── */
function getFutTier(rating: number) {
  if (rating >= 90) return {
    label: "Icon", dark: "#0A0A0A", mid: "#C0A000",
    bg1: "#FFD700", bg2: "#1C1C1C", ring: "#FFE855", accent: "#FFFFFF",
  };
  if (rating >= 85) return {
    label: "TOTW", dark: "#1A0D45", mid: "#5A35B0",
    bg1: "#8B5CF6", bg2: "#2D1A6E", ring: "#C4B5FD", accent: "#E0D4FF",
  };
  if (rating >= 80) return {
    label: "Speciaal", dark: "#4A1800", mid: "#C05010",
    bg1: "#F97316", bg2: "#7C2D00", ring: "#FDB575", accent: "#FFD4A8",
  };
  if (rating >= 65) return {
    label: "Goud", dark: "#4A3000", mid: "#B8860B",
    bg1: "#F5C842", bg2: "#8A6000", ring: "#FFD700", accent: "#FFF0A0",
  };
  if (rating >= 50) return {
    label: "Zilver", dark: "#303030", mid: "#909090",
    bg1: "#D8D8D8", bg2: "#707070", ring: "#F0F0F0", accent: "#FFFFFF",
  };
  if (rating >= 0) return {
    label: "Brons", dark: "#5C2E00", mid: "#A05820",
    bg1: "#CD7F32", bg2: "#8B4513", ring: "#E8A060", accent: "#F0C080",
  };
  return {
    label: "Basis", dark: "#1E2830", mid: "#5A6B7A",
    bg1: "#9BA4B5", bg2: "#4A5560", ring: "#B0BCC8", accent: "#D0D8E4",
  };
}

function FifaCard({
  player, rColor, avatarOverride,
}: { player: PlayerWithDetails; rColor: string; avatarOverride?: string | null }) {
  const uid = useId().replace(/:/g, "");
  const s = player.recent_scores;
  const rating = player.overall_rating;
  const tier = getFutTier(rating);

  const fifaStats = s ? [
    { v: toFifa(s.fysiek),                                                  l: "PAC" },
    { v: toFifa(s.techniek),                                                l: "SHO" },
    { v: Math.round(toFifa(s.teamplay) * 0.6 + toFifa(s.techniek) * 0.4), l: "PAS" },
    { v: Math.round(toFifa(s.techniek) * 0.55 + toFifa(s.fysiek) * 0.45), l: "DRI" },
    { v: Math.round(toFifa(s.tactiek) * 0.65 + toFifa(s.mentaal) * 0.35), l: "DEF" },
    { v: Math.round(toFifa(s.fysiek) * 0.60 + toFifa(s.mentaal) * 0.40),  l: "PHY" },
  ] : [];

  const av = avatarOverride ?? player.avatar_url;

  /* metallic gradient stops per tier */
  let metalStops: { offset: string; color: string }[];
  if (rating >= 65) {
    // gold (covers Goud, Speciaal, TOTW, Icon)
    metalStops = [
      { offset: "0%",   color: "#FFE580" },
      { offset: "30%",  color: "#B8860B" },
      { offset: "50%",  color: "#7A5500" },
      { offset: "70%",  color: "#C89830" },
      { offset: "100%", color: "#FFE580" },
    ];
  } else if (rating >= 50) {
    // silver
    metalStops = [
      { offset: "0%",   color: "#F4F4F4" },
      { offset: "40%",  color: "#A0A0A0" },
      { offset: "55%",  color: "#707070" },
      { offset: "75%",  color: "#C0C0C0" },
      { offset: "100%", color: "#F4F4F4" },
    ];
  } else if (rating >= 0) {
    // bronze
    metalStops = [
      { offset: "0%",   color: "#F0A870" },
      { offset: "40%",  color: "#8B4513" },
      { offset: "55%",  color: "#5C2E00" },
      { offset: "75%",  color: "#A05820" },
      { offset: "100%", color: "#F0A060" },
    ];
  } else {
    // basis
    metalStops = [
      { offset: "0%",   color: "#B0C0D0" },
      { offset: "40%",  color: "#4A5560" },
      { offset: "55%",  color: "#2E3840" },
      { offset: "75%",  color: "#6A7A8A" },
      { offset: "100%", color: "#B0C0D0" },
    ];
  }

  return (
    <div className="relative mx-auto select-none"
      style={{ width: CW, height: CH, flexShrink: 0 }}>

      {/* ═══ LAYER 1 — Background + card shape (with drop-shadow) ═══ */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={CW} height={CH}
        viewBox={`0 0 ${CW} ${CH}`}
        style={{
          zIndex: 1,
          filter: `drop-shadow(0 16px 48px ${tier.mid}90) drop-shadow(0 4px 16px rgba(0,0,0,0.8))`,
        }}>
        <defs>
          {/* Metallic border gradient */}
          <linearGradient id={`metalGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {metalStops.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
          {/* Card background gradient */}
          <linearGradient id={`cardbg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={tier.bg1} />
            <stop offset="45%"  stopColor={tier.bg2} />
            <stop offset="100%" stopColor="#010508" />
          </linearGradient>
          {/* Shimmer */}
          <linearGradient id={`shimmer-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="18%"  stopColor="rgba(255,255,255,0.18)" />
            <stop offset="60%"  stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <clipPath id={`clip-inner-${uid}`}>
            <path d={INNER_PATH} />
          </clipPath>
        </defs>

        {/* Metallic border — the OUTER_PATH fill IS the border */}
        <path d={OUTER_PATH} fill={`url(#metalGrad-${uid})`} />

        {/* Inner card contents */}
        <g transform={`translate(${BD},${BD})`} clipPath={`url(#clip-inner-${uid})`}>
          <path d={INNER_PATH} fill={`url(#cardbg-${uid})`} />
          <path d={INNER_PATH} fill={`url(#shimmer-${uid})`} />
          {/* Diagonal texture lines */}
          <g opacity="0.05">
            <line x1="150" y1="-20" x2="-10" y2="250" stroke="white" strokeWidth="40" />
            <line x1="200" y1="-20" x2="40"  y2="250" stroke="white" strokeWidth="22" />
          </g>
        </g>
      </svg>

      {/* ═══ LAYER 2 — Full-bleed player photo ═══ */}
      <div
        className="absolute"
        style={{
          zIndex: 2,
          left: BD, top: BD,
          width: IW, height: IH,
          borderRadius: `${IR}px`,
          overflow: "hidden",
        }}>
        {av ? (
          <Image src={av} alt={player.first_name} fill className="object-cover object-top" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-black"
            style={{
              fontSize: 64,
              background: `linear-gradient(180deg,${tier.bg1}30,${tier.bg2}60)`,
              color: `${tier.ring}80`,
            }}>
            {player.first_name[0]}{player.last_name[0]}
          </div>
        )}

        {/* Bottom gradient overlay for stats readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.92) 72%, rgba(0,0,0,0.98) 100%)" }}
        />
        {/* Top-left radial for rating readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 0% 0%, rgba(0,0,0,0.55) 0%, transparent 52%)" }}
        />
      </div>

      {/* ═══ LAYER 3 — Text overlays ═══ */}

      {/* Rating + position + flag — top left */}
      <div className="absolute" style={{ zIndex: 3, top: BD + 7, left: BD + 8 }}>
        <div
          className="font-black leading-none"
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 40,
            color: "white",
            textShadow: "0 0 24px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.8)",
          }}>
          {rating}
        </div>
        <div
          className="font-black uppercase tracking-widest"
          style={{ fontSize: 10, color: tier.ring, textShadow: "0 1px 8px rgba(0,0,0,1)", marginTop: 1 }}>
          {player.position}
        </div>
        <div style={{ fontSize: 17, lineHeight: 1, marginTop: 3, filter: "drop-shadow(0 1px 6px rgba(0,0,0,1))" }}>
          🇳🇱
        </div>
      </div>

      {/* Name — centered, above stats */}
      <div
        className="absolute text-center"
        style={{ zIndex: 3, left: BD, right: BD, bottom: BD + 52 }}>
        <div
          className="font-black text-white uppercase"
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 14,
            letterSpacing: "0.07em",
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}>
          {player.last_name.toUpperCase()}
        </div>
      </div>

      {/* Divider above stats */}
      <div
        className="absolute"
        style={{
          zIndex: 3,
          left: BD + 3, right: BD + 3,
          bottom: BD + 48,
          height: 1,
          background: `linear-gradient(to right, transparent, ${tier.ring}65, transparent)`,
        }}
      />

      {/* FIFA stats — bottom */}
      {fifaStats.length > 0 && (
        <div className="absolute" style={{ zIndex: 3, left: BD + 6, right: BD + 6, bottom: BD + 7 }}>
          <div className="grid grid-cols-3" style={{ gap: "2px 3px" }}>
            {fifaStats.map((st) => (
              <div key={st.l} className="flex items-center gap-1">
                <span
                  className="font-black tabular-nums"
                  style={{ color: tier.ring, fontFamily: "Outfit, sans-serif", fontSize: 13, lineHeight: 1.2 }}>
                  {st.v}
                </span>
                <span
                  className="font-bold uppercase"
                  style={{ color: "rgba(255,255,255,0.40)", fontSize: 9, letterSpacing: "0.04em" }}>
                  {st.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ LAYER 4 — Border strokes on top ═══ */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={CW} height={CH}
        viewBox={`0 0 ${CW} ${CH}`}
        style={{ zIndex: 4 }}>
        {/* Outer crisp edge on metallic border */}
        <path
          d={OUTER_PATH}
          fill="none"
          stroke={tier.dark}
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />
        {/* Inner accent line */}
        <path
          d={INNER_PATH}
          fill="none"
          stroke={tier.accent}
          strokeWidth="1"
          strokeOpacity="0.4"
          transform={`translate(${BD},${BD})`}
        />
      </svg>
    </div>
  );
}

/* ─── semicircle score gauge ───────────────────────────────────── */
function SemiGauge({ score, color }: { score: number; color: string }) {
  const r = 26;
  const circ = Math.PI * r;
  const fill = circ * (score / 100);
  return (
    <svg width="64" height="42" viewBox="0 0 64 42">
      <path d="M 6 38 A 26 26 0 0 1 58 38" fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />
      <path d="M 6 38 A 26 26 0 0 1 58 38" fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`} />
      <text x="32" y="37" textAnchor="middle" fill="white"
        fontSize="14" fontWeight="900" fontFamily="Outfit, sans-serif">{score}</text>
    </svg>
  );
}

/* ─── attribute column (Haaland-style) ────────────────────────── */
function AttributeColumn({ categoryId, score, subNotes }: {
  categoryId: string; score: number; subNotes?: string
}) {
  const schema = EVALUATION_SCHEMA.find((c) => c.id === categoryId)!;
  const sub = parseSubScores(subNotes);
  const sc = getScoreColor(score);
  const display = toFifa(score);
  return (
    <div className="flex flex-col items-center min-w-[120px]">
      <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1">{schema.label}</div>
      <SemiGauge score={display} color={sc} />
      <div className="mt-2 w-full space-y-1.5">
        {schema.subcategories.map((s) => {
          const val = sub?.[s.id];
          const hasVal = val !== undefined;
          const barColor = hasVal ? getScoreColor(val) : sc;
          const barPct = hasVal ? val * 10 : score * 10;
          return (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/40 w-24 truncate flex-shrink-0">{s.label}</span>
              <div className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)", minWidth: 30 }}>
                <div className="h-full rounded-full"
                  style={{ width: `${barPct}%`, backgroundColor: hasVal ? barColor : `${barColor}60` }} />
              </div>
              <span className="text-[10px] font-bold w-5 text-right tabular-nums flex-shrink-0"
                style={{ color: hasVal ? barColor : `${barColor}60` }}>
                {hasVal ? val : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────────── */
export default function PlayerCardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profiel" | "evaluaties" | "vergelijking" | "medisch">("profiel");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [iqData, setIqData] = useState<{ score: number; label: string; color: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tacticalIQ");
      if (saved) setIqData(JSON.parse(saved) as { score: number; label: string; color: string });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([getMyPlayerData(), getAllPlayers()]).then(([p, all]) => {
      setPlayer(p);
      setAvatarUrl(p?.avatar_url ?? null);
      setAllPlayers(all);
      setLoading(false);
    });
  }, []);

  async function handleGenerateAI() {
    if (!avatarUrl || !player) return;
    setGeneratingAI(true);
    setAiError(null);
    try {
      const res = await fetch("/api/generate-player-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: avatarUrl,
          playerName: `${player.first_name} ${player.last_name}`,
        }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) {
        setAvatarUrl(json.url);
      } else {
        setAiError(json.error ?? "AI generatie mislukt");
      }
    } catch {
      setAiError("Verbindingsfout");
    } finally {
      setGeneratingAI(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin" style={{ color: "#4FA9E6" }} />
    </div>
  );

  if (!player) return (
    <div className="p-8 text-center space-y-4">
      <div className="text-slate-600">Vul je profiel in om je spelerskaart te zien.</div>
      <Link href="/dashboard/player/settings" className="hub-btn-primary inline-flex items-center gap-2">
        <Settings size={14} /> Profiel invullen
      </Link>
    </div>
  );

  const identity = player.identity;
  const arch  = identity?.primary_archetype  ? ARCHETYPES[identity.primary_archetype]  : null;
  const socio = identity?.primary_sociotype  ? SOCIOTYPES[identity.primary_sociotype]  : null;
  const rColor = getRatingColor(player.overall_rating);
  const rLabel = getRatingLabel(player.overall_rating);
  const club = DUTCH_CLUBS.find((c) => c.id === (player as unknown as Record<string, unknown>).club as string);
  const p = player as unknown as Record<string, unknown>;
  const age = p.date_of_birth ? getAge(p.date_of_birth as string) : null;
  const heightCm = p.height_cm as number | undefined;
  const weightKg = p.weight_kg as number | undefined;
  const dominantFoot = (p.dominant_foot as DominantFoot) ?? "right";
  const injuries = (p.injury_locations as BodyRegion[]) ?? [];
  const latestEval = player.evaluations?.[0];
  const scores = latestEval?.scores ?? [];
  const radarData = scores.map((s) => ({
    subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category,
    value: s.score, fullMark: 10,
  }));

  const tabs = [
    { id: "profiel"      as const, label: "Profiel",      icon: <Activity size={13} /> },
    { id: "evaluaties"   as const, label: "Evaluaties",   icon: <Sparkles size={13} /> },
    { id: "vergelijking" as const, label: "Vergelijking", icon: <BarChart3 size={13} /> },
    { id: "medisch"      as const, label: "Medisch",      icon: <ShieldAlert size={13} /> },
  ];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">

      {/* ══════════════════════════════════════════════════════════
          eFootball / PES MARTINEZ HERO
      ══════════════════════════════════════════════════════════ */}
      <div
        className="relative"
        style={{
          background: "linear-gradient(135deg, #020509 0%, #081422 50%, #030c15 100%)",
          minHeight: 560,
          position: "relative",
          overflow: "clip",
        }}>

        {/* ── Logo watermark — centered, very faint ── */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 0 }}>
          <Image
            src="/logo.svg"
            alt=""
            width={480}
            height={480}
            unoptimized
            className="object-contain"
            style={{ opacity: 0.04 }}
          />
        </div>

        {/* ── Glow blob — top-left (rColor) ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -80, left: -80,
            width: 420, height: 420,
            borderRadius: "50%",
            opacity: 0.13,
            filter: "blur(70px)",
            background: rColor,
            zIndex: 0,
          }}
        />

        {/* ── Glow blob — bottom-right (#4FA9E6) ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: -60, right: -60,
            width: 300, height: 300,
            borderRadius: "50%",
            opacity: 0.08,
            filter: "blur(55px)",
            background: "#4FA9E6",
            zIndex: 0,
          }}
        />

        {/* ── Player photo — absolute right side ── */}
        {avatarUrl && (
          <>
            {/* Photo fills right 52% */}
            <div
              className="absolute pointer-events-none"
              style={{ zIndex: 1, right: 0, top: 0, bottom: 0, width: "52%" }}>
              <Image
                src={avatarUrl}
                alt={player.first_name}
                fill
                className="object-cover object-top"
              />
            </div>
            {/* Left-side gradient mask over the photo */}
            <div
              className="absolute pointer-events-none"
              style={{
                zIndex: 2,
                right: 0, top: 0, bottom: 0,
                width: "52%",
              }}>
              <div
                style={{
                  position: "absolute",
                  left: 0, top: 0, bottom: 0,
                  width: "55%",
                  background: "linear-gradient(to right, #020509 0%, transparent 100%)",
                }}
              />
            </div>
          </>
        )}

        {/* ── Content area ── */}
        <div
          className="relative px-6 sm:px-8 lg:px-10 pt-8 pb-0"
          style={{ zIndex: 10 }}>

          {/* Grid: [left info 200px] [center content] */}
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 items-start">

            {/* ── LEFT column (hidden on mobile) ── */}
            <div className="hidden lg:flex flex-col">
              {/* Big rating number */}
              <div
                className="font-black tabular-nums leading-none"
                style={{
                  color: rColor,
                  fontSize: "5.5rem",
                  fontFamily: "Outfit, sans-serif",
                  textShadow: `0 0 60px ${rColor}50`,
                }}>
                {player.overall_rating}
              </div>
              {rLabel && (
                <div
                  className="uppercase tracking-widest"
                  style={{ fontSize: 11, color: rColor, fontWeight: 700, marginBottom: "1rem" }}>
                  {rLabel}
                </div>
              )}

              {/* Thin divider */}
              <div style={{ height: 1, background: `${rColor}20`, marginTop: "0.75rem", marginBottom: "0.75rem" }} />

              {/* Info table */}
              <div className="space-y-2">
                {[
                  { label: "Positie",       value: POSITION_LABELS[player.position] },
                  { label: "Nationaliteit", value: (p.nationality as string) ?? "Nederland" },
                  { label: "Leeftijd",      value: age ? `${age} jaar` : "—" },
                  { label: "Lengte",        value: heightCm ? `${heightCm} cm` : "—" },
                  { label: "Gewicht",       value: weightKg ? `${weightKg} kg` : "—" },
                  { label: "Club",          value: player.team_name ?? club?.name ?? "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-2">
                    <span
                      className="uppercase tracking-widest flex-shrink-0"
                      style={{ fontSize: 9, color: "rgba(255,255,255,0.20)", width: 80, fontWeight: 600, paddingTop: 1 }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Jersey number */}
              {player.jersey_number && (
                <div
                  className="mt-auto font-black tabular-nums"
                  style={{
                    color: "rgba(255,255,255,0.05)",
                    fontSize: "4rem",
                    fontFamily: "Outfit, sans-serif",
                    marginTop: "2rem",
                    lineHeight: 1,
                  }}>
                  #{player.jersey_number}
                </div>
              )}
            </div>

            {/* ── CENTER column ── */}
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div
                className="font-bold uppercase mb-2"
                style={{ fontSize: 10, letterSpacing: "0.2em", color: "#4FA9E6" }}>
                Performance Hub · Spelersprofiel
              </div>

              {/* Mobile: inline rating */}
              <div className="flex items-center gap-3 mb-2 lg:hidden">
                <span
                  className="font-black tabular-nums leading-none"
                  style={{ color: rColor, fontSize: "2.5rem", fontFamily: "Outfit, sans-serif" }}>
                  {player.overall_rating}
                </span>
                {rLabel && (
                  <span
                    className="font-bold uppercase tracking-widest"
                    style={{ fontSize: 10, color: rColor }}>
                    {rLabel}
                  </span>
                )}
                <span className="text-[10px] text-white/40 ml-auto font-bold">{player.position}</span>
              </div>

              {/* Mobile: avatar at top right (in-flow, not absolute) */}
              {avatarUrl && (
                <div className="lg:hidden flex justify-end mb-3">
                  <div
                    className="relative overflow-hidden rounded-2xl"
                    style={{ width: 90, height: 180, flexShrink: 0 }}>
                    <Image
                      src={avatarUrl}
                      alt={player.first_name}
                      fill
                      className="object-cover object-top"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to bottom, transparent 50%, #020509 100%)" }}
                    />
                  </div>
                </div>
              )}

              {/* h1 — first name */}
              <h1
                className="font-black text-white uppercase"
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "clamp(2.5rem, 10vw, 5rem)",
                  letterSpacing: "-0.02em",
                  lineHeight: 0.88,
                  marginBottom: 0,
                }}>
                {player.first_name.toUpperCase()}
              </h1>

              {/* h2 — last name */}
              <h2
                className="font-black uppercase mb-3"
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "clamp(1.6rem, 7vw, 3rem)",
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "-0.02em",
                  lineHeight: 0.88,
                }}>
                {player.last_name.toUpperCase()}
              </h2>

              {/* Club / team line */}
              <div className="text-sm font-semibold mb-4" style={{ color: "#4FA9E6" }}>
                {player.team_name ?? club?.name ?? "Performance Hub"}
                {player.jersey_number ? ` · #${player.jersey_number}` : ""}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-5">
                <Link
                  href="/dashboard/player/settings"
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}>
                  <Bookmark size={11} /> Bewerken
                </Link>
                <button
                  onClick={() => setTab("vergelijking")}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}>
                  <GitCompare size={11} /> Vergelijken
                </button>
              </div>

              {/* Radar chart */}
              {radarData.length > 0 ? (
                <div className="opacity-85 -mx-3">
                  <PlayerRadarChart data={radarData} color={rColor} size={220} />
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-white/20 text-sm">
                  Nog geen evaluatiedata
                </div>
              )}
            </div>
          </div>

          {/* ── Hero meta-stats bar ── */}
          {(() => {
            const evalCount = player.evaluations?.length ?? 0;
            const bestScore = player.evaluations?.reduce((best, ev) =>
              (ev.overall_score ?? 0) > best ? (ev.overall_score ?? 0) : best, 0) ?? 0;
            const currentScore = player.evaluations?.[0]?.overall_score ?? null;

            const metaStats: { v: string; l: string; color?: string }[] = [
              { v: player.overall_rating.toString(), l: "OVR" },
              { v: evalCount.toString(),             l: "EVALS" },
              ...(currentScore ? [{ v: currentScore.toFixed(1), l: "HUIDIG" }] : []),
              ...(bestScore > 0 ? [{ v: bestScore.toFixed(1),   l: "PIEK" }] : []),
              ...(age           ? [{ v: age.toString(),          l: "LEEFT" }] : []),
              ...(heightCm      ? [{ v: `${heightCm}`,           l: "CM" }] : []),
              ...(iqData        ? [{ v: `${iqData.score}`, l: "IQ", color: iqData.color }] : []),
            ].slice(0, 7);

            if (metaStats.length === 0) return null;
            return (
              <div
                className="flex gap-1.5 sm:gap-2 mt-5 -mx-6 sm:-mx-8 lg:-mx-10 px-6 sm:px-8 lg:px-10
                  overflow-x-auto pb-0 scrollbar-none">
                {metaStats.map((st) => (
                  <div
                    key={st.l}
                    className="flex-1 flex flex-col items-center justify-center px-2 py-2.5 rounded-t-xl"
                    style={{
                      background: "rgba(255,255,255,0.045)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderBottom: "none",
                      minWidth: 55,
                    }}>
                    <div
                      className="text-lg sm:text-xl font-black tabular-nums leading-none"
                      style={{ fontFamily: "Outfit, sans-serif", color: st.color ?? "white" }}>
                      {st.v}
                    </div>
                    <div className="text-[9px] mt-1 uppercase tracking-wider font-medium"
                      style={{ color: st.color ? `${st.color}90` : "rgba(255,255,255,0.3)" }}>
                      {st.l}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Tabs ── */}
          <div
            className="flex -mx-6 sm:-mx-8 lg:-mx-10 px-6 sm:px-8 lg:px-10 mt-0 overflow-x-auto"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold
                  whitespace-nowrap transition-all flex-shrink-0"
                style={tab === t.id ? { color: rColor } : { color: "rgba(255,255,255,0.3)" }}>
                {t.icon}{t.label}
                {tab === t.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                    style={{ background: rColor }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB CONTENT
      ══════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-10" style={{ background: "#0e1a2b" }}>

        {/* ── PROFIEL TAB ── */}
        {tab === "profiel" && (
          <div className="space-y-8">

            {/* FIFA card + Attribute Details */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">
                Attribute Details
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="flex gap-6 px-4 sm:px-0 pb-2 min-w-max sm:min-w-0 sm:flex-wrap lg:flex-nowrap">

                  {/* FIFA card + upload */}
                  <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    <FifaCard player={player} rColor={rColor} avatarOverride={avatarUrl} />
                    {rLabel && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                        style={{
                          color: rColor,
                          background: `${rColor}15`,
                          border: `1px solid ${rColor}25`,
                        }}>
                        {rLabel}
                      </span>
                    )}

                    {/* Upload + AI buttons under card */}
                    <div className="flex items-center gap-2">
                      <AvatarUpload
                        currentUrl={avatarUrl}
                        userId={(p.profile_id as string) ?? ""}
                        name={`${player.first_name} ${player.last_name}`}
                        onUpload={(url) => setAvatarUrl(url)}
                        size={38}
                      />
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        <Camera size={10} className="inline mr-1" />Foto uploaden
                      </span>
                    </div>

                    {/* AI generate button */}
                    {avatarUrl && (
                      <button
                        onClick={handleGenerateAI}
                        disabled={generatingAI}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: generatingAI ? "rgba(79,169,230,0.15)" : "rgba(79,169,230,0.2)",
                          color: "#4FA9E6",
                          border: "1px solid rgba(79,169,230,0.3)",
                        }}>
                        {generatingAI
                          ? <Loader2 size={11} className="animate-spin" />
                          : <Wand2 size={11} />}
                        {generatingAI ? "AI bezig..." : "AI voetbalfoto"}
                      </button>
                    )}
                    {aiError && (
                      <div className="text-[10px] text-red-400 text-center max-w-[200px]">{aiError}</div>
                    )}

                    <Link
                      href="/dashboard/player/settings"
                      className="text-[11px] font-semibold px-4 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}>
                      <Settings size={11} className="inline mr-1" />Bewerken
                    </Link>
                  </div>

                  {/* Attribute columns */}
                  {scores.map((s) => (
                    <AttributeColumn
                      key={s.category}
                      categoryId={s.category}
                      score={s.score}
                      subNotes={(s as unknown as Record<string, unknown>).sub_notes as string | undefined}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Tactisch IQ ── */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-3">
                Tactisch IQ
              </div>
              {iqData ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl border"
                  style={{ background: `${iqData.color}0d`, borderColor: `${iqData.color}25` }}>
                  {/* Score ring */}
                  <div className="flex-shrink-0 relative w-16 h-16">
                    <svg width="64" height="64" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="26" fill="none"
                        stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                      <circle cx="32" cy="32" r="26" fill="none"
                        stroke={iqData.color} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${(iqData.score / 24) * 163} 163`}
                        transform="rotate(-90 32 32)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black" style={{ color: iqData.color, fontFamily: "Outfit, sans-serif" }}>
                        {iqData.score}
                      </span>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-lg leading-tight"
                      style={{ color: iqData.color, fontFamily: "Outfit, sans-serif" }}>
                      {iqData.label}
                    </div>
                    <div className="text-[11px] text-white/35 mt-0.5">{iqData.score}/24 punten</div>
                  </div>
                  {/* Re-test link */}
                  <Link href="/dashboard/player/game"
                    className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: `${iqData.color}18`, color: iqData.color,
                      border: `1px solid ${iqData.color}30` }}>
                    Opnieuw
                  </Link>
                </div>
              ) : (
                <Link href="/dashboard/player/game"
                  className="flex items-center gap-3 p-4 rounded-2xl border transition-all"
                  style={{ background: "rgba(79,169,230,0.06)", borderColor: "rgba(79,169,230,0.18)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(79,169,230,0.15)" }}>
                    <span className="text-lg">🧠</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">Doe de Tactisch IQ Test</div>
                    <div className="text-[11px] text-white/35 mt-0.5">8 scenario&apos;s · 11v11 · Max 24 punten</div>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(79,169,230,0.18)", color: "#4FA9E6" }}>
                    Start →
                  </span>
                </Link>
              )}
            </div>

            {/* Player DNA */}
            {(arch || socio || identity?.ai_summary) && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">
                  Player DNA
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {arch && (
                    <div
                      className="p-4 rounded-xl border"
                      style={{ background: `${arch.color}08`, borderColor: `${arch.color}20` }}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{arch.icon}</span>
                        <div>
                          <div className="text-[10px] text-white/30 uppercase tracking-wider">Archetype</div>
                          <div className="font-bold text-white text-sm mt-0.5">{arch.label}</div>
                          <div className="text-xs text-white/50 mt-1">{arch.description}</div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {arch.traits.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: `${arch.color}15`, color: arch.color }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {socio && (() => {
                    const SIcon = SOCIOTYPE_ICONS[socio.id];
                    return (
                      <div
                        className="p-4 rounded-xl border"
                        style={{ background: `${socio.color_hex}08`, borderColor: `${socio.color_hex}20` }}>
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${socio.color_hex}15` }}>
                            <SIcon size={20} style={{ color: socio.color_hex }} />
                          </div>
                          <div>
                            <div className="text-[10px] text-white/30 uppercase tracking-wider">Persoonlijkheid</div>
                            <div className="font-bold text-white text-sm mt-0.5">{socio.label}</div>
                            <div className="text-xs text-white/50 mt-1">{socio.description}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {identity?.ai_summary && (
                  <div
                    className="mt-4 p-4 rounded-xl border"
                    style={{ borderColor: "rgba(79,169,230,0.2)", background: "rgba(79,169,230,0.05)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={13} style={{ color: "#4FA9E6" }} />
                      <span className="text-xs font-bold" style={{ color: "#4FA9E6" }}>AI Scouting Rapport</span>
                      {identity.ai_fit_score && (
                        <span
                          className="ml-auto text-xs font-black px-2 py-0.5 rounded"
                          style={{ color: rColor, background: `${rColor}15` }}>
                          Fit {identity.ai_fit_score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{identity.ai_summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── EVALUATIES TAB ── */}
        {tab === "evaluaties" && (
          <div className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">
              Evaluatiehistorie — {player.evaluations?.length ?? 0} beoordelingen
            </div>
            {(player.evaluations ?? []).length === 0 ? (
              <div className="text-center py-16 text-white/30 text-sm">Nog geen evaluaties</div>
            ) : (
              (player.evaluations ?? []).map((ev, i) => {
                const rC = getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40);
                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    <div
                      className="flex items-center justify-between px-5 py-3 border-b"
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <div>
                        <div className="text-sm font-semibold text-white">{formatDate(ev.evaluation_date)}</div>
                        {ev.coach_name && (
                          <div className="text-xs text-white/30 mt-0.5">{ev.coach_name}</div>
                        )}
                      </div>
                      <div
                        className="text-2xl font-black tabular-nums"
                        style={{ color: rC, fontFamily: "Outfit, sans-serif" }}>
                        {ev.overall_score?.toFixed(1)}<span className="text-sm font-normal text-white/30">/10</span>
                      </div>
                    </div>
                    {i === 0 && ev.scores && ev.scores.length > 0 && (
                      <div className="overflow-x-auto">
                        <div className="flex gap-5 p-5 min-w-max">
                          {ev.scores.map((s) => (
                            <AttributeColumn
                              key={s.category}
                              categoryId={s.category}
                              score={s.score}
                              subNotes={(s as unknown as Record<string, unknown>).sub_notes as string | undefined}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {i > 0 && ev.scores && (
                      <div className="flex gap-3 px-5 py-3 flex-wrap">
                        {ev.scores.map((s) => {
                          const sc = getScoreColor(s.score);
                          const schema = EVALUATION_SCHEMA.find((c) => c.id === s.category);
                          return (
                            <div key={s.category} className="flex items-center gap-1.5 text-xs font-bold">
                              <span>{schema?.icon}</span>
                              <span className="text-white/40">
                                {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                              </span>
                              <span style={{ color: sc }}>{toFifa(s.score)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {ev.notes && (
                      <div className="px-5 pb-4 text-xs text-white/30 italic">&ldquo;{ev.notes}&rdquo;</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── VERGELIJKING TAB ── */}
        {tab === "vergelijking" && (
          <div
            className="rounded-2xl border overflow-hidden p-5"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">
              Jij vs. het team
            </div>
            {allPlayers.length > 1 ? (
              <PlayerComparisonChart
                players={allPlayers}
                currentPlayerId={player.id}
                anonymizeOthers={true}
                defaultQuality="techniek"
              />
            ) : (
              <div className="text-center py-16 text-white/30 text-sm">
                Vergelijking beschikbaar zodra er meerdere spelers zijn.
              </div>
            )}
          </div>
        )}

        {/* ── MEDISCH TAB ── */}
        {tab === "medisch" && (
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">
              Medisch Profiel
            </div>
            <p className="text-xs text-white/30 mb-5">
              <Link
                href="/dashboard/player/settings"
                className="hover:text-white/60 transition-colors underline">
                Bewerken →
              </Link>
            </p>
            <InjuryBodyMap injuries={injuries} dominantFoot={dominantFoot} readonly={true} />
          </div>
        )}
      </div>
    </div>
  );
}
