"use client";

// ============================================================
//  SLOT BOOKING — speler ziet de beschikbare momenten van de
//  trainer en plant zichzelf in (of schrijft zich weer uit).
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { Clock, Check, Loader2, CalendarDays } from "lucide-react";
import { listSlots, bookSlot, cancelBooking, fmtTime, type CoachSlot } from "@/lib/agenda";
import { todayISO } from "@/lib/trainings";

export function SlotBooking({ playerId }: { playerId: string }) {
  const [slots, setSlots] = useState<CoachSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const s = await listSlots(todayISO());
    setSlots(s); setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function toggle(slot: CoachSlot, mine: boolean) {
    setBusy(slot.id); setMsg(null);
    if (mine) {
      await cancelBooking(slot.id, playerId);
    } else {
      const r = await bookSlot(slot.id, playerId);
      if (!r.ok) setMsg(r.error ?? "Inschrijven mislukt");
    }
    await reload();
    setBusy(null);
  }

  if (loading) return null;
  if (slots.length === 0) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #0D1B2A 0%, #14263A 100%)",
      border: "1px solid rgba(77,174,229,0.25)", borderRadius: 18, padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <CalendarDays size={16} style={{ color: "#4DAEE5" }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
          Train met de trainer
        </span>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>
        De trainer heeft deze momenten opengezet — plan jezelf in.
      </p>

      {msg && <div style={{ fontSize: 12, color: "#FF8A8A", marginBottom: 10 }}>{msg}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slots.slice(0, 6).map((s) => {
          const mine = s.bookings.some((b) => b.player_id === playerId);
          const full = !mine && s.bookings.length >= s.capacity;
          const isBusy = busy === s.id;
          return (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
              borderRadius: 12, background: "rgba(255,255,255,0.05)",
              border: `1px solid ${mine ? "rgba(51,196,129,0.45)" : "rgba(255,255,255,0.09)"}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", textTransform: "capitalize" }}>
                  {new Date(s.date + "T12:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={11} /> {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                  {s.note && <span>· {s.note}</span>}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", flexShrink: 0, fontFeatureSettings: '"tnum" 1' }}>
                {s.bookings.length}/{s.capacity}
              </span>
              <button
                onClick={() => toggle(s, mine)}
                disabled={full || isBusy}
                style={{
                  height: 32, padding: "0 14px", borderRadius: 9, flexShrink: 0,
                  fontSize: 12, fontWeight: 700, cursor: full || isBusy ? "default" : "pointer",
                  background: mine ? "rgba(51,196,129,0.18)" : full ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #4DAEE5, #1B6CA8)",
                  color: mine ? "#33C481" : full ? "rgba(255,255,255,0.35)" : "#fff",
                  border: mine ? "1px solid rgba(51,196,129,0.4)" : "none",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                {isBusy ? <Loader2 size={12} className="animate-spin" />
                  : mine ? <><Check size={12} /> Ingepland</>
                  : full ? "Vol"
                  : "Plan in"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
