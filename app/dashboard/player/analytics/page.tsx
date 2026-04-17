"use client";

import { useState, useEffect } from "react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { CATEGORY_LABELS } from "@/lib/types";
import { getRatingColor, getScoreColor } from "@/lib/utils";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { BarChart3, TrendingUp, Loader2 } from "lucide-react";
import type { Evaluation, PlayerWithDetails } from "@/lib/types";

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

export default function PlayerAnalyticsPage() {
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

  const evaluations = player?.evaluations ?? [];
  const progressData = buildProgressData(evaluations);

  const latestEval = evaluations[0];
  const radarData = latestEval?.scores?.map((s) => ({
    subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS],
    value: s.score,
    fullMark: 10,
  })) ?? [];

  const rColor = getRatingColor(player?.overall_rating ?? 65);
  const first = progressData[0]?.overall ?? 0;
  const last = progressData[progressData.length - 1]?.overall ?? 0;
  const change = last - first;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <BarChart3 size={24} className="text-indigo-400" />
          Mijn Progressie
        </h1>
        <p className="text-slate-600 text-sm mt-1">Jouw ontwikkeling over tijd</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="hub-card p-4 text-center">
          <div className="hub-label mb-2">Huidige Rating</div>
          <div className="text-3xl font-black tabular-nums" style={{ color: rColor }}>
            {player?.overall_rating ?? "—"}
          </div>
        </div>
        <div className="hub-card p-4 text-center">
          <div className="hub-label mb-2">Evaluaties</div>
          <div className="text-3xl font-black text-slate-900">{evaluations.length}</div>
        </div>
        <div className="hub-card p-4 text-center">
          <div className="hub-label mb-2">Totale Groei</div>
          <div className={`text-3xl font-black tabular-nums ${change > 0 ? "text-hub-teal" : change < 0 ? "text-red-400" : "text-slate-900"}`}>
            {evaluations.length > 1 ? `${change > 0 ? "+" : ""}${change.toFixed(1)}` : "—"}
          </div>
        </div>
      </div>

      <div className="hub-card p-5">
        <div className="hub-label mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-hub-teal" />
          Rating Verloop
        </div>
        {progressData.length > 1 ? (
          <ProgressLineChart data={progressData} showCategories height={220} />
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
            Meer evaluaties nodig voor trends
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hub-card p-5">
          <div className="hub-label mb-4">Performance Radar</div>
          {radarData.length > 0 ? (
            <PlayerRadarChart data={radarData} color={rColor} size={240} />
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
              Nog geen evaluatiedata
            </div>
          )}
        </div>

        <div className="hub-card p-5">
          <div className="hub-label mb-4">Categorie Breakdown</div>
          {player?.recent_scores ? (
            <div className="space-y-4">
              {Object.entries(player.recent_scores).map(([cat, score]) => {
                const sc = getScoreColor(score);
                const label = CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS];
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-300 font-medium">{label}</span>
                      <span className="text-sm font-black tabular-nums" style={{ color: sc }}>{score.toFixed(1)}</span>
                    </div>
                    <div className="h-2.5 bg-hub-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score * 10}%`, backgroundColor: sc }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
              Nog geen score data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
