"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAllPlayers } from "@/lib/supabase/queries";
import { getRatingColor } from "@/lib/utils";
import { POSITION_LABELS, BADGE_CONFIG } from "@/lib/types";
import type { PlayerWithDetails } from "@/lib/types";
import {
  Mail, Phone, Award, Users, ClipboardList, TrendingUp,
  Star, Edit3, ChevronRight, Target, Shield, Trophy,
  Save, X, Loader2, BookOpen,
} from "lucide-react";

interface CoachProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  bio?: string;
  club?: string;
  coaching_license?: string;
  location?: string;
}

export default function CoachProfilePage() {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Editable fields
  const [editPhone, setEditPhone] = useState("");
  const [editClub, setEditClub] = useState("");
  const [editLicense, setEditLicense] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, bio, club, coaching_license, location")
        .eq("id", user.id)
        .single();

      if (prof) {
        setProfile(prof as CoachProfile);
        setEditPhone(prof.phone ?? "");
        setEditClub(prof.club ?? "");
        setEditLicense(prof.coaching_license ?? "");
        setEditBio(prof.bio ?? "");
        setEditLocation(prof.location ?? "");
      }

      const p = await getAllPlayers();
      setPlayers(p);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      phone: editPhone,
      club: editClub,
      coaching_license: editLicense,
      bio: editBio,
      location: editLocation,
    }).eq("id", profile.id);

    setProfile({ ...profile, phone: editPhone, club: editClub, coaching_license: editLicense, bio: editBio, location: editLocation });
    setSaving(false);
    setEditMode(false);
    setSaveMsg("Profiel opgeslagen");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  if (!profile) return null;

  const initials = profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const totalEvals = players.reduce((a, p) => a + (p.evaluations?.length ?? 0), 0);
  const totalChallenges = players.reduce((a, p) => a + (p.challenges?.length ?? 0), 0);
  const avgRating = players.length ? Math.round(players.reduce((a, p) => a + p.overall_rating, 0) / players.length) : 0;
  const elitePlayers = players.filter((p) => p.overall_rating >= 80).length;
  const topPlayer = [...players].sort((a, b) => b.overall_rating - a.overall_rating)[0];

  const inputStyle = { background: "#20243a", border: "1px solid #323754" };
  const inputClass = "w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Mijn Profiel</h1>
          <p className="text-slate-500 text-sm mt-1">Jouw coachprofiel & statistieken</p>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && (
            <span className="text-xs text-hub-teal font-medium">{saveMsg}</span>
          )}
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} className="hub-btn-ghost flex items-center gap-2">
                <X size={15} /> Annuleren
              </button>
              <button onClick={handleSave} disabled={saving}
                className="hub-btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Opslaan
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="hub-btn-ghost flex items-center gap-2">
              <Edit3 size={15} /> Bewerken
            </button>
          )}
        </div>
      </div>

      {/* Profile card */}
      <div className="hub-card p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black relative"
              style={{
                background: "linear-gradient(135deg, rgba(0,184,145,0.15), rgba(99,102,241,0.15))",
                border: "2px solid rgba(0,184,145,0.3)",
                color: "#00b891",
              }}>
              {initials}
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: "#00b891" }}>
                <Shield size={14} color="white" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h2 className="text-2xl font-black text-white">{profile.full_name}</h2>
              <span className="hub-tag text-xs" style={{ background: "rgba(0,184,145,0.1)", color: "#00b891" }}>Coach</span>
              {profile.coaching_license && (
                <span className="hub-tag text-xs" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                  <Award size={10} /> {profile.coaching_license}
                </span>
              )}
            </div>
            {profile.club && <p className="text-slate-400 text-sm mb-3">{profile.club}</p>}

            {editMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Club</label>
                  <input value={editClub} onChange={(e) => setEditClub(e.target.value)}
                    placeholder="Schoonhoven FC" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Telefoon</label>
                  <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+31 6 12345678" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Licentie</label>
                  <input value={editLicense} onChange={(e) => setEditLicense(e.target.value)}
                    placeholder="UEFA B, KNVB Trainer 2..." className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Locatie</label>
                  <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Schoonhoven, Nederland" className={inputClass} style={inputStyle} />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2"><Mail size={14} /> {profile.email}</div>
                {profile.phone && <div className="flex items-center gap-2"><Phone size={14} /> {profile.phone}</div>}
                {profile.location && <div className="flex items-center gap-2">{profile.location}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-5 pt-5 border-t border-hub-border">
          <div className="hub-label mb-2">Over mij</div>
          {editMode ? (
            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)}
              rows={4} placeholder="Beschrijf je achtergrond, aanpak en coaching filosofie..."
              className={`${inputClass} resize-none w-full`} style={inputStyle} />
          ) : profile.bio ? (
            <p className="text-slate-300 text-sm leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-slate-600 text-sm italic">
              Nog geen bio ingevuld.{" "}
              <button onClick={() => setEditMode(true)} className="text-hub-teal hover:underline">
                Voeg er een toe
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Spelers", value: players.length, icon: <Users size={16} />, color: "#00b891" },
          { label: "Evaluaties", value: totalEvals, icon: <ClipboardList size={16} />, color: "#6366f1" },
          { label: "Challenges", value: totalChallenges, icon: <Target size={16} />, color: "#d97706" },
          { label: "Gem. rating", value: avgRating || "—", icon: <Star size={16} />, color: "#f59e0b" },
          { label: "Elite (80+)", value: elitePlayers, icon: <Trophy size={16} />, color: "#a855f7" },
        ].map((s) => (
          <div key={s.label} className="hub-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: player list */}
        <div className="lg:col-span-2 space-y-5">
          <div className="hub-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="hub-label">Mijn Spelers</div>
              <Link href="/dashboard/coach/players" className="text-xs text-hub-teal hover:underline">
                Alle spelers →
              </Link>
            </div>
            {players.length > 0 ? (
              <div className="space-y-2">
                {players.slice(0, 6).map((p) => {
                  const rColor = getRatingColor(p.overall_rating);
                  return (
                    <Link key={p.id} href={`/dashboard/coach/players/${p.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-hub-surface transition-colors group border border-transparent hover:border-hub-border">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `${rColor}20`, color: rColor }}>
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm group-hover:text-hub-teal transition-colors truncate">
                            {p.first_name} {p.last_name}
                          </div>
                          <div className="text-xs text-slate-500">{POSITION_LABELS[p.position]}</div>
                        </div>
                        <div className="font-black tabular-nums text-lg" style={{ color: rColor }}>{p.overall_rating}</div>
                        <ChevronRight size={14} className="text-slate-600" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-600 text-sm py-4 text-center">
                Nog geen spelers. Zodra spelers zich registreren verschijnen ze hier.
              </p>
            )}
          </div>
        </div>

        {/* Right: top player + quick links */}
        <div className="space-y-5">
          {topPlayer && (
            <div className="hub-card p-5">
              <div className="hub-label mb-3">Top Speler</div>
              <Link href={`/dashboard/coach/players/${topPlayer.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-hub-surface transition-colors group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black flex-shrink-0"
                    style={{
                      background: `${getRatingColor(topPlayer.overall_rating)}20`,
                      border: `2px solid ${getRatingColor(topPlayer.overall_rating)}40`,
                      color: getRatingColor(topPlayer.overall_rating),
                    }}>
                    {topPlayer.first_name[0]}{topPlayer.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm group-hover:text-hub-teal transition-colors">
                      {topPlayer.first_name} {topPlayer.last_name}
                    </div>
                    <div className="text-xs text-slate-500">{POSITION_LABELS[topPlayer.position]}</div>
                    {topPlayer.badge && (
                      <span className="hub-tag text-[10px] mt-1"
                        style={{ background: BADGE_CONFIG[topPlayer.badge].bg, color: BADGE_CONFIG[topPlayer.badge].color }}>
                        {BADGE_CONFIG[topPlayer.badge].label}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black tabular-nums flex-shrink-0"
                    style={{ color: getRatingColor(topPlayer.overall_rating) }}>
                    {topPlayer.overall_rating}
                  </div>
                </div>
              </Link>
            </div>
          )}

          <div className="hub-card p-5">
            <div className="hub-label mb-3">Snelle Acties</div>
            <div className="space-y-2">
              {[
                { href: "/dashboard/coach/evaluations/new", icon: <ClipboardList size={15} />, label: "Nieuwe evaluatie" },
                { href: "/dashboard/coach/players", icon: <Users size={15} />, label: "Alle spelers" },
                { href: "/dashboard/coach/challenges", icon: <Target size={15} />, label: "Challenges beheren" },
                { href: "/dashboard/coach/ai", icon: <BookOpen size={15} />, label: "AI Scouting Engine" },
                { href: "/dashboard/coach/analytics", icon: <TrendingUp size={15} />, label: "Team analytics" },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-hub-surface transition-all border border-transparent hover:border-hub-border">
                  <span>{link.icon}</span>
                  {link.label}
                  <ChevronRight size={14} className="ml-auto text-slate-600" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
