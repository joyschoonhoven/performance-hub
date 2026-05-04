"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, CheckCircle2, Bell, Palette, Shield, User } from "lucide-react";

interface CoachProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const inputClass = "w-full rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 focus:outline-none focus:border-hub-teal focus:ring-2 focus:ring-hub-teal/10 transition-all";

export default function CoachSettingsPage() {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Notification preferences — stored in localStorage
  const [notifEval, setNotifEval] = useState(true);
  const [notifChallenge, setNotifChallenge] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data as CoachProfile);
        setFullName(data.full_name ?? "");
      }
      // Load saved preferences
      try {
        const prefs = JSON.parse(localStorage.getItem("coach_prefs") ?? "{}") as Record<string, boolean>;
        if (prefs.notifEval !== undefined) setNotifEval(prefs.notifEval);
        if (prefs.notifChallenge !== undefined) setNotifChallenge(prefs.notifChallenge);
        if (prefs.notifWeekly !== undefined) setNotifWeekly(prefs.notifWeekly);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", profile.id);
    if (updateError) {
      setError("Opslaan mislukt: " + updateError.message);
    } else {
      // Save preferences to localStorage
      localStorage.setItem("coach_prefs", JSON.stringify({ notifEval, notifChallenge, notifWeekly }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-hub-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Instellingen</h1>
        <p className="text-slate-600 text-sm mt-1">Beheer jouw account en voorkeuren</p>
      </div>

      {/* Account */}
      <div className="hub-card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <User size={16} className="text-hub-teal" />
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Account</h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Volledige naam
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="Jouw naam"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            E-mailadres
          </label>
          <input
            type="email"
            value={profile?.email ?? ""}
            disabled
            className="w-full rounded-xl px-4 py-3 text-sm text-slate-500 bg-slate-50 border border-slate-200 cursor-not-allowed"
          />
          <p className="text-xs text-slate-500 mt-1.5">E-mailadres kan niet worden gewijzigd.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Rol</label>
            <div className="px-4 py-3 rounded-xl bg-hub-teal/5 border border-hub-teal/20 text-sm font-semibold text-hub-teal capitalize">
              {profile?.role ?? "coach"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Lid sinds</label>
            <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("nl-NL", { month: "long", year: "numeric" }) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="hub-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={16} className="text-hub-teal" />
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Notificaties</h2>
        </div>

        {[
          { label: "Nieuwe evaluatie ingediend", desc: "Ontvang een melding als een speler feedback geeft", value: notifEval, set: setNotifEval },
          { label: "Challenge voltooid", desc: "Melding wanneer een speler een challenge afrondt", value: notifChallenge, set: setNotifChallenge },
          { label: "Wekelijks overzicht", desc: "Samenvatting van squad-prestaties elke maandag", value: notifWeekly, set: setNotifWeekly },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-4 py-3 border-b border-hub-border last:border-0">
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">{item.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
            </div>
            <button
              type="button"
              onClick={() => item.set(!item.value)}
              className="flex-shrink-0 mt-0.5 w-11 h-6 rounded-full transition-all duration-200 relative"
              style={{ background: item.value ? "#4FA9E6" : "#e2e8f0" }}
              aria-checked={item.value}
              role="switch"
            >
              <div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
                style={{ left: item.value ? "calc(100% - 1.375rem)" : "0.125rem" }}
              />
            </button>
          </div>
        ))}
        <p className="text-xs text-slate-400 pt-1">
          Notificaties worden verstuurd zodra e-mail is geconfigureerd in het systeem.
        </p>
      </div>

      {/* Security */}
      <div className="hub-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-hub-teal" />
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Beveiliging</h2>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Wachtwoord wijzigen</div>
            <div className="text-xs text-slate-500 mt-0.5">Stuur een reset-link naar jouw e-mailadres</div>
          </div>
          <PasswordResetButton email={profile?.email ?? ""} />
        </div>
      </div>

      {/* Display prefs */}
      <div className="hub-card p-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={16} className="text-hub-teal" />
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Weergave</h2>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-hub-border">
          <div>
            <div className="text-sm font-semibold text-slate-900">Taal</div>
            <div className="text-xs text-slate-500 mt-0.5">Interface taal</div>
          </div>
          <div className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
            Nederlands 🇳🇱
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Standaard spelersweergave</div>
            <div className="text-xs text-slate-500 mt-0.5">Cards of lijstweergave op de spelerspagina</div>
          </div>
          <div className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
            Cards
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-500 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="hub-btn-primary flex items-center gap-2 disabled:opacity-50 px-6 py-3"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={15} />
          ) : (
            <Save size={15} />
          )}
          {saved ? "Opgeslagen!" : "Wijzigingen opslaan"}
        </button>
      </div>
    </div>
  );
}

function PasswordResetButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email || sent) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading || sent}
      className="text-xs font-semibold px-4 py-2 rounded-xl transition-all border disabled:opacity-60"
      style={sent
        ? { background: "#d1fae5", color: "#2B8AC7", borderColor: "#a7f3d0" }
        : { background: "#f8fafc", color: "#475569", borderColor: "#e2e8f0" }
      }
    >
      {loading ? <Loader2 size={12} className="animate-spin inline" /> : sent ? "Verstuurd ✓" : "Reset sturen"}
    </button>
  );
}
