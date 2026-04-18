"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { POSITION_LABELS } from "@/lib/types";
import { Save, Loader2, CheckCircle2, Shield, Activity, Search } from "lucide-react";
import { AvatarUpload } from "@/components/AvatarUpload";
import { InjuryBodyMap, type BodyRegion, type DominantFoot } from "@/components/InjuryBodyMap";
import { DUTCH_CLUBS, CLUB_GROUPS, type DutchClub } from "@/lib/dutch-clubs";
import Image from "next/image";

const POSITIONS = Object.entries(POSITION_LABELS) as [string, string][];
const NATIONALITIES = [
  "Nederlands", "Belgisch", "Duits", "Frans", "Spaans", "Italiaans",
  "Portugees", "Engels", "Braziliaans", "Argentijns", "Marokkaans",
  "Turks", "Surinaams", "Antilliaans", "Anders",
];

const inputCls = "w-full bg-white border border-hub-border rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-hub-teal transition-colors placeholder:text-slate-400";

function ClubLogo({ club, size = 32 }: { club: DutchClub; size?: number }) {
  const [error, setError] = useState(false);
  if (!club.logoUrl || error) {
    return (
      <div className="flex-shrink-0 flex items-center justify-center rounded-lg font-black text-xs"
        style={{
          width: size, height: size,
          background: `${club.primaryColor}20`,
          color: club.primaryColor,
          border: `1.5px solid ${club.primaryColor}40`,
          fontSize: size < 30 ? 8 : 10,
        }}>
        {club.code}
      </div>
    );
  }
  return (
    <Image src={club.logoUrl} alt={club.name} width={size} height={size}
      className="object-contain flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setError(true)} />
  );
}

export default function PlayerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "club" | "medical">("profile");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [clubSearch, setClubSearch] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    position: "ST",
    jersey_number: "",
    team_name: "",
    nationality: "",
    date_of_birth: "",
    club_id: "",
    dominant_foot: "right" as DominantFoot,
    injuries: [] as BodyRegion[],
    height_cm: "",
    weight_kg: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);

      const { data: player } = await supabase.from("players").select("*").eq("profile_id", user.id).maybeSingle();
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
          club_id: player.club ?? "",
          dominant_foot: (player.dominant_foot as DominantFoot) ?? "right",
          injuries: (player.injury_locations as BodyRegion[]) ?? [],
          height_cm: player.height_cm?.toString() ?? "",
          weight_kg: player.weight_kg?.toString() ?? "",
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
      club: form.club_id || null,
      dominant_foot: form.dominant_foot,
      injury_locations: form.injuries,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseInt(form.weight_kg) : null,
    }).eq("id", playerId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const selectedClub = DUTCH_CLUBS.find((c) => c.id === form.club_id);
  const filteredClubs = DUTCH_CLUBS.filter((c) =>
    !clubSearch || c.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
    c.shortName.toLowerCase().includes(clubSearch.toLowerCase()) ||
    c.city.toLowerCase().includes(clubSearch.toLowerCase())
  );

  const tabs = [
    { id: "profile" as const, label: "Profiel", icon: <Shield size={14} /> },
    { id: "club" as const, label: "Club", icon: <Activity size={14} /> },
    { id: "medical" as const, label: "Medisch", icon: <Activity size={14} /> },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>Instellingen</h1>
        <p className="text-slate-500 text-sm mt-1">Jouw spelersprofiel beheren</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-hub-bg border border-hub-border rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={activeTab === t.id
              ? { background: "#0A2540", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(10,37,64,0.2)" }
              : { color: "#64748b" }
            }>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Profile ── */}
      {activeTab === "profile" && (
        <div className="hub-card p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            {userId && (
              <AvatarUpload
                currentUrl={avatarUrl}
                userId={userId}
                name={`${form.first_name} ${form.last_name}`}
                onUpload={setAvatarUrl}
                size={80}
              />
            )}
            <div>
              <div className="text-sm font-bold text-slate-900">Profielfoto</div>
              <div className="text-xs text-slate-500 mt-0.5">Klik op de avatar om een foto te kiezen</div>
            </div>
          </div>

          <div className="border-t border-hub-border pt-5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Persoonlijke gegevens</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">Voornaam</label>
                <input className={inputCls} value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Voornaam" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">Achternaam</label>
                <input className={inputCls} value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Achternaam" />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs text-slate-600 font-medium mb-1.5">Positie</label>
              <select className={inputCls} value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {POSITIONS.map(([key, label]) => (
                  <option key={key} value={key}>{label} ({key})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">Rugnummer</label>
                <input className={inputCls} value={form.jersey_number} type="number"
                  onChange={(e) => setForm({ ...form, jersey_number: e.target.value })} placeholder="bijv. 9" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">Team</label>
                <input className={inputCls} value={form.team_name}
                  onChange={(e) => setForm({ ...form, team_name: e.target.value })} placeholder="bijv. U17 A" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">Lengte (cm)</label>
                <input className={inputCls} value={form.height_cm} type="number"
                  onChange={(e) => setForm({ ...form, height_cm: e.target.value })} placeholder="bijv. 180" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">Gewicht (kg)</label>
                <input className={inputCls} value={form.weight_kg} type="number"
                  onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} placeholder="bijv. 75" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">Geboortedatum</label>
                <input className={inputCls} value={form.date_of_birth} type="date"
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">Nationaliteit</label>
                <select className={inputCls} value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}>
                  <option value="">Selecteer...</option>
                  {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Club ── */}
      {activeTab === "club" && (
        <div className="hub-card p-6 space-y-5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Clubselectie</div>

          {/* Current selection */}
          {selectedClub && (
            <div className="flex items-center gap-3 p-4 rounded-xl border-2"
              style={{ borderColor: `${selectedClub.primaryColor}40`, background: `${selectedClub.primaryColor}06` }}>
              <ClubLogo club={selectedClub} size={40} />
              <div>
                <div className="font-bold text-slate-900 text-sm">{selectedClub.name}</div>
                <div className="text-xs text-slate-500">{selectedClub.city}</div>
              </div>
              <button
                onClick={() => setForm({ ...form, club_id: "" })}
                className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors font-medium">
                Verwijderen
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full bg-white border border-hub-border rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:border-hub-teal transition-colors"
              placeholder="Zoek club (naam of stad)..."
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
            />
          </div>

          {/* Club grid */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {CLUB_GROUPS.map((group) => {
              const clubs = group.clubs.filter((c) =>
                !clubSearch || c.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
                c.shortName.toLowerCase().includes(clubSearch.toLowerCase()) ||
                c.city.toLowerCase().includes(clubSearch.toLowerCase())
              );
              if (clubs.length === 0) return null;
              return (
                <div key={group.label}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {clubs.map((club) => (
                      <button
                        key={club.id}
                        onClick={() => setForm({ ...form, club_id: club.id })}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all"
                        style={form.club_id === club.id ? {
                          background: `${club.primaryColor}12`,
                          border: `1.5px solid ${club.primaryColor}50`,
                        } : {
                          background: "#ffffff",
                          border: "1px solid #E4E7EB",
                        }}
                      >
                        <ClubLogo club={club} size={28} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">{club.shortName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{club.city}</div>
                        </div>
                        {form.club_id === club.id && (
                          <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: club.primaryColor }}>
                            <svg width={8} height={8} viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" /></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: Medical ── */}
      {activeTab === "medical" && (
        <div className="hub-card p-6 space-y-5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medisch profiel</div>
          <p className="text-xs text-slate-500">
            Geef aan welk been je voorkeursvoet is en markeer actieve blessures op het lichaamsmodel.
            Je coach kan deze informatie inzien.
          </p>
          <InjuryBodyMap
            injuries={form.injuries}
            dominantFoot={form.dominant_foot}
            onInjuriesChange={(injuries) => setForm({ ...form, injuries })}
            onDominantFootChange={(dominant_foot) => setForm({ ...form, dominant_foot })}
          />
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
        style={saved
          ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
          : { background: "#0A2540", color: "#ffffff", boxShadow: "0 4px 16px rgba(10,37,64,0.2)" }
        }
      >
        {saving ? (
          <><Loader2 size={15} className="animate-spin" /> Opslaan...</>
        ) : saved ? (
          <><CheckCircle2 size={15} /> Opgeslagen!</>
        ) : (
          <><Save size={15} /> Wijzigingen opslaan</>
        )}
      </button>
    </div>
  );
}
