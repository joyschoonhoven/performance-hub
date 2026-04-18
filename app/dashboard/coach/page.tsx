"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BADGE_CONFIG, POSITION_LABELS } from "@/lib/types";
import { getRatingColor, formatDate } from "@/lib/utils";
import { PlayerCard } from "@/components/PlayerCard";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Users, TrendingUp, Plus, ArrowRight, Star, Zap, Loader2, UserPlus } from "lucide-react";
import type { Evaluation, PlayerWithDetails } from "@/lib/types";
import { getAllPlayers } from "@/lib/supabase/queries";

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

export default function CoachDashboardPage() {
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithDetails | null>(null);
  const [coachName, setCoachName] = useState("");
  const [coachAvatar, setCoachAvatar] = useState<string | null>(null);

  useEffect(() => {
    getAllPlayers().then((data) => {
      setPlayers(data);
      if (data.length) setSelectedPlayer(data[0]);
      setLoading(false);
    });
    // Load coach profile
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (data?.full_name) setCoachName(data.full_name);
        if (data?.avatar_url) setCoachAvatar(data.avatar_url);
      });
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-hub-teal" />
      </div>
    );
  }

  // Empty state — no players yet
  if (!players.length) {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Coach Dashboard</h1>
            <p className="text-slate-600 text-sm mt-1">Schoonhoven Sports Performance Hub</p>
          </div>
          <Link href="/dashboard/coach/evaluations/new" className="hub-btn-primary flex items-center gap-2">
            <Plus size={16} /> Nieuwe evaluatie
          </Link>
        </div>
        <div className="hub-card p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(79,169,230,0.08)", border: "1px solid rgba(79,169,230,0.18)" }}>
            <UserPlus size={28} style={{ color: "#4FA9E6" }} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Nog geen spelers</h2>
          <p className="text-slate-600 text-sm mb-6">
            Zodra spelers een account aanmaken via de app worden ze hier zichtbaar.
            Je kunt ook direct een evaluatie aanmaken.
          </p>
          <Link href="/dashboard/coach/evaluations/new" className="hub-btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Eerste evaluatie aanmaken
          </Link>
        </div>
      </div>
    );
  }

  const totalPlayers = players.length;
  const activePlayers = players.filter((p) => p.is_active).length;
  const elitePlayers = players.filter((p) => p.overall_rating >= 80).length;
  const avgRating = Math.round(players.reduce((a, p) => a + p.overall_rating, 0) / players.length);
  const trendingUp = players.filter((p) => p.trend === "up").length;
  const topPlayers = [...players].sort((a, b) => b.overall_rating - a.overall_rating).slice(0, 3);
  const progressData = buildProgressData(selectedPlayer?.evaluations ?? []);

  return (
    <div className="space-y-8">
      {/* Premium page header */}
      <div className="hub-page-header p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-lg"
              style={coachAvatar ? {} : { background: "linear-gradient(135deg, #E8F4FC, #BAD9F5)", color: "#0A2540", border: "2px solid rgba(79,169,230,0.25)" }}>
              {coachAvatar
                ? <Image src={coachAvatar} alt={coachName} width={56} height={56} className="object-cover w-full h-full" />
                : coachName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "C"
              }
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-hub-teal mb-0.5" style={{ fontFamily: "Outfit, sans-serif" }}>Performance Hub</p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
                {coachName ? `Hey, ${coachName.split(" ")[0]} 👋` : "Coach Dashboard"}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {[
                  { label: `${totalPlayers} spelers`, color: "#4FA9E6", bg: "#E8F4FC" },
                  { label: `${avgRating} gem. rating`, color: "#0A2540", bg: "#E8F4FC" },
                  { label: `${trendingUp} trending ↑`, color: "#059669", bg: "#d1fae5" },
                ].map(s => (
                  <span key={s.label} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link href="/dashboard/coach/evaluations/new" className="hidden sm:flex hub-btn-primary items-center gap-2 flex-shrink-0">
            <Plus size={15} /> Nieuwe evaluatie
          </Link>
        </div>
      </div>
      <div className="sm:hidden">
        <Link href="/dashboard/coach/evaluations/new" className="hub-btn-primary flex items-center justify-center gap-2 w-full">
          <Plus size={15} /> Nieuwe evaluatie
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Spelers", value: totalPlayers, icon: <Users size={18} />, color: "#4FA9E6", bg: "#E8F4FC", sub: `${activePlayers} actief` },
          { label: "Gem. rating", value: avgRating, icon: <Star size={18} />, color: "#d97706", bg: "#fef3c7", sub: "alle spelers" },
          { label: "Progressie", value: trendingUp, icon: <TrendingUp size={18} />, color: "#059669", bg: "#d1fae5", sub: "trending omhoog" },
          { label: "Elite (80+)", value: elitePlayers, icon: <Zap size={18} />, color: "#0A2540", bg: "#E8F4FC", sub: "topscore" },
        ].map((stat) => (
          <div key={stat.label} className="hub-card p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: stat.color }} />
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl" style={{ background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div className="text-4xl font-black tabular-nums leading-none mb-1" style={{ color: stat.color, fontFamily: "Outfit, sans-serif" }}>{stat.value}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: "Outfit, sans-serif" }}>{stat.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left — player list */}
        <div className="xl:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Jouw Spelers</h2>
            <Link href="/dashboard/coach/players" className="text-xs text-hub-teal hover:underline flex items-center gap-1">
              Alle spelers <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {players.slice(0, 6).map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                variant="mini"
                onClick={() => setSelectedPlayer(player)}
                selected={selectedPlayer?.id === player.id}
              />
            ))}
          </div>
        </div>

        {/* Right — selected player detail */}
        {selectedPlayer && (
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                {selectedPlayer.first_name} {selectedPlayer.last_name}
              </h2>
              <Link href={`/dashboard/coach/players/${selectedPlayer.id}`}
                className="text-xs text-hub-teal hover:underline flex items-center gap-1">
                Volledig profiel <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PlayerCard player={selectedPlayer} variant="compact" />
              <div className="hub-card p-5">
                <div className="hub-label mb-4">Rating Progressie</div>
                {progressData.length > 1 ? (
                  <ProgressLineChart data={progressData} height={160} />
                ) : (
                  <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
                    Nog niet genoeg data
                  </div>
                )}
              </div>
            </div>
            <div className="hub-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="hub-label">Recente Evaluaties</div>
                <Link href={`/dashboard/coach/evaluations/new?player=${selectedPlayer.id}`}
                  className="text-xs text-hub-teal hover:underline flex items-center gap-1">
                  <Plus size={12} /> Evalueren
                </Link>
              </div>
              <div className="space-y-2">
                {(selectedPlayer.evaluations ?? []).slice(0, 3).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-hub-surface border border-hub-border">
                    <div className="text-xs text-slate-600 w-20 flex-shrink-0">{formatDate(ev.evaluation_date)}</div>
                    <div className="flex-1 flex gap-2 flex-wrap">
                      {ev.scores?.map((s) => (
                        <span key={s.category} className="text-xs px-2 py-0.5 rounded-lg"
                          style={{
                            background: `${s.score >= 8 ? "#10B981" : s.score >= 6 ? "#4FA9E6" : "#ef4444"}18`,
                            color: s.score >= 8 ? "#10B981" : s.score >= 6 ? "#4FA9E6" : "#f87171",
                          }}>
                          {s.category.slice(0, 3).toUpperCase()} {s.score.toFixed(1)}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm font-bold tabular-nums"
                      style={{ color: getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40) }}>
                      {ev.overall_score?.toFixed(1)}
                    </div>
                  </div>
                ))}
                {!(selectedPlayer.evaluations?.length) && (
                  <div className="text-sm text-slate-600 py-4 text-center">
                    Nog geen evaluaties — <Link href={`/dashboard/coach/evaluations/new?player=${selectedPlayer.id}`} className="text-hub-teal hover:underline">evalueer nu</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top performers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Star size={16} className="text-amber-400" />
            Top Performers
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPlayers.map((player, i) => {
            const badge = player.badge ? BADGE_CONFIG[player.badge] : null;
            const rColor = getRatingColor(player.overall_rating);
            return (
              <Link key={player.id} href={`/dashboard/coach/players/${player.id}`}>
                <div className="hub-card p-5 hover:border-hub-border-light transition-all group">
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-slate-600 text-xs font-black">#{i + 1}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                      style={{ background: `${rColor}20`, color: rColor, border: `2px solid ${rColor}50` }}>
                      {player.first_name[0]}{player.last_name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-sm group-hover:text-hub-teal transition-colors">
                        {player.first_name} {player.last_name}
                      </div>
                      <div className="text-xs text-slate-600">{POSITION_LABELS[player.position]}</div>
                      {badge && (
                        <span className="hub-tag text-[10px] mt-1" style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black tabular-nums" style={{ color: rColor }}>
                      {player.overall_rating}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
