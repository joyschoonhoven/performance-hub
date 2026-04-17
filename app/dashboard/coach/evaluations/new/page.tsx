"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAllPlayers } from "@/lib/supabase/queries";
import {
  EVALUATION_SCHEMA, POTENTIAL_LEVELS, OBSERVATION_CONTEXTS, ARCHETYPES, SOCIOTYPES, POSITION_LABELS,
  type EvaluationCategory, type ArchetypeType, type SociotypeName, type PositionType,
} from "@/lib/types";
import { getRatingColor } from "@/lib/utils";
import {
  ArrowLeft, Loader2, Sparkles, Save, CheckCircle2,
  ChevronDown, ChevronUp, Info,
} from "lucide-react";
import type { PlayerWithDetails } from "@/lib/types";

const inputStyle = { background: "#20243a", border: "1px solid #323754" };
const inputClass = "w-full rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all";

// ─── Score button grid (1–10) ─────────────────────────────────────────────────
function ScoreGrid({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
        const active = value === score;
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className="py-1.5 rounded-lg text-xs font-bold transition-all"
            style={active
              ? { background: color, color: "#fff" }
              : { background: "#20243a", color: "#475569", border: "1px solid #323754" }
            }
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────
function CategorySection({
  category, scores, onScore, isOpen, onToggle,
}: {
  category: typeof EVALUATION_SCHEMA[0];
  scores: Record<string, number>;
  onScore: (subId: string, val: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const avg = useMemo(() => {
    const vals = category.subcategories.map((s) => scores[s.id] ?? 7);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [category.subcategories, scores]);

  const scoreColor =
    avg >= 8.5 ? "#d97706" : avg >= 7 ? "#00b891" : avg >= 5 ? "#6366f1" : "#ef4444";

  return (
    <div className="hub-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-hub-surface transition-colors"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${category.color}18` }}
        >
          {category.icon}
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-900 text-base">{category.label}</div>
          <div className="text-xs text-slate-600 mt-0.5">
            {category.subcategories.length} criteria
          </div>
        </div>

        <div className="hidden sm:flex gap-1 items-end h-6">
          {category.subcategories.map((sub) => {
            const val = scores[sub.id] ?? 7;
            return (
              <div key={sub.id} className="w-1.5 rounded-t" style={{
                height: `${(val / 10) * 24}px`,
                background: `${category.color}60`,
              }} />
            );
          })}
        </div>

        <div className="text-right flex-shrink-0 mx-4">
          <div className="text-2xl font-black tabular-nums" style={{ color: scoreColor }}>
            {avg.toFixed(1)}
          </div>
          <div className="text-xs text-slate-600">gemiddeld</div>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-slate-600 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-600 flex-shrink-0" />}
      </button>

      {isOpen && (
        <div className="border-t border-hub-border divide-y divide-hub-border">
          {category.subcategories.map((sub) => {
            const val = scores[sub.id] ?? 7;
            const subColor =
              val >= 8.5 ? "#d97706" : val >= 7 ? "#00b891" : val >= 5 ? "#6366f1" : "#ef4444";
            return (
              <div key={sub.id} className="px-5 py-4">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-sm">{sub.label}</div>
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                      <Info size={10} />
                      {sub.description}
                    </div>
                  </div>
                  <div className="text-xl font-black tabular-nums flex-shrink-0" style={{ color: subColor }}>
                    {val.toFixed(0)}
                  </div>
                </div>
                <ScoreGrid value={val} onChange={(v) => onScore(sub.id, v)} color={category.color} />
                <div className="mt-2 h-1.5 rounded-full bg-hub-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${val * 10}%`, background: category.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function NewEvaluationPageInner() {
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get("player") ?? "";

  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState(preSelectedId);
  const [observationContext, setObservationContext] = useState("");
  const [opponent, setOpponent] = useState("");
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split("T")[0]);
  const [spelerType, setSpelerType] = useState("");
  const [positieBeschrijving, setPositieBeschrijving] = useState("");
  const [potentieel, setPotentieel] = useState("");
  const [sterkstePunten, setSterkstePunten] = useState("");
  const [verbeterpunten, setVerbeterpunten] = useState("");
  const [notes, setNotes] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<EvaluationCategory>>(
    new Set<EvaluationCategory>(["techniek"])
  );

  const [subScores, setSubScores] = useState<Record<string, Record<string, number>>>(() => {
    const init: Record<string, Record<string, number>> = {};
    EVALUATION_SCHEMA.forEach((cat) => {
      init[cat.id] = {};
      cat.subcategories.forEach((sub) => { init[cat.id][sub.id] = 7; });
    });
    return init;
  });

  const [assessedPosition, setAssessedPosition] = useState<PositionType | "">("");
  const [assessedArchetype, setAssessedArchetype] = useState<ArchetypeType | "">("");
  const [assessedSociotype, setAssessedSociotype] = useState<SociotypeName | "">("");

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    getAllPlayers().then((p) => {
      setPlayers(p);
      if (!preSelectedId && p.length > 0) setSelectedPlayerId(p[0].id);
      setPlayersLoading(false);
    });
  }, [preSelectedId]);

  function toggleCategory(catId: EvaluationCategory) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  function setSubScore(catId: string, subId: string, val: number) {
    setSubScores((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [subId]: val },
    }));
  }

  const categoryAverages = useMemo(() =>
    EVALUATION_SCHEMA.reduce((acc, cat) => {
      const vals = cat.subcategories.map((s) => subScores[cat.id]?.[s.id] ?? 7);
      acc[cat.id] = vals.reduce((a, b) => a + b, 0) / vals.length;
      return acc;
    }, {} as Record<string, number>),
  [subScores]);

  const overallAvg = useMemo(() => {
    const vals = Object.values(categoryAverages);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [categoryAverages]);

  const fifaRating = Math.round(40 + (overallAvg / 10) * 59);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  async function handleSave() {
    if (!selectedPlayerId) return;
    setLoading(true);
    setSaveError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    const coachName = profile?.full_name ?? "Coach";

    // Insert evaluation
    const { data: evalData, error: evalError } = await supabase.from("evaluations").insert({
      player_id: selectedPlayerId,
      coach_id: user.id,
      coach_name: coachName,
      evaluation_date: evaluationDate,
      overall_score: parseFloat(overallAvg.toFixed(2)),
      match_context: observationContext || null,
      opponent: opponent || null,
      notes: notes || null,
      potential_level: potentieel || null,
      strengths: sterkstePunten || null,
      improvement_points: verbeterpunten || null,
      player_type_description: spelerType || null,
      position_description: positieBeschrijving || null,
      assessed_position: assessedPosition || null,
      assessed_archetype: assessedArchetype || null,
      assessed_sociotype: assessedSociotype || null,
    }).select().single();

    if (evalError || !evalData) {
      setSaveError(evalError?.message ?? "Kon evaluatie niet opslaan");
      setLoading(false);
      return;
    }

    // Insert category scores
    const scoreInserts = EVALUATION_SCHEMA.map((cat) => ({
      evaluation_id: evalData.id,
      category: cat.id,
      score: parseFloat((categoryAverages[cat.id] ?? 7).toFixed(2)),
    }));

    await supabase.from("evaluation_scores").insert(scoreInserts);

    // Update player overall rating
    await supabase.from("players").update({ overall_rating: fifaRating }).eq("id", selectedPlayerId);

    setSaved(true);
    setLoading(false);
  }

  if (saved) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(0,184,145,0.12)", border: "1px solid rgba(0,184,145,0.2)" }}>
          <CheckCircle2 size={40} style={{ color: "#00b891" }} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Rapport opgeslagen!</h2>
          <p className="text-slate-600 mt-2 text-sm">
            Het scoutingsrapport voor {selectedPlayer?.first_name} is succesvol bewaard.
          </p>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <button onClick={() => { setSaved(false); setSaveError(""); }} className="hub-btn-ghost">
            Nieuw rapport
          </button>
          {selectedPlayer && (
            <Link href={`/dashboard/coach/players/${selectedPlayer.id}`} className="hub-btn-primary">
              Bekijk speler →
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/coach/players"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-hub-surface transition-all border border-hub-border">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Scoutingsrapport</h1>
          <p className="text-slate-600 text-sm mt-0.5">UEFA PRO niveau beoordeling — {EVALUATION_SCHEMA.reduce((a, c) => a + c.subcategories.length, 0)} criteria</p>
        </div>
      </div>

      {/* Identificatie */}
      <div className="hub-card p-6 space-y-5">
        <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Identificatie</h2>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Speler</label>
          {playersLoading ? (
            <div className="flex items-center gap-2 text-slate-600 text-sm py-3">
              <Loader2 size={14} className="animate-spin" /> Spelers laden...
            </div>
          ) : players.length === 0 ? (
            <div className="text-slate-600 text-sm py-3">
              Nog geen spelers aangemeld. Deel de registratielink zodat spelers zich kunnen aanmelden.
            </div>
          ) : (
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className={inputClass} style={inputStyle}
            >
              <option value="">— Kies een speler —</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.position}){p.team_name ? ` — ${p.team_name}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Datum observatie</label>
            <input
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Observatiecontext</label>
            <select value={observationContext} onChange={(e) => setObservationContext(e.target.value)} className={inputClass} style={inputStyle}>
              <option value="">— Kies context —</option>
              {OBSERVATION_CONTEXTS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Tegenstander / Training</label>
            <input
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="bv. Ajax U17, Trainingsgroep A"
              className={inputClass} style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Kwalitatieve inschatting */}
      <div className="hub-card p-6 space-y-5">
        <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Kwalitatieve Inschatting</h2>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
            Spelertype omschrijving
          </label>
          <textarea
            value={spelerType}
            onChange={(e) => setSpelerType(e.target.value)}
            placeholder="bv. Explosieve, technisch begaafde aanvaller die zijn beste werk doet in de diepte..."
            rows={3}
            className={`${inputClass} resize-none`} style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
            Positie & rol inschatting
          </label>
          <textarea
            value={positieBeschrijving}
            onChange={(e) => setPositieBeschrijving(e.target.value)}
            placeholder="bv. Primaire positie: LW in 4-3-3. Heeft vrijheid nodig om naar binnen te trekken."
            rows={3}
            className={`${inputClass} resize-none`} style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Potentieelinschatting</label>
          <select value={potentieel} onChange={(e) => setPotentieel(e.target.value)} className={inputClass} style={inputStyle}>
            <option value="">— Selecteer niveau —</option>
            {POTENTIAL_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Sterkste punten</label>
            <textarea
              value={sterkstePunten}
              onChange={(e) => setSterkstePunten(e.target.value)}
              placeholder="Topkwaliteiten en onderscheidende factoren..."
              rows={4}
              className={`${inputClass} resize-none`} style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Ontwikkelpunten</label>
            <textarea
              value={verbeterpunten}
              onChange={(e) => setVerbeterpunten(e.target.value)}
              placeholder="Aandachtspunten en groeimogelijkheden..."
              rows={4}
              className={`${inputClass} resize-none`} style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Spelertype inschatting */}
      <div className="hub-card p-6 space-y-5">
        <div>
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Spelertype Inschatting</h2>
          <p className="text-xs text-slate-600 mt-1">Over meerdere beoordelingen wordt het consensus-type automatisch bepaald.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Beste positie</label>
            <select
              value={assessedPosition}
              onChange={(e) => { setAssessedPosition(e.target.value as PositionType | ""); setAssessedArchetype(""); }}
              className={inputClass} style={inputStyle}
            >
              <option value="">— Kies positie —</option>
              {(Object.entries(POSITION_LABELS) as [PositionType, string][]).map(([pos, label]) => (
                <option key={pos} value={pos}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Speelstijl / Archetype</label>
            <select
              value={assessedArchetype}
              onChange={(e) => setAssessedArchetype(e.target.value as ArchetypeType | "")}
              className={inputClass} style={inputStyle}
              disabled={!assessedPosition}
            >
              <option value="">— Kies archetype —</option>
              {(Object.values(ARCHETYPES) as typeof ARCHETYPES[ArchetypeType][])
                .filter((a) => !assessedPosition || a.position.includes(assessedPosition as PositionType))
                .map((a) => (
                  <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
                ))}
            </select>
            {assessedArchetype && ARCHETYPES[assessedArchetype as ArchetypeType] && (
              <p className="text-xs text-slate-600 mt-1">
                {ARCHETYPES[assessedArchetype as ArchetypeType].description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Persoonlijkheidstype</label>
            <select
              value={assessedSociotype}
              onChange={(e) => setAssessedSociotype(e.target.value as SociotypeName | "")}
              className={inputClass} style={inputStyle}
            >
              <option value="">— Kies type —</option>
              {(Object.values(SOCIOTYPES) as typeof SOCIOTYPES[SociotypeName][]).map((s) => (
                <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
              ))}
            </select>
            {assessedSociotype && SOCIOTYPES[assessedSociotype as SociotypeName] && (
              <p className="text-xs text-slate-600 mt-1">
                {SOCIOTYPES[assessedSociotype as SociotypeName].description}
              </p>
            )}
          </div>
        </div>

        {(assessedArchetype || assessedSociotype) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {assessedArchetype && (() => {
              const a = ARCHETYPES[assessedArchetype as ArchetypeType];
              return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}40` }}>
                  {a.icon} {a.label}
                </span>
              );
            })()}
            {assessedSociotype && (() => {
              const s = SOCIOTYPES[assessedSociotype as SociotypeName];
              return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: `${s.color_hex}18`, color: s.color_hex, border: `1px solid ${s.color_hex}40` }}>
                  {s.icon} {s.label}
                </span>
              );
            })()}
          </div>
        )}
      </div>

      {/* Score categorieën */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="font-bold text-slate-900">Kwantitatieve Beoordeling</h2>
            <p className="text-sm text-slate-600 mt-0.5">Klik op een categorie om de subcriteria te beoordelen</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-600 mb-1">Overall gemiddeld</div>
            <div className="text-3xl font-black tabular-nums" style={{ color: getRatingColor(fifaRating) }}>
              {overallAvg.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="hub-card p-4">
          <div className="flex gap-3">
            {EVALUATION_SCHEMA.map((cat) => {
              const avg = categoryAverages[cat.id] ?? 7;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id as EvaluationCategory)}
                  className="flex-1 text-center p-2 rounded-xl transition-all hover:bg-hub-surface"
                  style={openCategories.has(cat.id as EvaluationCategory) ? {
                    background: `${cat.color}10`,
                    border: `1px solid ${cat.color}30`,
                  } : { border: "1px solid transparent" }}
                >
                  <div className="text-lg mb-1">{cat.icon}</div>
                  <div className="text-lg font-black tabular-nums" style={{ color: cat.color }}>
                    {avg.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                    {cat.label}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-hub-border flex items-center gap-3">
            <div className="text-xs text-slate-600 flex-shrink-0 w-28">Overall rating</div>
            <div className="flex-1 h-3 bg-hub-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((fifaRating - 40) / 59) * 100}%`,
                  background: `linear-gradient(90deg, #6366f1, #00b891)`,
                }}
              />
            </div>
            <div className="text-xl font-black tabular-nums flex-shrink-0 w-10"
              style={{ color: getRatingColor(fifaRating) }}>
              {fifaRating}
            </div>
          </div>
        </div>

        {EVALUATION_SCHEMA.map((cat) => (
          <CategorySection
            key={cat.id}
            category={cat}
            scores={subScores[cat.id] ?? {}}
            onScore={(subId, val) => setSubScore(cat.id, subId, val)}
            isOpen={openCategories.has(cat.id as EvaluationCategory)}
            onToggle={() => toggleCategory(cat.id as EvaluationCategory)}
          />
        ))}
      </div>

      {/* Afsluiting */}
      <div className="hub-card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Algemene Notitie</h2>
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Overige opmerkingen, context, bijzonderheden..."
            rows={4}
            className={`${inputClass} resize-none`} style={inputStyle}
          />
        </div>
      </div>

      {saveError && (
        <div className="rounded-xl px-4 py-3 text-red-400 text-sm"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {saveError}
        </div>
      )}

      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          className="hub-btn-outline flex items-center gap-2 disabled:opacity-40"
          disabled={!selectedPlayerId}
        >
          <Sparkles size={15} />
          AI Analyse
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedPlayerId || loading}
          className="hub-btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed flex-1 justify-center py-3"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Rapport opslaan
        </button>
      </div>
    </div>
  );
}

export default function NewEvaluationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-600">Laden...</div>}>
      <NewEvaluationPageInner />
    </Suspense>
  );
}
