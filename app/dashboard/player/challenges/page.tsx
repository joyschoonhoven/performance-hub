"use client";

import { useState, useEffect } from "react";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Trophy, CheckCircle2, Clock, Target, Zap, Loader2 } from "lucide-react";
import type { ChallengeStatus, Challenge } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const STATUS_CONFIG: Record<ChallengeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "#475569", icon: <Clock size={12} /> },
  in_progress: { label: "Bezig", color: "#f59e0b", icon: <Zap size={12} /> },
  completed: { label: "Voltooid", color: "#00d4aa", icon: <CheckCircle2 size={12} /> },
  expired: { label: "Verlopen", color: "#ef4444", icon: <Target size={12} /> },
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChallengeStatus | "all">("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get player record for this user
      const { data: player } = await supabase
        .from("players")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!player) { setLoading(false); return; }

      const { data } = await supabase
        .from("challenges")
        .select("*")
        .eq("player_id", player.id)
        .order("created_at", { ascending: false });

      setChallenges((data ?? []) as Challenge[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all" ? challenges : challenges.filter((c) => c.status === filter);
  const stats = {
    total: challenges.length,
    completed: challenges.filter((c) => c.status === "completed").length,
    in_progress: challenges.filter((c) => c.status === "in_progress").length,
    open: challenges.filter((c) => c.status === "open").length,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Trophy size={24} className="text-amber-400" />
          Mijn Challenges
        </h1>
        <p className="text-slate-600 text-sm mt-1">Jouw persoonlijke trainingsdoelen</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="hub-card p-4 text-center">
          <div className="text-3xl font-black text-hub-teal">{stats.completed}</div>
          <div className="hub-label mt-1">Voltooid</div>
        </div>
        <div className="hub-card p-4 text-center">
          <div className="text-3xl font-black text-amber-400">{stats.in_progress}</div>
          <div className="hub-label mt-1">Bezig</div>
        </div>
        <div className="hub-card p-4 text-center">
          <div className="text-3xl font-black text-slate-600">{stats.open}</div>
          <div className="hub-label mt-1">Open</div>
        </div>
      </div>

      {stats.total > 0 && (
        <div className="hub-card p-5">
          <div className="hub-label mb-3">Totale Voortgang</div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-hub-border rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-hub-teal transition-all duration-700"
                  style={{ width: `${(stats.completed / Math.max(stats.total, 1)) * 100}%` }} />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
              {stats.completed}/{stats.total}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "in_progress", "completed"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === s ? "bg-hub-teal text-slate-900" : "bg-hub-surface text-slate-600 border border-hub-border hover:text-slate-900"
            }`}>
            {s === "all" ? "Alle" : STATUS_CONFIG[s as ChallengeStatus].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((ch) => {
          const cfg = STATUS_CONFIG[ch.status];
          const catColor = ch.category ? CATEGORY_COLORS[ch.category as keyof typeof CATEGORY_COLORS] : "#64748b";
          return (
            <div key={ch.id} className={`hub-card p-5 ${ch.status === "completed" ? "opacity-75" : ""}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div className="hub-tag text-[10px]" style={{ color: cfg.color, background: `${cfg.color}15` }}>
                      {cfg.icon} {cfg.label}
                    </div>
                    {ch.category && (
                      <span className="hub-tag text-[10px]" style={{ color: catColor, background: `${catColor}15` }}>
                        {CATEGORY_LABELS[ch.category as keyof typeof CATEGORY_LABELS]}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{ch.title}</h3>
                  {ch.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ch.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {ch.status === "completed" ? (
                    <CheckCircle2 size={24} className="text-hub-teal" />
                  ) : (
                    <div className="text-2xl font-black tabular-nums" style={{ color: cfg.color }}>
                      {ch.progress}%
                    </div>
                  )}
                </div>
              </div>
              {ch.status !== "completed" && (
                <div className="h-2.5 bg-hub-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${ch.progress}%`, backgroundColor: cfg.color }} />
                </div>
              )}
              {ch.deadline && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-600">
                  <Target size={11} />
                  Deadline: {formatDate(ch.deadline)}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="hub-card p-12 text-center col-span-2">
            <Trophy size={40} className="text-slate-700 mx-auto mb-3" />
            <div className="text-slate-600">
              {challenges.length === 0
                ? "Je coach heeft nog geen challenges aangemaakt voor jou."
                : "Geen challenges in deze categorie."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
