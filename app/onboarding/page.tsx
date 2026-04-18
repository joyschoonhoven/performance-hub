"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ChevronRight } from "lucide-react";
import { POSITION_LABELS } from "@/lib/types";
import type { UserRole, PositionType } from "@/lib/types";

const POSITIONS = Object.entries(POSITION_LABELS) as [PositionType, string][];

const COACH_LICENSES = [
  "KNVB Trainer 1",
  "KNVB Trainer 2",
  "KNVB Trainer 3",
  "UEFA C",
  "UEFA B",
  "UEFA A",
  "UEFA Pro",
  "Geen licentie",
];

const COACH_SPECIALIZATIONS = [
  "Jeugdcoach (onder 12)",
  "Jeugdcoach (onder 16)",
  "Jeugdcoach (onder 19)",
  "Senioren (amateur)",
  "Senioren (semi-professioneel)",
  "Keeperstrainer",
  "Fysiektrainer / Conditiecoach",
  "Individuele spelersontwikkeling",
  "Assistent-trainer",
];

const PREFERRED_FORMATIONS = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "3-5-2",
  "3-4-3",
  "5-3-2",
  "4-1-4-1",
  "Wisselend / situationeel",
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Player fields ──────────────────────────────
  const [position, setPosition] = useState<PositionType>("CM");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [team, setTeam] = useState("");
  const [nationality, setNationality] = useState("NL");

  // ── Coach fields ───────────────────────────────
  const [coachClub, setCoachClub] = useState("");
  const [coachTeamName, setCoachTeamName] = useState("");
  const [coachLicense, setCoachLicense] = useState("");
  const [coachSpecialization, setCoachSpecialization] = useState("");
  const [coachFormation, setCoachFormation] = useState("");
  const [coachExperience, setCoachExperience] = useState("");
  const [coachPhone, setCoachPhone] = useState("");
  const [coachBio, setCoachBio] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setRole((profile?.role as UserRole) ?? "player");
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    if (role === "player") {
      await supabase.from("profiles").update({ club: team }).eq("id", user.id);

      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      const fullName = profile?.full_name ?? "";
      const parts = fullName.trim().split(" ");
      const firstName = parts[0] ?? "";
      const lastName = parts.slice(1).join(" ") || firstName;

      const { error: playerError } = await supabase.from("players").insert({
        profile_id: user.id,
        first_name: firstName,
        last_name: lastName,
        position,
        jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
        date_of_birth: dateOfBirth || null,
        nationality: nationality.toUpperCase() || "NL",
        team_name: team || null,
        club: team || null,
        overall_rating: 65,
        is_active: true,
      });

      if (playerError) {
        setError(playerError.message);
        setSaving(false);
        return;
      }
    } else if (role === "coach") {
      const updateData: Record<string, string> = {
        club: coachClub,
        phone: coachPhone,
        bio: coachBio,
        coaching_license: coachLicense,
      };
      // Store extra coach info in bio if fields exist
      const extras = [
        coachTeamName ? `Team: ${coachTeamName}` : "",
        coachSpecialization ? `Specialisatie: ${coachSpecialization}` : "",
        coachFormation ? `Favoriete formatie: ${coachFormation}` : "",
        coachExperience ? `Ervaring: ${coachExperience} jaar` : "",
      ].filter(Boolean).join(" | ");

      if (extras && !coachBio) {
        updateData.bio = extras;
      } else if (extras && coachBio) {
        updateData.bio = `${coachBio}\n\n${extras}`;
      }

      await supabase.from("profiles").update(updateData).eq("id", user.id);
    }

    router.push(`/dashboard/${role}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f1f5f9" }}>
        <Loader2 size={32} className="animate-spin text-hub-teal" />
      </div>
    );
  }

  const inputStyle = { background: "#ffffff", border: "1px solid #e2e8f0" };
  const inputClass = "w-full rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#f1f5f9" }}>
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: "linear-gradient(rgba(79,169,230,1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,169,230,1) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(79,169,230,0.04)" }} />

      <div className="relative z-10 w-full max-w-lg px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <Image src="/logo.png" alt="Logo" width={52} height={52} className="object-contain w-full h-full" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {role === "coach" ? "Coach profiel instellen" : "Spelersprofiel instellen"}
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            {role === "coach"
              ? "Vertel ons over jouw achtergrond als trainer."
              : "Vul je basisgegevens in zodat je coach je kan evalueren."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-5"
          style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>

          {/* ── PLAYER ── */}
          {role === "player" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Positie *</label>
                <select value={position} onChange={(e) => setPosition(e.target.value as PositionType)} required
                  className={inputClass} style={inputStyle}>
                  {POSITIONS.map(([val, label]) => (
                    <option key={val} value={val}>{label} ({val})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Rugnummer</label>
                  <input type="number" value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)}
                    placeholder="10" min={1} max={99} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Geboortedatum</label>
                  <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                    className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Team / Club</label>
                <input type="text" value={team} onChange={(e) => setTeam(e.target.value)}
                  placeholder="Schoonhoven FC" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Nationaliteit</label>
                <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)}
                  placeholder="NL" maxLength={3} className={`${inputClass} uppercase`} style={inputStyle} />
              </div>
            </>
          )}

          {/* ── COACH ── */}
          {role === "coach" && (
            <>
              {/* Club */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Club / Voetbalorganisatie *
                </label>
                <input type="text" value={coachClub} onChange={(e) => setCoachClub(e.target.value)}
                  required placeholder="Schoonhoven FC" className={inputClass} style={inputStyle} />
              </div>

              {/* Team name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Team dat je traint
                </label>
                <input type="text" value={coachTeamName} onChange={(e) => setCoachTeamName(e.target.value)}
                  placeholder="JO17-1, Schoonhoven FC 1, ..."
                  className={inputClass} style={inputStyle} />
              </div>

              {/* License + Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                    Coachlicentie
                  </label>
                  <select value={coachLicense} onChange={(e) => setCoachLicense(e.target.value)}
                    className={inputClass} style={inputStyle}>
                    <option value="">Selecteer...</option>
                    {COACH_LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                    Jaren ervaring
                  </label>
                  <input type="number" value={coachExperience} onChange={(e) => setCoachExperience(e.target.value)}
                    placeholder="5" min={0} max={50} className={inputClass} style={inputStyle} />
                </div>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Specialisatie / Rol
                </label>
                <select value={coachSpecialization} onChange={(e) => setCoachSpecialization(e.target.value)}
                  className={inputClass} style={inputStyle}>
                  <option value="">Selecteer...</option>
                  {COACH_SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Preferred formation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Favoriete speelwijze / formatie
                </label>
                <select value={coachFormation} onChange={(e) => setCoachFormation(e.target.value)}
                  className={inputClass} style={inputStyle}>
                  <option value="">Selecteer...</option>
                  {PREFERRED_FORMATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Telefoonnummer (optioneel)
                </label>
                <input type="tel" value={coachPhone} onChange={(e) => setCoachPhone(e.target.value)}
                  placeholder="+31 6 12345678" className={inputClass} style={inputStyle} />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Coaching filosofie (optioneel)
                </label>
                <textarea value={coachBio} onChange={(e) => setCoachBio(e.target.value)} rows={3}
                  placeholder="Kort beschrijf je aanpak, stijl en wat spelers van je mogen verwachten..."
                  className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
            </>
          )}

          {role === "admin" && (
            <p className="text-slate-600 text-sm text-center py-4">
              Admin profiel is klaar. Klik hieronder om door te gaan.
            </p>
          )}

          {error && (
            <div className="rounded-xl px-4 py-3 text-red-400 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            style={{ background: "#4FA9E6", color: "#fff" }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
            Doorgaan naar dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
