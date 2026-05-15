"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin } from "lucide-react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { POSITION_LABELS } from "@/lib/types";
import type { PlayerWithDetails, PositionType } from "@/lib/types";

/* ─────────────────────────────────────────────────────────
   FOOTBALL FIELD COORDINATES (relative %)
   Each position has an x/y center where it operates.
   ───────────────────────────────────────────────────────── */
const POSITION_ZONES: Record<PositionType, { x: number; y: number; w: number; h: number }> = {
  GK:  { x: 50, y: 92, w: 18, h: 14 },
  CB:  { x: 50, y: 78, w: 30, h: 14 },
  LB:  { x: 18, y: 76, w: 16, h: 24 },
  RB:  { x: 82, y: 76, w: 16, h: 24 },
  CDM: { x: 50, y: 60, w: 30, h: 14 },
  CM:  { x: 50, y: 48, w: 36, h: 18 },
  CAM: { x: 50, y: 34, w: 30, h: 14 },
  LW:  { x: 18, y: 26, w: 18, h: 24 },
  RW:  { x: 82, y: 26, w: 18, h: 24 },
  ST:  { x: 50, y: 14, w: 26, h: 14 },
  SS:  { x: 50, y: 22, w: 24, h: 14 },
};

export default function HeatmapPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getMyPlayerData();
      setPlayer(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#4DAEE5" }} />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-12">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Geen spelersgegevens</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Vul eerst je profiel aan.</p>
        <Link href="/onboarding" className="btn-primary">Naar onboarding</Link>
      </div>
    );
  }

  // ── Aggregate: count how often each position was assessed in evaluations ──
  const evals = player.evaluations ?? [];
  const positionCounts: Partial<Record<PositionType, number>> = {};

  evals.forEach(ev => {
    if (ev.assessed_position) {
      const p = ev.assessed_position as PositionType;
      positionCounts[p] = (positionCounts[p] ?? 0) + 1;
    }
  });

  // Always include the player's own primary + secondary position with high weight
  positionCounts[player.position] = (positionCounts[player.position] ?? 0) + 5;
  if (player.secondary_position) {
    positionCounts[player.secondary_position] = (positionCounts[player.secondary_position] ?? 0) + 2;
  }

  const maxCount = Math.max(...Object.values(positionCounts) as number[], 1);

  // Sort by frequency
  const ranked = (Object.entries(positionCounts) as [PositionType, number][])
    .sort((a, b) => b[1] - a[1]);

  return (
    <div style={{
      margin: "-28px -28px -40px",
      minHeight: "calc(100vh - 52px)",
      background: "#0A0E14",
      color: "#fff",
      padding: "32px 24px 60px",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .hm-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      ` }} />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 10, letterSpacing: "0.14em", fontWeight: 700,
            color: "#4DAEE5", textTransform: "uppercase", marginBottom: 12,
          }}>
            <MapPin size={11} /> Posities · Sterke zones
          </div>
          <h1 style={{
            fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em",
            lineHeight: 1, marginBottom: 8,
          }}>
            Hier ben jij goed
          </h1>
          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.5)",
            lineHeight: 1.55, maxWidth: 580,
          }}>
            Gebaseerd op jouw geregistreerde positie + waar je coach jou observeerde tijdens evaluaties.
            Hoe vaker een zone is gemarkeerd, hoe sterker hij oplicht.
          </p>
        </div>

        <div className="hm-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 40,
          alignItems: "start",
        }}>
          {/* ── FIELD ── */}
          <FootballField positionCounts={positionCounts} maxCount={maxCount} primary={player.position} secondary={player.secondary_position} />

          {/* ── SIDEBAR — ranking ── */}
          <aside>
            <SidebarHeader title="Positie Ranking" sub="Posities op basis van invoer" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ranked.length === 0 ? (
                <EmptyState />
              ) : ranked.map(([pos, count], i) => {
                const isPrimary = pos === player.position;
                const isSecondary = pos === player.secondary_position;
                const intensity = count / maxCount;
                return (
                  <div key={pos} style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: isPrimary
                      ? "rgba(240,165,0,0.08)"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isPrimary ? "rgba(240,165,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{
                      fontSize: 10, fontFamily: '"Inter", system-ui, sans-serif',
                      color: "rgba(255,255,255,0.3)", width: 18,
                    }}>
                      0{i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 14, fontWeight: 700,
                          color: isPrimary ? "#F0A500" : "rgba(255,255,255,0.92)",
                          letterSpacing: "-0.01em",
                        }}>
                          {pos}
                        </span>
                        {isPrimary && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                            padding: "1px 6px", borderRadius: 3,
                            background: "rgba(240,165,0,0.15)", color: "#F0A500",
                            textTransform: "uppercase",
                          }}>
                            Primair
                          </span>
                        )}
                        {isSecondary && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                            padding: "1px 6px", borderRadius: 3,
                            background: "rgba(77,174,229,0.15)", color: "#4DAEE5",
                            textTransform: "uppercase",
                          }}>
                            Secundair
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 11, color: "rgba(255,255,255,0.5)",
                      }}>
                        {POSITION_LABELS[pos]}
                      </div>
                      <div style={{
                        height: 2, borderRadius: 999,
                        background: "rgba(255,255,255,0.05)",
                        overflow: "hidden", marginTop: 8,
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${intensity * 100}%`,
                          background: isPrimary ? "#F0A500" : "#4DAEE5",
                          borderRadius: 999,
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 20, padding: 14,
              borderRadius: 10,
              background: "rgba(77,174,229,0.04)",
              border: "1px dashed rgba(77,174,229,0.2)",
              fontSize: 11, lineHeight: 1.55,
              color: "rgba(255,255,255,0.55)",
            }}>
              <strong style={{ color: "#4DAEE5" }}>Hoe wordt dit gevuld?</strong><br />
              • Jouw primaire + secundaire positie (uit profiel)<br />
              • Elke evaluatie waarin coach een positie aangeeft<br />
              • Geen GPS / tracking betrokken — puur op observatie.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────────────────────────── */

function SidebarHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{
        fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em",
        color: "#fff", marginBottom: 4,
      }}>
        {title}
      </h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{sub}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: "32px 20px",
      textAlign: "center",
      borderRadius: 12,
      border: "1px dashed rgba(255,255,255,0.1)",
      color: "rgba(255,255,255,0.5)",
      fontSize: 12, lineHeight: 1.55,
    }}>
      Nog geen positie-data.<br />
      Vraag je coach om de eerste evaluatie.
    </div>
  );
}

function FootballField({
  positionCounts, maxCount, primary, secondary,
}: {
  positionCounts: Partial<Record<PositionType, number>>;
  maxCount: number;
  primary: PositionType;
  secondary?: PositionType;
}) {
  return (
    <div style={{
      position: "relative",
      aspectRatio: "0.65 / 1",
      maxHeight: 720,
      borderRadius: 16,
      overflow: "hidden",
      background: "linear-gradient(180deg, #163e1f 0%, #0e2914 100%)",
      boxShadow: "0 16px 48px rgba(0,0,0,0.3), inset 0 0 80px rgba(0,0,0,0.5)",
    }}>
      {/* Field markings */}
      <svg
        viewBox="0 0 100 154"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* Subtle vertical lawn stripes */}
        {Array.from({ length: 7 }).map((_, i) => (
          <rect key={i} x={0} y={i * 22} width={100} height={11}
            fill="rgba(255,255,255,0.02)" />
        ))}

        {/* Outer line */}
        <rect x={3} y={3} width={94} height={148} fill="none"
          stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />

        {/* Halfway line */}
        <line x1={3} y1={77} x2={97} y2={77}
          stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />

        {/* Center circle + dot */}
        <circle cx={50} cy={77} r={10}
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <circle cx={50} cy={77} r={0.7} fill="rgba(255,255,255,0.5)" />

        {/* Top penalty area */}
        <rect x={26} y={3} width={48} height={18}
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <rect x={38} y={3} width={24} height={7}
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <circle cx={50} cy={14} r={0.7} fill="rgba(255,255,255,0.5)" />

        {/* Bottom penalty area */}
        <rect x={26} y={133} width={48} height={18}
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <rect x={38} y={144} width={24} height={7}
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <circle cx={50} cy={140} r={0.7} fill="rgba(255,255,255,0.5)" />
      </svg>

      {/* Heat zones */}
      {(Object.entries(positionCounts) as [PositionType, number][]).map(([pos, count]) => {
        const zone = POSITION_ZONES[pos];
        if (!zone) return null;
        const intensity = count / maxCount;
        const isPrimary = pos === primary;
        const isSecondary = pos === secondary;
        const color = isPrimary ? "#F0A500" : isSecondary ? "#4DAEE5" : "#4DAEE5";
        const baseOpacity = isPrimary ? 0.85 : 0.6;
        return (
          <div
            key={pos}
            style={{
              position: "absolute",
              left: `${zone.x - zone.w / 2}%`,
              top: `${zone.y - zone.h / 2}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}${Math.round(intensity * baseOpacity * 100).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
              filter: `blur(${(1 - intensity) * 4}px)`,
            }}
          >
            <div style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: isPrimary
                ? "rgba(240,165,0,0.95)"
                : "rgba(13,27,42,0.85)",
              backdropFilter: "blur(10px)",
              border: `1px solid ${isPrimary ? "#F0A500" : "rgba(77,174,229,0.4)"}`,
              fontSize: 11,
              fontWeight: 700,
              color: isPrimary ? "#0D1B2A" : "#fff",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}>
              {pos}
              {count > 1 && (
                <span style={{
                  marginLeft: 6,
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: 10,
                  opacity: 0.8,
                }}>
                  ×{count}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
