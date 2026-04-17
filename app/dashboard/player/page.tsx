"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ARCHETYPES, SOCIOTYPES, CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import { getRatingColor, getScoreColor, formatDate } from "@/lib/utils";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import Image from "next/image";
import { Trophy, CheckCircle2, Clock, Activity, Flame, Lightbulb, ShieldCheck, Loader2, UserPlus, Sparkles, ChevronRight, RefreshCw } from "lucide-react";
import type { Evaluation, PlayerWithDetails } from "@/lib/types";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { PlayerTypeHero, SOCIOTYPE_ICONS } from "@/components/PlayerTypeHero";

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

function EmptyState({ userName }: { userName?: string }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Hey{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-slate-600 text-sm mt-1">Jouw performance dashboard</p>
      </div>
      <div className="hub-card p-12 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "rgba(0,184,145,0.1)", border: "1px solid rgba(0,184,145,0.2)" }}>
          <UserPlus size={28} style={{ color: "#00b891" }} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Profiel nog niet compleet</h2>
        <p className="text-slate-600 text-sm mb-6">Vul je spelersprofiel in zodat je coach je kan evalueren en challenges kan aanmaken.</p>
        <Link href="/onboarding" className="hub-btn-primary inline-flex items-center gap-2">
          Profiel aanvullen
        </Link>
      </div>
    </div>
  );
}

export default function PlayerDashboardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [devPlan, setDevPlan] = useState<string[] | null>(null);
  const [devPlanLoading, setDevPlanLoading] = useState(false);
  const [devPlanSource, setDevPlanSource] = useState<"claude" | "rules" | null>(null);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        setUserName(profile?.full_name ?? "");
      }
      const data = await getMyPlayerData();
      setPlayer(data);
      setLoading(false);

      // Auto-load cached plan from localStorage
      if (data?.id) {
        const cacheKey = `dev-plan-${data.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.plan && parsed.ts && Date.now() - parsed.ts < 86400000) {
              setDevPlan(parsed.plan);
              setDevPlanSource(parsed.source);
            }
          } catch { /* ignore */ }
        }
      }
    }
    load();
  }, []);

  async function generateDevPlan(playerData: PlayerWithDetails) {
    setDevPlanLoading(true);
    try {
      const res = await fetch("/api/ai/dev-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: {
            first_name: playerData.first_name,
            position: playerData.position,
            overall_rating: playerData.overall_rating,
          },
          recent_scores: playerData.recent_scores,
          evaluations_count: playerData.evaluations?.length ?? 0,
          challenges: (playerData.challenges ?? []).map((c) => ({
            title: c.title,
            status: c.status,
            category: c.category,
          })),
          trend: playerData.trend,
        }),
      });
      const data = await res.json();
      setDevPlan(data.plan);
      setDevPlanSource(data.source);
      // Cache for 24h
      localStorage.setItem(`dev-plan-${playerData.id}`, JSON.stringify({
        plan: data.plan,
        source: data.source,
        ts: Date.now(),
      }));
    } catch { /* ignore */ }
    setDevPlanLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-hub-teal" />
      </div>
    );
  }

  if (!player) return <EmptyState userName={userName} />;

  const identity = player.identity;
  const primaryArch = identity?.primary_archetype ? ARCHETYPES[identity.primary_archetype] : null;
  const primarySocio = identity?.primary_sociotype ? SOCIOTYPES[identity.primary_sociotype] : null;
  const rColor = getRatingColor(player.overall_rating);

  const latestEval = player.evaluations?.[0];
  const radarData = latestEval?.scores?.map((s) => ({
    subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category,
    value: s.score,
    fullMark: 10,
  })) ?? [];

  const progressData = buildProgressData(player.evaluations ?? []);
  const openChallenges = player.challenges?.filter((c) => c.status === "open" || c.status === "in_progress") ?? [];
  const completedChallenges = player.challenges?.filter((c) => c.status === "completed") ?? [];

  return (
    <div className="space-y-8">
      {/* Premium page header */}
      <div className="hub-page-header p-6 sm:p-8">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center font-black text-2xl border-2"
              style={player.avatar_url
                ? { borderColor: `${rColor}30` }
                : { background: `linear-gradient(135deg, ${rColor}15, ${rColor}30)`, borderColor: `${rColor}30`, color: rColor }}>
              {player.avatar_url
                ? <Image src={player.avatar_url} alt={player.first_name} width={80} height={80} className="object-cover w-full h-full" />
                : `${player.first_name[0]}${player.last_name[0]}`
              }
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md"
              style={{ background: rColor, fontFamily: "Outfit, sans-serif" }}>
              {player.overall_rating}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#818cf8", fontFamily: "Outfit, sans-serif" }}>Performance Hub</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
              {player.first_name} <span style={{ color: rColor }}>{player.last_name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${rColor}12`, color: rColor, border: `1px solid ${rColor}25` }}>
                {player.position}
              </span>
              {player.jersey_number && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-600">
                  #{player.jersey_number}
                </span>
              )}
              {player.team_name && (
                <span className="text-xs text-slate-500">{player.team_name}</span>
              )}
              {primaryArch && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${primaryArch.color}12`, color: primaryArch.color }}>
                  {primaryArch.icon} {primaryArch.label}
                </span>
              )}
            </div>
          </div>

          {/* Big rating — desktop */}
          <div className="hidden sm:block flex-shrink-0 text-right">
            <div className="font-black tabular-nums leading-none" style={{ color: rColor, fontSize: "5rem", fontFamily: "Outfit, sans-serif" }}>{player.overall_rating}</div>
            <div className="text-xs text-slate-400 uppercase tracking-widest mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>Overall</div>
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Rating", value: player.overall_rating, color: rColor, bg: `${rColor}10`, sub: "overall" },
          { label: "Evaluaties", value: player.evaluations?.length ?? 0, color: "#4f46e5", bg: "#ede9fe", sub: player.evaluations?.[0] ? formatDate(player.evaluations[0].evaluation_date) : "nog geen" },
          { label: "Challenges", value: openChallenges.length, color: "#d97706", bg: "#fef3c7", sub: `${completedChallenges.length} voltooid` },
          { label: "Fit Score", value: identity?.ai_fit_score ?? "—", color: "#7c3aed", bg: "#f3e8ff", sub: "AI scouting" },
        ].map((s) => (
          <div key={s.label} className="hub-card p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.color }} />
            <div className="text-4xl font-black tabular-nums leading-none mb-1" style={{ color: s.color, fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500" style={{ fontFamily: "Outfit, sans-serif" }}>{s.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Player Type Hero */}
      {primaryArch && (
        <PlayerTypeHero
          archetype={primaryArch}
          sociotype={primarySocio ?? undefined}
          overallRating={player.overall_rating}
          position={player.position}
        />
      )}

      {/* AI Ontwikkelplan */}
      <div className="hub-card p-5" style={{ border: "1px solid rgba(99,102,241,0.25)", background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(0,184,145,0.04))" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(99,102,241,0.15)" }}>
              <Sparkles size={14} style={{ color: "#818cf8" }} />
            </div>
            <span className="text-sm font-bold text-slate-900">AI Ontwikkelplan</span>
            {devPlanSource === "claude" && (
              <span className="hub-tag text-[9px]" style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>Claude AI</span>
            )}
          </div>
          {devPlan && (
            <button
              onClick={() => player && generateDevPlan(player)}
              disabled={devPlanLoading}
              className="text-slate-600 hover:text-slate-300 transition-colors"
              title="Vernieuwen"
            >
              <RefreshCw size={13} className={devPlanLoading ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {devPlanLoading ? (
          <div className="flex items-center gap-2 text-slate-600 text-sm py-2">
            <Loader2 size={14} className="animate-spin" />
            Plan wordt gegenereerd...
          </div>
        ) : devPlan ? (
          <ul className="space-y-2.5">
            {devPlan.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                  style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                  {i + 1}
                </div>
                <span className="text-sm text-slate-300 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {(player?.evaluations?.length ?? 0) === 0
                ? "Beschikbaar na je eerste evaluatie."
                : "Genereer een persoonlijk plan op basis van jouw data."}
            </p>
            {(player?.evaluations?.length ?? 0) > 0 && (
              <button
                onClick={() => player && generateDevPlan(player)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ml-3"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <Sparkles size={11} /> Genereer
                <ChevronRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <PlayerCard player={player} variant="full" />
        </div>
        <div className="xl:col-span-2 space-y-4">
          <div className="hub-card p-5">
            <div className="hub-label mb-4">Performance Radar</div>
            {radarData.length > 0 ? (
              <PlayerRadarChart data={radarData} color={rColor} size={280} />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
                Nog geen evaluatie data
              </div>
            )}
          </div>
          <div className="hub-card p-5">
            <div className="hub-label mb-3">Mijn Progressie</div>
            {progressData.length > 1 ? (
              <ProgressLineChart data={progressData} height={150} />
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-600 text-sm">
                Meer evaluaties nodig voor grafiek
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DNA Profile */}
      {identity && (primaryArch || primarySocio) && (
        <div className="hub-card p-5">
          <div className="hub-label mb-4">Mijn Speler DNA</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {primarySocio && (() => {
              const SocioIcon = SOCIOTYPE_ICONS[primarySocio.id];
              return (
                <div className="p-4 rounded-xl border transition-all"
                  style={{ borderColor: `${primarySocio.color_hex}40`, background: `${primarySocio.color_hex}08` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${primarySocio.color_hex}15` }}>
                      <SocioIcon size={18} style={{ color: primarySocio.color_hex }} strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase tracking-wider">Persoonlijkheid</div>
                      <div className="font-bold text-slate-900 text-sm">{primarySocio.label}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{primarySocio.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {primarySocio.traits.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-hub-border text-slate-600">{t}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
          {identity && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Noodzaak", value: identity.core_noodzaak, color: "#ef4444", Icon: Flame },
                { label: "Creativiteit", value: identity.core_creativiteit, color: "#a855f7", Icon: Lightbulb },
                { label: "Vertrouwen", value: identity.core_vertrouwen, color: "#00d4aa", Icon: ShieldCheck },
              ].map((kv) => (
                <div key={kv.label} className="text-center p-3 rounded-xl bg-hub-surface border border-hub-border">
                  <kv.Icon size={18} className="mx-auto mb-1.5" style={{ color: kv.color }} />
                  <div className="hub-label text-[10px]">{kv.label}</div>
                  <div className="text-xl font-black mt-1 tabular-nums" style={{ color: kv.color }}>{kv.value}</div>
                </div>
              ))}
            </div>
          )}
          {identity?.ai_summary && (
            <div className="mt-4 p-4 rounded-xl bg-hub-surface border border-hub-border">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-hub-teal" />
                <div className="text-xs font-semibold text-hub-teal uppercase tracking-wider">Scouting Analyse</div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{identity.ai_summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Active challenges */}
      {openChallenges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-amber-400" />
            <h2 className="font-bold text-slate-900">Actieve Challenges</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {openChallenges.map((ch) => {
              const statusColor = ch.status === "in_progress" ? "#f59e0b" : "#64748b";
              return (
                <div key={ch.id} className="hub-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 text-sm">{ch.title}</div>
                      {ch.category && (
                        <div className="text-xs text-slate-600 mt-0.5">
                          {CATEGORY_ICONS[ch.category as keyof typeof CATEGORY_ICONS]} {CATEGORY_LABELS[ch.category as keyof typeof CATEGORY_LABELS]}
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-black tabular-nums" style={{ color: statusColor }}>
                      {ch.progress}%
                    </div>
                  </div>
                  <div className="h-2 bg-hub-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${ch.progress}%`, backgroundColor: statusColor }} />
                  </div>
                  {ch.deadline && (
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
                      <Clock size={10} />
                      {formatDate(ch.deadline)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent evaluations */}
      {(player.evaluations?.length ?? 0) > 0 && (
        <div>
          <h2 className="font-bold text-slate-900 mb-4">Recente Evaluaties</h2>
          <div className="space-y-3">
            {(player.evaluations ?? []).slice(0, 3).map((ev) => (
              <div key={ev.id} className="hub-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-slate-900">{formatDate(ev.evaluation_date)}</div>
                  <div className="text-lg font-black tabular-nums"
                    style={{ color: getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40) }}>
                    {ev.overall_score?.toFixed(1)}/10
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ev.scores?.map((s) => (
                    <div key={s.category} className="text-center">
                      <div className="text-xs font-bold tabular-nums"
                        style={{ color: getScoreColor(s.score) }}>{s.score.toFixed(1)}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5 uppercase">
                        {s.category.slice(0, 3)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for no evaluations yet */}
      {(player.evaluations?.length ?? 0) === 0 && openChallenges.length === 0 && (
        <div className="hub-card p-8 text-center">
          <Trophy size={36} className="text-slate-700 mx-auto mb-3" />
          <div className="text-slate-600 text-sm">Je coach heeft nog geen evaluaties of challenges aangemaakt.</div>
        </div>
      )}
    </div>
  );
}
