"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPlayerById } from "@/lib/supabase/queries";
import { ARCHETYPES, SOCIOTYPES, BADGE_CONFIG, POSITION_LABELS, CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import { getRatingColor, formatDate, getAge, getScoreColor } from "@/lib/utils";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import type { Evaluation, PlayerWithDetails } from "@/lib/types";
import Image from "next/image";
import {
  ArrowLeft, Brain, Zap, Star, Trophy, TrendingUp, TrendingDown,
  Minus, Plus, Calendar, Target, Loader2, Sparkles, UserCircle,
} from "lucide-react";

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

function getConsensusAssessment(evals: Evaluation[]) {
  const archetypeCounts: Record<string, number> = {};
  const sociotypeCounts: Record<string, number> = {};
  const positionCounts: Record<string, number> = {};

  evals.forEach((ev) => {
    if (ev.assessed_archetype) archetypeCounts[ev.assessed_archetype] = (archetypeCounts[ev.assessed_archetype] || 0) + 1;
    if (ev.assessed_sociotype) sociotypeCounts[ev.assessed_sociotype] = (sociotypeCounts[ev.assessed_sociotype] || 0) + 1;
    if (ev.assessed_position) positionCounts[ev.assessed_position] = (positionCounts[ev.assessed_position] || 0) + 1;
  });

  const topArchetype = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topSociotype = Object.entries(sociotypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topPosition = Object.entries(positionCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    archetype: topArchetype,
    sociotype: topSociotype,
    position: topPosition,
    totalAssessments: evals.filter((e) => e.assessed_archetype || e.assessed_sociotype).length,
  };
}

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "dna" | "evaluations" | "challenges">("overview");
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      getPlayerById(id).then((p) => { setPlayer(p); setLoading(false); });
    }
  }, [id]);

  async function updateChallengeProgress(challengeId: string, progress: number) {
    setUpdatingProgress(challengeId);
    const supabase = createClient();
    const status = progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "open";
    await supabase.from("challenges").update({ progress, status }).eq("id", challengeId);
    // Refresh player data
    if (id) {
      const updated = await getPlayerById(id);
      setPlayer(updated);
    }
    setUpdatingProgress(null);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-600">
        <p className="text-lg font-bold text-slate-900 mb-2">Speler niet gevonden</p>
        <Link href="/dashboard/coach/players" className="text-hub-teal hover:underline mt-2 text-sm">
          ← Terug naar spelers
        </Link>
      </div>
    );
  }

  const identity = player.identity;
  const primaryArch = identity?.primary_archetype ? ARCHETYPES[identity.primary_archetype] : null;
  const secondaryArch = identity?.secondary_archetype ? ARCHETYPES[identity.secondary_archetype] : null;
  const primarySocio = identity?.primary_sociotype ? SOCIOTYPES[identity.primary_sociotype] : null;
  const secondarySocio = identity?.secondary_sociotype ? SOCIOTYPES[identity.secondary_sociotype] : null;
  const badge = player.badge ? BADGE_CONFIG[player.badge] : null;
  const rColor = getRatingColor(player.overall_rating);
  const progressData = buildProgressData(player.evaluations ?? []);

  const latestEval = player.evaluations?.[0];
  const radarData = latestEval?.scores?.map((s) => ({
    subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS],
    value: s.score,
    fullMark: 10,
  })) ?? [];

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: <Star size={14} /> },
    { id: "dna" as const, label: "Player DNA", icon: <Brain size={14} /> },
    { id: "evaluations" as const, label: "Evaluaties", icon: <Zap size={14} /> },
    { id: "challenges" as const, label: "Challenges", icon: <Trophy size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/dashboard/coach/players" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} /> Terug naar spelers
      </Link>

      {/* Premium page header */}
      <div className="hub-page-header p-6 sm:p-8">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center font-black text-2xl border-2"
              style={player.avatar_url
                ? { borderColor: `${rColor}30` }
                : { background: `linear-gradient(135deg, ${rColor}15, ${rColor}30)`, borderColor: `${rColor}30`, color: rColor }}>
              {player.avatar_url
                ? <Image src={player.avatar_url} alt={player.first_name} width={96} height={96} className="object-cover w-full h-full" />
                : `${player.first_name[0]}${player.last_name[0]}`
              }
            </div>
            {player.jersey_number && (
              <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-md border border-white"
                style={{ background: `${rColor}15`, color: rColor }}>
                #{player.jersey_number}
              </div>
            )}
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-0.5" style={{ fontFamily: "Outfit, sans-serif" }}>Performance Hub</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
              {player.first_name} <span style={{ color: rColor }}>{player.last_name.toUpperCase()}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${rColor}10`, color: rColor }}>
                {POSITION_LABELS[player.position]}
              </span>
              {badge && (
                <span className="hub-tag text-[10px] font-black" style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              )}
              <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                player.trend === "up" ? "bg-emerald-50 text-emerald-600" :
                player.trend === "down" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
              }`}>
                {player.trend === "up" ? <TrendingUp size={10} /> : player.trend === "down" ? <TrendingDown size={10} /> : <Minus size={10} />}
                {player.trend === "up" ? "Stijgend" : player.trend === "down" ? "Dalend" : "Stabiel"}
              </span>
              {player.team_name && <span className="text-xs text-slate-500">{player.team_name}</span>}
              {player.date_of_birth && <span className="text-xs text-slate-500">{getAge(player.date_of_birth)} jaar</span>}
            </div>
            {player.recent_scores && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(player.recent_scores).map(([cat, score]) => {
                  const sc = score >= 8 ? "#059669" : score >= 6 ? "#4f46e5" : "#ef4444";
                  const bg = score >= 8 ? "#d1fae5" : score >= 6 ? "#ede9fe" : "#fee2e2";
                  return (
                    <span key={cat} className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: bg, color: sc }}>
                      {cat.slice(0,3).toUpperCase()} {score.toFixed(1)}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-3 mt-4">
              <Link href={`/dashboard/coach/evaluations/new?player=${player.id}`}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                style={{ background: `${rColor}10`, color: rColor, border: `1px solid ${rColor}25` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = `${rColor}20`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = `${rColor}10`; }}>
                <Plus size={13} /> Evaluatie aanmaken
              </Link>
              <Link href={`/dashboard/coach/ai`}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.2)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.14)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.08)"; }}>
                <Brain size={13} /> AI Analyse
              </Link>
            </div>
          </div>

          {/* Big rating — desktop */}
          <div className="hidden sm:block flex-shrink-0 text-right">
            <div className="font-black tabular-nums leading-none" style={{ color: rColor, fontSize: "5rem", fontFamily: "Outfit, sans-serif" }}>{player.overall_rating}</div>
            <div className="text-xs text-slate-400 uppercase tracking-widest mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>Rating</div>
            {identity?.ai_fit_score && (
              <div className="text-xs text-slate-500 mt-1">
                AI Fit: <span className="font-bold" style={{ color: rColor }}>{identity.ai_fit_score}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-hub-surface border border-hub-border rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-1 justify-center ${
              activeTab === tab.id ? "bg-hub-teal text-hub-bg" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PlayerCard player={player} variant="full" />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Performance Radar</div>
              {radarData.length > 0 ? (
                <PlayerRadarChart data={radarData} color={rColor} size={250} />
              ) : (
                <div className="h-60 flex items-center justify-center text-slate-600 text-sm">
                  Evalueer de speler voor radar data
                </div>
              )}
            </div>

            <div className="hub-card p-5">
              <div className="hub-label mb-4">Rating Progressie ({(player.evaluations?.length ?? 0)} evaluaties)</div>
              {progressData.length > 1 ? (
                <ProgressLineChart data={progressData} showCategories height={180} />
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-600 text-sm">
                  Meer evaluaties nodig voor trends
                </div>
              )}
            </div>

            {player.recent_scores && (
              <div className="hub-card p-5">
                <div className="hub-label mb-4">Categorie Scores</div>
                <div className="space-y-3">
                  {Object.entries(player.recent_scores).map(([cat, score]) => {
                    const sColor = getScoreColor(score);
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-slate-600 font-medium flex items-center gap-1.5">
                          <span>{CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]}</span>
                          {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                        </div>
                        <div className="flex-1 h-2 bg-hub-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(score / 10) * 100}%`, backgroundColor: sColor }} />
                        </div>
                        <div className="text-sm font-bold w-8 tabular-nums text-right" style={{ color: sColor }}>
                          {score.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DNA TAB */}
      {activeTab === "dna" && (
        <div className="space-y-6">
          {!identity ? (
            <div className="hub-card p-12 text-center space-y-4">
              <Brain size={40} className="text-slate-700 mx-auto" />
              <div className="text-slate-900 font-bold">Player DNA nog niet ingesteld</div>
              <p className="text-slate-600 text-sm">Gebruik de AI engine om automatisch het DNA te bepalen, of stel het handmatig in via evaluaties.</p>
              <Link href={`/dashboard/coach/ai?player=${player.id}`} className="hub-btn-primary inline-flex items-center gap-2">
                <Brain size={16} /> AI Analyse starten
              </Link>
            </div>
          ) : (
            <>
              {identity.ai_summary && (
                <div className="hub-card p-5 border-hub-teal/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-hub-teal/15">
                        <Sparkles size={16} className="text-hub-teal" />
                      </div>
                      <div className="font-bold text-slate-900 text-sm">AI Scouting Analyse</div>
                    </div>
                    {identity.last_ai_analysis && (
                      <span className="text-xs text-slate-600">{formatDate(identity.last_ai_analysis)}</span>
                    )}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{identity.ai_summary}</p>
                  {identity.ai_fit_score && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-hub-border">
                      <div>
                        <div className="hub-label">Fit Score</div>
                        <div className="text-2xl font-black tabular-nums mt-1" style={{ color: getRatingColor(identity.ai_fit_score) }}>
                          {identity.ai_fit_score}<span className="text-sm text-slate-600 font-normal">/100</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="hub-card p-5">
                  <div className="hub-label mb-4">Archetype Profiel</div>
                  <div className="space-y-3">
                    {primaryArch && (
                      <div className="p-4 rounded-xl border transition-all"
                        style={{ borderColor: `${primaryArch.color}40`, background: `${primaryArch.color}08` }}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{primaryArch.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{primaryArch.label}</span>
                              <span className="hub-tag text-[10px]" style={{ background: `${primaryArch.color}20`, color: primaryArch.color }}>Primair</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{primaryArch.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {primaryArch.traits.map((t) => (
                                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-hub-border text-slate-600">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {secondaryArch && (
                      <div className="p-4 rounded-xl border border-hub-border bg-hub-surface">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{secondaryArch.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700 text-sm">{secondaryArch.label}</span>
                              <span className="hub-tag text-[10px] bg-hub-border text-slate-600">Secundair</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{secondaryArch.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {!primaryArch && !secondaryArch && (
                      <p className="text-slate-600 text-sm">Geen archetype data.</p>
                    )}
                  </div>
                </div>

                <div className="hub-card p-5">
                  <div className="hub-label mb-4">Sociotype Profiel</div>
                  <div className="space-y-3">
                    {primarySocio && (
                      <div className="p-4 rounded-xl border transition-all"
                        style={{ borderColor: `${primarySocio.color_hex}40`, background: `${primarySocio.color_hex}08` }}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{primarySocio.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{primarySocio.label}</span>
                              <span className="hub-tag text-[10px]" style={{ background: `${primarySocio.color_hex}20`, color: primarySocio.color_hex }}>Primair</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{primarySocio.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {secondarySocio && (
                      <div className="p-4 rounded-xl border border-hub-border bg-hub-surface">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{secondarySocio.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700 text-sm">{secondarySocio.label}</span>
                              <span className="hub-tag text-[10px] bg-hub-border text-slate-600">Secundair</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{secondarySocio.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {!primarySocio && !secondarySocio && (
                      <p className="text-slate-600 text-sm">Geen sociotype data.</p>
                    )}
                  </div>
                </div>
              </div>

              {(identity.core_noodzaak !== undefined || identity.core_creativiteit !== undefined) && (
                <div className="hub-card p-5">
                  <div className="hub-label mb-5">Kernwaarden</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { key: "noodzaak", label: "Noodzaak", value: identity.core_noodzaak ?? 0, color: "#ef4444", desc: "Fysiek vermogen & werkethiek" },
                      { key: "creativiteit", label: "Creativiteit", value: identity.core_creativiteit ?? 0, color: "#a855f7", desc: "Techniek & tactisch inzicht" },
                      { key: "vertrouwen", label: "Vertrouwen", value: identity.core_vertrouwen ?? 0, color: "#00d4aa", desc: "Mentale kracht & consistentie" },
                    ].map((kv) => (
                      <div key={kv.key} className="p-4 rounded-xl border border-hub-border bg-hub-surface space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{kv.label}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                              <circle cx="32" cy="32" r="28" fill="none" stroke={kv.color} strokeWidth="6"
                                strokeDasharray={`${kv.value * 1.759} 175.9`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-black tabular-nums" style={{ color: kv.color }}>{kv.value}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 leading-snug">{kv.desc}</div>
                        </div>
                        <div className="h-1.5 bg-hub-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${kv.value}%`, backgroundColor: kv.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* EVALUATIONS TAB */}
      {activeTab === "evaluations" && (() => {
        const evals = player.evaluations ?? [];
        const consensus = getConsensusAssessment(evals);
        const consensusArch = consensus.archetype ? ARCHETYPES[consensus.archetype as keyof typeof ARCHETYPES] : null;
        const consensusSocio = consensus.sociotype ? SOCIOTYPES[consensus.sociotype as keyof typeof SOCIOTYPES] : null;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">{evals.length} evaluaties totaal</div>
              <Link href={`/dashboard/coach/evaluations/new?player=${player.id}`}
                className="hub-btn-primary flex items-center gap-2 text-xs">
                <Plus size={14} /> Nieuwe evaluatie
              </Link>
            </div>

            {consensus.totalAssessments > 0 && (
              <div className="hub-card p-5 border-hub-teal/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ background: "rgba(0,184,145,0.12)" }}>
                    <Brain size={14} style={{ color: "#00b891" }} />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Consensus Spelertype</span>
                  <span className="text-xs text-slate-600">— op basis van {consensus.totalAssessments} beoordelingen</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {consensusArch && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                      style={{ background: `${consensusArch.color}18`, color: consensusArch.color, border: `1px solid ${consensusArch.color}40` }}>
                      {consensusArch.icon} {consensusArch.label}
                    </span>
                  )}
                  {consensusSocio && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                      style={{ background: `${consensusSocio.color_hex}18`, color: consensusSocio.color_hex, border: `1px solid ${consensusSocio.color_hex}40` }}>
                      {consensusSocio.icon} {consensusSocio.label}
                    </span>
                  )}
                  {consensus.position && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-hub-surface text-slate-600 border border-hub-border">
                      {POSITION_LABELS[consensus.position as keyof typeof POSITION_LABELS]}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {evals.map((ev) => {
                const arch = ev.assessed_archetype ? ARCHETYPES[ev.assessed_archetype] : null;
                const socio = ev.assessed_sociotype ? SOCIOTYPES[ev.assessed_sociotype] : null;
                return (
                  <div key={ev.id} className="hub-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-600" />
                          <span className="text-sm font-semibold text-slate-900">{formatDate(ev.evaluation_date)}</span>
                        </div>
                        {ev.coach_name && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <UserCircle size={12} />
                            {ev.coach_name}
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-black tabular-nums" style={{ color: getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40) }}>
                        {ev.overall_score?.toFixed(1)}/10
                      </div>
                    </div>
                    {ev.scores && ev.scores.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                        {ev.scores.map((s) => {
                          const sc = getScoreColor(s.score);
                          return (
                            <div key={s.category} className="p-2.5 rounded-xl border border-hub-border bg-hub-surface">
                              <div className="text-[10px] font-bold text-slate-600 mb-1">{CATEGORY_ICONS[s.category as keyof typeof CATEGORY_ICONS]}</div>
                              <div className="hub-label text-[10px]">{CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}</div>
                              <div className="text-sm font-black tabular-nums mt-1" style={{ color: sc }}>{s.score.toFixed(1)}</div>
                              <div className="h-1 bg-hub-border rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${s.score * 10}%`, backgroundColor: sc }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {(arch || socio) && (
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs text-slate-600">Inschatting:</span>
                        {arch && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                            style={{ background: `${arch.color}15`, color: arch.color }}>
                            {arch.icon} {arch.label}
                          </span>
                        )}
                        {socio && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                            style={{ background: `${socio.color_hex}15`, color: socio.color_hex }}>
                            {socio.icon} {socio.label}
                          </span>
                        )}
                      </div>
                    )}
                    {ev.notes && (
                      <div className="p-3 rounded-xl bg-hub-surface border border-hub-border text-xs text-slate-600 italic">
                        &ldquo;{ev.notes}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })}
              {!evals.length && (
                <div className="hub-card p-12 text-center">
                  <Target size={40} className="text-slate-700 mx-auto mb-3" />
                  <div className="text-slate-600 font-bold mb-2">Nog geen evaluaties</div>
                  <Link href={`/dashboard/coach/evaluations/new?player=${player.id}`}
                    className="hub-btn-primary inline-flex items-center gap-2 text-sm mt-3">
                    <Plus size={14} /> Eerste evaluatie maken
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* CHALLENGES TAB */}
      {activeTab === "challenges" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">{player.challenges?.length ?? 0} challenges</div>
            <Link href="/dashboard/coach/challenges" className="hub-btn-ghost text-xs flex items-center gap-2">
              <Plus size={14} /> Challenge toewijzen
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(player.challenges ?? []).map((ch) => {
              const statusConfig = {
                open: { color: "#475569", label: "Open" },
                in_progress: { color: "#f59e0b", label: "Bezig" },
                completed: { color: "#00d4aa", label: "Voltooid" },
                expired: { color: "#ef4444", label: "Verlopen" },
              }[ch.status];

              return (
                <div key={ch.id} className="hub-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{ch.title}</span>
                        <span className="hub-tag text-[10px]" style={{ color: statusConfig.color, background: `${statusConfig.color}15` }}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-black tabular-nums" style={{ color: statusConfig.color }}>
                      {ch.progress}%
                    </div>
                  </div>
                  <div className="h-2 bg-hub-border rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${ch.progress}%`, backgroundColor: statusConfig.color }} />
                  </div>
                  {/* Progress updater */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={0} max={100} step={5}
                      value={ch.progress}
                      onChange={(e) => updateChallengeProgress(ch.id, parseInt(e.target.value))}
                      disabled={updatingProgress === ch.id}
                      className="flex-1 accent-hub-teal"
                    />
                    {updatingProgress === ch.id && <Loader2 size={12} className="animate-spin text-hub-teal" />}
                  </div>
                  {ch.deadline && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-600">
                      <Target size={11} />
                      Deadline: {formatDate(ch.deadline)}
                    </div>
                  )}
                </div>
              );
            })}
            {!(player.challenges?.length) && (
              <div className="hub-card p-12 text-center col-span-2">
                <Trophy size={40} className="text-slate-700 mx-auto mb-3" />
                <div className="text-slate-600 font-bold mb-2">Nog geen challenges</div>
                <Link href="/dashboard/coach/challenges" className="hub-btn-outline inline-flex items-center gap-2 text-sm mt-3">
                  <Plus size={14} /> Challenge toewijzen
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
