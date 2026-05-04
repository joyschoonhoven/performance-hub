"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculatePlayerIndex, getIndexLabel } from "@/lib/match-stats";
import { POSITION_LABELS } from "@/lib/types";
import type { PositionType } from "@/lib/types";
import { ArrowLeft, Save, Activity, Target, Shield, Footprints, User } from "lucide-react";

const POSITIONS: PositionType[] = ["GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST","SS"];
const COMPETITIONS = ["Competitie","KNVB U17","Cup","Vriendschappelijk","Toernooi"];

interface FormData {
  player_name: string;
  position: PositionType;
  match_date: string;
  opponent: string;
  competition: string;
  home_away: "home" | "away";
  result: string;
  minutes_played: number;
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  passes: number;
  pass_accuracy: number;
  key_passes: number;
  dribbles_attempted: number;
  dribbles_completed: number;
  duels_won: number;
  duels_total: number;
  aerial_duels_won: number;
  aerial_duels_total: number;
  tackles: number;
  interceptions: number;
  yellow_cards: number;
  red_cards: number;
  fouls_committed: number;
  match_rating: number;
  notes: string;
}

const DEFAULTS: FormData = {
  player_name: "", position: "ST", match_date: new Date().toISOString().split("T")[0],
  opponent: "", competition: "Competitie", home_away: "home", result: "",
  minutes_played: 90, goals: 0, assists: 0, shots: 0, shots_on_target: 0,
  passes: 30, pass_accuracy: 75, key_passes: 0, dribbles_attempted: 0,
  dribbles_completed: 0, duels_won: 0, duels_total: 0, aerial_duels_won: 0,
  aerial_duels_total: 0, tackles: 0, interceptions: 0, yellow_cards: 0,
  red_cards: 0, fouls_committed: 0, match_rating: 7.0, notes: "",
};

function NumberField({
  label, value, onChange, min = 0, max = 999, step = 1, unit = "", hint = "",
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; unit?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label} {unit && <span className="text-slate-400 normal-case font-normal">({unit})</span>}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 font-bold transition-colors flex-shrink-0"
          style={{ background: "rgba(15,40,70,0.06)" }}
        >−</button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full text-center text-base font-black tabular-nums border rounded-xl py-2 outline-none focus:ring-2 focus:ring-[#4FA9E6]/40"
          style={{
            borderColor: "rgba(15,40,70,0.1)",
            color: "#0A2540",
            fontFamily: "Outfit, sans-serif",
          }}
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 font-bold transition-colors flex-shrink-0"
          style={{ background: "rgba(15,40,70,0.06)" }}
        >+</button>
      </div>
      {hint && <div className="text-[10px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

export default function NewMatchPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof FormData, value: FormData[keyof FormData]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Live index preview
  const liveIndex = calculatePlayerIndex({
    ...form,
    id: "preview", player_id: "", player_name: form.player_name,
    coach_id: "", match_date: form.match_date, opponent: form.opponent,
    competition: form.competition, home_away: form.home_away,
    result: form.result, fouls_committed: form.fouls_committed,
  });
  const { label: idxLabel, color: idxColor } = getIndexLabel(liveIndex);

  function handleSave() {
    // In production: POST to API route / Supabase
    setSaved(true);
    setTimeout(() => router.push("/dashboard/coach/matches"), 1200);
  }

  const sectionClass = "hub-card p-5 space-y-4";
  const sectionHeader = "flex items-center gap-2 mb-4 pb-3 border-b border-hub-border";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/coach/matches"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "rgba(15,40,70,0.05)" }}
        >
          <ArrowLeft size={16} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
            Wedstrijd Loggen
          </h1>
          <p className="text-slate-500 text-xs">Vul de statistieken in — de Performance Index wordt live berekend</p>
        </div>

        {/* Live index preview */}
        <div className="ml-auto flex flex-col items-center px-4 py-2 rounded-2xl"
          style={{ background: `${idxColor}12`, border: `1px solid ${idxColor}30` }}>
          <div className="text-3xl font-black tabular-nums leading-none"
            style={{ color: idxColor, fontFamily: "Outfit, sans-serif" }}>
            {liveIndex}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
            style={{ color: idxColor }}>
            {idxLabel}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">INDEX</div>
        </div>
      </div>

      {/* Player + Match info */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <User size={15} className="text-hub-teal" />
          <span className="text-sm font-bold text-slate-900">Speler & Wedstrijd</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Spelernaam
            </label>
            <input
              type="text"
              value={form.player_name}
              onChange={(e) => set("player_name", e.target.value)}
              placeholder="Lars van der Berg"
              className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
              style={{ borderColor: "rgba(15,40,70,0.1)", fontFamily: "Outfit, sans-serif" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Positie
            </label>
            <select
              value={form.position}
              onChange={(e) => set("position", e.target.value as PositionType)}
              className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
              style={{ borderColor: "rgba(15,40,70,0.1)", fontFamily: "Outfit, sans-serif" }}
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p} · {POSITION_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Datum</label>
            <input
              type="date"
              value={form.match_date}
              onChange={(e) => set("match_date", e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
              style={{ borderColor: "rgba(15,40,70,0.1)" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Tegenstander</label>
            <input
              type="text"
              value={form.opponent}
              onChange={(e) => set("opponent", e.target.value)}
              placeholder="Ajax U17"
              className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
              style={{ borderColor: "rgba(15,40,70,0.1)" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Competitie</label>
            <select
              value={form.competition}
              onChange={(e) => set("competition", e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
              style={{ borderColor: "rgba(15,40,70,0.1)" }}
            >
              {COMPETITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Uitslag</label>
            <input
              type="text"
              value={form.result}
              onChange={(e) => set("result", e.target.value)}
              placeholder="2-1"
              className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
              style={{ borderColor: "rgba(15,40,70,0.1)" }}
            />
          </div>
        </div>

        {/* Thuis / Uit */}
        <div className="flex gap-2">
          {(["home", "away"] as const).map((ha) => (
            <button
              key={ha}
              type="button"
              onClick={() => set("home_away", ha)}
              className="flex-1 py-2 text-sm font-semibold rounded-xl border transition-all"
              style={form.home_away === ha
                ? { background: "#4FA9E6", color: "white", borderColor: "#4FA9E6" }
                : { background: "transparent", color: "#64748b", borderColor: "rgba(15,40,70,0.1)" }}
            >
              {ha === "home" ? "Thuiswedstrijd" : "Uitwedstrijd"}
            </button>
          ))}
        </div>
      </div>

      {/* Aanval */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <Target size={15} className="text-hub-teal" />
          <span className="text-sm font-bold text-slate-900">Aanval</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <NumberField label="Minuten" value={form.minutes_played} onChange={(v) => set("minutes_played", v)} max={120} />
          <NumberField label="Doelpunten" value={form.goals} onChange={(v) => set("goals", v)} />
          <NumberField label="Assists" value={form.assists} onChange={(v) => set("assists", v)} />
          <NumberField label="Schoten" value={form.shots} onChange={(v) => set("shots", v)} />
          <NumberField label="Schoten op doel" value={form.shots_on_target} onChange={(v) => set("shots_on_target", v)} />
          <NumberField label="Rating" value={form.match_rating} onChange={(v) => set("match_rating", v)} min={1} max={10} step={0.5} hint="1.0 – 10.0" />
        </div>
      </div>

      {/* Passing */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <Footprints size={15} className="text-hub-teal" />
          <span className="text-sm font-bold text-slate-900">Passing</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <NumberField label="Totaal passes" value={form.passes} onChange={(v) => set("passes", v)} />
          <NumberField label="Pass nauwkeurigheid" value={form.pass_accuracy} onChange={(v) => set("pass_accuracy", v)} max={100} unit="%" hint="0 – 100%" />
          <NumberField label="Key passes" value={form.key_passes} onChange={(v) => set("key_passes", v)} hint="Directe kans creaties" />
          <NumberField label="Dribbels geprobeerd" value={form.dribbles_attempted} onChange={(v) => set("dribbles_attempted", v)} />
          <NumberField label="Dribbels gelukt" value={form.dribbles_completed} onChange={(v) => set("dribbles_completed", v)} />
        </div>
      </div>

      {/* Defensief */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <Shield size={15} className="text-hub-teal" />
          <span className="text-sm font-bold text-slate-900">Defensief</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <NumberField label="Duels gewonnen" value={form.duels_won} onChange={(v) => set("duels_won", v)} />
          <NumberField label="Duels totaal" value={form.duels_total} onChange={(v) => set("duels_total", v)} />
          <NumberField label="Kopduels gewonnen" value={form.aerial_duels_won} onChange={(v) => set("aerial_duels_won", v)} />
          <NumberField label="Kopduels totaal" value={form.aerial_duels_total} onChange={(v) => set("aerial_duels_total", v)} />
          <NumberField label="Tackles" value={form.tackles} onChange={(v) => set("tackles", v)} />
          <NumberField label="Intercepties" value={form.interceptions} onChange={(v) => set("interceptions", v)} />
          <NumberField label="Gele kaarten" value={form.yellow_cards} onChange={(v) => set("yellow_cards", v)} max={2} />
          <NumberField label="Rode kaarten" value={form.red_cards} onChange={(v) => set("red_cards", v)} max={1} />
          <NumberField label="Overtredingen" value={form.fouls_committed} onChange={(v) => set("fouls_committed", v)} />
        </div>
      </div>

      {/* Notes */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <Activity size={15} className="text-hub-teal" />
          <span className="text-sm font-bold text-slate-900">Coach notitie</span>
        </div>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Observaties, sterke punten, verbeterpunten..."
          className="w-full px-3 py-2.5 text-sm border rounded-xl outline-none resize-none"
          style={{ borderColor: "rgba(15,40,70,0.1)", fontFamily: "Outfit, sans-serif" }}
        />
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pb-8">
        <Link href="/dashboard/coach/matches" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          Annuleren
        </Link>
        <button
          onClick={handleSave}
          disabled={saved}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{ background: saved ? "#4FA9E6" : "#4FA9E6", color: "white" }}
        >
          <Save size={15} />
          {saved ? "Opgeslagen! ✓" : `Opslaan · Index: ${liveIndex}`}
        </button>
      </div>
    </div>
  );
}
