"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ChevronDown, ArrowLeft } from "lucide-react";

// Bypass edge cache
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   ───────────────────────────────────────────────────────── */

const SEASONS = ["2026", "2025", "2024"] as const;

const PLAYER = {
  first_name: "Joy",
  last_name: "Schoonhoven",
  position: "Aanvallende Middenvelder / Spits",
  bio_lead: "Joy tekende in 2024 bij SFA voor een rol als creatief hart van het A1 elftal.",
  bio: "Joy Schoonhoven is een Nederlandse middenvelder die de routes ziet die anderen missen. Zijn combinatie van techniek, spelinzicht en killer-mentaliteit maakt hem het zenuwcentrum van de Schoonhoven Sports Academy A-selectie.",
  date_of_birth: "12/03/2008",
  place_of_birth: "Schoonhoven, Nederland",
  height: "1.78 m (5 ft 10 in)",
};

const ATTRIBUTES = [
  { label: "PACE",      value: 8.5 },
  { label: "SHOOTING",  value: 8.7 },
  { label: "PASSING",   value: 9.2 },
  { label: "DRIBBLING", value: 8.9 },
  { label: "DEFENDING", value: 6.2 },
  { label: "FORM",      value: 8.4 },
  { label: "HEALTH",    value: 9.0 },
];

const FOOT_STATS = [
  { label: "RIGHT FOOT", value: 9.1 },
  { label: "LEFT FOOT",  value: 6.4 },
  { label: "SKILLS",     value: 8.7 },
  { label: "WORK RATE",  value: 8.3 },
];

/* ─────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────── */

export default function PlayerCardDesignPage() {
  const [season, setSeason] = useState<(typeof SEASONS)[number]>("2026");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#E5E7EB",
      padding: "40px 24px",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    }}>
      {/* Top: back link */}
      <div style={{ maxWidth: 1200, margin: "0 auto 16px" }}>
        <Link href="/design" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "#6B7280", textDecoration: "none",
          letterSpacing: "0.02em",
        }}>
          <ArrowLeft size={14} /> Design preview
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          HERO CARD
          ═══════════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        background: "#0D1B2A",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(13,27,42,0.35), 0 8px 24px rgba(13,27,42,0.15)",
        position: "relative",
        display: "grid",
        gridTemplateColumns: "76px 1fr",
        minHeight: 700,
      }}>
        {/* ── LEFT RAIL ── */}
        <aside style={{
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
          gap: 24,
        }}>
          {/* Hamburger */}
          <button style={{
            width: 44, height: 44, borderRadius: 6,
            background: "#1B6CA8", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer",
          }}>
            <Menu size={20} />
          </button>
          {/* Club crest (SFA logo) */}
          <div style={{
            width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <SFACrest size={36} />
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ position: "relative" }}>
          {/* Stadium ambient backdrop */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse at 60% 40%, rgba(27,108,168,0.18) 0%, transparent 55%),
              radial-gradient(ellipse at 90% 80%, rgba(77,174,229,0.1) 0%, transparent 50%),
              linear-gradient(180deg, rgba(13,27,42,0) 0%, rgba(7,16,26,0.6) 100%)
            `,
            pointerEvents: "none",
          }} />

          {/* Subtle stadium light streaks */}
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}
            viewBox="0 0 1000 700"
            preserveAspectRatio="none"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i}
                x1={i * 100}
                y1={0}
                x2={i * 100 + 200}
                y2={700}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </svg>

          {/* === Year tabs + Performance selector === */}
          <header style={{
            position: "relative",
            padding: "26px 36px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 5,
          }}>
            <div style={{ display: "flex", gap: 28 }}>
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 15, fontWeight: 600,
                    color: season === s ? "#fff" : "rgba(255,255,255,0.4)",
                    letterSpacing: "-0.01em",
                    padding: 0,
                  }}
                >
                  <span style={{
                    width: 12, height: 12, borderRadius: "50%",
                    border: `1.5px solid ${season === s ? "#4DAEE5" : "rgba(255,255,255,0.3)"}`,
                    background: season === s ? "#4DAEE5" : "transparent",
                    display: "inline-block",
                    boxShadow: season === s ? "0 0 0 3px rgba(77,174,229,0.18)" : "none",
                  }} />
                  {s}
                </button>
              ))}
            </div>

            <button style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "8px 18px",
              borderRadius: 999,
              background: "transparent",
              border: "1.5px solid rgba(77,174,229,0.5)",
              color: "#fff",
              fontSize: 13, fontWeight: 500,
              cursor: "pointer",
            }}>
              Performance
              <ChevronDown size={14} />
            </button>
          </header>

          {/* === Body — 3 column grid: text | photo | radar === */}
          <div style={{
            position: "relative",
            padding: "40px 36px 60px",
            display: "grid",
            gridTemplateColumns: "minmax(260px, 1fr) minmax(280px, 380px) minmax(360px, 1fr)",
            gap: 0,
            zIndex: 5,
          }}>
            {/* ── LEFT: TEXT + IDENTITY STATS ── */}
            <div style={{ position: "relative", paddingRight: 20, zIndex: 6 }}>
              <h1 style={{
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                color: "#fff",
                marginBottom: 10,
                textTransform: "uppercase",
              }}>
                {PLAYER.first_name} {PLAYER.last_name}
              </h1>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#4DAEE5",
                textTransform: "uppercase",
                marginBottom: 28,
              }}>
                {PLAYER.position}
              </div>

              <p style={{
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.45,
                color: "#fff",
                marginBottom: 14,
              }}>
                {PLAYER.bio_lead}
              </p>
              <p style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.72)",
                marginBottom: 40,
              }}>
                {PLAYER.bio}
              </p>

              {/* Identity stats */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                color: "#fff",
              }}>
                <IdentityStat label="Date of Birth" value={PLAYER.date_of_birth} />
                <IdentityStat label="Place of Birth" value={PLAYER.place_of_birth} />
                <IdentityStat label="Height" value={PLAYER.height} />
              </div>
            </div>

            {/* ── MIDDLE: CUTOUT PHOTO ── */}
            <div style={{
              position: "relative",
              minHeight: 580,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              zIndex: 4,
            }}>
              <div style={{
                position: "absolute",
                top: -20,
                left: "50%",
                transform: "translateX(-50%)",
                width: "115%",
                height: "calc(100% + 60px)",
                pointerEvents: "none",
                maxWidth: 440,
              }}>
                <PlayerSilhouette />
              </div>
            </div>

            {/* ── RIGHT: RADAR + STAT BARS ── */}
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              zIndex: 5,
            }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <BigRadar attrs={ATTRIBUTES} />
              </div>

              {/* Stat bars (2x2 grid) */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: 40,
                rowGap: 24,
                marginTop: 30,
              }}>
                {FOOT_STATS.map((s) => (
                  <FootStat key={s.label} {...s} />
                ))}
              </div>

              {/* Competition badge bottom right */}
              <div style={{
                marginTop: 30,
                display: "inline-flex", alignItems: "center", gap: 8,
                alignSelf: "flex-end",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg, #F0A500, #B07700)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "#0D1B2A",
                  letterSpacing: "-0.02em",
                }}>
                  SFA
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: "#fff",
                  letterSpacing: "0.04em",
                }}>
                  Schoonhoven Sports Academy
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Helper note ── */}
      <div style={{
        maxWidth: 1200,
        margin: "20px auto 0",
        padding: "16px 20px",
        borderRadius: 10,
        background: "#fff",
        border: "1px solid #E5E7EB",
        fontSize: 12,
        color: "#6B7280",
        lineHeight: 1.6,
      }}>
        <strong style={{ color: "#1B6CA8" }}>Cutout demo:</strong> nu een SVG silhouet als placeholder.
        In productie wordt elke speler-foto automatisch uitgeknipt via{" "}
        <code style={{ background: "#F4F5F7", padding: "1px 5px", borderRadius: 3 }}>
          @imgly/background-removal
        </code>{" "}
        (al geïnstalleerd in <code>AvatarUpload.tsx</code>). Coach uploadt gewone foto → cutout
        rendert automatisch tussen tekst en radar.
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────────────────────────── */

function IdentityStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: "rgba(255,255,255,0.95)",
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 13,
        color: "rgba(255,255,255,0.6)",
        fontWeight: 500,
      }}>
        {value}
      </div>
    </div>
  );
}

function FootStat({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  return (
    <div>
      <div style={{
        fontSize: 13,
        fontStyle: "italic",
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: "#fff",
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {/* filled portion */}
        <div style={{
          height: 3,
          flex: pct / 100,
          background: "linear-gradient(90deg, #1B6CA8, #4DAEE5)",
          borderRadius: 999,
          boxShadow: "0 0 8px rgba(77,174,229,0.6)",
        }} />
        {/* empty portion */}
        <div style={{
          height: 3,
          flex: (100 - pct) / 100,
          background: "rgba(255,255,255,0.18)",
          borderRadius: 999,
        }} />
      </div>
    </div>
  );
}

function SFACrest({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" style={{ display: "block" }}>
      <defs>
        <linearGradient id="crestGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B6CA8" />
          <stop offset="100%" stopColor="#0D1B2A" />
        </linearGradient>
      </defs>
      {/* Shield */}
      <path
        d="M 18 2 L 32 6 L 32 18 C 32 26 26 32 18 34 C 10 32 4 26 4 18 L 4 6 Z"
        fill="url(#crestGrad)"
        stroke="#F0A500"
        strokeWidth={1.2}
      />
      {/* SFA */}
      <text
        x="18"
        y="22"
        fontSize="9"
        fontWeight="900"
        textAnchor="middle"
        fill="#F0A500"
        style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", letterSpacing: "0.08em" }}
      >
        SFA
      </text>
    </svg>
  );
}

/**
 * Player silhouette placeholder — represents where the
 * background-removed cutout photo would render in production.
 */
function PlayerSilhouette() {
  return (
    <svg viewBox="0 0 400 600" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="bodyGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#E6F4FC" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="kitGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ground" cx="0.5" cy="1" r="0.5">
          <stop offset="0%" stopColor="#0D1B2A" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="200" cy="580" rx="120" ry="20" fill="url(#ground)" />

      {/* Body — running pose */}
      <g transform="translate(60, 40)">
        {/* Head */}
        <ellipse cx="160" cy="42" rx="34" ry="40" fill="url(#bodyGrad)" />
        {/* Hair shadow on top of head */}
        <path d="M 130 30 Q 160 -5 195 25 Q 200 38 192 45 Q 175 30 145 35 Z" fill="#fff" opacity="0.55" />

        {/* Neck */}
        <path d="M 145 80 L 178 80 L 180 100 L 142 100 Z" fill="url(#bodyGrad)" />

        {/* Shirt/Torso (running motion, twisted) */}
        <path
          d="M 80 110
             Q 130 95 145 100
             L 178 100
             Q 220 105 250 130
             Q 260 145 248 160
             L 220 180
             Q 200 240 210 290
             Q 195 310 170 305
             L 140 308
             Q 110 305 100 280
             Q 95 220 85 175
             Q 60 145 80 110 Z"
          fill="url(#kitGrad)"
        />
        {/* Number on chest */}
        <text x="170" y="190" fontSize="34" fontWeight="900" fill="#1B6CA8" textAnchor="middle" opacity="0.45"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>10</text>

        {/* Right arm extended forward */}
        <path
          d="M 80 130
             Q 50 140 30 165
             Q 18 185 15 210
             Q 20 220 35 215
             Q 50 195 65 175
             Q 78 158 88 145 Z"
          fill="url(#bodyGrad)"
        />

        {/* Left arm back, bent */}
        <path
          d="M 250 130
             Q 285 140 305 175
             Q 312 195 305 215
             Q 290 220 280 200
             Q 270 185 258 168 Z"
          fill="url(#bodyGrad)"
        />

        {/* Shorts */}
        <path
          d="M 100 300
             L 215 300
             L 230 380
             L 195 385
             L 175 320
             L 155 320
             L 140 385
             L 100 380 Z"
          fill="url(#kitGrad)"
        />

        {/* Front leg (stride) */}
        <path
          d="M 100 380
             Q 80 430 70 480
             Q 65 510 80 520
             Q 100 525 110 510
             Q 130 455 140 410
             Q 145 392 140 385 Z"
          fill="url(#bodyGrad)"
        />

        {/* Back leg (push) */}
        <path
          d="M 195 385
             Q 220 410 240 450
             Q 245 470 235 485
             Q 220 490 210 475
             Q 195 440 185 420
             Q 180 405 195 385 Z"
          fill="url(#bodyGrad)"
        />

        {/* Front foot */}
        <ellipse cx="92" cy="525" rx="22" ry="9" fill="#0D1B2A" opacity="0.75" />
        {/* Back foot */}
        <ellipse cx="240" cy="490" rx="22" ry="9" fill="#0D1B2A" opacity="0.75" />
      </g>
    </svg>
  );
}

function BigRadar({ attrs }: { attrs: typeof ATTRIBUTES }) {
  const size = 440;
  const cx = size / 2;
  const cy = size / 2;
  const R = 150;
  const n = attrs.length;

  const points = attrs.map((a, i) => {
    const ratio = a.value / 10;
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * R * ratio,
      y: cy + Math.sin(angle) * R * ratio,
    };
  });

  const labelPoints = attrs.map((_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * (R + 32),
      y: cy + Math.sin(angle) * (R + 32),
      angle,
    };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B6CA8" stopOpacity="1" />
          <stop offset="100%" stopColor="#1B6CA8" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Grid circles (concentric) */}
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <circle
          key={ring}
          cx={cx}
          cy={cy}
          r={R * ring}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={ring === 1 ? 1.5 : 1}
        />
      ))}

      {/* Filled polygon (solid blue) */}
      <path d={path} fill="url(#radarFill)" stroke="#4DAEE5" strokeWidth={2} />

      {/* Labels */}
      {labelPoints.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          fontSize={13}
          fill="#fff"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontWeight: 600,
            letterSpacing: "0.08em",
          }}
        >
          {attrs[i].label}
        </text>
      ))}
    </svg>
  );
}
