"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMyPlayerData, getAllPlayers } from "@/lib/supabase/queries";
import { ARCHETYPES, SOCIOTYPES, POSITION_LABELS, CATEGORY_LABELS, EVALUATION_SCHEMA } from "@/lib/types";
import { getRatingColor, getRatingLabel, getAge, formatDate, getScoreColor } from "@/lib/utils";
import { Loader2, Settings, Sparkles, Activity, BarChart3, ShieldAlert, Bookmark, GitCompare, Camera } from "lucide-react";
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

/* ─── FIFA card — echte FUT kaart vorm ──────────────────────────── */
const CARD_W = 220;
const CARD_H = 320;

// Karakteristieke FUT kaartvorm: afgeronde hoeken + lichte boog bovenaan
const CARD_PATH =
  `M 18,0 L ${CARD_W - 18},0 ` +
  `Q ${CARD_W},0 ${CARD_W},18 ` +
  `L ${CARD_W},${CARD_H - 22} ` +
  `Q ${CARD_W},${CARD_H} ${CARD_W - 18},${CARD_H} ` +
  `L 18,${CARD_H} ` +
  `Q 0,${CARD_H} 0,${CARD_H - 22} ` +
  `L 0,18 ` +
  `Q 0,0 18,0 Z`;

function FifaCard({ player, rColor, avatarOverride }: { player: PlayerWithDetails; rColor: string; avatarOverride?: string | null }) {
  const s = player.recent_scores;

  // FUT goud-metallic kleurenpalet afhankelijk van rating
  const rating = player.overall_rating;
  const isElite = rating >= 85;
  const isGood  = rating >= 75;
  const goldTop    = isElite ? "#F8D060" : isGood ? "#D4AF37" : "#9BA4B5";
  const goldMid    = isElite ? "#C8932A" : isGood ? "#A07B20" : "#6B7280";
  const goldDark   = isElite ? "#7B4F10" : isGood ? "#5C3D10" : "#374151";
  const shimmer    = isElite ? "rgba(255,245,180,0.22)" : isGood ? "rgba(255,235,150,0.15)" : "rgba(200,200,220,0.12)";

  const cardGrad = `linear-gradient(160deg, ${goldTop} 0%, ${goldMid} 40%, ${goldDark} 75%, #050c1a 100%)`;

  const stats = s ? [
    { v: toFifa(s.techniek), l: "TEC" },
    { v: toFifa(s.fysiek),   l: "FYS" },
    { v: toFifa(s.tactiek),  l: "TAC" },
    { v: toFifa(s.mentaal),  l: "MEN" },
    { v: toFifa(s.teamplay), l: "TEA" },
    { v: rating,             l: "OVR" },
  ] : [];

  const av = avatarOverride ?? player.avatar_url;

  return (
    <div className="relative mx-auto select-none drop-shadow-2xl"
      style={{ width: CARD_W, height: CARD_H, flexShrink: 0 }}>

      {/* SVG als basis — kaart clip + achtergrond + decoratie */}
      <svg
        className="absolute inset-0"
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ overflow: "visible", filter: `drop-shadow(0 8px 32px ${goldMid}55)` }}
      >
        <defs>
          <clipPath id={`card-clip-${rating}`}>
            <path d={CARD_PATH} />
          </clipPath>
          <linearGradient id={`card-bg-${rating}`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={goldTop} />
            <stop offset="40%" stopColor={goldMid} />
            <stop offset="75%" stopColor={goldDark} />
            <stop offset="100%" stopColor="#050c1a" />
          </linearGradient>
          <linearGradient id={`shimmer-${rating}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="45%" stopColor={shimmer} />
            <stop offset="55%" stopColor={shimmer} />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Kaart achtergrond */}
        <path d={CARD_PATH} fill={`url(#card-bg-${rating})`} />

        {/* Diagonale shimmer */}
        <path d={CARD_PATH} fill={`url(#shimmer-${rating})`} />

        {/* Binnenste frame (2px inset) */}
        <path
          d={CARD_PATH}
          fill="none"
          stroke={goldTop}
          strokeWidth="1.5"
          strokeOpacity="0.45"
          transform="scale(0.962) translate(4.3, 6.1)"
        />

        {/* Subtiele diagonale lijnen */}
        <g clipPath={`url(#card-clip-${rating})`} opacity="0.08">
          <line x1="170" y1="-10" x2="30" y2="220" stroke="white" strokeWidth="28" />
          <line x1="210" y1="-10" x2="70" y2="220" stroke="white" strokeWidth="16" />
        </g>

        {/* Donkere overlay onderin voor stats */}
        <path
          d={`M 0,${CARD_H * 0.6} L ${CARD_W},${CARD_H * 0.6} L ${CARD_W},${CARD_H - 22} Q ${CARD_W},${CARD_H} ${CARD_W - 18},${CARD_H} L 18,${CARD_H} Q 0,${CARD_H} 0,${CARD_H - 22} Z`}
          fill="rgba(0,0,0,0.65)"
        />
      </svg>

      {/* ── Inhoud bovenop de SVG ── */}
      {/* Rating + positie (links boven) */}
      <div className="absolute top-3 left-4 z-10">
        <div className="font-black text-white leading-none"
          style={{ fontFamily: "Outfit, sans-serif", fontSize: 42, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
          {rating}
        </div>
        <div className="font-black text-white/90 uppercase tracking-widest mt-0.5 text-[11px]">
          {player.position}
        </div>
        <div className="text-[17px] mt-0.5">🇳🇱</div>
      </div>

      {/* Avatar — groot, vult bovenste gedeelte */}
      <div className="absolute z-10" style={{ left: 30, right: 30, top: 44, height: 158 }}>
        <div className="w-full h-full overflow-hidden flex items-center justify-center font-black text-5xl"
          style={av
            ? { borderRadius: 12 }
            : { borderRadius: 12, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
          {av
            ? <Image src={av} alt={player.first_name} fill className="object-cover object-top" />
            : `${player.first_name[0]}${player.last_name[0]}`}
        </div>
      </div>

      {/* Naam */}
      <div className="absolute z-10 left-0 right-0 text-center font-black text-white uppercase tracking-tight"
        style={{ top: CARD_H * 0.615, fontFamily: "Outfit, sans-serif", fontSize: 16, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
        {player.last_name.toUpperCase()}
      </div>

      {/* Scheidingslijn */}
      <div className="absolute z-10 left-6 right-6" style={{ top: CARD_H * 0.655, height: 1, background: `${goldTop}50` }} />

      {/* Stats grid */}
      {stats.length > 0 && (
        <div className="absolute z-10 left-5 right-5 grid grid-cols-2 gap-x-2"
          style={{ top: CARD_H * 0.67, rowGap: 4 }}>
          {[stats.slice(0, 3), stats.slice(3)].map((col, ci) => (
            <div key={ci} className="space-y-0.5">
              {col.map((st) => (
                <div key={st.l} className="flex items-center gap-1.5">
                  <span className="font-black text-[13px] tabular-nums leading-none"
                    style={{ color: goldTop, fontFamily: "Outfit, sans-serif" }}>{st.v}</span>
                  <span className="text-white/55 text-[9px] tracking-widest uppercase leading-none">{st.l}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
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
      <path d="M 6 38 A 26 26 0 0 1 58 38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />
      <path d="M 6 38 A 26 26 0 0 1 58 38" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`} />
      <text x="32" y="37" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="Outfit, sans-serif">{score}</text>
    </svg>
  );
}

/* ─── attribute column (Haaland-style) ────────────────────────── */
function AttributeColumn({ categoryId, score, subNotes }: { categoryId: string; score: number; subNotes?: string }) {
  const schema = EVALUATION_SCHEMA.find((c) => c.id === categoryId)!;
  const sub = parseSubScores(subNotes);
  const sc = getScoreColor(score);
  const display = toFifa(score);
  return (
    <div className="flex flex-col items-center min-w-[120px]">
      {/* Category label */}
      <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1">{schema.label}</div>
      {/* Semicircle */}
      <SemiGauge score={display} color={sc} />
      {/* Sub-attributes */}
      <div className="mt-2 w-full space-y-1.5">
        {schema.subcategories.map((s) => {
          const val = sub?.[s.id];
          const hasVal = val !== undefined;
          const barColor = hasVal ? getScoreColor(val) : sc;
          const barPct = hasVal ? val * 10 : score * 10;
          return (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/40 w-24 truncate flex-shrink-0">{s.label}</span>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", minWidth: 30 }}>
                <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: hasVal ? barColor : `${barColor}60` }} />
              </div>
              <span className="text-[10px] font-bold w-5 text-right tabular-nums flex-shrink-0"
                style={{ color: hasVal ? barColor : `${barColor}60` }}>{hasVal ? val : "—"}</span>
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

  useEffect(() => {
    Promise.all([getMyPlayerData(), getAllPlayers()]).then(([p, all]) => {
      setPlayer(p);
      setAvatarUrl(p?.avatar_url ?? null);
      setAllPlayers(all);
      setLoading(false);
    });
  }, []);

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
  const club = DUTCH_CLUBS.find((c) => c.id === (player as unknown as Record<string,unknown>).club as string);
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
    { id: "profiel"     as const, label: "Profiel",     icon: <Activity size={13} /> },
    { id: "evaluaties"  as const, label: "Evaluaties",  icon: <Sparkles size={13} /> },
    { id: "vergelijking"as const, label: "Vergelijking",icon: <BarChart3 size={13} /> },
    { id: "medisch"     as const, label: "Medisch",     icon: <ShieldAlert size={13} /> },
  ];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">

      {/* ══════════════════════════════════════════════════════════
          PES / KONAMI HERO SECTIE
      ══════════════════════════════════════════════════════════ */}
      <div className="relative"
        style={{ background: "linear-gradient(135deg, #050c1a 0%, #0A2540 55%, #071829 100%)", minHeight: 360, overflow: "clip" }}>

        {/* Club watermark rechts */}
        {club?.logoUrl && (
          <div className="absolute right-0 top-0 bottom-0 w-80 flex items-center justify-end pr-8 pointer-events-none select-none opacity-[0.04]">
            <Image src={club.logoUrl} alt="" width={280} height={280} className="object-contain" style={{ width: 280, height: 280 }} />
          </div>
        )}

        {/* Kleur glow */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ background: rColor }} />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-6 pb-0">

          {/* ── Bovenste rij: [rating+info] [naam+radar] [avatar] ── */}
          <div className="flex items-start gap-6 lg:gap-10">

            {/* Links: rating + info tabel */}
            <div className="flex-shrink-0 hidden sm:block" style={{ minWidth: 130 }}>
              <div className="font-black tabular-nums leading-none mb-0.5"
                style={{ color: "rgba(255,255,255,0.25)", fontSize: "4rem", fontFamily: "Outfit, sans-serif" }}>
                {player.overall_rating}
              </div>
              {rLabel && (
                <div className="text-[11px] font-bold uppercase tracking-widest mb-4"
                  style={{ color: rColor }}>{rLabel}</div>
              )}
              {/* Info tabel */}
              <div className="space-y-2 mt-4">
                {[
                  { label: "Nationaliteit", value: (player as unknown as Record<string,unknown>).nationality as string ?? "Nederland" },
                  { label: "Leeftijd",      value: age ? `${age} jaar` : "—" },
                  { label: "Profiel",       value: [heightCm && `${heightCm}cm`, weightKg && `${weightKg}kg`].filter(Boolean).join(" / ") || "—" },
                  { label: "Positie",       value: POSITION_LABELS[player.position] },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span className="text-[11px] text-white/30 w-24 flex-shrink-0 font-medium">{row.label}</span>
                    <span className="text-[11px] text-white/80 font-semibold flex-1">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Midden: naam + buttons + radar */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#4FA9E6" }}>
                Performance Hub · Spelersprofiel
              </div>

              {/* Mobiel-only: rating + label (linker panel is verborgen) */}
              <div className="flex items-center gap-3 mb-2 sm:hidden">
                <span className="font-black tabular-nums leading-none"
                  style={{ color: rColor, fontSize: "2.5rem", fontFamily: "Outfit, sans-serif" }}>
                  {player.overall_rating}
                </span>
                {rLabel && (
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: rColor }}>
                    {rLabel}
                  </span>
                )}
                <span className="text-[10px] text-white/40 ml-auto font-bold">
                  {player.position}
                </span>
              </div>

              {/* Grote naam */}
              <h1 className="font-black text-white uppercase leading-[0.9] mb-1"
                style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em", fontSize: "clamp(1.6rem, 8vw, 3.5rem)" }}>
                {player.last_name.toUpperCase()}
              </h1>
              <div className="text-xs sm:text-sm font-semibold mb-3" style={{ color: "#4FA9E6" }}>
                {player.team_name ?? club?.name ?? "Performance Hub"}
                {player.jersey_number ? ` · #${player.jersey_number}` : ""}
              </div>

              {/* Actie buttons — compacter op mobiel */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <Link href="/dashboard/player/settings"
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <Bookmark size={11} /> Bewerken
                </Link>
                <button
                  onClick={() => setTab("vergelijking")}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <GitCompare size={11} /> Vergelijken
                </button>
              </div>

              {/* Radar chart — SVG heeft nu ingebouwde padding voor labels */}
              {radarData.length > 0 ? (
                <div className="opacity-80 -mx-2">
                  <PlayerRadarChart data={radarData} color={rColor} size={200} />
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-white/20 text-sm">
                  Nog geen evaluatiedata
                </div>
              )}
            </div>

            {/* Rechts: grote avatar (PES-stijl speler afbeelding) — klikbaar voor upload */}
            <div className="hidden lg:flex flex-shrink-0 items-end self-stretch" style={{ marginBottom: -1 }}>
              <div className="relative group">
                <div className="w-52 h-64 rounded-t-3xl overflow-hidden flex items-center justify-center font-black text-7xl"
                  style={avatarUrl
                    ? { border: `2px solid ${rColor}30` }
                    : { background: `linear-gradient(180deg, ${rColor}15 0%, ${rColor}30 100%)`, color: `${rColor}90`, border: `2px solid ${rColor}20` }}>
                  {avatarUrl
                    ? <Image src={avatarUrl} alt={player.first_name} width={208} height={256} className="object-cover w-full h-full object-top" />
                    : `${player.first_name[0]}${player.last_name[0]}`}
                </div>
                {/* Upload overlay on hover */}
                <div className="absolute inset-0 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <AvatarUpload
                      currentUrl={avatarUrl}
                      userId={(p.profile_id as string) ?? ""}
                      name={`${player.first_name} ${player.last_name}`}
                      onUpload={(url) => setAvatarUrl(url)}
                      size={56}
                    />
                  </div>
                </div>
                {/* Subtiele glow onder de speler */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-8 blur-xl opacity-40 rounded-full"
                  style={{ background: rColor }} />
              </div>
            </div>
          </div>

          {/* ── Stat boxes onderin de hero (zoals PES) ── */}
          {scores.length > 0 && (
            <div className="flex gap-1.5 sm:gap-2 mt-5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-x-auto pb-0 scrollbar-none">
              {scores.map((s) => {
                const schema = EVALUATION_SCHEMA.find((c) => c.id === s.category);
                const sc = getScoreColor(s.score);
                const label = CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS];
                return (
                  <div key={s.category}
                    className="flex-1 flex flex-col items-center justify-center px-2 py-2.5 rounded-t-xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", minWidth: 60 }}>
                    <div className="text-xl sm:text-2xl font-black tabular-nums leading-none"
                      style={{ color: sc, fontFamily: "Outfit, sans-serif" }}>
                      {toFifa(s.score)}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/40 mt-1 uppercase tracking-wide font-medium text-center leading-tight">
                      {schema?.icon} {label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Tabs, vloeiend onderaan de hero ── */}
          <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mt-0 overflow-x-auto"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
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

            {/* ── FIFA kaart + Attribute Details (Haaland-stijl) ── */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">
                Attribute Details
              </div>
              {/* Op mobiel: FIFA card + attribuutkolommen naast elkaar (horizontaal scrollbaar) */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="flex gap-6 px-4 sm:px-0 pb-2 min-w-max sm:min-w-0 sm:flex-wrap lg:flex-nowrap">

                  {/* FIFA kaart */}
                  <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    <FifaCard player={player} rColor={rColor} avatarOverride={avatarUrl} />
                    {rLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                        style={{ color: rColor, background: `${rColor}15`, border: `1px solid ${rColor}25` }}>
                        {rLabel}
                      </span>
                    )}
                    {/* Foto upload onder de kaart */}
                    <div className="flex items-center gap-2">
                      <AvatarUpload
                        currentUrl={avatarUrl}
                        userId={p.profile_id as string ?? ""}
                        name={`${player.first_name} ${player.last_name}`}
                        onUpload={(url) => setAvatarUrl(url)}
                        size={40}
                      />
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        <Camera size={10} className="inline mr-1" />Foto uploaden
                      </span>
                    </div>
                    <Link href="/dashboard/player/settings"
                      className="text-[11px] font-semibold px-4 py-1.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Settings size={11} className="inline mr-1" />Bewerken
                    </Link>
                  </div>

                  {/* Attribute kolommen — Haaland stijl */}
                  {scores.map((s) => (
                    <AttributeColumn
                      key={s.category}
                      categoryId={s.category}
                      score={s.score}
                      subNotes={(s as unknown as Record<string,unknown>).sub_notes as string | undefined}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* DNA */}
            {(arch || socio || identity?.ai_summary) && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">Player DNA</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {arch && (() => {
                    return (
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
                    );
                  })()}
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
                  <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: "rgba(79,169,230,0.2)", background: "rgba(79,169,230,0.05)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={13} style={{ color: "#4FA9E6" }} />
                      <span className="text-xs font-bold" style={{ color: "#4FA9E6" }}>AI Scouting Rapport</span>
                      {identity.ai_fit_score && (
                        <span className="ml-auto text-xs font-black px-2 py-0.5 rounded"
                          style={{ color: rColor, background: `${rColor}15` }}>Fit {identity.ai_fit_score}/100</span>
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
                        {ev.coach_name && <div className="text-xs text-white/30 mt-0.5">{ev.coach_name}</div>}
                      </div>
                      <div className="text-2xl font-black tabular-nums" style={{ color: rC, fontFamily: "Outfit, sans-serif" }}>
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
                              subNotes={(s as unknown as Record<string,unknown>).sub_notes as string | undefined}
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
                              <span className="text-white/40">{CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}</span>
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
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">Jij vs. het team</div>
            {allPlayers.length > 1 ? (
              <PlayerComparisonChart
                players={allPlayers}
                currentPlayerId={player.id}
                anonymizeOthers={true}
                defaultQuality="techniek"
              />
            ) : (
              <div className="text-center py-16 text-white/30 text-sm">Vergelijking beschikbaar zodra er meerdere spelers zijn.</div>
            )}
          </div>
        )}

        {/* ── MEDISCH TAB ── */}
        {tab === "medisch" && (
          <div className="rounded-2xl border p-5"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">Medisch Profiel</div>
            <p className="text-xs text-white/30 mb-5">
              <Link href="/dashboard/player/settings" className="hover:text-white/60 transition-colors underline">Bewerken →</Link>
            </p>
            <InjuryBodyMap injuries={injuries} dominantFoot={dominantFoot} readonly={true} />
          </div>
        )}

      </div>
    </div>
  );
}
