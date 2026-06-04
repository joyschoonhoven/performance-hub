"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Shield, User, Trash2, RefreshCw, Loader2, CheckCircle2, AlertCircle, Search, Mail } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
  avatar_url: string | null;
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:  { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  coach:  { bg: "rgba(79,169,230,0.12)", color: "#4FA9E6" },
  player: { bg: "rgba(108,117,137,0.1)", color: "#6C7589" },
};

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at, avatar_url")
      .order("created_at", { ascending: false });
    setProfiles((data ?? []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeRole(id: string, newRole: string) {
    setSaving(id);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    if (error) {
      setFeedback({ id, msg: "Opslaan mislukt", ok: false });
    } else {
      setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, role: newRole } : p));
      setFeedback({ id, msg: "Rol bijgewerkt", ok: true });
    }
    setSaving(null);
    setTimeout(() => setFeedback(null), 2500);
  }

  async function sendPasswordReset(email: string, id: string) {
    setSaving(id);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setFeedback({ id, msg: "Reset e-mail verstuurd", ok: true });
    setSaving(null);
    setTimeout(() => setFeedback(null), 2500);
  }

  const filtered = profiles.filter((p) => {
    const matchRole = filterRole === "all" || p.role === filterRole;
    const matchSearch = !search
      || (p.full_name ?? "").toLowerCase().includes(search.toLowerCase())
      || (p.email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = {
    all: profiles.length,
    coach: profiles.filter((p) => p.role === "coach").length,
    player: profiles.filter((p) => p.role === "player").length,
    admin: profiles.filter((p) => p.role === "admin").length,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#001B48", fontFamily: "Outfit, sans-serif" }}>
            Gebruikersbeheer
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Rollen wijzigen, wachtwoord resets sturen en accounts beheren.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
          <RefreshCw size={14} /> Vernieuwen
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {(["all", "coach", "player", "admin"] as const).map((r) => (
          <button key={r} onClick={() => setFilterRole(r)}
            className="rounded-xl p-4 text-left transition-all border"
            style={filterRole === r
              ? { background: "rgba(79,169,230,0.08)", borderColor: "rgba(79,169,230,0.35)", color: "#0D1117" }
              : { background: "#ffffff", borderColor: "#e2e8f0", color: "#6C7589" }
            }>
            <div className="text-2xl font-black tabular-nums" style={{ fontFamily: "Oswald, sans-serif", color: filterRole === r ? "#001B48" : "#94a3b8" }}>
              {counts[r]}
            </div>
            <div className="text-xs font-semibold mt-1 capitalize">{r === "all" ? "Totaal" : r}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam of e-mail…"
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white border border-slate-200 focus:outline-none focus:border-[#4FA9E6] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="hub-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#4FA9E6]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            Geen gebruikers gevonden.
          </div>
        ) : (
          <div className="divide-y divide-hub-border">
            {/* Table head */}
            <div className="grid grid-cols-[1fr_180px_120px_120px] gap-4 px-5 py-3"
              style={{ background: "#f8fafc" }}>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gebruiker</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lid sinds</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rol</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acties</span>
            </div>

            {filtered.map((p) => {
              const rc = ROLE_COLORS[p.role ?? "player"] ?? ROLE_COLORS.player;
              const initials = (p.full_name ?? p.email ?? "?").charAt(0).toUpperCase();
              const isSaving = saving === p.id;
              const fb = feedback?.id === p.id ? feedback : null;
              return (
                <div key={p.id}
                  className="grid grid-cols-[1fr_180px_120px_120px] gap-4 px-5 py-4 items-center hover:bg-hub-surface transition-all">
                  {/* User info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "rgba(79,169,230,0.1)", color: "#4FA9E6", border: "1px solid rgba(79,169,230,0.2)" }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{p.full_name ?? "—"}</div>
                      <div className="text-xs text-slate-400 truncate">{p.email}</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-slate-500">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </div>

                  {/* Role selector */}
                  <div>
                    <select
                      value={p.role ?? "player"}
                      onChange={(e) => changeRole(p.id, e.target.value)}
                      disabled={isSaving}
                      className="w-full rounded-lg px-2 py-1.5 text-xs font-semibold border outline-none cursor-pointer transition-all"
                      style={{ background: rc.bg, color: rc.color, borderColor: rc.color + "40" }}
                    >
                      <option value="player">player</option>
                      <option value="coach">coach</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin text-[#4FA9E6]" />
                    ) : fb ? (
                      <span className={`text-xs flex items-center gap-1 ${fb.ok ? "text-emerald-500" : "text-red-500"}`}>
                        {fb.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        {fb.msg}
                      </span>
                    ) : (
                      <>
                        {p.email && (
                          <button
                            onClick={() => sendPasswordReset(p.email!, p.id)}
                            title="Stuur wachtwoord-reset e-mail"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#4FA9E6] hover:bg-[#4FA9E6]/10 transition-all"
                          >
                            <Mail size={14} />
                          </button>
                        )}
                      </>
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
        Rolwijzigingen zijn direct van kracht. De gebruiker ziet het bij de volgende login.
      </p>
    </div>
  );
}
