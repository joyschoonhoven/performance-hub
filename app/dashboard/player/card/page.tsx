"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMyPlayerData, getAllPlayers } from "@/lib/supabase/queries";
import { ARCHETYPES, SOCIOTYPES, POSITION_LABELS, CATEGORY_LABELS, EVALUATION_SCHEMA } from "@/lib/types";
import { getRatingColor, getRatingLabel, getAge, formatDate, getScoreColor } from "@/lib/utils";
import {
  Star, Loader2, Settings, Sparkles, Trophy, TrendingUp, TrendingDown,
  Minus, Calendar, Ruler, Weight, Footprints, Activity, BarChart3,
  ShieldAlert, ChevronDown, ChevronUp, MapPin,
} from "lucide-react";
import type { PlayerWithDetails } from "@/lib/types";
import { ARCHETYPE_ICONS, SOCIOTYPE_ICONS } from "@/components/PlayerTypeHero";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { PlayerComparisonChart } from "@/components/charts/PlayerComparisonChart";
import { InjuryBodyMap, type BodyRegion, type DominantFoot } from "@/components/InjuryBodyMap";
import { DUTCH_CLUBS } from "@/lib/dutch-clubs";

/* ─── helpers ──────────────────────────────────────────────────── */
function parseSubScores(subNotes?: string): Record<string, number> | null {
  if (!subNotes) return null;
  try { return JSON.parse(subNotes); } catch { return null; }
}

function ClubBadge({ clubId, size = 48 }: { clubId: string; size?: number }) {
  const club = DUTCH_CLUBS.find((c) => c.id === clubId);
  const [err, setErr] = useState(false);
  if (!club) return null;
  if (!club.logoUrl || err) {
    return (
      <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-black"
        style={{ width: size, height: size, background: `${club.primaryColor}20`, color: club.primaryColor, border: `2px solid ${club.primaryColor}30`, fontSize: size < 40 ? 9 : 11 }}>
        {club.code}
      </div>
    );
  }
  return (
    <Image src={club.logoUrl} alt={club.name} width={size} height={size}
      className="object-contain flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setErr(true)} />
  );
}

/* ─── attribute bar (voor de profiel-sectie) ────────────────────── */
function AttributeBar({ label, icon, score, color }: { label: string; icon: string; score: number; color: string }) {
  const pct = (score / 10) * 100;
  const display = Math.round(score * 10); // 0–100
  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-6 flex-shrink-0">{icon}</span>
      <span className="text-xs font-semibold text-white/60 w-20 flex-shrink-0 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
      <span className="text-sm font-black tabular-nums w-8 text-right flex-shrink-0"
        style={{ color, fontFamily: "Outfit, sans-serif" }}>{display}</span>
    </div>
  );
}

/* ─── expandable sub-criteria (voor evaluatiegeschiedenis) ─────── */
function SubCriteriaRow({ categoryId, subNotes, fallback }: { categoryId: string; subNotes?: string; fallback: number }) {
  const schema = EVALUATION_SCHEMA.find((c) => c.id === categoryId);
  const sub = parseSubScores(subNotes);
  const hasReal = !!sub && Object.keys(sub).length > 0;
  if (!schema) return null;
  return (
    <div className="mt-2 space-y-1.5 pl-2 border-l-2" style={{ borderColor: `${schema.color}40` }}>
      {schema.subcategories.map((s) => {
        const val = hasReal ? (sub![s.id] ?? fallback) : fallback;
        const sc = getScoreColor(val);
        return (
          <div key={s.id} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-32 flex-shrink-0 truncate">{s.label}</span>
            <div className="flex-1 h-1 bg-hub-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${val * 10}%`, backgroundColor: hasReal ? sc : `${sc}50` }} />
            </div>
            <span className="text-[10px] font-bold w-5 text-right tabular-nums flex-shrink-0"
              style={{ color: hasReal ? sc : `${sc}80` }}>{hasReal ? val : "—"}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────────── */
export default function PlayerCardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profiel" | "evaluaties" | "vergelijking" | "medisch">("profiel");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMyPlayerData(), getAllPlayers()]).then(([p, all]) => {
      setPlayer(p); setAllPlayers(all); setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin" style={{ color: "#4FA9E6" }} />
    </div>
  );

  if (!player) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Mijn Profiel</h1>
      <div className="hub-card p-12 text-center">
        <Star size={40} className="text-slate-300 mx-auto mb-3" />
        <div className="text-slate-600 mb-4">Vul eerst je spelersprofiel in.</div>
        <Link href="/dashboard/player/settings" className="hub-btn-primary inline-flex items-center gap-2">
          <Settings size={14} /> Profiel invullen
        </Link>
      </div>
    </div>
  );

  const identity = player.identity;
  const arch = identity?.primary_archetype ? ARCHETYPES[identity.primary_archetype] : null;
  const socio = identity?.primary_sociotype ? SOCIOTYPES[identity.primary_sociotype] : null;
  const rColor = getRatingColor(player.overall_rating);
  const rLabel = getRatingLabel(player.overall_rating);
  const club = DUTCH_CLUBS.find((c) => c.id === (player as unknown as Record<string, unknown>).club as string);

  const p = player as unknown as Record<string, unknown>;
  const age = p.date_of_birth ? getAge(p.date_of_birth as string) : null;
  const heightCm = p.height_cm as number | undefined;
  const weightKg = p.weight_kg as number | undefined;
  const dominantFoot = ((p.dominant_foot as DominantFoot) ?? "right") as DominantFoot;
  const injuries = ((p.injury_locations as BodyRegion[]) ?? []) as BodyRegion[];

  const latestEval = player.evaluations?.[0];
  const scores = latestEval?.scores ?? [];

  const radarData = scores.map((s) => ({
    subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category,
    value: s.score,
    fullMark: 10,
  }));

  const trend = player.trend ?? "stable";

  const tabs = [
    { id: "profiel" as const, label: "Profiel", icon: <Star size={13} /> },
    { id: "evaluaties" as const, label: "Evaluaties", icon: <Activity size={13} /> },
    { id: "vergelijking" as const, label: "Vergelijking", icon: <BarChart3 size={13} /> },
    { id: "medisch" as const, label: "Medisch", icon: <ShieldAlert size={13} /> },
  ];

  return (
    <div className="space-y-0 -mx-4 sm:-mx-6 lg:-mx-8">

      {/* ══════════════════════════════════════════════════════════════
          HERO — volledig donker, premium
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #060d1a 0%, #0A2540 50%, #0b1f38 100%)" }}>

        {/* Glow achter de speler */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.15] blur-3xl pointer-events-none"
          style={{ background: rColor }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "#4FA9E6" }} />

        {/* Club watermark */}
        {club?.logoUrl && (
          <div className="absolute right-4 top-4 opacity-[0.05] pointer-events-none select-none">
            <Image src={club.logoUrl} alt="" width={160} height={160} className="object-contain" style={{ width: 160, height: 160 }} />
          </div>
        )}

        {/* Bovenste accentlijn */}
        <div className="h-[3px] w-full"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${rColor} 30%, #4FA9E6 70%, transparent 100%)` }} />

        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-0">

          {/* Topbalk: label + edit */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "#4FA9E6" }}>
              Performance Hub · Spelersprofiel
            </span>
            <Link href="/dashboard/player/settings"
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Settings size={11} /> Bewerken
            </Link>
          </div>

          {/* Hoofd info rij */}
          <div className="flex items-start gap-5 sm:gap-7">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex items-center justify-center font-black text-2xl sm:text-3xl shadow-2xl"
                style={player.avatar_url
                  ? { border: `2px solid ${rColor}50` }
                  : { background: `linear-gradient(135deg, ${rColor}20, ${rColor}45)`, border: `2px solid ${rColor}40`, color: rColor }}>
                {player.avatar_url
                  ? <Image src={player.avatar_url} alt={player.first_name} width={96} height={96} className="object-cover w-full h-full" />
                  : `${player.first_name[0]}${player.last_name[0]}`}
              </div>
              {/* Positie badge */}
              <div className="absolute -bottom-2 -right-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-lg"
                style={{ background: rColor }}>
                {player.position}
              </div>
            </div>

            {/* Naam + metadata */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight"
                style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.03em" }}>
                {player.first_name}{" "}
                <span style={{ color: rColor }}>{player.last_name.toUpperCase()}</span>
              </h1>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border"
                  style={{ background: `${rColor}18`, color: rColor, borderColor: `${rColor}35` }}>
                  {POSITION_LABELS[player.position]}
                </span>
                {player.jersey_number && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    #{player.jersey_number}
                  </span>
                )}
                {rLabel && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: `${rColor}18`, color: rColor, border: `1px solid ${rColor}30` }}>
                    {rLabel}
                  </span>
                )}
                {trend !== "stable" && (
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    trend === "up" ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
                  }`}>
                    {trend === "up" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {trend === "up" ? "Stijgend" : "Dalend"}
                  </span>
                )}
              </div>

              {/* Fysiek + club info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
                {age && <span className="flex items-center gap-1 text-xs text-white/40"><Calendar size={10} />{age} jaar</span>}
                {heightCm && <span className="flex items-center gap-1 text-xs text-white/40"><Ruler size={10} />{heightCm} cm</span>}
                {weightKg && <span className="flex items-center gap-1 text-xs text-white/40"><Weight size={10} />{weightKg} kg</span>}
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <Footprints size={10} />{dominantFoot === "left" ? "Links" : "Rechts"}
                </span>
                {player.team_name && (
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <MapPin size={10} />{player.team_name}
                  </span>
                )}
              </div>
            </div>

            {/* Grote rating + club logo */}
            <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
              {club && <ClubBadge clubId={club.id} size={40} />}
              <div className="text-right">
                <div className="font-black tabular-nums leading-none"
                  style={{ color: rColor, fontSize: "4.5rem", fontFamily: "Outfit, sans-serif", textShadow: `0 0 50px ${rColor}50` }}>
                  {player.overall_rating}
                </div>
                <div className="text-[10px] text-white/25 uppercase tracking-widest -mt-1">Overall</div>
              </div>
            </div>
          </div>

          {/* ── ATTRIBUTE BARS (vanuit evaluatiedata) ── */}
          {scores.length > 0 && (
            <div className="mt-6 pt-5 border-t grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {scores.map((s) => {
                const schema = EVALUATION_SCHEMA.find((c) => c.id === s.category);
                return (
                  <AttributeBar
                    key={s.category}
                    label={CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                    icon={schema?.icon ?? "⚽"}
                    score={s.score}
                    color={getScoreColor(s.score)}
                  />
                );
              })}
            </div>
          )}

          {/* Evaluatiedatum */}
          {latestEval && (
            <div className="mt-3 pb-1 text-[10px] text-white/20 text-right">
              Gebaseerd op evaluatie van {formatDate(latestEval.evaluation_date)}
              {latestEval.coach_name ? ` · ${latestEval.coach_name}` : ""}
            </div>
          )}

          {/* ── TABS (onderin de hero, vloeiend aansluitend) ── */}
          <div className="flex gap-0 mt-5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-x-auto"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 relative"
                style={tab === t.id
                  ? { color: rColor }
                  : { color: "rgba(255,255,255,0.35)" }
                }>
                {t.icon}{t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full" style={{ background: rColor }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB CONTENT (lichte achtergrond)
      ══════════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-8 space-y-5">

        {/* ── PROFIEL TAB ── */}
        {tab === "profiel" && (
          <div className="space-y-5">

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Overall", value: player.overall_rating, color: rColor, icon: <Star size={15} /> },
                { label: "Evaluaties", value: player.evaluations?.length ?? 0, color: "#4FA9E6", icon: <TrendingUp size={15} /> },
                { label: "Challenges", value: player.challenges?.filter(c => c.status !== "expired").length ?? 0, color: "#F59E0B", icon: <Trophy size={15} /> },
                { label: "AI Fit Score", value: identity?.ai_fit_score ?? "—", color: "#8B5CF6", icon: <Sparkles size={15} /> },
              ].map((s) => (
                <div key={s.label} className="hub-card p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.color }} />
                  <div className="p-1.5 rounded-lg w-fit mb-2" style={{ background: `${s.color}12` }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                  <div className="text-3xl font-black tabular-nums" style={{ color: s.color, fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Radar + DNA zij aan zij */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Radar */}
              {radarData.length > 0 && (
                <div className="hub-card p-5">
                  <div className="hub-label mb-4">Performance Radar</div>
                  <div className="flex justify-center">
                    <PlayerRadarChart data={radarData} color={rColor} size={260} />
                  </div>
                </div>
              )}

              {/* DNA */}
              {(arch || socio) && (
                <div className="hub-card p-5 space-y-3">
                  <div className="hub-label">Player DNA</div>
                  {arch && (() => {
                    const AIcon = ARCHETYPE_ICONS[arch.id];
                    return (
                      <div className="p-4 rounded-xl border transition-all"
                        style={{ background: `${arch.color}06`, borderColor: `${arch.color}25` }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${arch.color}15` }}>
                            <AIcon size={20} style={{ color: arch.color }} strokeWidth={1.75} />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Archetype</div>
                            <div className="font-bold text-slate-900 text-sm mt-0.5">{arch.label}</div>
                            <div className="text-xs text-slate-500 mt-1 leading-snug">{arch.description}</div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {arch.traits.map((t) => (
                                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{ background: `${arch.color}12`, color: arch.color }}>{t}</span>
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
                      <div className="p-4 rounded-xl border transition-all"
                        style={{ background: `${socio.color_hex}06`, borderColor: `${socio.color_hex}25` }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${socio.color_hex}15` }}>
                            <SIcon size={20} style={{ color: socio.color_hex }} strokeWidth={1.75} />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Persoonlijkheid</div>
                            <div className="font-bold text-slate-900 text-sm mt-0.5">{socio.label}</div>
                            <div className="text-xs text-slate-500 mt-1 leading-snug">{socio.description}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* AI Scouting rapport */}
            {identity?.ai_summary && (
              <div className="hub-card p-5"
                style={{ background: "linear-gradient(135deg, #f0f7fd 0%, #ffffff 100%)", borderColor: "rgba(79,169,230,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ background: "rgba(79,169,230,0.12)" }}>
                    <Sparkles size={14} style={{ color: "#4FA9E6" }} />
                  </div>
                  <span className="text-sm font-bold text-slate-900">AI Scouting Rapport</span>
                  {identity.ai_fit_score && (
                    <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-lg"
                      style={{ background: `${rColor}12`, color: rColor }}>
                      Fit {identity.ai_fit_score}/100
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{identity.ai_summary}</p>
              </div>
            )}

            {/* Spelersprofiel stats */}
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Spelersprofiel</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Positie", value: POSITION_LABELS[player.position] },
                  { label: "Rugnummer", value: player.jersey_number ? `#${player.jersey_number}` : "—" },
                  { label: "Leeftijd", value: age ? `${age} jaar` : "—" },
                  { label: "Lengte", value: heightCm ? `${heightCm} cm` : "—" },
                  { label: "Gewicht", value: weightKg ? `${weightKg} kg` : "—" },
                  { label: "Voorkeursvoet", value: dominantFoot === "left" ? "Links" : dominantFoot === "right" ? "Rechts" : "Beide" },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-hub-surface border border-hub-border">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EVALUATIES TAB ── */}
        {tab === "evaluaties" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Mijn Evaluaties</h2>
                <p className="text-xs text-slate-500 mt-0.5">{player.evaluations?.length ?? 0} beoordelingen van je coach</p>
              </div>
            </div>

            {(player.evaluations ?? []).length === 0 ? (
              <div className="hub-card p-12 text-center">
                <Activity size={36} className="text-slate-300 mx-auto mb-3" />
                <div className="text-slate-500 text-sm">Nog geen evaluaties</div>
              </div>
            ) : (
              <div className="space-y-4">
                {(player.evaluations ?? []).map((ev, i) => {
                  const rC = getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40);
                  return (
                    <div key={ev.id} className={`hub-card p-5 ${i === 0 ? "border-hub-teal/25" : ""}`}>
                      {i === 0 && <div className="hub-tag text-[10px] bg-hub-teal/10 text-hub-teal mb-3">Meest Recent</div>}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{formatDate(ev.evaluation_date)}</div>
                          {ev.coach_name && <div className="text-xs text-slate-400 mt-0.5">{ev.coach_name}</div>}
                        </div>
                        <div className="text-2xl font-black tabular-nums" style={{ color: rC, fontFamily: "Outfit, sans-serif" }}>
                          {ev.overall_score?.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span>
                        </div>
                      </div>

                      {/* Categoriescores — uitklapbaar */}
                      {ev.scores && ev.scores.length > 0 && (
                        <div className="space-y-2">
                          {ev.scores.map((s) => {
                            const sc = getScoreColor(s.score);
                            const schema = EVALUATION_SCHEMA.find((c) => c.id === s.category);
                            const catKey = `${ev.id}-${s.category}`;
                            const isOpen = expandedCat === catKey;
                            const sNotes = (s as unknown as Record<string, unknown>).sub_notes as string | undefined;
                            return (
                              <div key={s.category} className="rounded-xl border transition-all overflow-hidden"
                                style={{ borderColor: isOpen ? `${sc}35` : "#e2e8f0", background: isOpen ? `${sc}04` : "#f8fafc" }}>
                                <button
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-black/[0.015] transition-colors"
                                  onClick={() => setExpandedCat(isOpen ? null : catKey)}>
                                  <span className="text-base flex-shrink-0">{schema?.icon ?? "⚽"}</span>
                                  <span className="flex-1 text-sm font-semibold text-slate-700">
                                    {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                                  </span>
                                  <span className="text-sm font-black tabular-nums px-2.5 py-0.5 rounded-full"
                                    style={{ background: `${sc}12`, color: sc }}>{s.score.toFixed(1)}</span>
                                  <div className="hidden sm:block w-20 h-1.5 bg-hub-border rounded-full overflow-hidden flex-shrink-0">
                                    <div className="h-full rounded-full" style={{ width: `${s.score * 10}%`, backgroundColor: sc }} />
                                  </div>
                                  <span className="text-slate-300 flex-shrink-0">
                                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </span>
                                </button>
                                {isOpen && (
                                  <div className="px-4 pb-4">
                                    {!parseSubScores(sNotes) && (
                                      <p className="text-[10px] text-slate-400 italic mb-2">Gemiddelde — subcriteria beschikbaar in nieuwe evaluaties</p>
                                    )}
                                    <SubCriteriaRow categoryId={s.category} subNotes={sNotes} fallback={s.score} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {ev.notes && (
                        <div className="mt-3 p-3 rounded-xl bg-hub-surface border border-hub-border text-xs text-slate-500 italic">
                          &ldquo;{ev.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── VERGELIJKING TAB ── */}
        {tab === "vergelijking" && (
          <div className="hub-card p-5">
            <div className="hub-label mb-1">Jij vs. het team</div>
            <p className="text-xs text-slate-500 mb-5">Jouw naam is gemarkeerd, anderen zijn anoniem.</p>
            {allPlayers.length > 1 ? (
              <PlayerComparisonChart
                players={allPlayers}
                currentPlayerId={player.id}
                anonymizeOthers={true}
                defaultQuality="techniek"
              />
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                Vergelijking beschikbaar zodra er meerdere spelers zijn.
              </div>
            )}
          </div>
        )}

        {/* ── MEDISCH TAB ── */}
        {tab === "medisch" && (
          <div className="hub-card p-5 space-y-4">
            <div className="hub-label">Medisch Profiel</div>
            <p className="text-xs text-slate-500">
              Blessures en voorkeursvoet.{" "}
              <Link href="/dashboard/player/settings" className="text-hub-teal hover:underline">Bewerken →</Link>
            </p>
            <InjuryBodyMap injuries={injuries} dominantFoot={dominantFoot} readonly={true} />
          </div>
        )}

      </div>
    </div>
  );
}
