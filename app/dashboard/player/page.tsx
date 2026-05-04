"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ARCHETYPES, SOCIOTYPES, CATEGORY_LABELS, CATEGORY_ICONS, POSITION_LABELS } from "@/lib/types";
import { getRatingColor, getScoreColor, formatDate } from "@/lib/utils";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import Image from "next/image";
import {
  Trophy, CheckCircle2, Clock, Activity, Loader2,
  UserPlus, Sparkles, ChevronRight, RefreshCw, TrendingUp,
} from "lucide-react";
import type { Evaluation, PlayerWithDetails } from "@/lib/types";
import { getMyPlayerData } from "@/lib/supabase/queries";

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
        <h1 className="hub-heading">
          {userName ? `Welkom, ${userName.split(" ")[0]}` : "Dashboard"}
        </h1>
        <p className="hub-subtext text-sm mt-1">Jouw Performance Hub — overzicht en voortgang</p>
      </div>
      <div className="hub-card p-12 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "rgba(79,169,230,0.08)", border: "1px solid rgba(79,169,230,0.2)" }}>
          <UserPlus size={24} style={{ color: "#4FA9E6" }} />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-2">Spelersprofiel niet volledig</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Vul je profiel in zodat je coach je kan evalueren en challenges kan instellen.
        </p>
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

      if (data?.id) {
        const cached = localStorage.getItem(`dev-plan-${data.id}`);
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
            title: c.title, status: c.status, category: c.category,
          })),
          trend: playerData.trend,
        }),
      });
      const data = await res.json();
      setDevPlan(data.plan);
      setDevPlanSource(data.source);
      localStorage.setItem(`dev-plan-${playerData.id}`, JSON.stringify({
        plan: data.plan, source: data.source, ts: Date.now(),
      }));
    } catch { /* ignore */ }
    setDevPlanLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin" style={{ color: "#4FA9E6" }} />
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

  // FIFA-card attribute row from latest evaluation
  const catAttrs = latestEval?.scores?.map((s) => ({
    label: s.category.slice(0, 3).toUpperCase(),
    full: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS],
    score: s.score,
    color: getScoreColor(s.score),
  })) ?? [];

  const trendColor = player.trend === "up" ? "#4FA9E6" : player.trend === "down" ? "#ef4444" : "#9CA3AF";
  const trendLabel = player.trend === "up" ? "Stijgend" : player.trend === "down" ? "Dalend" : "Stabiel";

  return (
    <div className="space-y-6">

      {/* ═══ HERO CARD ═════════════════════════════════════════════════════ */}
      <div className="relative hub-card overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${rColor}, #4FA9E6, transparent)` }} />

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex items-center justify-center font-black text-3xl"
                style={player.avatar_url
                  ? { border: `2px solid ${rColor}40` }
                  : { background: `linear-gradient(135deg, ${rColor}15, ${rColor}30)`,
                      border: `2px solid ${rColor}40`, color: rColor, fontFamily: "Outfit, sans-serif" }}>
                {player.avatar_url
                  ? <Image src={player.avatar_url} alt={player.first_name} width={96} height={96} className="object-cover w-full h-full" />
                  : `${player.first_name[0]}${player.last_name[0]}`}
              </div>
              <div className="absolute -bottom-2 -right-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                style={{ background: rColor }}>
                {player.position}
              </div>
            </div>

            {/* Name + tags */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "#4FA9E6" }}>
                Performance Hub
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight"
                style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
                {player.first_name}{" "}
                <span style={{ color: rColor }}>{player.last_name.toUpperCase()}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                  style={{ background: `${rColor}15`, color: rColor, borderColor: `${rColor}40` }}>
                  {POSITION_LABELS[player.position]}
                </span>
                {player.jersey_number && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    #{player.jersey_number}
                  </span>
                )}
                {primaryArch && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${primaryArch.color}15`, color: primaryArch.color }}>
                    {primaryArch.icon} {primaryArch.label}
                  </span>
                )}
                {player.team_name && (
                  <span className="text-xs text-slate-400">{player.team_name}</span>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="hidden sm:flex flex-col items-center flex-shrink-0 pt-1">
              <div className="font-black tabular-nums leading-none"
                style={{ color: rColor, fontSize: "5rem", fontFamily: "Outfit, sans-serif" }}>
                {player.overall_rating}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest -mt-1">Rating</div>
            </div>
          </div>

          {/* Attribute strip */}
          {catAttrs.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-5 gap-2">
                {catAttrs.map((attr) => (
                  <div key={attr.label} className="text-center bg-slate-100 rounded-xl px-2 py-2">
                    <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                      <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                        style={{ width: `${attr.score * 10}%`, background: `linear-gradient(90deg, ${attr.color}70, ${attr.color})` }} />
                    </div>
                    <div className="text-xl font-black tabular-nums leading-none"
                      style={{ color: attr.color, fontFamily: "Outfit, sans-serif" }}>
                      {Math.round(attr.score * 10)}
                    </div>
                    <div className="text-[9px] font-bold tracking-wider mt-0.5 text-slate-400 uppercase">
                      {attr.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-slate-400 text-right">
                {latestEval ? `Laatste evaluatie: ${formatDate(latestEval.evaluation_date)}` : ""}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Key metrics strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Overall Rating", value: player.overall_rating, color: rColor,
            sub: primaryArch ? primaryArch.label : "Spelersscore" },
          { label: "Evaluaties", value: player.evaluations?.length ?? 0, color: "#4FA9E6",
            sub: latestEval ? formatDate(latestEval.evaluation_date) : "Nog geen" },
          { label: "Open Challenges", value: openChallenges.length, color: "#d97706",
            sub: `${completedChallenges.length} afgerond` },
          { label: "Trend", value: trendLabel, color: trendColor,
            sub: player.trend === "up" ? "t.o.v. vorige eval" : player.trend === "down" ? "t.o.v. vorige eval" : "Stabiele lijn" },
        ].map((s) => (
          <div key={s.label} className="hub-card p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.color }} />
            <div className="text-3xl font-black tabular-nums leading-none mb-1"
              style={{ color: s.color, fontFamily: "Outfit, sans-serif" }}>
              {s.value}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── AI Ontwikkelplan ── */}
      <div className="hub-card p-5"
        style={{ border: "1px solid rgba(79,169,230,0.16)", background: "linear-gradient(135deg, #f0f7fd 0%, #ffffff 100%)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: "#E8F4FC" }}>
              <Sparkles size={13} style={{ color: "#4FA9E6" }} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900">AI Ontwikkelplan</span>
              {devPlanSource === "claude" && (
                <span className="ml-2 hub-tag text-[9px]" style={{ background: "#E8F4FC", color: "#4FA9E6" }}>
                  Claude AI
                </span>
              )}
            </div>
          </div>
          {devPlan && (
            <button onClick={() => player && generateDevPlan(player)} disabled={devPlanLoading}
              className="text-slate-400 hover:text-slate-600 transition-colors" title="Vernieuwen">
              <RefreshCw size={13} className={devPlanLoading ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {devPlanLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
            <Loader2 size={14} className="animate-spin" style={{ color: "#4FA9E6" }} />
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
            <p className="text-sm text-slate-500">
              {(player?.evaluations?.length ?? 0) === 0
                ? "Beschikbaar na de eerste evaluatie."
                : "Genereer een gepersonaliseerd ontwikkelplan op basis van jouw evaluatiedata."}
            </p>
            {(player?.evaluations?.length ?? 0) > 0 && (
              <button onClick={() => player && generateDevPlan(player)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ml-3"
                style={{ background: "#E8F4FC", color: "#4FA9E6", border: "1px solid rgba(79,169,230,0.2)" }}>
                <Sparkles size={11} /> Genereer <ChevronRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Performance visualisatie ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Radar */}
        <div className="hub-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="hub-label">Performance Radar</div>
            {latestEval && (
              <span className="text-[10px] text-slate-400">{formatDate(latestEval.evaluation_date)}</span>
            )}
          </div>
          {radarData.length > 0 ? (
            <PlayerRadarChart data={radarData} color={rColor} size={260} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-center px-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                style={{ background: "rgba(79,169,230,0.08)", border: "1px solid rgba(79,169,230,0.12)" }}>
                <Activity size={17} style={{ color: "#4FA9E6" }} />
              </div>
              <div className="text-sm font-semibold text-slate-700">Nog geen evaluatiedata</div>
              <div className="text-xs text-slate-400 leading-relaxed">
                Zodra je coach een evaluatie heeft ingevuld, verschijnt hier jouw radar.
              </div>
            </div>
          )}
        </div>

        {/* Progression */}
        <div className="hub-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} style={{ color: "#4FA9E6" }} />
            <div className="hub-label">Evaluatie Progressie</div>
          </div>
          {progressData.length > 1 ? (
            <ProgressLineChart data={progressData} height={180} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-center px-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                style={{ background: "rgba(79,169,230,0.08)", border: "1px solid rgba(79,169,230,0.12)" }}>
                <TrendingUp size={17} style={{ color: "#4FA9E6" }} />
              </div>
              <div className="text-sm font-semibold text-slate-700">Onvoldoende data</div>
              <div className="text-xs text-slate-400">Minimaal twee evaluaties nodig voor progressiegrafiek.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Actieve challenges ── */}
      {openChallenges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={15} style={{ color: "#d97706" }} />
              <h2 className="text-sm font-bold text-slate-900">Actieve Challenges</h2>
            </div>
            <Link href="/dashboard/player/challenges"
              className="text-xs font-semibold" style={{ color: "#4FA9E6" }}>
              Alle challenges
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {openChallenges.map((ch) => {
              const statusColor = ch.status === "in_progress" ? "#f59e0b" : "#64748b";
              return (
                <div key={ch.id} className="hub-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{ch.title}</div>
                      {ch.category && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {CATEGORY_ICONS[ch.category as keyof typeof CATEGORY_ICONS]}{" "}
                          {CATEGORY_LABELS[ch.category as keyof typeof CATEGORY_LABELS]}
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-black tabular-nums ml-3 flex-shrink-0"
                      style={{ color: statusColor, fontFamily: "Outfit, sans-serif" }}>
                      {ch.progress}%
                    </div>
                  </div>
                  <div className="h-1.5 bg-hub-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${ch.progress}%`, backgroundColor: statusColor }} />
                  </div>
                  {ch.deadline && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
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

      {/* ── Lege toestand ── */}
      {(player.evaluations?.length ?? 0) === 0 && openChallenges.length === 0 && (
        <div className="hub-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(79,169,230,0.07)", border: "1px solid rgba(79,169,230,0.15)" }}>
            <CheckCircle2 size={22} style={{ color: "#4FA9E6" }} />
          </div>
          <div className="text-sm font-semibold text-slate-700 mb-1">Nog geen activiteit</div>
          <div className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Je coach heeft nog geen evaluaties of challenges aangemaakt. Je profiel is klaar.
          </div>
        </div>
      )}
    </div>
  );
}
