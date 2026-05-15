"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, ChevronRight, Calendar, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SORENESS_LOCATION_LABELS, type SorenessLocation } from "@/lib/types";

const SORENESS_KEYS: SorenessLocation[] = [
  "hamstring", "calves", "quads", "groin",
  "lower_back", "upper_back", "shoulders", "core",
  "knees", "ankles", "feet", "neck",
];

interface CheckinForm {
  sleep_quality: number;
  sleep_hours: string;
  perceived_recovery: number;
  energy_level: number;
  mood: number;
  soreness: number;
  stress_level: number;
  motivation: number;
  soreness_locations: SorenessLocation[];
  notes: string;
}

const initialForm: CheckinForm = {
  sleep_quality: 7,
  sleep_hours: "8",
  perceived_recovery: 7,
  energy_level: 7,
  mood: 7,
  soreness: 3,
  stress_level: 3,
  motivation: 8,
  soreness_locations: [],
  notes: "",
};

export default function CheckinPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [todayId, setTodayId] = useState<string | null>(null);
  const [form, setForm] = useState<CheckinForm>(initialForm);
  const [history, setHistory] = useState<{ checkin_date: string; sleep_quality: number | null; perceived_recovery: number | null; mood: number | null }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: player } = await supabase
        .from("players")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!player) { setLoading(false); return; }
      setPlayerId(player.id);

      // Today's check-in
      const { data: todayCheckin } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("player_id", player.id)
        .eq("checkin_date", today)
        .maybeSingle();

      if (todayCheckin) {
        setTodayId(todayCheckin.id);
        setForm({
          sleep_quality:      todayCheckin.sleep_quality ?? 7,
          sleep_hours:        todayCheckin.sleep_hours?.toString() ?? "8",
          perceived_recovery: todayCheckin.perceived_recovery ?? 7,
          energy_level:       todayCheckin.energy_level ?? 7,
          mood:               todayCheckin.mood ?? 7,
          soreness:           todayCheckin.soreness ?? 3,
          stress_level:       todayCheckin.stress_level ?? 3,
          motivation:         todayCheckin.motivation ?? 8,
          soreness_locations: (todayCheckin.soreness_locations ?? []) as SorenessLocation[],
          notes:              todayCheckin.notes ?? "",
        });
      }

      // History (last 14 days)
      const { data: hist } = await supabase
        .from("daily_checkins")
        .select("checkin_date, sleep_quality, perceived_recovery, mood")
        .eq("player_id", player.id)
        .order("checkin_date", { ascending: false })
        .limit(14);
      setHistory(hist ?? []);

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!playerId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();

    const payload = {
      player_id:          playerId,
      checkin_date:       today,
      sleep_quality:      form.sleep_quality,
      sleep_hours:        form.sleep_hours ? parseFloat(form.sleep_hours) : null,
      perceived_recovery: form.perceived_recovery,
      energy_level:       form.energy_level,
      mood:               form.mood,
      soreness:           form.soreness,
      stress_level:       form.stress_level,
      motivation:         form.motivation,
      soreness_locations: form.soreness_locations,
      notes:              form.notes || null,
    };

    let result;
    if (todayId) {
      result = await supabase.from("daily_checkins").update(payload).eq("id", todayId).select().single();
    } else {
      result = await supabase.from("daily_checkins").insert(payload).select().single();
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setTodayId(result.data.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    }
    setSaving(false);
  }

  function toggleLocation(loc: SorenessLocation) {
    setForm(f => ({
      ...f,
      soreness_locations: f.soreness_locations.includes(loc)
        ? f.soreness_locations.filter(l => l !== loc)
        : [...f.soreness_locations, loc],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--navy)" }} />
      </div>
    );
  }

  if (!playerId) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Geen spelersgegevens</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
          Je moet eerst je profiel afronden via onboarding.
        </p>
        <Link href="/onboarding" className="btn-primary">Naar onboarding</Link>
      </div>
    );
  }

  return (
    <div className="checkin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, maxWidth: 1100, margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 720px) {
          .checkin-grid { grid-template-columns: 1fr !important; }
        }
      ` }} />
      {/* MAIN FORM */}
      <main style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
            Dagelijkse Check-in
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Hoe voel je je vandaag? Vul je antwoorden in — dit voedt jouw performance dashboard.
          </p>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-dim)", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Calendar size={11} /> {new Date(today).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
            {todayId && <span style={{ marginLeft: 8, color: "var(--green)", fontWeight: 600 }}>· Vandaag al ingevuld — je kunt aanpassen</span>}
          </div>
        </div>

        {/* Sleep section */}
        <FormSection title="Slaap" subtitle="Hoe heb je geslapen vannacht?">
          <ScaleInput
            label="Slaapkwaliteit"
            value={form.sleep_quality}
            onChange={v => setForm({ ...form, sleep_quality: v })}
            lowLabel="Slecht / wakker"
            highLabel="Diep & herstellend"
          />
          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
              Aantal uren geslapen
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="14"
              value={form.sleep_hours}
              onChange={e => setForm({ ...form, sleep_hours: e.target.value })}
              className="input"
              style={{ maxWidth: 140 }}
            />
          </div>
        </FormSection>

        {/* Recovery & Energy */}
        <FormSection title="Herstel & Energie" subtitle="Hoe voel je je fysiek vandaag?">
          <ScaleInput
            label="Perceived Recovery"
            value={form.perceived_recovery}
            onChange={v => setForm({ ...form, perceived_recovery: v })}
            lowLabel="Niet hersteld"
            highLabel="Volledig hersteld"
          />
          <ScaleInput
            label="Energieniveau"
            value={form.energy_level}
            onChange={v => setForm({ ...form, energy_level: v })}
            lowLabel="Uitgeput"
            highLabel="Vol energie"
          />
        </FormSection>

        {/* Soreness */}
        <FormSection title="Spierpijn" subtitle="Hoeveel last heb je van je spieren?">
          <ScaleInput
            label="Algemene spierpijn"
            value={form.soreness}
            onChange={v => setForm({ ...form, soreness: v })}
            lowLabel="Geen pijn"
            highLabel="Veel pijn"
            inverted
          />
          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
              Locatie van spierpijn (optioneel)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SORENESS_KEYS.map(loc => {
                const active = form.soreness_locations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    style={{
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: `1px solid ${active ? "var(--navy)" : "var(--border)"}`,
                      background: active ? "var(--navy)" : "var(--surface)",
                      color: active ? "#fff" : "var(--text-2)",
                      cursor: "pointer",
                      fontWeight: 500,
                      transition: "all 0.15s",
                    }}
                  >
                    {SORENESS_LOCATION_LABELS[loc]}
                  </button>
                );
              })}
            </div>
          </div>
        </FormSection>

        {/* Mental */}
        <FormSection title="Mentaal" subtitle="Hoe voel je je mentaal?">
          <ScaleInput
            label="Stemming"
            value={form.mood}
            onChange={v => setForm({ ...form, mood: v })}
            lowLabel="Slecht humeur"
            highLabel="Zeer positief"
          />
          <ScaleInput
            label="Stress"
            value={form.stress_level}
            onChange={v => setForm({ ...form, stress_level: v })}
            lowLabel="Geen stress"
            highLabel="Hoge stress"
            inverted
          />
          <ScaleInput
            label="Motivatie / Trainingszin"
            value={form.motivation}
            onChange={v => setForm({ ...form, motivation: v })}
            lowLabel="Geen zin"
            highLabel="Zeer gemotiveerd"
          />
        </FormSection>

        {/* Notes */}
        <FormSection title="Notities" subtitle="Iets dat je coach moet weten? (optioneel)">
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Bv. lichte hoofdpijn, vermoeid van school, slecht geslapen door...&#10;"
            className="input"
            style={{ resize: "vertical", minHeight: 80, fontFamily: "inherit", lineHeight: 1.5 }}
          />
        </FormSection>

        {/* Save bar */}
        <div style={{
          position: "sticky", bottom: 0, zIndex: 10,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 12, color: error ? "var(--red)" : saved ? "var(--green)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            {saved ? <><CheckCircle2 size={14} /> Opgeslagen — je dashboard is bijgewerkt</>
              : error ? <>⚠️ {error}</>
              : todayId ? "Wijzigingen worden opgeslagen wanneer je op Bijwerken klikt"
              : "Vul de check-in in en klik op Opslaan"}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ minWidth: 120, justifyContent: "center", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {todayId ? "Bijwerken" : "Opslaan"}
          </button>
        </div>
      </main>

      {/* SIDEBAR */}
      <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 10 }}>
            Recente Check-ins
          </div>
          {history.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Nog geen historie.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.slice(0, 7).map(h => (
                <div key={h.checkin_date} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 12,
                }}>
                  <span style={{ color: h.checkin_date === today ? "var(--gold-dim)" : "var(--text-2)", fontWeight: h.checkin_date === today ? 700 : 500 }}>
                    {new Date(h.checkin_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                  </span>
                  <div style={{ display: "flex", gap: 8, fontFeatureSettings: '"tnum" 1' }}>
                    <span style={{ color: "var(--text-muted)" }}>💤 {h.sleep_quality ?? "—"}</span>
                    <span style={{ color: "var(--text-muted)" }}>⚡ {h.perceived_recovery ?? "—"}</span>
                    <span style={{ color: "var(--text-muted)" }}>😊 {h.mood ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 8 }}>
            Tip
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.55, color: "var(--text-2)" }}>
            Vul de check-in elke ochtend bij het ontbijt in. Consistentie geeft je coach betere inzichten over je herstelpatronen.
          </p>
        </div>

        <Link
          href="/dashboard/player"
          style={{
            fontSize: 12, color: "var(--text-muted)",
            display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px",
          }}
        >
          Naar dashboard <ChevronRight size={12} />
        </Link>
      </aside>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */
/*  Sub-components                                               */
/* ───────────────────────────────────────────────────────────── */

function FormSection({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text)" }}>
          {title}
        </h3>
        {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function ScaleInput({ label, value, onChange, lowLabel, highLabel, inverted }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  inverted?: boolean;
}) {
  // For 'inverted' (e.g. soreness, stress), high values are bad
  const goodColor = "var(--green)";
  const okColor = "var(--amber)";
  const badColor = "var(--red)";

  let valueColor: string;
  if (inverted) {
    valueColor = value <= 3 ? goodColor : value <= 6 ? okColor : badColor;
  } else {
    valueColor = value >= 7 ? goodColor : value >= 4 ? okColor : badColor;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</label>
        <span style={{
          fontSize: 22, fontWeight: 800, color: valueColor,
          letterSpacing: "-0.03em", fontFeatureSettings: '"tnum" 1', lineHeight: 1,
        }}>
          {value}<span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500 }}>/10</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const active = n <= value;
          let segColor = "var(--border)";
          if (active) {
            if (inverted) {
              segColor = n <= 3 ? goodColor : n <= 6 ? okColor : badColor;
            } else {
              segColor = n <= 3 ? badColor : n <= 6 ? okColor : goodColor;
            }
          }
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              style={{
                flex: 1,
                height: 28,
                borderRadius: 4,
                border: "none",
                background: segColor,
                cursor: "pointer",
                transition: "all 0.15s",
                fontSize: 10,
                fontWeight: 700,
                color: active ? "#fff" : "var(--text-dim)",
                fontFeatureSettings: '"tnum" 1',
              }}
              aria-label={`${label}: ${n}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        marginTop: 5, fontSize: 10.5, color: "var(--text-dim)",
      }}>
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
