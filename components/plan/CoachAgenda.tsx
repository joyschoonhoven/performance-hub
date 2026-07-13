"use client";

// ============================================================
//  COACH AGENDA — algemene kalender met alle geplande
//  trainingen van spelers + eigen beschikbaarheid (tijdslots)
//  die spelers kunnen boeken.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Users, Loader2, X } from "lucide-react";
import {
  listSlots, createSlot, deleteSlot, listAllTrainings, fmtTime,
  type CoachSlot, type TeamTraining,
} from "@/lib/agenda";
import { TRAINING_META, todayISO } from "@/lib/trainings";
import type { TrainingType } from "@/lib/trainings";

const ACCENT = "#5A90BA";
const DAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CoachAgenda() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [slots, setSlots] = useState<CoachSlot[]>([]);
  const [trainings, setTrainings] = useState<TeamTraining[]>([]);
  const [selected, setSelected] = useState<string>(todayISO());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // formulier
  const [fDate, setFDate] = useState(todayISO());
  const [fStart, setFStart] = useState("16:00");
  const [fEnd, setFEnd] = useState("17:00");
  const [fCap, setFCap] = useState(4);
  const [fNote, setFNote] = useState("");

  const reload = useCallback(async () => {
    const from = iso(new Date(Date.now() - 45 * 24 * 3600 * 1000));
    const [s, t] = await Promise.all([listSlots(from), listAllTrainings(from)]);
    setSlots(s); setTrainings(t); setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // kalendercellen voor de cursor-maand
  const cells = useMemo(() => {
    const first = new Date(cursor);
    const lead = (first.getDay() + 6) % 7; // maandag = 0
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(iso(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  const slotsByDay = useMemo(() => {
    const m = new Map<string, CoachSlot[]>();
    for (const s of slots) m.set(s.date, [...(m.get(s.date) ?? []), s]);
    return m;
  }, [slots]);

  const trainingsByDay = useMemo(() => {
    const m = new Map<string, TeamTraining[]>();
    for (const t of trainings) m.set(t.date, [...(m.get(t.date) ?? []), t]);
    return m;
  }, [trainings]);

  async function submitSlot() {
    if (fStart >= fEnd) { setErr("Eindtijd moet na de starttijd liggen"); return; }
    setSaving(true); setErr(null);
    const r = await createSlot({ date: fDate, start_time: fStart, end_time: fEnd, capacity: fCap, note: fNote || undefined });
    setSaving(false);
    if (!r.ok) { setErr(r.error ?? "Opslaan mislukt"); return; }
    setShowForm(false); setFNote("");
    await reload();
  }

  async function removeSlot(id: string) {
    setSlots((s) => s.filter((x) => x.id !== id));
    await deleteSlot(id);
    reload();
  }

  const today = todayISO();
  const daySlots = slotsByDay.get(selected) ?? [];
  const dayTrainings = trainingsByDay.get(selected) ?? [];
  const upcoming = slots.filter((s) => s.date >= today).slice(0, 8);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      {/* ── Kop ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="club-h" style={{ fontSize: 14, color: "var(--text)" }}>Agenda</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Trainingen van spelers en jouw beschikbaarheid</p>
        </div>
        <button onClick={() => { setShowForm((v) => !v); setFDate(selected >= today ? selected : today); }} className="cut-btn display-font" style={{
          display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 20px",
          background: ACCENT, color: "#fff", border: "none",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          <Plus size={13} /> Tijdslot toevoegen
        </button>
      </div>

      {/* ── Slotformulier ── */}
      {showForm && (
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>Nieuw beschikbaar moment</span>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)" }}><X size={14} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
            <Field label="Datum"><input type="date" value={fDate} min={today} onChange={(e) => setFDate(e.target.value)} style={inputStyle} /></Field>
            <Field label="Van"><input type="time" value={fStart} onChange={(e) => setFStart(e.target.value)} style={inputStyle} /></Field>
            <Field label="Tot"><input type="time" value={fEnd} onChange={(e) => setFEnd(e.target.value)} style={inputStyle} /></Field>
            <Field label="Plekken"><input type="number" min={1} max={30} value={fCap} onChange={(e) => setFCap(Math.max(1, Number(e.target.value)))} style={{ ...inputStyle, width: 70 }} /></Field>
            <Field label="Notitie (optioneel)" grow><input value={fNote} onChange={(e) => setFNote(e.target.value)} placeholder="Bijv. techniektraining, veld 2" style={{ ...inputStyle, width: "100%" }} /></Field>
            <button onClick={submitSlot} disabled={saving} className="cut-btn display-font" style={{
              height: 36, padding: "0 20px", background: ACCENT, color: "#fff",
              border: "none", fontSize: 12, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1,
            }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : "Opslaan"}
            </button>
          </div>
          {err && <div style={{ marginTop: 8, fontSize: 12, color: "var(--red)" }}>{err}</div>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }} className="lg:grid-cols-[1.4fr_1fr]">
        {/* ── Maandkalender ── */}
        <div style={{ padding: 18, borderRight: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} style={navBtn}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textTransform: "capitalize" }}>
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} style={navBtn}><ChevronRight size={14} /></button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {DAYS.map((d) => (
              <div key={d} style={{ fontSize: 10, fontWeight: 600, color: "var(--text-dim)", textAlign: "center", padding: "4px 0", letterSpacing: "0.04em" }}>{d}</div>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />;
              const isToday = day === today;
              const isSel = day === selected;
              const nSlots = slotsByDay.get(day)?.length ?? 0;
              const nTr = trainingsByDay.get(day)?.length ?? 0;
              return (
                <button key={day} onClick={() => setSelected(day)} style={{
                  aspectRatio: "1", borderRadius: 8, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  background: isSel ? ACCENT : "transparent",
                  border: isToday && !isSel ? `1px solid ${ACCENT}` : "1px solid transparent",
                  transition: "background 0.12s",
                }}>
                  <span style={{ fontSize: 12, fontWeight: isToday || isSel ? 700 : 500, color: isSel ? "#fff" : "var(--text-2)", fontFeatureSettings: '"tnum" 1' }}>
                    {Number(day.slice(8))}
                  </span>
                  <span style={{ display: "flex", gap: 2, height: 4 }}>
                    {nSlots > 0 && <span style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "#fff" : ACCENT }} />}
                    {nTr > 0 && <span style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.6)" : "var(--green)" }} />}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} /> Beschikbaar moment</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} /> Training speler</span>
          </div>
        </div>

        {/* ── Dagdetail + komende slots ── */}
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              {new Date(selected + "T12:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                <Loader2 size={13} className="animate-spin" /> Laden…
              </div>
            ) : daySlots.length === 0 && dayTrainings.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Niets gepland op deze dag.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {daySlots.map((s) => (
                  <div key={s.id} style={{ border: "1px solid var(--border)", borderLeft: `3px solid ${ACCENT}`, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Clock size={12} style={{ color: ACCENT }} /> {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11.5, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Users size={11} /> {s.bookings.length}/{s.capacity}
                        </span>
                        <button onClick={() => removeSlot(s.id)} title="Verwijderen" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 2 }}>
                          <Trash2 size={12} />
                        </button>
                      </span>
                    </div>
                    {s.note && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{s.note}</div>}
                    {s.bookings.length > 0 && (
                      <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 6 }}>
                        {s.bookings.map((b) => b.player_name ?? "Speler").join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
                {dayTrainings.map((t) => {
                  const meta = TRAINING_META[t.type as TrainingType];
                  return (
                    <div key={t.id} style={{ border: "1px solid var(--border)", borderLeft: "3px solid var(--green)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
                        {t.player_name ?? "Speler"} — {t.title || meta?.label || t.type}
                      </div>
                      {(t.coach_goal || t.player_goal) && (
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                          {t.coach_goal && <div>Trainer: {t.coach_goal}</div>}
                          {t.player_goal && <div>Speler: {t.player_goal}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {upcoming.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                Komende beschikbaarheid
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {upcoming.map((s) => (
                  <button key={s.id} onClick={() => { setSelected(s.date); setCursor(new Date(Number(s.date.slice(0, 4)), Number(s.date.slice(5, 7)) - 1, 1)); }} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "none", border: "none", cursor: "pointer", padding: "5px 2px",
                    fontSize: 12, color: "var(--text-2)", textAlign: "left",
                  }}>
                    <span>{new Date(s.date + "T12:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {fmtTime(s.start_time)}</span>
                    <span style={{ color: s.bookings.length >= s.capacity ? "var(--red)" : "var(--text-muted)", fontFeatureSettings: '"tnum" 1' }}>
                      {s.bookings.length}/{s.capacity}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 36, padding: "0 10px", borderRadius: 8, fontSize: 12.5,
  background: "var(--surface)", border: "1px solid var(--border)",
  color: "var(--text)", outline: "none", boxSizing: "border-box",
};

const navBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border)",
  background: "var(--surface)", cursor: "pointer", color: "var(--text-2)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

function Field({ label, children, grow }: { label: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: grow ? 1 : undefined, minWidth: grow ? 160 : undefined }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.03em" }}>{label}</span>
      {children}
    </label>
  );
}
