"use client";

import { useState, useEffect } from "react";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Trophy, Plus, CheckCircle2, Clock, Zap, Target, Loader2, X, Calendar, ChevronDown } from "lucide-react";
import type { ChallengeStatus, PlayerWithDetails } from "@/lib/types";
import { getAllPlayers, getChallengeTemplates, assignChallengeToPlayer, updateChallengeProgress } from "@/lib/supabase/queries";
import type { ChallengeTemplate } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";

type TabType = "overzicht" | "templates";

export default function CoachChallengesPage() {
  const [tab, setTab] = useState<TabType>("overzicht");
  const [filter, setFilter] = useState<ChallengeStatus | "all">("all");
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [templates, setTemplates] = useState<ChallengeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null); // templateId being assigned
  const [assignModal, setAssignModal] = useState<{ template: ChallengeTemplate } | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    Promise.all([getAllPlayers(), getChallengeTemplates()]).then(([p, t]) => {
      setPlayers(p);
      setTemplates(t);
      setLoading(false);
    });
  }, []);

  // Flatten all challenges across players
  const allChallenges = players.flatMap((p) =>
    (p.challenges ?? []).map((ch) => ({ ...ch, player: p }))
  );
  const filtered = filter === "all" ? allChallenges : allChallenges.filter((c) => c.status === filter);

  const stats = {
    completed: allChallenges.filter((c) => c.status === "completed").length,
    in_progress: allChallenges.filter((c) => c.status === "in_progress").length,
    open: allChallenges.filter((c) => c.status === "open").length,
  };

  async function handleAssign() {
    if (!assignModal || !selectedPlayerId) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();

    const result = await assignChallengeToPlayer(
      assignModal.template.id,
      selectedPlayerId,
      user!.id,
      profile?.full_name ?? "Coach",
      deadline || new Date(Date.now() + assignModal.template.duration_weeks * 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
    );

    setSaving(false);
    if (result.error) {
      alert(result.error);
    } else {
      setAssignModal(null);
      setSuccessMsg("Challenge toegewezen!");
      setTimeout(() => setSuccessMsg(""), 3000);
      // Reload players data
      getAllPlayers().then(setPlayers);
    }
  }

  const categoryColor = (cat: string) => CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? "#64748b";

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Trophy size={24} className="text-amber-400" />
            Team Challenges
          </h1>
          <p className="text-slate-600 text-sm mt-1">Trainingsdoelen beheren en toewijzen</p>
        </div>
        <button
          onClick={() => setTab("templates")}
          className="hub-btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Challenge toewijzen
        </button>
      </div>

      {successMsg && (
        <div className="rounded-xl px-4 py-3 text-hub-teal text-sm flex items-center gap-2"
          style={{ background: "rgba(0,184,145,0.1)", border: "1px solid rgba(0,184,145,0.2)" }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="hub-card p-5 text-center">
          <CheckCircle2 size={20} className="text-hub-teal mx-auto mb-2" />
          <div className="text-3xl font-black text-hub-teal">{stats.completed}</div>
          <div className="hub-label mt-1">Voltooid</div>
        </div>
        <div className="hub-card p-5 text-center">
          <Zap size={20} className="text-amber-400 mx-auto mb-2" />
          <div className="text-3xl font-black text-amber-400">{stats.in_progress}</div>
          <div className="hub-label mt-1">Bezig</div>
        </div>
        <div className="hub-card p-5 text-center">
          <Clock size={20} className="text-slate-600 mx-auto mb-2" />
          <div className="text-3xl font-black text-slate-600">{stats.open}</div>
          <div className="hub-label mt-1">Open</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit bg-slate-100 border border-slate-200">
        {(["overzicht", "templates"] as TabType[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize"
            style={tab === t ? { background: "#4f46e5", color: "#fff", boxShadow: "0 2px 8px rgba(79,70,229,0.25)" } : { color: "#64748b" }}>
            {t === "overzicht" ? "Overzicht" : "Maandelijkse Challenges"}
          </button>
        ))}
      </div>

      {/* TAB: Overzicht */}
      {tab === "overzicht" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(["all", "open", "in_progress", "completed"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === s ? "bg-hub-teal text-slate-900" : "bg-hub-surface text-slate-600 border border-hub-border hover:text-slate-900"
                }`}>
                {s === "all" ? `Alle (${allChallenges.length})` :
                 s === "open" ? `Open (${stats.open})` :
                 s === "in_progress" ? `Bezig (${stats.in_progress})` :
                 `Voltooid (${stats.completed})`}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((ch) => {
              const statusConfig = {
                open: { color: "#475569", label: "Open" },
                in_progress: { color: "#f59e0b", label: "Bezig" },
                completed: { color: "#00d4aa", label: "Voltooid" },
                expired: { color: "#ef4444", label: "Verlopen" },
              }[ch.status];

              return (
                <div key={ch.id} className="hub-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(79,169,230,0.12)", color: "#4FA9E6" }}>
                      {ch.player.first_name[0]}{ch.player.last_name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{ch.title}</span>
                        <span className="hub-tag text-[10px]" style={{ color: statusConfig.color, background: `${statusConfig.color}15` }}>
                          {statusConfig.label}
                        </span>
                        {ch.category && (
                          <span className="hub-tag text-[10px]" style={{ color: categoryColor(ch.category), background: `${categoryColor(ch.category)}15` }}>
                            {CATEGORY_LABELS[ch.category as keyof typeof CATEGORY_LABELS]}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        {ch.player.first_name} {ch.player.last_name}
                        {ch.player.team_name ? ` · ${ch.player.team_name}` : ""}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-hub-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${ch.progress}%`, backgroundColor: statusConfig.color }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums" style={{ color: statusConfig.color }}>{ch.progress}%</span>
                      </div>
                    </div>
                    {ch.deadline && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 flex-shrink-0">
                        <Target size={11} />
                        {formatDate(ch.deadline)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="hub-card p-12 text-center">
                <Trophy size={40} className="text-slate-700 mx-auto mb-3" />
                <div className="text-slate-600 mb-4">Geen challenges gevonden</div>
                <button onClick={() => setTab("templates")} className="hub-btn-outline">
                  Challenge toewijzen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Templates */}
      {tab === "templates" && (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Kies een maandelijkse challenge en wijs die toe aan een speler.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => {
              const color = categoryColor(t.category ?? "");
              return (
                <div key={t.id} className="hub-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-xs font-semibold mb-1" style={{ color: "#475569" }}>{t.month_label}</div>
                      <div className="font-bold text-slate-900 text-sm">{t.title}</div>
                    </div>
                    {t.category && (
                      <span className="hub-tag text-[10px] ml-3 flex-shrink-0" style={{ color, background: `${color}15` }}>
                        {CATEGORY_LABELS[t.category as keyof typeof CATEGORY_LABELS]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">{t.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Calendar size={11} /> {t.duration_weeks} weken
                    </span>
                    <button
                      onClick={() => {
                        setAssignModal({ template: t });
                        setSelectedPlayerId(players[0]?.id ?? "");
                        setDeadline("");
                      }}
                      disabled={!players.length}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                      style={{ background: "rgba(79,169,230,0.12)", color: "#4FA9E6", border: "1px solid rgba(0,184,145,0.2)" }}
                    >
                      Toewijzen aan speler
                    </button>
                  </div>
                </div>
              );
            })}
            {templates.length === 0 && (
              <div className="hub-card p-8 text-center col-span-2">
                <div className="text-slate-600 text-sm">
                  Geen templates gevonden. Voer eerst het schema-update.sql bestand uit in Supabase.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAssignModal(null)} />
          <div className="relative rounded-2xl p-6 w-full max-w-md space-y-4 bg-white"
            style={{ border: "1px solid #e2e8f0", boxShadow: "0 20px 60px rgba(15,23,42,0.2)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Challenge toewijzen</h3>
              <button onClick={() => setAssignModal(null)} className="text-slate-600 hover:text-slate-900 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
              <div className="text-xs text-slate-600 mb-1">{assignModal.template.month_label}</div>
              <div className="font-semibold text-slate-900 text-sm">{assignModal.template.title}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                Speler *
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none"
                style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                Deadline (optioneel)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none"
                style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
              />
              <p className="text-xs text-slate-600 mt-1">
                Standaard: {assignModal.template.duration_weeks} weken vanaf vandaag
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAssignModal(null)}
                className="flex-1 hub-btn-ghost py-3 text-sm">
                Annuleren
              </button>
              <button
                onClick={handleAssign}
                disabled={saving || !selectedPlayerId}
                className="flex-1 font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                style={{ background: "#4FA9E6", color: "#fff" }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Toewijzen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
