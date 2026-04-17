"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { POSITION_LABELS } from "@/lib/types";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

const POSITIONS = Object.entries(POSITION_LABELS) as [string, string][];

export default function PlayerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    position: "ST",
    jersey_number: "",
    team_name: "",
    nationality: "",
    date_of_birth: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: player } = await supabase
        .from("players")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (player) {
        setPlayerId(player.id);
        setForm({
          first_name: player.first_name ?? "",
          last_name: player.last_name ?? "",
          position: player.position ?? "ST",
          jersey_number: player.jersey_number?.toString() ?? "",
          team_name: player.team_name ?? "",
          nationality: player.nationality ?? "",
          date_of_birth: player.date_of_birth ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!playerId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("players").update({
      first_name: form.first_name,
      last_name: form.last_name,
      position: form.position,
      jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
      team_name: form.team_name || null,
      nationality: form.nationality || null,
      date_of_birth: form.date_of_birth || null,
    }).eq("id", playerId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-black text-white">Instellingen</h1>
        <p className="text-slate-400 text-sm mt-1">Jouw spelersprofiel bewerken</p>
      </div>

      <div className="hub-card p-6 space-y-4">
        <div className="hub-label mb-2">Persoonlijke gegevens</div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Voornaam</label>
            <input
              className="w-full bg-hub-surface border border-hub-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-hub-teal/50 transition-colors"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="Voornaam"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Achternaam</label>
            <input
              className="w-full bg-hub-surface border border-hub-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-hub-teal/50 transition-colors"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              placeholder="Achternaam"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium">Positie</label>
          <select
            className="w-full bg-hub-surface border border-hub-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-hub-teal/50 transition-colors"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
          >
            {POSITIONS.map(([key, label]) => (
              <option key={key} value={key}>{label} ({key})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Rugnummer</label>
            <input
              className="w-full bg-hub-surface border border-hub-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-hub-teal/50 transition-colors"
              value={form.jersey_number}
              onChange={(e) => setForm({ ...form, jersey_number: e.target.value })}
              placeholder="bijv. 9"
              type="number"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Team</label>
            <input
              className="w-full bg-hub-surface border border-hub-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-hub-teal/50 transition-colors"
              value={form.team_name}
              onChange={(e) => setForm({ ...form, team_name: e.target.value })}
              placeholder="bijv. U17 A"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Nationaliteit</label>
            <input
              className="w-full bg-hub-surface border border-hub-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-hub-teal/50 transition-colors"
              value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })}
              placeholder="bijv. Nederlands"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Geboortedatum</label>
            <input
              className="w-full bg-hub-surface border border-hub-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-hub-teal/50 transition-colors"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              type="date"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{ background: saved ? "rgba(0,212,170,0.15)" : "rgba(0,212,170,0.1)", color: saved ? "#00d4aa" : "#00d4aa", border: "1px solid rgba(0,212,170,0.3)" }}
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Opslaan...</>
          ) : saved ? (
            <><CheckCircle2 size={15} /> Opgeslagen!</>
          ) : (
            <><Save size={15} /> Opslaan</>
          )}
        </button>
      </div>
    </div>
  );
}
