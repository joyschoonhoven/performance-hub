"use client";

import { MOCK_PLAYERS } from "@/lib/mock-data";
import { BADGE_CONFIG, POSITION_LABELS } from "@/lib/types";
import { getRatingColor, formatDate } from "@/lib/utils";
import { Shield, Users, ClipboardList, Brain, TrendingUp, Plus, Settings } from "lucide-react";

const DEMO_USERS = [
  { id: "u1", name: "Marco de Vries", email: "marco@schoonhoven.nl", role: "coach", players: 8, created: "2024-08-01" },
  { id: "u2", name: "Sarah Johnson", email: "sarah@schoonhoven.nl", role: "coach", players: 6, created: "2024-09-01" },
  { id: "u3", name: "Lars van der Berg", email: "lars@schoonhoven.nl", role: "player", players: 0, created: "2024-08-01" },
  { id: "u4", name: "Noah Fernandez", email: "noah@schoonhoven.nl", role: "player", players: 0, created: "2024-08-01" },
];

export default function AdminPage() {
  const totalEvals = MOCK_PLAYERS.reduce((a, p) => a + (p.evaluations?.length ?? 0), 0);
  const avgRating = Math.round(MOCK_PLAYERS.reduce((a, p) => a + p.overall_rating, 0) / MOCK_PLAYERS.length);

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

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Totaal spelers", value: MOCK_PLAYERS.length, icon: <Users size={20} />, color: "#00d4aa" },
          { label: "Coaches", value: DEMO_USERS.filter((u) => u.role === "coach").length, icon: <Shield size={20} />, color: "#6366f1" },
          { label: "Evaluaties", value: totalEvals, icon: <ClipboardList size={20} />, color: "#f59e0b" },
          { label: "Gem. rating", value: avgRating, icon: <TrendingUp size={20} />, color: "#22c55e" },
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
        {/* Users */}
        <div className="hub-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="hub-label">Gebruikers</div>
            <button className="hub-btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
              <Plus size={13} /> Toevoegen
            </button>
          </div>
          <div className="space-y-2">
            {DEMO_USERS.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-hub-surface transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold bg-hub-surface border border-hub-border text-slate-900">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-600">{u.email}</div>
                </div>
                <div className="text-right">
                  <span className={`hub-tag text-[10px] ${
                    u.role === "coach" ? "bg-hub-teal/10 text-hub-teal" :
                    u.role === "admin" ? "bg-amber-500/10 text-amber-400" :
                    "bg-indigo-500/10 text-indigo-400"
                  }`}>
                    {u.role}
                  </span>
                </div>
                <button className="text-slate-400 hover:text-slate-700 transition-colors">
                  <Settings size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Players overview */}
        <div className="hub-card p-5">
          <div className="hub-label mb-4">Spelers Overzicht</div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {MOCK_PLAYERS.map((p) => {
              const badge = p.badge ? BADGE_CONFIG[p.badge] : null;
              const rColor = getRatingColor(p.overall_rating);
              return (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-hub-surface transition-all">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${rColor}20`, color: rColor }}>
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-[10px] text-slate-600">{POSITION_LABELS[p.position]} · {p.team_name}</div>
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
        </div>
      </div>

      {/* System settings */}
      <div className="hub-card p-5">
        <div className="hub-label mb-4">Platform Instellingen</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "AI Engine", desc: "Claude API integratie", status: "Actief", color: "#00d4aa" },
            { label: "Supabase Auth", desc: "Database & RLS", status: "Configuratie nodig", color: "#f59e0b" },
            { label: "Email Notificaties", desc: "Evaluatie alerts", status: "Inactief", color: "#475569" },
            { label: "Export (PDF)", desc: "Player card exports", status: "Beta", color: "#6366f1" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 p-4 rounded-xl bg-hub-surface border border-hub-border">
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                <div className="text-xs text-slate-600">{s.desc}</div>
              </div>
              <span className="hub-tag text-xs" style={{ color: s.color, background: `${s.color}15` }}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
