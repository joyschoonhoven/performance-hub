"use client";

import { useState, useEffect } from "react";
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

/* ─── FIFA card ─────────────────────────────────────────────────
   Authentieke FUT-kaart: volledig bleeding spelersfoto met
   gradient overlay onderaan voor naam + stats.
──────────────────────────────────────────────────────────────── */
const CW = 222;   // kaartbreedte
const CH = 312;   // kaarthoogte  (steviger verhouding, meer FUT-like)
const CR = 12;    // outer corner radius
const BD = 5;     // border dikte

const IW = CW - BD * 2;   // 212
const IH = CH - BD * 2;   // 302
const IR = CR - BD;        // 7

function cardPath(w: number, h: number, r: number) {
  return `M ${r},0 L ${w - r},0 Q ${w},0 ${w},${r} L ${w},${h - r} Q ${w},${h} ${w - r},${h} L ${r},${h} Q 0,${h} 0,${h - r} L 0,${r} Q 0,0 ${r},0 Z`;
}

/* FUT kaart heeft ook een subtiel "knik" bovenaan — we voegen
   twee kleine diagonale inkepingen toe aan de boven-hoeken,
   net als bij de echte FIFA FUT-template */
function futCardPath(w: number, h: number, r: number) {
  const cut = 12; // diagonale inkeping grootte
  return (
    `M ${r + cut},0 ` +
    `L ${w - r - cut},0 ` +
    `Q ${w - cut},0 ${w - r},${cut / 2} ` +
    `Q ${w},${cut} ${w},${r + cut} ` +
    `L ${w},${h - r} ` +
    `Q ${w},${h} ${w - r},${h} ` +
    `L ${r},${h} ` +
    `Q 0,${h} 0,${h - r} ` +
    `L 0,${r + cut} ` +
    `Q 0,${cut} ${r},${cut / 2} ` +
    `Q ${cut},0 ${r + cut},0 ` +
    `Z`
  );
}

const OUTER_PATH = futCardPath(CW, CH, CR);
const INNER_PATH = futCardPath(IW, IH, IR);

/* ── FIFA tier kleuren per rating-bereik ──────────────────────── */
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
  if (rating >= 75) return {
    label: "Goud", dark: "#4A3000", mid: "#B8860B",
    bg1: "#F5C842", bg2: "#8A6000", ring: "#FFD700", accent: "#FFF0A0",
  };
  if (rating >= 70) return {
    label: "Goud", dark: "#3A2800", mid: "#8B6914",
    bg1: "#D4AF37", bg2: "#7A5500", ring: "#E6C45A", accent: "#F5D878",
  };
  if (rating >= 65) return {
    label: "Zilver", dark: "#303030", mid: "#909090",
    bg1: "#D8D8D8", bg2: "#707070", ring: "#F0F0F0", accent: "#FFFFFF",
  };
  if (rating >= 50) return {
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
  const uid = `fc${rating}`;

  return (
    <div className="relative mx-auto select-none"
      style={{ width: CW, height: CH, flexShrink: 0 }}>

      {/* ═══ LAAG 1 — Achtergrond + kaart vorm ═══ */}
      <svg className="absolute inset-0 pointer-events-none" width={CW} height={CH}
        viewBox={`0 0 ${CW} ${CH}`}
        style={{ zIndex: 1, filter: `drop-shadow(0 16px 48px ${tier.mid}90) drop-shadow(0 4px 16px rgba(0,0,0,0.8))` }}>
        <defs>
          <clipPath id={`clip-outer-${uid}`}><path d={OUTER_PATH} /></clipPath>
          <clipPath id={`clip-inner-${uid}`}><path d={INNER_PATH} /></clipPath>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%"   stopColor={tier.bg1} />
            <stop offset="45%"  stopColor={tier.bg2} />
            <stop offset="100%" stopColor="#020812" />
          </linearGradient>
          <linearGradient id={`shimmer-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="rgba(255,255,255,0)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* Gradient overlay onderaan voor stats */}
          <linearGradient id={`bot-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="35%" stopColor="rgba(0,0,0,0.82)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.97)" />
          </linearGradient>
        </defs>

        {/* Outer border kleur (visible rim) */}
        <path d={OUTER_PATH} fill={tier.dark} />
        {/* Kaart achtergrond (inner) */}
        <g transform={`translate(${BD},${BD})`} clipPath={`url(#clip-inner-${uid})`}>
          <path d={INNER_PATH} fill={`url(#bg-${uid})`} />
          {/* Shimmer */}
          <path d={INNER_PATH} fill={`url(#shimmer-${uid})`} />
          {/* Diagonale texture */}
          <g opacity="0.06">
            <line x1="160" y1="-20" x2="-10" y2="260" stroke="white" strokeWidth="45" />
            <line x1="210" y1="-20" x2="40" y2="260" stroke="white" strokeWidth="25" />
          </g>
        </g>
      </svg>

      {/* ═══ LAAG 2 — Volledige spelersfoto (full-bleed) ═══ */}
      <div className="absolute"
        style={{ zIndex: 2, left: BD, top: BD, width: IW, height: IH, overflow: "hidden",
          borderRadius: `${IR}px` }}>
        {av ? (
          <Image src={av} alt={player.first_name} fill
            className="object-cover object-top" style={{ transform: "scale(1.05)" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-black"
            style={{ fontSize: 64, background: `linear-gradient(180deg,${tier.bg1}30,${tier.bg2}60)`,
              color: `${tier.ring}80` }}>
            {player.first_name[0]}{player.last_name[0]}
          </div>
        )}

        {/* Bottom gradient overlay — stats achtergrond */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.88) 72%, rgba(0,0,0,0.97) 100%)` }} />

        {/* Top-left gradient voor rating leesbaarheid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 0% 0%, rgba(0,0,0,0.60) 0%, transparent 55%)` }} />
      </div>

      {/* ═══ LAAG 3 — Tekst: rating + positie + naam + stats ═══ */}

      {/* Rating + positie + vlag — linksboven */}
      <div className="absolute" style={{ zIndex: 3, top: BD + 8, left: BD + 9 }}>
        <div className="font-black leading-none"
          style={{ fontFamily: "Outfit, sans-serif", fontSize: 42, color: "white",
            textShadow: "0 0 24px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1)" }}>
          {rating}
        </div>
        <div className="font-black uppercase tracking-widest"
          style={{ fontSize: 11, color: tier.ring, textShadow: "0 1px 8px rgba(0,0,0,1)", marginTop: 0 }}>
          {player.position}
        </div>
        <div style={{ fontSize: 18, lineHeight: 1, marginTop: 3,
          filter: "drop-shadow(0 1px 6px rgba(0,0,0,1))" }}>🇳🇱</div>
      </div>

      {/* Naam + dunne lijn */}
      <div className="absolute text-center" style={{
        zIndex: 3,
        left: BD, right: BD,
        bottom: BD + (fifaStats.length > 0 ? 50 : 8),
      }}>
        <div className="font-black text-white uppercase"
          style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, letterSpacing: "0.07em",
            textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
          {player.last_name.toUpperCase()}
        </div>
        <div className="mx-4 mt-1 mb-0"
          style={{ height: 1, background: `linear-gradient(to right, transparent, ${tier.ring}70, transparent)` }} />
      </div>

      {/* FIFA stats — onderaan */}
      {fifaStats.length > 0 && (
        <div className="absolute" style={{ zIndex: 3, left: BD + 6, right: BD + 6, bottom: BD + 8 }}>
          <div className="grid grid-cols-3 gap-x-1" style={{ gap: "2px 4px" }}>
            {fifaStats.map((st) => (
              <div key={st.l} className="flex items-center gap-1">
                <span className="font-black tabular-nums"
                  style={{ color: tier.ring, fontFamily: "Outfit, sans-serif", fontSize: 13, lineHeight: 1.2 }}>
                  {st.v}
                </span>
                <span className="font-bold uppercase tracking-wide"
                  style={{ color: "rgba(255,255,255,0.45)", fontSize: 9 }}>
                  {st.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ LAAG 4 — Rand strepen bovenop alles ═══ */}
      <svg className="absolute inset-0 pointer-events-none" width={CW} height={CH}
        viewBox={`0 0 ${CW} ${CH}`} style={{ zIndex: 4 }}>
        {/* Outer rand */}
        <path d={OUTER_PATH} fill="none"
          stroke={tier.dark} strokeWidth="1.5" strokeOpacity="0.9" />
        {/* Inner accent lijn */}
        <path d={INNER_PATH} fill="none"
          stroke={tier.accent} strokeWidth="1.5" strokeOpacity="0.55"
          transform={`translate(${BD},${BD})`} />
        {/* Tweede subtiele lijn */}
        <path d={futCardPath(IW - 4, IH - 4, IR - 2)} fill="none"
          stroke={tier.ring} strokeWidth="0.75" strokeOpacity="0.28"
          transform={`translate(${BD + 2},${BD + 2})`} />
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
          PES / KONAMI HERO SECTIE
      ══════════════════════════════════════════════════════════ */}
      <div className="relative"
        style={{
          background: "linear-gradient(135deg, #050c1a 0%, #0A2540 55%, #071829 100%)",
          minHeight: 400,
          overflow: "clip",
        }}>

        {/* ── Performance Hub logo watermark (groot, vervaagd) ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 0 }}>
          <Image
            src="/logo.svg"
            alt=""
            width={480}
            height={480}
            className="object-contain"
            style={{ opacity: 0.045, filter: "blur(1px)" }}
          />
        </div>

        {/* ── Club watermark (subtiel, rechts) ── */}
        {club?.logoUrl && (
          <div className="absolute right-0 top-0 bottom-0 w-72 flex items-center justify-end pr-6
            pointer-events-none select-none"
            style={{ opacity: 0.03, zIndex: 1 }}>
            <Image src={club.logoUrl} alt="" width={260} height={260} className="object-contain" />
          </div>
        )}

        {/* ── Kleur glow (links-boven) ── */}
        <div className="absolute pointer-events-none"
          style={{
            top: -80, left: -80, width: 420, height: 420,
            borderRadius: "50%", opacity: 0.12, filter: "blur(60px)",
            background: rColor, zIndex: 1,
          }} />

        {/* ── Kleur glow (rechts-onder) ── */}
        <div className="absolute pointer-events-none"
          style={{
            bottom: -60, right: -60, width: 300, height: 300,
            borderRadius: "50%", opacity: 0.07, filter: "blur(50px)",
            background: "#4FA9E6", zIndex: 1,
          }} />

        <div className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-0" style={{ zIndex: 2 }}>

          {/* ── Grid: [info links] [naam + radar midden] [foto rechts] ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_auto] gap-6 lg:gap-8 items-start">

            {/* ── LINKS: Rating + info tabel (verborgen op mobiel) ── */}
            <div className="hidden lg:block flex-shrink-0">
              {/* Grote rating */}
              <div className="font-black tabular-nums leading-none"
                style={{ color: rColor, fontSize: "5rem", fontFamily: "Outfit, sans-serif",
                  textShadow: `0 0 40px ${rColor}60` }}>
                {player.overall_rating}
              </div>
              {rLabel && (
                <div className="text-[11px] font-bold uppercase tracking-widest mb-5"
                  style={{ color: rColor }}>{rLabel}</div>
              )}

              {/* Info tabel */}
              <div className="space-y-2.5">
                {[
                  { label: "Positie",       value: POSITION_LABELS[player.position] },
                  { label: "Nationaliteit", value: (p.nationality as string) ?? "Nederland" },
                  { label: "Leeftijd",      value: age ? `${age} jaar` : "—" },
                  {
                    label: "Profiel",
                    value: [heightCm && `${heightCm}cm`, weightKg && `${weightKg}kg`]
                      .filter(Boolean).join(" / ") || "—",
                  },
                  { label: "Club", value: player.team_name ?? club?.name ?? "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-2">
                    <span className="text-[10px] text-white/25 w-20 flex-shrink-0 font-medium uppercase tracking-wider pt-0.5">
                      {row.label}
                    </span>
                    <span className="text-[11px] text-white/80 font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Jersey nummer */}
              {player.jersey_number && (
                <div className="mt-5 font-black tabular-nums"
                  style={{ color: "rgba(255,255,255,0.08)", fontSize: "3.5rem",
                    fontFamily: "Outfit, sans-serif", lineHeight: 1 }}>
                  #{player.jersey_number}
                </div>
              )}
            </div>

            {/* ── MIDDEN: naam + knoppen + radar ── */}
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2"
                style={{ color: "#4FA9E6" }}>
                Performance Hub · Spelersprofiel
              </div>

              {/* Mobiel: rating inline */}
              <div className="flex items-center gap-3 mb-2 lg:hidden">
                <span className="font-black tabular-nums leading-none"
                  style={{ color: rColor, fontSize: "2.5rem", fontFamily: "Outfit, sans-serif" }}>
                  {player.overall_rating}
                </span>
                {rLabel && (
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: rColor }}>{rLabel}</span>
                )}
                <span className="text-[10px] text-white/40 ml-auto font-bold">{player.position}</span>
              </div>

              {/* Grote naam */}
              <h1 className="font-black text-white uppercase leading-[0.88]"
                style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em",
                  fontSize: "clamp(2rem, 9vw, 4rem)", marginBottom: "0.2em" }}>
                {player.first_name.toUpperCase()}
              </h1>
              <h2 className="font-black text-white uppercase leading-[0.88] mb-3"
                style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em",
                  fontSize: "clamp(1.4rem, 6vw, 2.6rem)", color: "rgba(255,255,255,0.65)" }}>
                {player.last_name.toUpperCase()}
              </h2>

              {/* Club + nummer */}
              <div className="text-xs sm:text-sm font-semibold mb-4" style={{ color: "#4FA9E6" }}>
                {player.team_name ?? club?.name ?? "Performance Hub"}
                {player.jersey_number ? ` · #${player.jersey_number}` : ""}
              </div>

              {/* Knoppen */}
              <div className="flex gap-2 mb-5 flex-wrap">
                <Link href="/dashboard/player/settings"
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.10)" }}>
                  <Bookmark size={11} /> Bewerken
                </Link>
                <button onClick={() => setTab("vergelijking")}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.10)" }}>
                  <GitCompare size={11} /> Vergelijken
                </button>
              </div>

              {/* Radar chart */}
              {radarData.length > 0 ? (
                <div className="opacity-85 -mx-3">
                  <PlayerRadarChart data={radarData} color={rColor} size={210} />
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-white/20 text-sm">
                  Nog geen evaluatiedata
                </div>
              )}
            </div>

            {/* ── RECHTS: Grote spelersfoto (PES-stijl cutout) ── */}
            <div className="hidden lg:flex flex-shrink-0 items-end self-stretch pb-0"
              style={{ marginBottom: -1 }}>
              <div className="relative group">
                {/* Foto container — halflange PES-stijl */}
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: 220,
                    height: 300,
                    borderRadius: "20px 20px 0 0",
                    border: avatarUrl ? `1px solid ${rColor}25` : `1px solid ${rColor}15`,
                    background: avatarUrl ? "transparent"
                      : `linear-gradient(180deg, ${rColor}12 0%, ${rColor}28 100%)`,
                  }}>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={player.first_name}
                      fill
                      className="object-cover object-top"
                      style={{ transform: "scale(1.04)" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black"
                      style={{ fontSize: 80, color: `${rColor}60` }}>
                      {player.first_name[0]}{player.last_name[0]}
                    </div>
                  )}
                  {/* Gradient onderkant */}
                  <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                      height: 80,
                      background: "linear-gradient(to bottom, transparent, rgba(5,12,26,0.95))",
                    }} />
                  {/* Glow */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ width: 160, height: 24, borderRadius: "50%",
                      background: rColor, opacity: 0.35, filter: "blur(16px)" }} />
                </div>

                {/* Upload/AI knoppen — hover overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
                    flex flex-col items-center justify-end gap-2 pb-5"
                  style={{ background: "rgba(0,0,0,0.45)", borderRadius: "20px 20px 0 0" }}>
                  <AvatarUpload
                    currentUrl={avatarUrl}
                    userId={(p.profile_id as string) ?? ""}
                    name={`${player.first_name} ${player.last_name}`}
                    onUpload={(url) => setAvatarUrl(url)}
                    size={48}
                  />
                  {avatarUrl && (
                    <button
                      onClick={handleGenerateAI}
                      disabled={generatingAI}
                      className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(79,169,230,0.85)", color: "white" }}>
                      {generatingAI
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Wand2 size={11} />}
                      {generatingAI ? "Bezig..." : "AI voetbalfoto"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Hero meta-stats balk ── */}
          {(() => {
            const evalCount = player.evaluations?.length ?? 0;
            const bestScore = player.evaluations?.reduce((best, ev) =>
              (ev.overall_score ?? 0) > best ? (ev.overall_score ?? 0) : best, 0) ?? 0;
            const currentScore = player.evaluations?.[0]?.overall_score ?? null;

            const metaStats = [
              { v: player.overall_rating.toString(), l: "OVR" },
              { v: evalCount.toString(),             l: "EVALS" },
              ...(currentScore ? [{ v: currentScore.toFixed(1), l: "HUIDIG" }] : []),
              ...(bestScore > 0 ? [{ v: bestScore.toFixed(1),   l: "PIEK" }] : []),
              ...(age           ? [{ v: age.toString(),          l: "LEEFT" }] : []),
              ...(heightCm      ? [{ v: `${heightCm}`,           l: "CM" }] : []),
            ].slice(0, 6);

            if (metaStats.length === 0) return null;
            return (
              <div className="flex gap-1.5 sm:gap-2 mt-5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8
                overflow-x-auto pb-0 scrollbar-none">
                {metaStats.map((st) => (
                  <div key={st.l}
                    className="flex-1 flex flex-col items-center justify-center px-2 py-2.5 rounded-t-xl"
                    style={{ background: "rgba(255,255,255,0.045)",
                      border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", minWidth: 55 }}>
                    <div className="text-lg sm:text-xl font-black tabular-nums leading-none text-white"
                      style={{ fontFamily: "Outfit, sans-serif" }}>{st.v}</div>
                    <div className="text-[9px] text-white/30 mt-1 uppercase tracking-wider font-medium">
                      {st.l}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Tabs ── */}
          <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mt-0 overflow-x-auto"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold
                  whitespace-nowrap transition-all flex-shrink-0"
                style={tab === t.id ? { color: rColor } : { color: "rgba(255,255,255,0.3)" }}>
                {t.icon}{t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                    style={{ background: rColor }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB CONTENT
      ══════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-10"
        style={{ background: "#0e1a2b" }}>

        {/* ── PROFIEL TAB ── */}
        {tab === "profiel" && (
          <div className="space-y-8">

            {/* FIFA kaart + Attribute Details */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">
                Attribute Details
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="flex gap-6 px-4 sm:px-0 pb-2 min-w-max sm:min-w-0 sm:flex-wrap lg:flex-nowrap">

                  {/* FIFA kaart + upload */}
                  <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    <FifaCard player={player} rColor={rColor} avatarOverride={avatarUrl} />
                    {rLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                        style={{ color: rColor, background: `${rColor}15`,
                          border: `1px solid ${rColor}25` }}>
                        {rLabel}
                      </span>
                    )}

                    {/* Upload + AI knoppen onder kaart */}
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

                    {/* AI genereer knop */}
                    {avatarUrl && (
                      <button
                        onClick={handleGenerateAI}
                        disabled={generatingAI}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: generatingAI ? "rgba(79,169,230,0.15)" : "rgba(79,169,230,0.2)",
                          color: "#4FA9E6", border: "1px solid rgba(79,169,230,0.3)",
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

                    <Link href="/dashboard/player/settings"
                      className="text-[11px] font-semibold px-4 py-1.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Settings size={11} className="inline mr-1" />Bewerken
                    </Link>
                  </div>

                  {/* Attribute kolommen */}
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

            {/* Player DNA */}
            {(arch || socio || identity?.ai_summary) && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">
                  Player DNA
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {arch && (
                    <div className="p-4 rounded-xl border"
                      style={{ background: `${arch.color}08`, borderColor: `${arch.color}20` }}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{arch.icon}</span>
                        <div>
                          <div className="text-[10px] text-white/30 uppercase tracking-wider">Archetype</div>
                          <div className="font-bold text-white text-sm mt-0.5">{arch.label}</div>
                          <div className="text-xs text-white/50 mt-1">{arch.description}</div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {arch.traits.map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: `${arch.color}15`, color: arch.color }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {socio && (() => {
                    const SIcon = SOCIOTYPE_ICONS[socio.id];
                    return (
                      <div className="p-4 rounded-xl border"
                        style={{ background: `${socio.color_hex}08`, borderColor: `${socio.color_hex}20` }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
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
                  <div className="mt-4 p-4 rounded-xl border"
                    style={{ borderColor: "rgba(79,169,230,0.2)", background: "rgba(79,169,230,0.05)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={13} style={{ color: "#4FA9E6" }} />
                      <span className="text-xs font-bold" style={{ color: "#4FA9E6" }}>AI Scouting Rapport</span>
                      {identity.ai_fit_score && (
                        <span className="ml-auto text-xs font-black px-2 py-0.5 rounded"
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
                  <div key={ev.id} className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center justify-between px-5 py-3 border-b"
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <div>
                        <div className="text-sm font-semibold text-white">{formatDate(ev.evaluation_date)}</div>
                        {ev.coach_name && (
                          <div className="text-xs text-white/30 mt-0.5">{ev.coach_name}</div>
                        )}
                      </div>
                      <div className="text-2xl font-black tabular-nums"
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
          <div className="rounded-2xl border overflow-hidden p-5"
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
          <div className="rounded-2xl border p-5"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">
              Medisch Profiel
            </div>
            <p className="text-xs text-white/30 mb-5">
              <Link href="/dashboard/player/settings"
                className="hover:text-white/60 transition-colors underline">Bewerken →</Link>
            </p>
            <InjuryBodyMap injuries={injuries} dominantFoot={dominantFoot} readonly={true} />
          </div>
        )}
      </div>
    </div>
  );
}
