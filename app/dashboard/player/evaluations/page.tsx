"use client";

import { useState, useEffect } from "react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import { formatDate, getRatingColor, getScoreColor } from "@/lib/utils";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { ClipboardList, Loader2 } from "lucide-react";
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

export default function PlayerEvaluationsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <ClipboardList size={24} className="text-indigo-400" />
          Mijn Evaluaties
        </h1>
        <p className="text-slate-600 text-sm mt-1">{evaluations.length} evaluaties van jouw coach</p>
      </div>

      {progressData.length > 1 && (
        <div className="hub-card p-5">
          <div className="hub-label mb-4">Progressie Overzicht</div>
          <ProgressLineChart data={progressData} showCategories height={200} />
        </div>
      )}

      <div className="space-y-4">
        {evaluations.map((ev, i) => {
          const rColor = getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40);
          const isLatest = i === 0;
          return (
            <div key={ev.id} className={`hub-card p-5 ${isLatest ? "border-hub-teal/30" : ""}`}>
              {isLatest && (
                <div className="hub-tag text-[10px] bg-hub-teal/10 text-hub-teal mb-3">Meest Recent</div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-900">{formatDate(ev.evaluation_date)}</div>
                <div className="text-2xl font-black tabular-nums" style={{ color: rColor }}>
                  {ev.overall_score?.toFixed(1)}<span className="text-sm text-slate-600 font-normal">/10</span>
                </div>
              </div>
              {ev.scores && ev.scores.length > 0 && (
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {ev.scores.map((s) => {
                    const sc = getScoreColor(s.score);
                    return (
                      <div key={s.category} className="p-3 rounded-xl bg-hub-surface border border-hub-border text-center">
                        <div className="text-[10px] font-bold text-slate-600 mb-1">{CATEGORY_ICONS[s.category as keyof typeof CATEGORY_ICONS]}</div>
                        <div className="text-[10px] hub-label">{CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}</div>
                        <div className="text-base font-black tabular-nums mt-1" style={{ color: sc }}>{s.score.toFixed(1)}</div>
                        <div className="h-1 bg-hub-border rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.score * 10}%`, backgroundColor: sc }} />
                        </div>
                      </div>
                    );
                  })}
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
        {evaluations.length === 0 && (
          <div className="hub-card p-12 text-center">
            <ClipboardList size={40} className="text-slate-700 mx-auto mb-3" />
            <div className="text-slate-600">Nog geen evaluaties van je coach</div>
          </div>
        )}
      </div>
    </div>
  );
}
