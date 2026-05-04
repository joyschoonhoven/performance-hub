import { createClient } from "@/lib/supabase/server";
import { BADGE_CONFIG, POSITION_LABELS } from "@/lib/types";
import { getRatingColor } from "@/lib/utils";
import { Shield, Users, ClipboardList, TrendingUp, Plus, Settings, CheckCircle2, AlertCircle, Clock, FlaskConical } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();

  const [
    { count: playerCount },
    { data: profiles },
    { count: evalCount },
    { data: players },
  ] = await Promise.all([
    supabase.from("players").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("id, full_name, email, role, created_at, avatar_url"),
    supabase.from("evaluations").select("*", { count: "exact", head: true }),
    supabase.from("players").select("id, first_name, last_name, position, team_name, overall_rating, badge, profile_id").eq("is_active", true).order("overall_rating", { ascending: false }).limit(20),
  ]);

  const allProfiles = profiles ?? [];
  const allPlayers = players ?? [];
  const coachCount = allProfiles.filter((p) => p.role === "coach").length;
  const avgRating = allPlayers.length
    ? Math.round(allPlayers.reduce((a, p) => a + (p.overall_rating ?? 70), 0) / allPlayers.length)
    : 0;

  const statusItems = [
    { label: "AI Engine", desc: "Claude API integratie", status: "Actief", icon: <CheckCircle2 size={14} />, color: "#4FA9E6" },
    { label: "Supabase Auth", desc: "Database & authenticatie", status: "Actief", icon: <CheckCircle2 size={14} />, color: "#4FA9E6" },
    { label: "Email Notificaties", desc: "Evaluatie alerts via SMTP", status: "Inactief", icon: <Clock size={14} />, color: "#94a3b8" },
    { label: "PDF Export", desc: "Player card exports", status: "Beta", icon: <FlaskConical size={14} />, color: "#4FA9E6" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Shield size={24} className="text-amber-400" />
            Admin Panel
          </h1>
          <p className="text-slate-600 text-sm mt-1">Schoonhoven Sports Performance Hub beheer</p>
        </div>
      </div>

      {/* Platform stats — live data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Actieve spelers", value: playerCount ?? 0, icon: <Users size={20} />, color: "#4FA9E6" },
          { label: "Coaches", value: coachCount, icon: <Shield size={20} />, color: "#4FA9E6" },
          { label: "Evaluaties", value: evalCount ?? 0, icon: <ClipboardList size={20} />, color: "#f59e0b" },
          { label: "Gem. rating", value: avgRating || "—", icon: <TrendingUp size={20} />, color: "#F97316" },
        ].map((s) => (
          <div key={s.label} className="hub-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl" style={{ background: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tabular-nums">{s.value}</div>
            <div className="hub-label mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users — live */}
        <div className="hub-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="hub-label">Gebruikers ({allProfiles.length})</div>
            <button className="hub-btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
              <Plus size={13} /> Uitnodigen
            </button>
          </div>
          {allProfiles.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">Nog geen gebruikers</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {allProfiles.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-hub-surface transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold bg-hub-surface border border-hub-border text-slate-900 flex-shrink-0">
                    {(u.full_name ?? u.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{u.full_name ?? "—"}</div>
                    <div className="text-xs text-slate-600 truncate">{u.email}</div>
                  </div>
                  <span className={`hub-tag text-[10px] flex-shrink-0 ${
                    u.role === "coach" ? "bg-hub-teal/10 text-hub-teal" :
                    u.role === "admin" ? "bg-amber-500/10 text-amber-400" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {u.role ?? "player"}
                  </span>
                  <button className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
                    <Settings size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Players overview — live */}
        <div className="hub-card p-5">
          <div className="hub-label mb-4">Spelers Overzicht ({allPlayers.length})</div>
          {allPlayers.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">Nog geen spelers geregistreerd</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {allPlayers.map((p) => {
                const badge = p.badge ? BADGE_CONFIG[p.badge as keyof typeof BADGE_CONFIG] : null;
                const rColor = getRatingColor(p.overall_rating ?? 70);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-hub-surface transition-all">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${rColor}20`, color: rColor }}>
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        {POSITION_LABELS[p.position as keyof typeof POSITION_LABELS] ?? p.position} · {p.team_name}
                      </div>
                    </div>
                    {badge && (
                      <span className="hub-tag text-[9px]" style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    )}
                    <div className="text-sm font-black tabular-nums flex-shrink-0" style={{ color: rColor }}>
                      {p.overall_rating}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System settings */}
      <div className="hub-card p-5">
        <div className="hub-label mb-4">Platform Status</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {statusItems.map((s) => (
            <div key={s.label} className="flex items-center gap-3 p-4 rounded-xl bg-hub-surface border border-hub-border">
              <div className="flex-shrink-0" style={{ color: s.color }}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                <div className="text-xs text-slate-600">{s.desc}</div>
              </div>
              <span className="hub-tag text-xs flex-shrink-0" style={{ color: s.color, background: `${s.color}15` }}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
          <AlertCircle size={11} />
          Email notificaties vereisen SMTP-configuratie in omgevingsvariabelen.
        </p>
      </div>
    </div>
  );
}
