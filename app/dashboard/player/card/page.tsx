"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMyPlayerData, getAllPlayers } from "@/lib/supabase/queries";
import { PlayerCard } from "@/components/PlayerCard";
import { ARCHETYPES, SOCIOTYPES, POSITION_LABELS, CATEGORY_LABELS } from "@/lib/types";
import { getRatingColor, getRatingLabel, getAge, formatDate } from "@/lib/utils";
import { Star, Loader2, Settings, Sparkles, Trophy, TrendingUp, Calendar, Ruler, Weight, Footprints, Activity, BarChart3, ShieldAlert } from "lucide-react";
import type { PlayerWithDetails } from "@/lib/types";
import { ARCHETYPE_ICONS, SOCIOTYPE_ICONS } from "@/components/PlayerTypeHero";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { PlayerComparisonChart } from "@/components/charts/PlayerComparisonChart";
import { InjuryBodyMap } from "@/components/InjuryBodyMap";
import { DUTCH_CLUBS } from "@/lib/dutch-clubs";

function ClubBadge({ clubId, size = 48 }: { clubId: string; size?: number }) {
  const club = DUTCH_CLUBS.find((c) => c.id === clubId);
  const [error, setError] = useState(false);
  if (!club) return null;
  if (!club.logoUrl || error) {
    return (
      <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-black"
        style={{ width: size, height: size, background: `${club.primaryColor}15`, color: club.primaryColor, border: `2px solid ${club.primaryColor}30`, fontSize: size < 40 ? 9 : 11 }}>
        {club.code}
      </div>
    );
  }
  return (
    <Image src={club.logoUrl} alt={club.name} width={size} height={size}
      className="object-contain flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setError(true)} />
  );
}

export default function PlayerCardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"card" | "stats" | "compare" | "medical">("card");

  useEffect(() => {
    Promise.all([getMyPlayerData(), getAllPlayers()]).then(([p, all]) => {
      setPlayer(p);
      setAllPlayers(all);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  if (!player) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Mijn Player Card</h1>
      <div className="hub-card p-12 text-center">
        <Star size={40} className="text-slate-300 mx-auto mb-3" />
        <div className="text-slate-600 mb-4">Vul eerst je spelersprofiel in om je player card te zien.</div>
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
  const club = DUTCH_CLUBS.find((c) => c.id === (player as any).club);

  const radarData = player.recent_scores
    ? Object.entries(player.recent_scores).map(([cat, val]) => ({
        subject: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat,
        value: val,
        fullMark: 10,
      }))
    : [];

  const age = (player as any).date_of_birth ? getAge((player as any).date_of_birth) : null;
  const heightCm = (player as any).height_cm;
  const weightKg = (player as any).weight_kg;
  const dominantFoot = (player as any).dominant_foot ?? "right";
  const injuries = (player as any).injury_locations ?? [];

  const tabs = [
    { id: "card" as const, label: "Card", icon: <Star size={13} /> },
    { id: "stats" as const, label: "Stats", icon: <Activity size={13} /> },
    { id: "compare" as const, label: "Vergelijking", icon: <BarChart3 size={13} /> },
    { id: "medical" as const, label: "Medisch", icon: <ShieldAlert size={13} /> },
  ];

  return (
    <div className="space-y-6">
      {/* ── Hero header — PSV style ── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A2540 0%, #0D2D4D 60%, #0A2540 100%)", minHeight: 200 }}>

        {/* Background club crest (very faint watermark) */}
        {club?.logoUrl && (
          <div className="absolute right-0 top-0 bottom-0 w-64 flex items-center justify-center pointer-events-none select-none opacity-[0.06]"
            style={{ filter: "blur(1px)" }}>
            <Image src={club.logoUrl} alt="" width={200} height={200} className="object-contain" style={{ width: 200, height: 200 }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${rColor}12 0%, transparent 60%)` }} />

        {/* Top bar accent */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${rColor}, #4FA9E6)` }} />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
            {/* Avatar + rating badge */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex items-center justify-center font-black text-3xl border-2"
                style={player.avatar_url
                  ? { borderColor: `${rColor}50` }
                  : { background: `linear-gradient(135deg, ${rColor}20, ${rColor}40)`, borderColor: `${rColor}40`, color: rColor }}>
                {player.avatar_url
                  ? <Image src={player.avatar_url} alt={player.first_name} width={112} height={112} className="object-cover w-full h-full" />
                  : `${player.first_name[0]}${player.last_name[0]}`
                }
              </div>
              {/* Rating pill */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-sm font-black text-white shadow-lg whitespace-nowrap"
                style={{ background: rColor, fontFamily: "Outfit, sans-serif", fontSize: 13 }}>
                {player.overall_rating}
              </div>
            </div>

            {/* Name + info */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4FA9E6" }}>
                  Performance Hub
                </span>
                {rLabel && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${rColor}25`, color: rColor }}>
                    {rLabel}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight"
                style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
                {player.first_name}{" "}
                <span style={{ color: rColor }}>{player.last_name.toUpperCase()}</span>
              </h1>

              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: `${rColor}20`, color: rColor, border: `1px solid ${rColor}35` }}>
                  {POSITION_LABELS[player.position]}
                </span>
                {player.jersey_number && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white/80">
                    #{player.jersey_number}
                  </span>
                )}
                {age && (
                  <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-white/10 text-white/70">
                    <Calendar size={10} /> {age} jaar
                  </span>
                )}
                {heightCm && (
                  <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-white/10 text-white/70">
                    <Ruler size={10} /> {heightCm} cm
                  </span>
                )}
                {weightKg && (
                  <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-white/10 text-white/70">
                    <Weight size={10} /> {weightKg} kg
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-white/10 text-white/70">
                  <Footprints size={10} /> {dominantFoot === "left" ? "Links" : dominantFoot === "right" ? "Rechts" : "Beide"}
                </span>
              </div>
            </div>

            {/* Club logo (right side) */}
            {club && (
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <ClubBadge clubId={club.id} size={56} />
                <span className="text-[10px] text-white/50 font-medium text-center">{club.shortName}</span>
              </div>
            )}

            {/* Overall rating (desktop) */}
            <div className="hidden sm:flex flex-col items-end flex-shrink-0">
              <div className="font-black tabular-nums leading-none"
                style={{ color: rColor, fontSize: "5rem", fontFamily: "Outfit, sans-serif", textShadow: `0 0 40px ${rColor}40` }}>
                {player.overall_rating}
              </div>
              <div className="text-xs text-white/40 uppercase tracking-widest mt-1">Overall</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Overall", value: player.overall_rating, color: rColor, icon: <Star size={16} /> },
          { label: "Evaluaties", value: player.evaluations?.length ?? 0, color: "#4FA9E6", icon: <TrendingUp size={16} /> },
          { label: "Challenges", value: player.challenges?.filter(c => c.status !== "expired").length ?? 0, color: "#F59E0B", icon: <Trophy size={16} /> },
          { label: "AI Fit Score", value: identity?.ai_fit_score ?? "—", color: "#8B5CF6", icon: <Sparkles size={16} /> },
        ].map((s) => (
          <div key={s.label} className="hub-card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.color }} />
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg" style={{ background: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div className="text-3xl font-black tabular-nums" style={{ color: s.color, fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex gap-1 p-1 bg-hub-bg border border-hub-border rounded-xl w-full sm:w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
            style={tab === t.id
              ? { background: "#0A2540", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(10,37,64,0.2)" }
              : { color: "#64748b" }
            }>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Card ── */}
      {tab === "card" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* FIFA card */}
          <div className="lg:col-span-2">
            <PlayerCard player={player} variant="full" />
            <Link href="/dashboard/player/settings"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(79,169,230,0.08)", color: "#4FA9E6", border: "1px solid rgba(79,169,230,0.2)" }}>
              <Settings size={12} /> Profiel bewerken
            </Link>
          </div>

          {/* Right column */}
          <div className="lg:col-span-3 space-y-4">
            {/* Scores */}
            {player.recent_scores && (
              <div className="hub-card p-5">
                <div className="hub-label mb-4">Laatste Scores</div>
                <div className="space-y-3">
                  {Object.entries(player.recent_scores).map(([cat, score]) => {
                    const sc = score >= 8 ? "#10B981" : score >= 6 ? "#4FA9E6" : score >= 4 ? "#F59E0B" : "#EF4444";
                    const pct = (score / 10) * 100;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-20 text-xs font-semibold text-slate-600 capitalize">
                          {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}
                        </div>
                        <div className="flex-1 h-2.5 bg-hub-bg rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${sc}90, ${sc})` }} />
                        </div>
                        <div className="text-sm font-black tabular-nums w-8 text-right"
                          style={{ color: sc, fontFamily: "Outfit, sans-serif" }}>{score.toFixed(1)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Archetype + sociotype */}
            {(arch || socio) && (
              <div className="hub-card p-5">
                <div className="hub-label mb-4">Player DNA</div>
                <div className="space-y-3">
                  {arch && (() => {
                    const AIcon = ARCHETYPE_ICONS[arch.id];
                    return (
                      <div className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: `${arch.color}08`, border: `1px solid ${arch.color}25` }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${arch.color}15` }}>
                          <AIcon size={20} style={{ color: arch.color }} strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Archetype</div>
                          <div className="font-bold text-slate-900 text-sm">{arch.label}</div>
                          <div className="text-xs text-slate-500 truncate">{arch.description}</div>
                        </div>
                      </div>
                    );
                  })()}
                  {socio && (() => {
                    const SIcon = SOCIOTYPE_ICONS[socio.id];
                    return (
                      <div className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: `${socio.color_hex}08`, border: `1px solid ${socio.color_hex}25` }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${socio.color_hex}15` }}>
                          <SIcon size={20} style={{ color: socio.color_hex }} strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Persoonlijkheid</div>
                          <div className="font-bold text-slate-900 text-sm">{socio.label}</div>
                          <div className="text-xs text-slate-500 truncate">{socio.description}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* AI Rapport */}
            {identity?.ai_summary && (
              <div className="hub-card p-5"
                style={{ borderColor: "rgba(79,169,230,0.2)", background: "linear-gradient(135deg, #f0f7fd 0%, #ffffff 100%)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ background: "rgba(79,169,230,0.15)" }}>
                    <Sparkles size={14} style={{ color: "#4FA9E6" }} />
                  </div>
                  <div className="text-sm font-bold text-slate-900">AI Scouting Rapport</div>
                  {identity.ai_fit_score && (
                    <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-lg"
                      style={{ background: `${rColor}15`, color: rColor }}>
                      Fit {identity.ai_fit_score}/100
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{identity.ai_summary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Stats ── */}
      {tab === "stats" && (
        <div className="space-y-6">
          {/* Profile stats grid */}
          <div className="hub-card p-5">
            <div className="hub-label mb-4">Spelersprofiel</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Positie", value: POSITION_LABELS[player.position] },
                { label: "Rugnummer", value: player.jersey_number ? `#${player.jersey_number}` : "—" },
                { label: "Leeftijd", value: age ? `${age} jaar` : "—" },
                { label: "Lengte", value: heightCm ? `${heightCm} cm` : "—" },
                { label: "Gewicht", value: weightKg ? `${weightKg} kg` : "—" },
                { label: "Voorkeursvoet", value: dominantFoot === "left" ? "Links" : dominantFoot === "right" ? "Rechts" : "Beide" },
                { label: "Nationaliteit", value: (player as any).nationality ?? "—" },
                { label: "Club", value: club?.name ?? (player.team_name ?? "—") },
                { label: "Team", value: player.team_name ?? "—" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl" style={{ background: "#F4F5F7" }}>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar chart */}
          {radarData.length > 0 && (
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Performance Radar</div>
              <div className="flex justify-center">
                <PlayerRadarChart data={radarData} color={rColor} size={280} />
              </div>
            </div>
          )}

          {/* Evaluation history */}
          {(player.evaluations?.length ?? 0) > 0 && (
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Evaluatiehistorie</div>
              <div className="space-y-2">
                {player.evaluations!.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "#F4F5F7" }}>
                    <div className="text-xs text-slate-500 w-24 flex-shrink-0">{formatDate(ev.evaluation_date)}</div>
                    <div className="flex gap-1.5 flex-1 flex-wrap">
                      {ev.scores?.map((s) => {
                        const c = s.score >= 8 ? "#10B981" : s.score >= 6 ? "#4FA9E6" : "#F59E0B";
                        return (
                          <span key={s.category} className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ background: `${c}15`, color: c }}>
                            {s.category.slice(0, 3).toUpperCase()} {s.score.toFixed(1)}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-base font-black tabular-nums flex-shrink-0"
                      style={{ color: getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40), fontFamily: "Outfit, sans-serif" }}>
                      {ev.overall_score?.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Vergelijking ── */}
      {tab === "compare" && (
        <div className="hub-card p-5">
          <div className="hub-label mb-1">Jij vs. het team</div>
          <p className="text-xs text-slate-500 mb-5">
            Selecteer een kwaliteit om te zien waar jij staat ten opzichte van anderen. Je naam wordt gemarkeerd.
          </p>
          {allPlayers.length > 1 ? (
            <PlayerComparisonChart
              players={allPlayers}
              currentPlayerId={player.id}
              anonymizeOthers={true}
              defaultQuality="techniek"
            />
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm">
              Vergelijking beschikbaar zodra er meerdere spelers zijn.
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Medisch ── */}
      {tab === "medical" && (
        <div className="hub-card p-5 space-y-4">
          <div className="hub-label">Medisch Profiel</div>
          <p className="text-xs text-slate-500">
            Blessures en voorkeursvoet bijhouden. Ga naar{" "}
            <Link href="/dashboard/player/settings" className="text-hub-teal hover:underline">instellingen</Link> om dit te bewerken.
          </p>
          <InjuryBodyMap
            injuries={injuries}
            dominantFoot={dominantFoot}
            readonly={true}
          />
        </div>
      )}
    </div>
  );
}
