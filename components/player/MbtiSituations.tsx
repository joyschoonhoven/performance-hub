"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronRight } from "lucide-react";
import { MBTI_PROFILES, situationalCues, type MbtiCode } from "@/lib/mbti";

/**
 * Roterend "bewegend vakje" dat per situatie toont hoe deze speler speelt,
 * afgeleid van het MBTI-type. Bedoeld naast het veld op de positiepagina.
 * Dark-glass stijl zodat het op het (donkere) veld/paneel past.
 */
const T = {
  panel:"rgba(10,22,40,0.72)", line:"rgba(120,175,225,0.18)", ink:"#EAF2FB", sub:"#9FB6D4", sky:"#4DAEE5",
} as const;

export function MbtiSituations({ mbtiType, intervalMs = 4000 }: { mbtiType?: string | null; intervalMs?: number }) {
  const p = mbtiType && mbtiType in MBTI_PROFILES ? MBTI_PROFILES[mbtiType as MbtiCode] : null;
  const cues = p ? situationalCues(p.code) : [];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (cues.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % cues.length), intervalMs);
    return () => clearInterval(id);
  }, [cues.length, intervalMs]);

  if (!p) {
    return (
      <Link href="/dashboard/player/mbti" style={{ textDecoration: "none" }}>
        <div style={{ padding: "16px 18px", borderRadius: 14, background: T.panel, border: `1px dashed ${T.line}`,
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: T.sky, marginBottom: 6 }}>
            <Brain size={15} /><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Speler-type</span>
          </div>
          <div style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>Doe de persoonlijkheidstest</div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 3 }}>
            en zie hoe je speelt per situatie <ChevronRight size={12} />
          </div>
        </div>
      </Link>
    );
  }

  const cue = cues[i];

  return (
    <div style={{ borderRadius: 16, background: T.panel, border: `1px solid ${T.line}`, overflow: "hidden",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 20px 50px -24px rgba(0,0,0,0.6)" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `${p.color}22`, border: `1px solid ${p.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{p.icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 16, fontWeight: 700, color: p.color, letterSpacing: "0.03em" }}>{p.code}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>{p.nickname}</span>
          </div>
          <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: T.sub, textTransform: "uppercase", fontWeight: 700 }}>Jouw spel per situatie</div>
        </div>
      </div>

      {/* rotating cue */}
      <div style={{ position: "relative", minHeight: 92, padding: "16px 16px 12px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={i}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: 20 }}>{cue.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: T.sky, letterSpacing: "0.02em" }}>{cue.situation}</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: T.ink }}>{cue.trait}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* progress dots */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 14px" }}>
        {cues.map((_, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={`Situatie ${k + 1}`}
            style={{ height: 4, flex: 1, borderRadius: 999, border: "none", cursor: "pointer",
              background: k === i ? T.sky : "rgba(159,182,212,0.25)", transition: "background 0.3s" }} />
        ))}
      </div>
    </div>
  );
}
