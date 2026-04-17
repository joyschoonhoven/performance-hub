"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPlayers } from "@/lib/supabase/queries";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import { formatDate, getRatingColor } from "@/lib/utils";
import { Plus, Calendar, ClipboardList, Loader2 } from "lucide-react";
import type { PlayerWithDetails } from "@/lib/types";

export default function EvaluationsPage() {
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPlayers().then((p) => { setPlayers(p); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  const allEvals = players.flatMap((p) =>
    (p.evaluations ?? []).map((ev) => ({ ...ev, player: p }))
  ).sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Evaluaties</h1>
          <p className="text-slate-400 text-sm mt-1">{allEvals.length} evaluaties in totaal</p>
        </div>
        <Link href="/dashboard/coach/evaluations/new" className="hub-btn-primary flex items-center gap-2">
          <Plus size={16} /> Nieuwe evaluatie
        </Link>
      </div>

      {allEvals.length === 0 ? (
        <div className="hub-card p-12 text-center">
          <ClipboardList size={40} className="text-slate-700 mx-auto mb-3" />
          <div className="text-white font-bold mb-2">Nog geen evaluaties</div>
          <p className="text-slate-500 text-sm mb-4">
            {players.length === 0
              ? "Evalueer een speler nadat ze zich hebben aangemeld."
              : "Maak je eerste evaluatie aan voor een van je spelers."}
          </p>
          <Link href="/dashboard/coach/evaluations/new" className="hub-btn-primary inline-flex items-center gap-2 text-sm">
            <Plus size={14} /> Eerste evaluatie
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {allEvals.map((ev) => {
            const rColor = getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40);
            return (
              <div key={ev.id} className="hub-card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: `${rColor}20`, color: rColor }}>
                    {ev.player.first_name[0]}{ev.player.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/dashboard/coach/players/${ev.player.id}`}
                        className="font-bold text-white text-sm hover:text-hub-teal transition-colors">
                        {ev.player.first_name} {ev.player.last_name}
                      </Link>
                      <span className="text-xs text-slate-500">{ev.player.position}</span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={11} />
                        {formatDate(ev.evaluation_date)}
                      </div>
                    </div>
                    {ev.scores && ev.scores.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ev.scores.map((s) => {
                          const sc = s.score >= 8 ? "#00d4aa" : s.score >= 6 ? "#6366f1" : "#ef4444";
                          return (
                            <span key={s.category} className="hub-tag text-[10px]"
                              style={{ background: `${sc}18`, color: sc }}>
                              {CATEGORY_ICONS[s.category as keyof typeof CATEGORY_ICONS]} {s.score.toFixed(1)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {ev.notes && <p className="text-xs text-slate-500 italic mt-2">&ldquo;{ev.notes}&rdquo;</p>}
                  </div>
                  <div className="text-xl font-black tabular-nums" style={{ color: rColor }}>
                    {ev.overall_score?.toFixed(1)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
