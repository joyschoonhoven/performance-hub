"use client";

import { useState, useEffect } from "react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { PlayerCard } from "@/components/PlayerCard";
import { ARCHETYPES, SOCIOTYPES } from "@/lib/types";
import { getRatingColor } from "@/lib/utils";
import { Star, Loader2 } from "lucide-react";
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Star size={24} className="text-amber-400" />
          Mijn Player Card
        </h1>
      </div>
      <div className="hub-card p-12 text-center">
        <Star size={40} className="text-slate-700 mx-auto mb-3" />
        <div className="text-slate-500">Vul eerst je spelersprofiel in om je player card te zien.</div>
      </div>
    </div>
  );

  const identity = player.identity;
  const arch = identity?.primary_archetype ? ARCHETYPES[identity.primary_archetype] : null;
  const socio = identity?.primary_sociotype ? SOCIOTYPES[identity.primary_sociotype] : null;
  const rColor = getRatingColor(player.overall_rating);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Star size={24} className="text-amber-400" />
          Mijn Player Card
        </h1>
        <p className="text-slate-400 text-sm mt-1">Jouw spelersprofiel</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="max-w-sm">
          <PlayerCard player={player} variant="full" />
        </div>

        <div className="flex-1 space-y-4">
          <div className="hub-card p-5">
            <div className="hub-label mb-3">Profiel Info</div>
            <div className="space-y-3">
              <div className="data-row">
                <span className="text-slate-500 text-sm">Overall Rating</span>
                <span className="text-xl font-black tabular-nums" style={{ color: rColor }}>{player.overall_rating}</span>
              </div>
              <div className="data-row">
                <span className="text-slate-500 text-sm">Positie</span>
                <span className="text-sm font-semibold text-slate-900">{player.position}</span>
              </div>
              {player.jersey_number && (
                <div className="data-row">
                  <span className="text-slate-500 text-sm">Rugnummer</span>
                  <span className="text-sm font-semibold text-slate-900">#{player.jersey_number}</span>
                </div>
              )}
              {player.team_name && (
                <div className="data-row">
                  <span className="text-slate-500 text-sm">Team</span>
                  <span className="text-sm font-semibold text-slate-900">{player.team_name}</span>
                </div>
              )}
              {player.nationality && (
                <div className="data-row">
                  <span className="text-slate-500 text-sm">Nationaliteit</span>
                  <span className="text-sm font-semibold text-slate-900">{player.nationality}</span>
                </div>
              )}
            </div>
          </div>

          {(arch || socio) && (
            <div className="hub-card p-5">
              <div className="hub-label mb-3">Player DNA</div>
              <div className="space-y-3">
                {arch && (() => {
                  const AIcon = ARCHETYPE_ICONS[arch.id];
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ borderColor: `${arch.color}30`, background: `${arch.color}08` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${arch.color}15` }}>
                        <AIcon size={18} style={{ color: arch.color }} strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Archetype</div>
                        <div className="font-bold text-slate-900 text-sm">{arch.label}</div>
                      </div>
                    </div>
                  );
                })()}
                {socio && (() => {
                  const SIcon = SOCIOTYPE_ICONS[socio.id];
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ borderColor: `${socio.color_hex}30`, background: `${socio.color_hex}08` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${socio.color_hex}15` }}>
                        <SIcon size={18} style={{ color: socio.color_hex }} strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Sociotype</div>
                        <div className="font-bold text-slate-900 text-sm">{socio.label}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {identity?.ai_summary && (
            <div className="hub-card p-5 border-hub-teal/20">
              <div className="hub-label mb-3 text-hub-teal">AI Scouting Rapport</div>
              <p className="text-sm text-slate-300 leading-relaxed">{identity.ai_summary}</p>
              {identity.ai_fit_score && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-hub-border">
                  <div>
                    <div className="hub-label text-[10px]">Fit Score</div>
                    <div className="text-2xl font-black tabular-nums" style={{ color: rColor }}>
                      {identity.ai_fit_score}<span className="text-xs text-slate-500 font-normal">/100</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
