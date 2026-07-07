"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ChevronRight, Calendar, Save, Moon, Battery, Activity, Smile, Brain, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SORENESS_LOCATION_LABELS, type SorenessLocation } from "@/lib/types";
import { SFA, PREMIUM_CSS, PremiumHeader, Reveal } from "@/components/ui/premium";

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
  sleep_quality: 7, sleep_hours: "8", perceived_recovery: 7, energy_level: 7,
  mood: 7, soreness: 3, stress_level: 3, motivation: 8, soreness_locations: [], notes: "",
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

      const { data: player } = await supabase.from("players").select("id").eq("profile_id", user.id).maybeSingle();
      if (!player) { setLoading(false); return; }
      setPlayerId(player.id);

      const { data: todayCheckin } = await supabase
        .from("daily_checkins").select("*").eq("player_id", player.id).eq("checkin_date", today).maybeSingle();

      if (todayCheckin) {
        setTodayId(todayCheckin.id);
        setForm({
          sleep_quality: todayCheckin.sleep_quality ?? 7,
          sleep_hours: todayCheckin.sleep_hours?.toString() ?? "8",
          perceived_recovery: todayCheckin.perceived_recovery ?? 7,
          energy_level: todayCheckin.energy_level ?? 7,
          mood: todayCheckin.mood ?? 7,
          soreness: todayCheckin.soreness ?? 3,
          stress_level: todayCheckin.stress_level ?? 3,
          motivation: todayCheckin.motivation ?? 8,
          soreness_locations: (todayCheckin.soreness_locations ?? []) as SorenessLocation[],
          notes: todayCheckin.notes ?? "",
        });
      }

      const { data: hist } = await supabase
        .from("daily_checkins").select("checkin_date, sleep_quality, perceived_recovery, mood")
        .eq("player_id", player.id).order("checkin_date", { ascending: false }).limit(14);
      setHistory(hist ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!playerId) return;
    setSaving(true); setError(null);
    const supabase = createClient();
    const payload = {
      player_id: playerId, checkin_date: today,
      sleep_quality: form.sleep_quality, sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
      perceived_recovery: form.perceived_recovery, energy_level: form.energy_level, mood: form.mood,
      soreness: form.soreness, stress_level: form.stress_level, motivation: form.motivation,
      soreness_locations: form.soreness_locations, notes: form.notes || null,
    };
    let result;
    if (todayId) result = await supabase.from("daily_checkins").update(payload).eq("id", todayId).select().single();
    else result = await supabase.from("daily_checkins").insert(payload).select().single();

    if (result.error) setError(result.error.message);
    else { setTodayId(result.data.id); setSaved(true); setTimeout(() => setSaved(false), 2400); }
    setSaving(false);
  }

  function toggleLocation(loc: SorenessLocation) {
    setForm(f => ({
      ...f,
      soreness_locations: f.soreness_locations.includes(loc)
        ? f.soreness_locations.filter(l => l !== loc) : [...f.soreness_locations, loc],
    }));
  }

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_CSS }} />
      <div className="pv-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: SFA.blue }} />
      </div>
    </>
  );

  if (!playerId) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_CSS }} />
      <div className="pv-root" style={{ maxWidth: 460, margin: "60px auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: SFA.ink, marginBottom: 8 }}>Geen spelersgegevens</h2>
        <p style={{ color: SFA.sub, fontSize: 13, marginBottom: 20 }}>Je moet eerst je profiel afronden via onboarding.</p>
        <Link href="/onboarding" className="pv-btn" style={{ textDecoration: "none" }}>Naar onboarding</Link>
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_CSS + CHECKIN_CSS }} />
      <div className="pv-root">
        <div className="ci-grid">
          {/* MAIN */}
          <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PremiumHeader
              eyebrow="Dagelijkse check-in"
              title="Hoe voel je je vandaag?"
              subtitle={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Calendar size={12} /> {new Date(today).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
                  {todayId && <span style={{ color: SFA.green, fontWeight: 700 }}>· vandaag ingevuld — je kunt aanpassen</span>}
                </span>
              }
            />

            <Reveal i={0}><Section icon={<Moon size={15} />} color={SFA.blue} title="Slaap" subtitle="Hoe heb je geslapen vannacht?">
              <Scale label="Slaapkwaliteit" value={form.sleep_quality} onChange={v => setForm({ ...form, sleep_quality: v })} lowLabel="Slecht / wakker" highLabel="Diep & herstellend" />
              <div style={{ marginTop: 4 }}>
                <div className="pv-label" style={{ marginBottom: 7 }}>Aantal uren geslapen</div>
                <input type="number" step="0.5" min="0" max="14" value={form.sleep_hours}
                  onChange={e => setForm({ ...form, sleep_hours: e.target.value })} className="pv-input" style={{ maxWidth: 150 }} />
              </div>
            </Section></Reveal>

            <Reveal i={1}><Section icon={<Battery size={15} />} color={SFA.green} title="Herstel & Energie" subtitle="Hoe voel je je fysiek vandaag?">
              <Scale label="Herstel" value={form.perceived_recovery} onChange={v => setForm({ ...form, perceived_recovery: v })} lowLabel="Niet hersteld" highLabel="Volledig hersteld" />
              <Scale label="Energieniveau" value={form.energy_level} onChange={v => setForm({ ...form, energy_level: v })} lowLabel="Uitgeput" highLabel="Vol energie" />
            </Section></Reveal>

            <Reveal i={2}><Section icon={<Flame size={15} />} color={SFA.red} title="Spierpijn" subtitle="Hoeveel last heb je van je spieren?">
              <Scale label="Algemene spierpijn" value={form.soreness} onChange={v => setForm({ ...form, soreness: v })} lowLabel="Geen pijn" highLabel="Veel pijn" inverted />
              <div>
                <div className="pv-label" style={{ marginBottom: 9 }}>Locatie (optioneel)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {SORENESS_KEYS.map(loc => {
                    const active = form.soreness_locations.includes(loc);
                    return (
                      <button key={loc} type="button" onClick={() => toggleLocation(loc)}
                        style={{
                          fontSize: 12, fontWeight: 700, padding: "7px 13px", borderRadius: 999, cursor: "pointer",
                          border: `1px solid ${active ? SFA.red : SFA.line}`,
                          background: active ? `${SFA.red}12` : SFA.card,
                          color: active ? SFA.red : SFA.sub, transition: "all 0.15s",
                        }}>
                        {SORENESS_LOCATION_LABELS[loc]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section></Reveal>

            <Reveal i={3}><Section icon={<Brain size={15} />} color={SFA.gold} title="Mentaal" subtitle="Hoe voel je je mentaal?">
              <Scale label="Stemming" value={form.mood} onChange={v => setForm({ ...form, mood: v })} lowLabel="Slecht humeur" highLabel="Zeer positief" />
              <Scale label="Stress" value={form.stress_level} onChange={v => setForm({ ...form, stress_level: v })} lowLabel="Geen stress" highLabel="Hoge stress" inverted />
              <Scale label="Motivatie" value={form.motivation} onChange={v => setForm({ ...form, motivation: v })} lowLabel="Geen zin" highLabel="Zeer gemotiveerd" />
            </Section></Reveal>

            <Reveal i={4}><Section icon={<Smile size={15} />} color={SFA.sky} title="Notities" subtitle="Iets dat je coach moet weten? (optioneel)">
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                placeholder="Bv. lichte hoofdpijn, vermoeid van school, slecht geslapen…"
                className="pv-input" style={{ resize: "vertical", minHeight: 84, lineHeight: 1.5 }} />
            </Section></Reveal>

            {/* Save bar */}
            <div style={{
              position: "sticky", bottom: 12, zIndex: 10, marginTop: 4,
              background: SFA.card, border: `1px solid ${SFA.line}`, borderRadius: 14,
              padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              boxShadow: "0 8px 28px rgba(13,27,42,0.10)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                color: error ? SFA.red : saved ? SFA.green : SFA.sub }}>
                {saved ? <><CheckCircle2 size={14} /> Opgeslagen — je dashboard is bijgewerkt</>
                  : error ? <>⚠ {error}</>
                  : todayId ? "Wijzigingen worden opgeslagen bij Bijwerken"
                  : "Vul in en klik op Opslaan"}
              </div>
              <button onClick={handleSave} disabled={saving} className="pv-btn" style={{ minWidth: 130 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {todayId ? "Bijwerken" : "Opslaan"}
              </button>
            </div>
          </main>

          {/* SIDEBAR */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Reveal i={1}>
              <div className="pv-card notch" style={{ padding: 18 }}>
                <div className="pv-label" style={{ marginBottom: 12 }}>Recente check-ins</div>
                {history.length === 0 ? (
                  <p style={{ fontSize: 12, color: SFA.dim }}>Nog geen historie.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {history.slice(0, 7).map(h => (
                      <div key={h.checkin_date} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "9px 0", borderBottom: `1px solid ${SFA.line}`, fontSize: 12,
                      }}>
                        <span style={{ color: h.checkin_date === today ? SFA.blue : SFA.sub, fontWeight: h.checkin_date === today ? 800 : 600 }}>
                          {new Date(h.checkin_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                        </span>
                        <div style={{ display: "flex", gap: 9 }} className="pv-num">
                          <span style={{ color: SFA.sub }}>💤 {h.sleep_quality ?? "—"}</span>
                          <span style={{ color: SFA.sub }}>⚡ {h.perceived_recovery ?? "—"}</span>
                          <span style={{ color: SFA.sub }}>😊 {h.mood ?? "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal i={2}>
              <div className="pv-card notch" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <Activity size={14} style={{ color: SFA.sky }} />
                  <div className="pv-label">Tip</div>
                </div>
                <p style={{ fontSize: 12.5, lineHeight: 1.55, color: SFA.sub }}>
                  Vul de check-in elke ochtend bij het ontbijt in. Consistentie geeft je coach betere inzichten over je herstelpatronen.
                </p>
              </div>
            </Reveal>

            <Link href="/dashboard/player" style={{ fontSize: 12, fontWeight: 600, color: SFA.sub, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
              Naar dashboard <ChevronRight size={12} />
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════ */
function Section({ icon, color, title, subtitle, children }: {
  icon: React.ReactNode; color: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="pv-card notch pv-hover" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `${color}14`, border: `1px solid ${color}26`,
          display: "flex", alignItems: "center", justifyContent: "center", color,
        }}>{icon}</div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", color: SFA.ink }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 12, color: SFA.dim, marginTop: 1 }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
    </div>
  );
}

function Scale({ label, value, onChange, lowLabel, highLabel, inverted }: {
  label: string; value: number; onChange: (v: number) => void; lowLabel: string; highLabel: string; inverted?: boolean;
}) {
  const good = SFA.green, ok = SFA.gold, bad = SFA.red;
  const valueColor = inverted
    ? (value <= 3 ? good : value <= 6 ? ok : bad)
    : (value >= 7 ? good : value >= 4 ? ok : bad);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9 }}>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: SFA.ink }}>{label}</label>
        <span className="pv-num" style={{ fontSize: 24, fontWeight: 700, color: valueColor, letterSpacing: "0.01em", lineHeight: 1 }}>
          {value}<span style={{ fontSize: 12, color: SFA.dim, fontWeight: 500 }}>/10</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const active = n <= value;
          let seg: string = SFA.track;
          if (active) seg = inverted ? (n <= 3 ? good : n <= 6 ? ok : bad) : (n <= 3 ? bad : n <= 6 ? ok : good);
          return (
            <motion.button key={n} type="button" onClick={() => onChange(n)} whileTap={{ scale: 0.88 }}
              style={{
                flex: 1, height: 30, borderRadius: 6, border: "none", background: seg, cursor: "pointer",
                fontSize: 10, fontWeight: 800, color: active ? "#fff" : SFA.dim,
                fontFamily: "var(--pv-num)", transition: "background 0.15s",
              }}
              aria-label={`${label}: ${n}`}>
              {n}
            </motion.button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10.5, color: SFA.dim }}>
        <span>{lowLabel}</span><span>{highLabel}</span>
      </div>
    </div>
  );
}

const CHECKIN_CSS = `
  .ci-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; max-width: 1080px; margin: 0 auto; align-items: start; }
  @media (max-width: 820px) { .ci-grid { grid-template-columns: 1fr; } }
`;
