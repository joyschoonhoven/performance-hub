"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { PlayerCard } from "@/components/PlayerCard";
import { ARCHETYPES, SOCIOTYPES, POSITION_LABELS } from "@/lib/types";
import { getRatingColor } from "@/lib/utils";
import { Star, Loader2, Settings, Sparkles } from "lucide-react";
import type { PlayerWithDetails } from "@/lib/types";
import { ARCHETYPE_ICONS, SOCIOTYPE_ICONS } from "@/components/PlayerTypeHero";

export default function PlayerCardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPlayerData().then((p) => { setPlayer(p); setLoading(false); });
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
        <Star size={40} className="text-slate-400 mx-auto mb-3" />
        <div className="text-slate-600">Vul eerst je spelersprofiel in om je player card te zien.</div>
        <Link href="/dashboard/player/settings" className="hub-btn-primary inline-flex items-center gap-2 mt-4">
          <Settings size={14} /> Profiel invullen
        </Link>
      </div>
    </div>
  );

  const identity = player.identity;
  const arch = identity?.primary_archetype ? ARCHETYPES[identity.primary_archetype] : null;
  const socio = identity?.primary_sociotype ? SOCIOTYPES[identity.primary_sociotype] : null;
  const rColor = getRatingColor(player.overall_rating);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0f1422 0%, #1a1d2e 50%, #0f1422 100%)", minHeight: 160 }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 80% 50%, ${rColor}18 0%, transparent 65%)` }} />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${rColor}, #6366f1, #a855f7)` }} />
        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-xl"
            style={player.avatar_url ? {} : { background: `linear-gradient(135deg, ${rColor}25, ${rColor}50)`, color: rColor, border: `2px solid ${rColor}40` }}>
            {player.avatar_url
              ? <Image src={player.avatar_url} alt={player.first_name} width={64} height={64} className="object-cover w-full h-full" />
              : `${player.first_name[0]}${player.last_name[0]}`
            }
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: rColor }}>Mijn Player Card</div>
            <h1 className="text-2xl font-black text-white">{player.first_name} <span style={{ color: rColor }}>{player.last_name.toUpperCase()}</span></h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
              <span>{POSITION_LABELS[player.position]}</span>
              {player.jersey_number && <span>#{player.jersey_number}</span>}
              {player.team_name && <span>{player.team_name}</span>}
            </div>
          </div>
          <div className="hidden sm:block text-right flex-shrink-0">
            <div className="text-6xl font-black tabular-nums leading-none" style={{ color: rColor }}>{player.overall_rating}</div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Rating</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* FIFA card */}
        <div className="max-w-sm w-full">
          <PlayerCard player={player} variant="full" />
          <Link href="/dashboard/player/settings"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Settings size={12} /> Profiel bewerken
          </Link>
        </div>

        <div className="flex-1 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Overall", value: player.overall_rating, color: rColor },
              { label: "Evaluaties", value: player.evaluations?.length ?? 0, color: "#6366f1" },
              { label: "Fit Score", value: identity?.ai_fit_score ?? "—", color: "#00d4aa" },
            ].map((s) => (
              <div key={s.label} className="hub-card p-4 text-center">
                <div className="text-3xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
                <div className="hub-label mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Scores */}
          {player.recent_scores && (
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Laatste Scores</div>
              <div className="space-y-3">
                {Object.entries(player.recent_scores).map(([cat, score]) => {
                  const sc = score >= 8 ? "#00d4aa" : score >= 6 ? "#6366f1" : "#ef4444";
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-20 text-xs text-slate-600 font-medium capitalize">{cat}</div>
                      <div className="flex-1 h-2 bg-hub-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(score / 10) * 100}%`, backgroundColor: sc }} />
                      </div>
                      <div className="text-sm font-black tabular-nums w-8 text-right" style={{ color: sc }}>{score.toFixed(1)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DNA */}
          {(arch || socio) && (
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Player DNA</div>
              <div className="space-y-3">
                {arch && (() => {
                  const AIcon = ARCHETYPE_ICONS[arch.id];
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ borderColor: `${arch.color}30`, background: `${arch.color}06` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${arch.color}15` }}>
                        <AIcon size={20} style={{ color: arch.color }} strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">Archetype</div>
                        <div className="font-bold text-slate-900">{arch.label}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{arch.description}</div>
                      </div>
                    </div>
                  );
                })()}
                {socio && (() => {
                  const SIcon = SOCIOTYPE_ICONS[socio.id];
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ borderColor: `${socio.color_hex}30`, background: `${socio.color_hex}06` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${socio.color_hex}15` }}>
                        <SIcon size={20} style={{ color: socio.color_hex }} strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">Persoonlijkheid</div>
                        <div className="font-bold text-slate-900">{socio.label}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{socio.description}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* AI rapport */}
          {identity?.ai_summary && (
            <div className="hub-card p-5" style={{ borderColor: "rgba(99,102,241,0.25)", background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(0,184,145,0.04))" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ background: "rgba(99,102,241,0.15)" }}>
                  <Sparkles size={14} style={{ color: "#818cf8" }} />
                </div>
                <div className="text-sm font-bold text-slate-900">AI Scouting Rapport</div>
                {identity.ai_fit_score && (
                  <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-lg" style={{ background: `${rColor}15`, color: rColor }}>
                    Fit {identity.ai_fit_score}/100
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{identity.ai_summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
