"use client";

// ============================================================
//  SHIELD BADGE — clubstijl schildbadge (zoals profclub-apps).
//  Generiek bruikbaar voor MBTI-types én challenge-badges.
// ============================================================

import { MBTI_PROFILES, type MbtiCode } from "@/lib/mbti";

/* Klassiek schild: punt onder, rechte schouders */
const SHIELD_PATH = "M50 2 L94 14 V60 C94 86 74 104 50 114 C26 104 6 86 6 60 V14 Z";
const INNER_PATH  = "M50 10 L86 20 V59 C86 81 69 96 50 105 C31 96 14 81 14 59 V20 Z";

interface ShieldBadgeProps {
  color: string;
  icon?: React.ReactNode;          // emoji of lucide-icoon
  label?: string;                  // korte tekst in het schild (bijv. MBTI-code of aantal)
  size?: number;                   // breedte in px
  earned?: boolean;                // false → grijs/vergrendeld
}

export function ShieldBadge({ color, icon, label, size = 64, earned = true }: ShieldBadgeProps) {
  const uid = `${color}-${size}-${earned}`.replace(/[^a-z0-9]/gi, "s");
  const c = earned ? color : "#C6CBD3";
  const h = size * 1.16;

  return (
    <svg width={size} height={h} viewBox="0 0 100 116" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sh-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c} stopOpacity={earned ? 1 : 0.55} />
          <stop offset="100%" stopColor={c} stopOpacity={earned ? 0.72 : 0.35} />
        </linearGradient>
      </defs>
      <path d={SHIELD_PATH} fill={`url(#sh-${uid})`} />
      <path d={INNER_PATH} fill="none" stroke="#fff" strokeOpacity={earned ? 0.85 : 0.6} strokeWidth={2.5} />
      {/* subtiele diagonale glans */}
      {earned && <path d="M50 2 L94 14 V38 L6 26 V14 Z" fill="#fff" opacity={0.10} />}
      {icon != null && (
        <text x="50" y={label ? 52 : 62} textAnchor="middle" fontSize={label ? 30 : 36}
          dominantBaseline="middle" style={{ filter: earned ? "none" : "grayscale(1)" }} opacity={earned ? 1 : 0.75}>
          {icon}
        </text>
      )}
      {label && (
        <text x="50" y="82" textAnchor="middle" fontSize="19" fontWeight="700" fill="#fff"
          style={{ fontFamily: "'Oswald','Archivo Narrow',sans-serif", letterSpacing: "0.05em" }}>
          {label}
        </text>
      )}
    </svg>
  );
}

/* ── MBTI-schild: het type als clubbadge ── */
interface MbtiShieldProps {
  code: string;                    // MBTI-code, wordt gevalideerd
  size?: number;
  showName?: boolean;              // nickname + code naast het schild
}

export function MbtiShield({ code, size = 56, showName = false }: MbtiShieldProps) {
  const p = code in MBTI_PROFILES ? MBTI_PROFILES[code as MbtiCode] : null;
  if (!p) return null;

  const shield = <ShieldBadge color={p.color} icon={p.icon} label={p.code} size={size} />;
  if (!showName) return shield;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {shield}
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span className="display-font" style={{ fontSize: size * 0.28, fontWeight: 600, color: p.color }}>{p.code}</span>
        <span style={{ fontSize: size * 0.22, fontWeight: 700, color: "var(--text, #0D1B2A)" }}>{p.nickname}</span>
      </span>
    </span>
  );
}
