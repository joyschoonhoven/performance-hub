"use client";

// ============================================================
//  SHIELD BADGE — clubstijl schildbadge (zoals profclub-apps).
//  Generiek bruikbaar voor MBTI-types én challenge-badges.
// ============================================================

import { MBTI_PROFILES, type MbtiCode } from "@/lib/mbti";

/* Klassiek schild: punt onder, rechte schouders */
const SHIELD_PATH = "M50 2 L94 14 V60 C94 86 74 104 50 114 C26 104 6 86 6 60 V14 Z";
const INNER_PATH  = "M50 10 L86 20 V59 C86 81 69 96 50 105 C31 96 14 81 14 59 V20 Z";

export type CrestPattern = "plain" | "chevron" | "stripes" | "rays" | "star" | "laurel";

interface ShieldBadgeProps {
  color: string;
  icon?: React.ReactNode;          // emoji of lucide-icoon
  label?: string;                  // korte tekst in het schild (bijv. MBTI-code of aantal)
  size?: number;                   // breedte in px
  earned?: boolean;                // false → grijs/vergrendeld
  crest?: CrestPattern;            // heraldisch patroon in het schild
}

/* Heraldische patronen — subtiel wit over de schildkleur */
function Crest({ crest, o }: { crest: CrestPattern; o: number }) {
  switch (crest) {
    case "chevron":
      return (
        <g fill="#fff" opacity={o}>
          <path d="M14 52 L50 32 L86 52 L86 42 L50 22 L14 42 Z" />
          <path d="M14 66 L50 46 L86 66 L86 58 L50 38 L14 58 Z" opacity={0.55} />
        </g>
      );
    case "stripes":
      return (
        <g fill="#fff" opacity={o}>
          <path d="M30 12 L38 14 L38 106 L30 101 Z" />
          <path d="M62 14 L70 12 L70 101 L62 106 Z" />
        </g>
      );
    case "rays":
      return (
        <g stroke="#fff" strokeWidth={3} opacity={o} strokeLinecap="round">
          <line x1="50" y1="58" x2="24" y2="26" /><line x1="50" y1="58" x2="50" y2="18" />
          <line x1="50" y1="58" x2="76" y2="26" /><line x1="50" y1="58" x2="30" y2="44" />
          <line x1="50" y1="58" x2="70" y2="44" />
        </g>
      );
    case "star":
      return (
        <path fill="#fff" opacity={o}
          d="M50 24 L55.5 40 H72 L59 50 L64 66 L50 56 L36 66 L41 50 L28 40 H44.5 Z" />
      );
    case "laurel":
      return (
        <g fill="none" stroke="#fff" strokeWidth={2.5} opacity={o} strokeLinecap="round">
          <path d="M26 72 C20 58 22 42 32 30" />
          <path d="M74 72 C80 58 78 42 68 30" />
          <path d="M28 66 l-7 2 M27 54 l-7 0 M30 42 l-6 -3 M35 33 l-4 -5" />
          <path d="M72 66 l7 2 M73 54 l7 0 M70 42 l6 -3 M65 33 l4 -5" />
        </g>
      );
    default:
      return null;
  }
}

export function ShieldBadge({ color, icon, label, size = 64, earned = true, crest = "plain" }: ShieldBadgeProps) {
  const uid = `${color}-${size}-${earned}-${crest}`.replace(/[^a-z0-9]/gi, "s");
  const c = earned ? color : "#C6CBD3";
  const h = size * 1.16;

  return (
    <svg width={size} height={h} viewBox="0 0 100 116" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sh-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c} stopOpacity={earned ? 1 : 0.55} />
          <stop offset="100%" stopColor={c} stopOpacity={earned ? 0.72 : 0.35} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}><path d={SHIELD_PATH} /></clipPath>
      </defs>
      <path d={SHIELD_PATH} fill={`url(#sh-${uid})`} />
      <g clipPath={`url(#clip-${uid})`}>
        <Crest crest={crest} o={earned ? 0.22 : 0.14} />
      </g>
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
        <text x="50" y={icon != null ? 82 : 66} textAnchor="middle"
          fontSize={icon != null ? 19 : label.length > 3 ? 22 : 28} fontWeight="700" fill="#fff"
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
