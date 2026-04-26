"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ARCHETYPES, SOCIOTYPES, CATEGORY_LABELS, CATEGORY_ICONS, POSITION_LABELS } from "@/lib/types";
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
          style={{ background: "rgba(79,169,230,0.08)", border: "1px solid rgba(79,169,230,0.2)" }}>
          <UserPlus size={28} style={{ color: "#4FA9E6" }} />
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

  // Build FIFA-card attribute pairs from latest evaluation
  const catAttrs = latestEval?.scores?.map((s) => ({
    label: s.category.slice(0, 3).toUpperCase(),
    full: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS],
    score: s.score,
    color: getScoreColor(s.score),
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* ═══ MARTINEZ-STYLE HERO CARD ══════════════════════════════════════ */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(150deg, #060e1c 0%, #0A2540 45%, #0d3060 100%)" }}>

        {/* Decorative glow blob */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: rColor }} />
        {/* Top accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${rColor}, #4FA9E6, transparent)` }} />

        <div className="relative z-10 p-6 sm:p-8">
          {/* Main row: avatar | info | big rating */}
          <div className="flex items-start gap-5">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center font-black text-3xl shadow-2xl"
                style={player.avatar_url
                  ? { border: `2px solid ${rColor}60` }
                  : { background: `linear-gradient(135deg, ${rColor}25, ${rColor}50)`, border: `2px solid ${rColor}50`, color: rColor }}>
                {player.avatar_url
                  ? <Image src={player.avatar_url} alt={player.first_name} width={96} height={96} className="object-cover w-full h-full" />
                  : `${player.first_name[0]}${player.last_name[0]}`}
              </div>
              {/* Position badge */}
              <div className="absolute -bottom-2 -right-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg text-white"
                style={{ background: rColor }}>
                {player.position}
              </div>
            </div>

            {/* Name + tags */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "#4FA9E6" }}>
                Performance Hub
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
                {player.first_name} <span style={{ color: rColor }}>{player.last_name.toUpperCase()}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                  style={{ background: `${rColor}20`, color: rColor, borderColor: `${rColor}40` }}>
                  {POSITION_LABELS[player.position]}
                </span>
                {player.jersey_number && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                    #{player.jersey_number}
                  </span>
                )}
                {primaryArch && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${primaryArch.color}25`, color: primaryArch.color }}>
                    {primaryArch.icon} {primaryArch.label}
                  </span>
                )}
                {player.team_name && (
                  <span className="text-xs text-white/50">{player.team_name}</span>
                )}
              </div>
            </div>

            {/* Big rating — desktop */}
            <div className="hidden sm:flex flex-col items-center flex-shrink-0 pt-1">
              <div className="font-black tabular-nums leading-none"
                style={{ color: rColor, fontSize: "5.5rem", fontFamily: "Outfit, sans-serif", textShadow: `0 0 40px ${rColor}40` }}>
                {player.overall_rating}
              </div>
              <div className="text-[10px] text-white/30 uppercase tracking-widest -mt-1">Rating</div>
            </div>
          </div>

          {/* ─── FIFA CARD ATTRIBUTES ────────────────────────────────── */}
          {catAttrs.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="grid grid-cols-5 gap-2">
                {catAttrs.map((attr) => (
                  <div key={attr.label} className="text-center">
                    {/* Score bar */}
                    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                      <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                        style={{ width: `${attr.score * 10}%`, background: `linear-gradient(90deg, ${attr.color}80, ${attr.color})` }} />
                    </div>
                    <div className="text-xl font-black tabular-nums leading-none"
                      style={{ color: attr.color, fontFamily: "Outfit, sans-serif" }}>
                      {Math.round(attr.score * 10)}
                    </div>
                    <div className="text-[9px] font-bold tracking-wider mt-0.5 text-white/50 uppercase">
                      {attr.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-white/25 text-right">
                {latestEval ? `Laatste evaluatie: ${formatDate(latestEval.evaluation_date)}` : ""}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Rating", value: player.overall_rating, color: rColor, sub: "overall" },
          { label: "Evaluaties", value: player.evaluations?.length ?? 0, color: "#4FA9E6", sub: player.evaluations?.[0] ? formatDate(player.evaluations[0].evaluation_date) : "nog geen" },
          { label: "Challenges", value: openChallenges.length, color: "#d97706", sub: `${completedChallenges.length} voltooid` },
          { label: "Fit Score", value: identity?.ai_fit_score ?? "—", color: "#8B5CF6", sub: "AI scouting" },
        ].map((s) => (
          <div key={s.label} className="hub-card p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.color }} />
            <div className="text-4xl font-black tabular-nums leading-none mb-1" style={{ color: s.color, fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
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
      <div className="hub-card p-5" style={{ border: "1px solid rgba(79,169,230,0.18)", background: "linear-gradient(135deg, #f0f7fd 0%, #ffffff 100%)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: "#E8F4FC" }}>
              <Sparkles size={14} style={{ color: "#4FA9E6" }} />
            </div>
            <span className="text-sm font-bold text-slate-900">AI Ontwikkelplan</span>
            {devPlanSource === "claude" && (
              <span className="hub-tag text-[9px]" style={{ background: "#E8F4FC", color: "#4FA9E6" }}>Claude AI</span>
            )}
          </div>
          {devPlan && (
            <button
              onClick={() => player && generateDevPlan(player)}
              disabled={devPlanLoading}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Vernieuwen"
            >
              <RefreshCw size={13} className={devPlanLoading ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {devPlanLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
            <Loader2 size={14} className="animate-spin text-hub-teal" />
            Plan wordt gegenereerd...
          </div>
        ) : devPlan ? (
          <ul className="space-y-2.5">
            {devPlan.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                  style={{ background: "#E8F4FC", color: "#4FA9E6" }}>
                  {i + 1}
                </div>
                <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
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
                style={{ background: "#E8F4FC", color: "#4FA9E6", border: "1px solid rgba(79,169,230,0.2)" }}
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
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-center px-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                  style={{ background: "rgba(79,169,230,0.08)", border: "1px solid rgba(79,169,230,0.15)" }}>
                  <Activity size={18} style={{ color: "#4FA9E6" }} />
                </div>
                <div className="text-sm font-semibold text-slate-700">Nog geen evaluatie</div>
                <div className="text-xs text-slate-500">Zodra jouw coach een evaluatie invult, zie je hier jouw performance radar.</div>
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
                { label: "Vertrouwen", value: identity.core_vertrouwen, color: "#10B981", Icon: ShieldCheck },
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
              <p className="text-sm text-slate-700 leading-relaxed">{identity.ai_summary}</p>
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
