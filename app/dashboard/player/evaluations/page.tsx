"use client";

import { useState, useEffect } from "react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { CATEGORY_LABELS, EVALUATION_SCHEMA } from "@/lib/types";
import { formatDate, getRatingColor, getScoreColor } from "@/lib/utils";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { ClipboardList, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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

function parseSubScores(subNotes?: string): Record<string, number> | null {
  if (!subNotes) return null;
  try { return JSON.parse(subNotes); } catch { return null; }
}

function SubCriteriaBreakdown({
  categoryId,
  subNotes,
  fallbackScore,
}: {
  categoryId: string;
  subNotes?: string;
  fallbackScore: number;
}) {
  const schema = EVALUATION_SCHEMA.find((c) => c.id === categoryId);
  if (!schema) return null;

  const subScores = parseSubScores(subNotes);
  const hasReal = !!subScores && Object.keys(subScores).length > 0;

  return (
    <div className="mt-3 pt-3 border-t border-hub-border space-y-2.5">
      {!hasReal && (
        <p className="text-[10px] text-slate-400 italic mb-1">
          Gemiddelde score getoond — individuele subcriteria beschikbaar in nieuwe evaluaties
        </p>
      )}
      {schema.subcategories.map((sub) => {
        const val = hasReal ? (subScores![sub.id] ?? fallbackScore) : fallbackScore;
        const sc = getScoreColor(val);
        return (
          <div key={sub.id} className="flex items-center gap-3">
            <div className="w-36 text-[11px] text-slate-600 font-medium leading-tight flex-shrink-0">
              {sub.label}
            </div>
            <div className="flex-1 h-1.5 bg-hub-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${val * 10}%`, backgroundColor: hasReal ? sc : `${sc}60` }}
              />
            </div>
            <div
              className="text-xs font-bold w-6 text-right tabular-nums flex-shrink-0"
              style={{ color: hasReal ? sc : `${sc}80` }}
            >
              {hasReal ? val : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EvaluationCard({ ev, isLatest }: { ev: Evaluation; isLatest: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const rColor = getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40);

  return (
    <div className={`hub-card p-5 ${isLatest ? "border-hub-teal/30" : ""}`}>
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
        <div className="space-y-2">
          {ev.scores.map((s) => {
            const sc = getScoreColor(s.score);
            const isOpen = expanded === s.category;
            const subNotes = (s as { sub_notes?: string }).sub_notes;
            const hasRealSub = !!parseSubScores(subNotes);
            const schema = EVALUATION_SCHEMA.find((c) => c.id === s.category);

            return (
              <div
                key={s.category}
                className="rounded-xl border transition-all overflow-hidden"
                style={{
                  borderColor: isOpen ? `${sc}40` : "#e2e8f0",
                  background: isOpen ? `${sc}05` : "#f8fafc",
                }}
              >
                {/* Category header row — always clickable */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : s.category)}
                >
                  {/* Icon */}
                  <span className="text-base flex-shrink-0">{schema?.icon ?? "⚽"}</span>

                  {/* Label */}
                  <span className="flex-1 text-sm font-semibold text-slate-700">
                    {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                  </span>

                  {/* Score pill */}
                  <span
                    className="text-sm font-black tabular-nums px-2.5 py-0.5 rounded-full"
                    style={{ background: `${sc}15`, color: sc }}
                  >
                    {s.score.toFixed(1)}
                  </span>

                  {/* Bar */}
                  <div className="hidden sm:block w-20 h-1.5 bg-hub-border rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${s.score * 10}%`, backgroundColor: sc }} />
                  </div>

                  {/* Sub-score indicator */}
                  {hasRealSub && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${sc}15`, color: sc }}>
                      DETAIL
                    </span>
                  )}

                  {/* Chevron */}
                  <span className="flex-shrink-0 text-slate-400">
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>

                {/* Expanded sub-criteria */}
                {isOpen && (
                  <div className="px-4 pb-4">
                    <SubCriteriaBreakdown
                      categoryId={s.category}
                      subNotes={subNotes}
                      fallbackScore={s.score}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ev.notes && (
        <div className="p-3 rounded-xl bg-hub-surface border border-hub-border text-xs text-slate-600 italic mt-3">
          &ldquo;{ev.notes}&rdquo;
        </div>
      )}
    </div>
  );
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
          <ClipboardList size={24} className="text-hub-teal" />
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
        {evaluations.map((ev, i) => (
          <EvaluationCard key={ev.id} ev={ev} isLatest={i === 0} />
        ))}
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
