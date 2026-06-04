"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Target, Users, Link2, Link2Off, Loader2, CheckCircle2, AlertCircle, Search, RefreshCw } from "lucide-react";
import { POSITION_LABELS } from "@/lib/types";
import type { PositionType } from "@/lib/types";

interface CoachProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  position: PositionType | null;
  team_name: string | null;
  profile_id: string | null;
  coach_id: string | null;
}

export default function AdminAssignmentsPage() {
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filterCoach, setFilterCoach] = useState<string>("all");

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [coachRes, playerRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").eq("role", "coach").order("full_name"),
      supabase.from("players").select("id, first_name, last_name, position, team_name, profile_id, coach_id").eq("is_active", true).order("last_name"),
    ]);
    setCoaches((coachRes.data ?? []) as CoachProfile[]);
    setPlayers((playerRes.data ?? []) as PlayerRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function assignCoach(playerId: string, coachId: string | null) {
    setSaving(playerId);
    const supabase = createClient();
    const { error } = await supabase
      .from("players")
      .update({ coach_id: coachId })
      .eq("id", playerId);
    if (error) {
      setFeedback({ id: playerId, ok: false, msg: "Opslaan mislukt" });
    } else {
      setPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, coach_id: coachId } : p));
      setFeedback({ id: playerId, ok: true, msg: coachId ? "Gekoppeld" : "Ontkoppeld" });
    }
    setSaving(null);
    setTimeout(() => setFeedback(null), 2500);
  }

  const filtered = players.filter((p) => {
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || (p.team_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCoach = filterCoach === "all" || (filterCoach === "none" ? !p.coach_id : p.coach_id === filterCoach);
    return matchSearch && matchCoach;
  });

  const unlinked = players.filter((p) => !p.coach_id).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#001B48", fontFamily: "Outfit, sans-serif" }}>
            Koppelingen
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Koppel spelers aan coaches. Een speler kan maar aan één coach gekoppeld zijn.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
          <RefreshCw size={14} /> Vernieuwen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Totaal spelers", value: players.length, color: "#4FA9E6" },
          { label: "Gekoppeld", value: players.length - unlinked, color: "#10b981" },
          { label: "Niet gekoppeld", value: unlinked, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="hub-card p-4">
            <div className="text-2xl font-black tabular-nums" style={{ fontFamily: "Oswald, sans-serif", color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek speler of team…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white border border-slate-200 focus:outline-none focus:border-[#4FA9E6] transition-colors"
          />
        </div>
        <select
          value={filterCoach}
          onChange={(e) => setFilterCoach(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm bg-white border border-slate-200 focus:outline-none focus:border-[#4FA9E6] text-slate-700"
        >
          <option value="all">Alle coaches</option>
          <option value="none">Niet gekoppeld</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name ?? c.email}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="hub-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#4FA9E6]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            Geen spelers gevonden.
          </div>
        ) : (
          <div className="divide-y divide-hub-border">
            <div className="grid grid-cols-[1fr_140px_200px_80px] gap-4 px-5 py-3" style={{ background: "#f8fafc" }}>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Speler</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coach</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
            </div>

            {filtered.map((p) => {
              const isSaving = saving === p.id;
              const fb = feedback?.id === p.id ? feedback : null;
              const assignedCoach = coaches.find((c) => c.id === p.coach_id);
              const initials = `${(p.first_name ?? "?")[0]}${(p.last_name ?? "?")[0]}`.toUpperCase();

              return (
                <div key={p.id}
                  className="grid grid-cols-[1fr_140px_200px_80px] gap-4 px-5 py-3.5 items-center hover:bg-hub-surface transition-all">
                  {/* Player */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(79,169,230,0.1)", color: "#4FA9E6" }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {p.position ? (POSITION_LABELS[p.position] ?? p.position) : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="text-xs text-slate-500 truncate">{p.team_name ?? "—"}</div>

                  {/* Coach selector */}
                  <select
                    value={p.coach_id ?? ""}
                    onChange={(e) => assignCoach(p.id, e.target.value || null)}
                    disabled={isSaving}
                    className="w-full rounded-lg px-2 py-1.5 text-xs border outline-none cursor-pointer transition-all"
                    style={{ background: p.coach_id ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)", borderColor: p.coach_id ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)", color: "#334155" }}
                  >
                    <option value="">— Niet gekoppeld —</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name ?? c.email}</option>
                    ))}
                  </select>

                  {/* Status */}
                  <div className="flex items-center justify-center">
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin text-[#4FA9E6]" />
                    ) : fb ? (
                      <span className={`text-xs ${fb.ok ? "text-emerald-500" : "text-red-500"}`}>
                        {fb.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      </span>
                    ) : p.coach_id ? (
                      <Link2 size={14} className="text-emerald-500" />
                    ) : (
                      <Link2Off size={14} className="text-amber-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 flex items-center gap-1.5">
        <AlertCircle size={11} />
        Koppelingen zijn direct actief. De coach ziet de speler bij de volgende refresh.
      </p>
    </div>
  );
}
