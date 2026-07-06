"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X, Target, User, Trash2, Loader2 } from "lucide-react";
import {
  listTrainings, addTraining, updateTraining, removeTraining, todayISO,
  TRAINING_META, type Training, type TrainingType,
} from "@/lib/trainings";

/* ═══════════════════════════════════════════════
   TOKENS (FIFA-style dark)
═══════════════════════════════════════════════ */
const T = {
  bg:     "#071426",
  panel:  "#0E2038",
  panel2: "#132A48",
  line:   "rgba(120,175,225,0.14)",
  lineHi: "rgba(120,175,225,0.28)",
  ink:    "#EAF2FB",
  sub:    "#8FA8C6",
  dim:    "#4E688A",
  blue:   "#1B6CA8",
  sky:    "#4DAEE5",
} as const;

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const MONTHS = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */
export function TrainingCalendar({ playerId, viewerRole, playerFirstName }: {
  playerId: string;
  viewerRole: "coach" | "player";
  playerFirstName?: string;
}) {
  const isCoach = viewerRole === "coach";
  const today = todayISO();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState<string>(today);
  const [editing, setEditing] = useState<Training | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    const rows = await listTrainings(playerId);
    setTrainings(rows);
    setLoading(false);
  }, [playerId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const byDate = useMemo(() => {
    const m: Record<string, Training[]> = {};
    for (const t of trainings) (m[t.date] ??= []).push(t);
    return m;
  }, [trainings]);

  const upcoming = useMemo(
    () => trainings.filter((t) => t.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6),
    [trainings, today],
  );

  /* calendar grid — Monday-first */
  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startDow = (first.getDay() + 6) % 7; // 0 = Monday
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  async function handleSave(input: { date: string; type: TrainingType; title?: string; coach_goal?: string; player_goal?: string }, existing?: Training) {
    if (existing) {
      await updateTraining(playerId, existing.id, input);
    } else {
      await addTraining(playerId, input);
    }
    setEditing(null); setCreating(false);
    await refresh();
  }
  async function handleDelete(id: string) {
    await removeTraining(playerId, id);
    setEditing(null);
    await refresh();
  }

  const selectedList = byDate[selected] ?? [];

  return (
    <div style={{
      position: "relative", overflow: "hidden", borderRadius: 18,
      background: `linear-gradient(160deg, ${T.panel} 0%, ${T.bg} 100%)`,
      border: `1px solid ${T.lineHi}`,
      boxShadow: "0 24px 60px -28px rgba(0,0,0,0.7)",
      fontFamily: "'Archivo', system-ui, sans-serif",
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ position: "absolute", top: -80, right: -60, width: 260, height: 260, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.sky}18, transparent 65%)`, pointerEvents: "none" }} />

      <div className="tc-grid-layout">
        {/* ── CALENDAR ── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: T.sky, textTransform: "uppercase" }}>
                Trainingskalender
              </div>
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 20, fontWeight: 700, color: T.ink, letterSpacing: "0.01em" }}>
                {MONTHS[cursor.m]} {cursor.y}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="tc-nav" onClick={() => shiftMonth(-1)} aria-label="Vorige maand"><ChevronLeft size={16} /></button>
              <button className="tc-nav" onClick={() => shiftMonth(1)} aria-label="Volgende maand"><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* weekday header */}
          <div className="tc-week">
            {WEEKDAYS.map((w) => <div key={w} className="tc-wd">{w}</div>)}
          </div>

          {/* day grid */}
          <div className="tc-days">
            {grid.map((d, i) => {
              if (d == null) return <div key={i} />;
              const dstr = iso(cursor.y, cursor.m, d);
              const items = byDate[dstr] ?? [];
              const isToday = dstr === today;
              const isSel = dstr === selected;
              return (
                <motion.button key={i} className="tc-day"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelected(dstr)}
                  style={{
                    background: isSel ? `linear-gradient(160deg, ${T.blue}, #14507e)` : T.panel2,
                    border: `1px solid ${isSel ? T.sky : isToday ? T.lineHi : T.line}`,
                    boxShadow: isSel ? `0 6px 18px ${T.blue}55` : "none",
                  }}>
                  <span style={{
                    fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 600,
                    color: isSel ? "#fff" : isToday ? T.sky : T.ink,
                  }}>{d}</span>
                  {items.length > 0 && (
                    <span className="tc-dots">
                      {items.slice(0, 3).map((it) => (
                        <span key={it.id} style={{ width: 4, height: 4, borderRadius: "50%", background: TRAINING_META[it.type].color }} />
                      ))}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* selected day panel */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>{labelForDate(selected)}</span>
              <button className="tc-add-sm" onClick={() => setCreating(true)}><Plus size={13} /> Training</button>
            </div>
            {loading ? (
              <div style={{ color: T.dim, fontSize: 12, display: "flex", gap: 6, alignItems: "center", padding: "6px 0" }}>
                <Loader2 size={13} className="animate-spin" /> Laden…
              </div>
            ) : selectedList.length === 0 ? (
              <div style={{ fontSize: 12, color: T.dim, padding: "4px 0" }}>Geen training gepland.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedList.map((t) => (
                  <button key={t.id} className="tc-mini" onClick={() => setEditing(t)}>
                    <span style={{ fontSize: 14 }}>{TRAINING_META[t.type].icon}</span>
                    <span style={{ flex: 1, textAlign: "left", fontSize: 12.5, fontWeight: 600, color: T.ink }}>
                      {t.title || TRAINING_META[t.type].label}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: TRAINING_META[t.type].color }}>{TRAINING_META[t.type].short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── UPCOMING ── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: T.sky, textTransform: "uppercase", marginBottom: 12 }}>
            Aankomende trainingen
          </div>
          {upcoming.length === 0 ? (
            <div style={{
              border: `1px dashed ${T.line}`, borderRadius: 12, padding: "26px 16px", textAlign: "center",
              color: T.dim, fontSize: 12.5,
            }}>
              Nog niks gepland. Tik op <b style={{ color: T.sky }}>+ Training</b> om te beginnen{playerFirstName ? `, ${playerFirstName}` : ""}.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map((t, i) => (
                <motion.div key={t.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  className="tc-up" onClick={() => setEditing(t)}>
                  <div className="tc-up-date" style={{ background: `${TRAINING_META[t.type].color}1c`, borderColor: `${TRAINING_META[t.type].color}40` }}>
                    <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 18, fontWeight: 700, color: TRAINING_META[t.type].color, lineHeight: 1 }}>
                      {parseInt(t.date.slice(8, 10), 10)}
                    </span>
                    <span style={{ fontSize: 8.5, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {MONTHS[parseInt(t.date.slice(5, 7), 10) - 1].slice(0, 3)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 12 }}>{TRAINING_META[t.type].icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.title || TRAINING_META[t.type].label}
                      </span>
                    </div>
                    <GoalLine icon={<Target size={11} />} label="Coach" value={t.coach_goal} color={T.sky} />
                    <GoalLine icon={<User size={11} />} label="Speler" value={t.player_goal} color="#2EC4A8" />
                  </div>
                  <ChevronRight size={15} style={{ color: T.dim, flexShrink: 0, alignSelf: "center" }} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(editing || creating) && (
          <TrainingForm
            training={editing}
            defaultDate={selected}
            isCoach={isCoach}
            onClose={() => { setEditing(null); setCreating(false); }}
            onSave={handleSave}
            onDelete={editing ? () => handleDelete(editing.id) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── goal line ── */
function GoalLine({ icon, label, value, color }: { icon: React.ReactNode; label: string; value?: string | null; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, lineHeight: 1.4, marginTop: 2 }}>
      <span style={{ color, display: "inline-flex", marginTop: 1 }}>{icon}</span>
      <span style={{ color: T.dim, fontWeight: 700, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: value ? T.sub : T.dim, fontStyle: value ? "normal" : "italic" }}>
        {value || "nog geen doel"}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FORM (add / edit) — bottom sheet
═══════════════════════════════════════════════ */
function TrainingForm({ training, defaultDate, isCoach, onClose, onSave, onDelete }: {
  training: Training | null;
  defaultDate: string;
  isCoach: boolean;
  onClose: () => void;
  onSave: (input: { date: string; type: TrainingType; title?: string; coach_goal?: string; player_goal?: string }, existing?: Training) => void;
  onDelete?: () => void;
}) {
  const [date, setDate] = useState(training?.date ?? defaultDate);
  const [type, setType] = useState<TrainingType>(training?.type ?? "team");
  const [title, setTitle] = useState(training?.title ?? "");
  const [coachGoal, setCoachGoal] = useState(training?.coach_goal ?? "");
  const [playerGoal, setPlayerGoal] = useState(training?.player_goal ?? "");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // lock background scroll while the sheet is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submit = () => {
    setSaving(true);
    onSave({ date, type, title: title.trim() || undefined, coach_goal: coachGoal.trim() || undefined, player_goal: playerGoal.trim() || undefined }, training ?? undefined);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(3,8,15,0.7)", backdropFilter: "blur(6px)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed", left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 2001,
          width: "min(520px, 100%)", maxHeight: "88dvh",
          overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain", touchAction: "pan-y",
          background: `linear-gradient(180deg, ${T.panel}, ${T.bg})`,
          borderTop: `1px solid ${T.lineHi}`, borderRadius: "20px 20px 0 0",
          boxShadow: "0 -24px 60px rgba(0,0,0,0.6)",
          padding: "20px 22px calc(28px + env(safe-area-inset-bottom, 0px))",
          fontFamily: "'Archivo', system-ui, sans-serif",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{training ? "Training bewerken" : "Nieuwe training"}</h3>
          <button className="tc-nav" onClick={onClose} aria-label="Sluiten"><X size={16} /></button>
        </div>

        {/* type chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {(Object.keys(TRAINING_META) as TrainingType[]).map((tt) => {
            const m = TRAINING_META[tt]; const on = type === tt;
            return (
              <button key={tt} onClick={() => setType(tt)} style={{
                display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 999,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: on ? `${m.color}22` : "transparent",
                border: `1px solid ${on ? m.color : T.line}`,
                color: on ? m.color : T.sub,
              }}>
                <span>{m.icon}</span>{m.label}
              </button>
            );
          })}
        </div>

        <Field label="Datum">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="tc-input" />
        </Field>
        <Field label="Titel (optioneel)">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="bv. Afronden onder druk" className="tc-input" />
        </Field>

        <Field label={<><Target size={12} style={{ verticalAlign: "-2px", color: T.sky }} /> Trainingsdoel — coach</>}>
          <textarea value={coachGoal} onChange={(e) => setCoachGoal(e.target.value)} rows={2}
            disabled={!isCoach}
            placeholder={isCoach ? "Wat wil je dat de speler leert?" : "Wordt door je coach ingevuld"}
            className="tc-input" style={{ resize: "vertical", opacity: isCoach ? 1 : 0.7 }} />
        </Field>
        <Field label={<><User size={12} style={{ verticalAlign: "-2px", color: "#2EC4A8" }} /> Mijn doel — speler</>}>
          <textarea value={playerGoal} onChange={(e) => setPlayerGoal(e.target.value)} rows={2}
            disabled={isCoach}
            placeholder={isCoach ? "Wordt door de speler ingevuld" : "Waar wil jij deze training aan werken?"}
            className="tc-input" style={{ resize: "vertical", opacity: isCoach ? 0.7 : 1 }} />
        </Field>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {onDelete && (
            <button onClick={onDelete} className="tc-btn-ghost" aria-label="Verwijderen"><Trash2 size={15} /></button>
          )}
          <button onClick={submit} disabled={saving} className="tc-btn-primary" style={{ flex: 1 }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : (training ? "Opslaan" : "Toevoegen")}
          </button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6, letterSpacing: "0.02em" }}>{label}</label>
      {children}
    </div>
  );
}

function labelForDate(dstr: string): string {
  const [y, m, d] = dstr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

/* ═══════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════ */
const CSS = `
  .tc-grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 20px 22px; position: relative; z-index: 1; }
  @media (max-width: 720px) { .tc-grid-layout { grid-template-columns: 1fr; gap: 20px; } }

  .tc-nav { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
    background: ${T.panel2}; border: 1px solid ${T.line}; color: ${T.sub}; cursor: pointer; transition: all 0.15s; }
  .tc-nav:hover { color: ${T.sky}; border-color: ${T.lineHi}; }

  .tc-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 6px; }
  .tc-wd { text-align: center; font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; color: ${T.dim}; text-transform: uppercase; }
  .tc-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
  .tc-day { aspect-ratio: 1 / 1; border-radius: 9px; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.2s; padding: 0; }
  .tc-dots { display: flex; gap: 2px; }

  .tc-add-sm { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; cursor: pointer;
    padding: 5px 10px; border-radius: 999px; background: ${T.sky}22; border: 1px solid ${T.sky}44; color: ${T.sky}; }
  .tc-mini { display: flex; align-items: center; gap: 9px; width: 100%; padding: 9px 11px; border-radius: 10px;
    background: ${T.panel2}; border: 1px solid ${T.line}; cursor: pointer; transition: border-color 0.15s; }
  .tc-mini:hover { border-color: ${T.lineHi}; }

  .tc-up { display: flex; align-items: stretch; gap: 12px; padding: 12px; border-radius: 13px;
    background: ${T.panel2}; border: 1px solid ${T.line}; cursor: pointer; transition: transform 0.18s, border-color 0.18s; }
  .tc-up:hover { transform: translateY(-2px); border-color: ${T.lineHi}; }
  .tc-up-date { flex-shrink: 0; width: 46px; border-radius: 10px; border: 1px solid; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 1px; }

  .tc-input { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 10px; font-size: 13px;
    background: ${T.panel2}; border: 1px solid ${T.line}; color: ${T.ink}; font-family: inherit; outline: none; }
  .tc-input:focus { border-color: ${T.sky}; }
  .tc-input::placeholder { color: ${T.dim}; }

  .tc-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, ${T.sky}, ${T.blue}); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; border: none; }
  .tc-btn-ghost { width: 44px; height: 44px; border-radius: 12px; background: transparent; border: 1px solid rgba(224,80,96,0.4);
    color: #E0555C; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
`;
