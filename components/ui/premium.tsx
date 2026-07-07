"use client";

import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════
   SFA PREMIUM KIT — shared light design language
   (matches the player home dashboard)
═══════════════════════════════════════════════ */
export const SFA = {
  page:   "#F4F7FA",
  card:   "#FFFFFF",
  ink:    "#0D1B2A",
  sub:    "#5A6B80",
  dim:    "#9BAABB",
  line:   "rgba(13,27,42,0.09)",
  lineHi: "rgba(13,27,42,0.16)",
  blue:   "#1B6CA8",
  sky:    "#4DAEE5",
  green:  "#2E9E6B",
  gold:   "#F0A500",
  red:    "#D64045",
  track:  "rgba(13,27,42,0.10)",
} as const;

/* Inject once per page via <style dangerouslySetInnerHTML={{__html: PREMIUM_CSS}} /> */
export const PREMIUM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Archivo+Narrow:wght@600;700&display=swap');
  :root { --pv-sans:'Archivo',system-ui,sans-serif; --pv-num:'Archivo Narrow','Archivo',sans-serif; }

  .pv-root { font-family: var(--pv-sans); color: ${SFA.ink}; }
  .pv-wrap { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }

  .pv-card {
    background: ${SFA.card}; border: 1px solid ${SFA.line}; border-radius: 14px;
    box-shadow: 0 1px 2px rgba(13,27,42,0.04);
  }
  .pv-card.notch { clip-path: polygon(0 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%); }
  .pv-hover { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease; }
  .pv-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(27,108,168,0.13); }

  .pv-eyebrow { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; color: ${SFA.blue}; text-transform: uppercase; }
  .pv-h1 { font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: ${SFA.ink}; line-height: 1.05; }
  .pv-sub { font-size: 13px; color: ${SFA.sub}; }
  .pv-label { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: ${SFA.dim}; text-transform: uppercase; }
  .pv-num { font-family: var(--pv-num); }

  .pv-input {
    width: 100%; box-sizing: border-box; padding: 11px 13px; border-radius: 10px; font-size: 14px;
    background: ${SFA.card}; border: 1px solid ${SFA.line}; color: ${SFA.ink}; font-family: inherit; outline: none;
    transition: border-color 0.15s;
  }
  .pv-input:focus { border-color: ${SFA.sky}; box-shadow: 0 0 0 3px rgba(77,174,229,0.12); }
  .pv-input::placeholder { color: ${SFA.dim}; }

  .pv-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 46px; padding: 0 22px;
    border-radius: 12px; border: none; cursor: pointer; font-size: 14px; font-weight: 800; letter-spacing: 0.01em;
    background: linear-gradient(135deg, ${SFA.sky}, ${SFA.blue}); color: #fff;
    box-shadow: 0 8px 22px rgba(27,108,168,0.28); transition: transform 0.15s, box-shadow 0.2s;
  }
  .pv-btn:hover { transform: translateY(-1px); }
  .pv-btn:disabled { opacity: 0.6; cursor: default; transform: none; }

  @media (prefers-reduced-motion: reduce) { .pv-hover, .pv-hover:hover { transition: none; transform: none; } }
`;

/* ── Page header ── */
export function PremiumHeader({ eyebrow, title, subtitle, action }: {
  eyebrow?: string; title: string; subtitle?: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1] }}
      style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <div className="pv-eyebrow" style={{ marginBottom: 5 }}>{eyebrow}</div>}
        <h1 className="pv-h1">{title}</h1>
        {subtitle && <div className="pv-sub" style={{ marginTop: 5 }}>{subtitle}</div>}
      </div>
      {action}
    </motion.div>
  );
}

/* ── Staggered reveal wrapper ── */
export function Reveal({ children, i = 0 }: { children: React.ReactNode; i?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.06 + i * 0.06, ease: [0.16,1,0.3,1] }}>
      {children}
    </motion.div>
  );
}

/* ── Notched card ── */
export function PremiumCard({ children, style, hover = true }: {
  children: React.ReactNode; style?: React.CSSProperties; hover?: boolean;
}) {
  return <div className={`pv-card notch${hover ? " pv-hover" : ""}`} style={{ padding: 22, ...style }}>{children}</div>;
}
