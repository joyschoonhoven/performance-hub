"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, ChevronRight } from "lucide-react";
import { MBTI_PROFILES, type MbtiCode } from "@/lib/mbti";

const S = { card:"#FFFFFF", ink:"#0D1B2A", sub:"#5A6B80", dim:"#9BAABB", line:"rgba(13,27,42,0.09)", blue:"#1B6CA8", sky:"#4DAEE5" } as const;

/** Compacte MBTI-kaart voor het dashboard. Toont het type of een CTA. */
export function MbtiBadge({ mbtiType }: { mbtiType?: string | null }) {
  const p = mbtiType && mbtiType in MBTI_PROFILES ? MBTI_PROFILES[mbtiType as MbtiCode] : null;

  if (!p) {
    return (
      <Link href="/dashboard/player/mbti" style={{ textDecoration: "none" }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer",
            padding: "14px 18px", borderRadius: 14,
            background: `linear-gradient(135deg, ${S.blue}14, ${S.blue}06)`, border: `1px solid ${S.blue}30`,
            boxShadow: `0 4px 18px ${S.blue}14`,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${S.blue}18`, border: `1px solid ${S.blue}30`,
              display: "flex", alignItems: "center", justifyContent: "center", color: S.blue, flexShrink: 0 }}>
              <Brain size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: S.ink }}>Ontdek je speler-type</div>
              <div style={{ fontSize: 11.5, color: S.sub, marginTop: 1 }}>Doe de persoonlijkheidstest — 16 vragen</div>
            </div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 13px", borderRadius: 999,
            background: S.blue, color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            Start <ChevronRight size={12} />
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href="/dashboard/player/mbti" style={{ textDecoration: "none" }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
          padding: "14px 18px", borderRadius: 14, background: S.card, border: `1px solid ${S.line}`,
          boxShadow: "0 1px 2px rgba(13,27,42,0.04)",
        }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: `${p.color}16`, border: `1px solid ${p.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{p.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 19, fontWeight: 700, color: p.color, letterSpacing: "0.03em" }}>{p.code}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: S.ink }}>{p.nickname}</span>
          </div>
          <div style={{ fontSize: 11.5, color: S.sub, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.summary}</div>
        </div>
        <ChevronRight size={16} style={{ color: S.dim, flexShrink: 0 }} />
      </motion.div>
    </Link>
  );
}
