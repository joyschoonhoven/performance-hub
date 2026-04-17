"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ARCHETYPES, SOCIOTYPES } from "@/lib/types";
import { analyzePlayerLocal } from "@/lib/ai-engine";
import { getRatingColor } from "@/lib/utils";
import { getAllPlayers } from "@/lib/supabase/queries";
import { Sparkles, Brain, Loader2, ArrowRight, ChevronRight } from "lucide-react";
import type { AIAnalysisOutput, PlayerWithDetails } from "@/lib/types";

export default function AIScoutingPage() {
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisOutput | null>(null);
  const [useClaudeAPI, setUseClaudeAPI] = useState(false);

  useEffect(() => {
    getAllPlayers().then(setPlayers);
  }, []);

  const selectedPlayer = players.find((p) => p.id === selectedId);

  async function runAnalysis() {
    if (!selectedPlayer) return;
    setLoading(true);
    setResult(null);

    if (useClaudeAPI) {
      try {
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player: selectedPlayer,
            evaluations: selectedPlayer.evaluations ?? [],
            coach_notes: selectedPlayer.identity?.coach_notes,
          }),
        });
        const data = await res.json();
        setResult(data);
      } catch {
        // Fallback to local
        const local = analyzePlayerLocal({
          player: selectedPlayer,
          evaluations: selectedPlayer.evaluations ?? [],
          coach_notes: selectedPlayer.identity?.coach_notes,
        });
        setResult(local);
      }
    } else {
      await new Promise((r) => setTimeout(r, 1200)); // simulate processing
      const local = analyzePlayerLocal({
        player: selectedPlayer,
        evaluations: selectedPlayer.evaluations ?? [],
        coach_notes: selectedPlayer.identity?.coach_notes,
      });
      setResult(local);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-hub-teal/15">
            <Brain size={22} className="text-hub-teal" />
          </div>
          AI Scouting Engine
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Analyseer spelers automatisch op archetype, sociotype en kernwaarden
        </p>
      </div>

      {/* Config card */}
      <div className="hub-card p-5 space-y-4">
        <div className="hub-label">Analyse Configuratie</div>
        <div>
          <label className="block text-xs text-slate-600 mb-2">Selecteer speler</label>
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}
            className="w-full bg-hub-surface border border-hub-border rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-hub-teal transition-all"
          >
            <option value="">-- Kies een speler --</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} — {p.position} ({p.evaluations?.length ?? 0} evaluaties)
              </option>
            ))}
          </select>
        </div>

        {/* Engine toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-hub-surface border border-hub-border">
          <div>
            <div className="text-sm font-semibold text-slate-900">Claude AI Engine</div>
            <div className="text-xs text-slate-600">Geavanceerdere analyse via Claude API</div>
          </div>
          <button
            onClick={() => setUseClaudeAPI(!useClaudeAPI)}
            className={`relative w-11 h-6 rounded-full transition-all ${useClaudeAPI ? "bg-hub-teal" : "bg-hub-border"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useClaudeAPI ? "left-6" : "left-1"}`} />
          </button>
        </div>

        <button
          onClick={runAnalysis}
          disabled={!selectedId || loading}
          className="hub-btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Analyseren...</>
          ) : (
            <><Sparkles size={16} /> Starten Analyse</>
          )}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="hub-card p-8 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-hub-teal/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-hub-teal animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🧬</div>
          </div>
          <div className="text-slate-900 font-semibold">AI analyseert speler...</div>
          <div className="text-xs text-slate-600 space-y-1">
            <div>Evaluaties verwerken</div>
            <div>Archetype bepalen</div>
            <div>Kernwaarden berekenen</div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && selectedPlayer && !loading && (
        <div className="space-y-4">
          {/* Summary banner */}
          <div className="hub-card p-6 border-hub-teal/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hub-teal to-indigo-500" />
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-hub-teal/15 flex-shrink-0">
                <Sparkles size={20} className="text-hub-teal" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-black text-slate-900">
                    {selectedPlayer.first_name} {selectedPlayer.last_name}
                  </span>
                  <span className="hub-tag text-xs bg-hub-teal/15 text-hub-teal font-bold">
                    Fit Score: {result.fit_score}/100
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
                {result.reasoning && (
                  <p className="text-xs text-slate-600 mt-2 italic">{result.reasoning}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Archetypes */}
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Archetype Analyse</div>
              <div className="space-y-3">
                {[
                  { arch: result.archetype, label: "Primair" },
                  ...(result.secondary_archetype ? [{ arch: result.secondary_archetype, label: "Secundair" }] : []),
                ].map(({ arch, label }) => {
                  const meta = ARCHETYPES[arch];
                  return meta ? (
                    <div key={arch} className="flex items-start gap-3 p-3 rounded-xl bg-hub-surface border border-hub-border">
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{meta.label}</span>
                          <span className="hub-tag text-[9px] bg-hub-border text-slate-600">{label}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{meta.description}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Sociotypes */}
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Sociotype Analyse</div>
              <div className="space-y-3">
                {[
                  { socio: result.primary_sociotype, label: "Primair" },
                  ...(result.secondary_sociotype ? [{ socio: result.secondary_sociotype, label: "Secundair" }] : []),
                ].map(({ socio, label }) => {
                  const meta = SOCIOTYPES[socio];
                  return meta ? (
                    <div key={socio} className="flex items-start gap-3 p-3 rounded-xl bg-hub-surface border border-hub-border">
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{meta.label}</span>
                          <span className="hub-tag text-[9px] bg-hub-border text-slate-600">{label}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{meta.description}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Core values */}
            <div className="hub-card p-5 md:col-span-2">
              <div className="hub-label mb-4">Kernwaarden Scores</div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: "noodzaak", label: "Noodzaak", value: result.core_values.noodzaak, color: "#ef4444", icon: "💪" },
                  { key: "creativiteit", label: "Creativiteit", value: result.core_values.creativiteit, color: "#a855f7", icon: "🎨" },
                  { key: "vertrouwen", label: "Vertrouwen", value: result.core_values.vertrouwen, color: "#00d4aa", icon: "🔥" },
                ].map((kv) => (
                  <div key={kv.key} className="p-4 rounded-xl bg-hub-surface border border-hub-border text-center">
                    <div className="text-2xl mb-2">{kv.icon}</div>
                    <div className="hub-label mb-2">{kv.label}</div>
                    <div className="text-3xl font-black tabular-nums" style={{ color: kv.color }}>{kv.value}</div>
                    <div className="h-1.5 bg-hub-border rounded-full mt-3 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${kv.value}%`, backgroundColor: kv.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link href={`/dashboard/coach/players/${selectedPlayer.id}`}
            className="hub-btn-primary flex items-center justify-center gap-2 w-full py-3">
            Speler profiel bekijken <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Quick-scan all players */}
      {!result && !loading && (
        <div className="hub-card p-5">
          <div className="hub-label mb-4">Alle Spelers Overzicht</div>
          <div className="space-y-2">
            {players.map((p) => {
              const aiScore = p.identity?.ai_fit_score ?? 0;
              const archLabel = p.identity?.primary_archetype?.replace(/_/g, " ") ?? "—";
              return (
                <div key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-hub-surface transition-all cursor-pointer"
                  onClick={() => { setSelectedId(p.id); setResult(null); }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: `${getRatingColor(p.overall_rating)}20`, color: getRatingColor(p.overall_rating) }}>
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{p.first_name} {p.last_name}</div>
                    <div className="text-xs text-slate-600">{archLabel}</div>
                  </div>
                  {aiScore > 0 && (
                    <div className="text-sm font-bold" style={{ color: getRatingColor(aiScore) }}>{aiScore}</div>
                  )}
                  <ChevronRight size={14} className="text-slate-600" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
