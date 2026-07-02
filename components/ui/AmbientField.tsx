"use client";

import { motion } from "framer-motion";

/**
 * AmbientField — soft, slow "floating" atmosphere behind a page.
 * Mirrors the welcome/landing aesthetic: drifting blurred blobs + pulsing
 * twinkles. Purely decorative (aria-hidden), absolutely positioned, sits at
 * z-index 0 so page content (z >= 1) floats above it.
 */
export function AmbientField({
  tint = "#4DAEE5",
  tint2 = "#1B6CA8",
  twinkle = "#2B8AC7",
  intensity = 1,
}: {
  tint?: string;
  tint2?: string;
  twinkle?: string;
  intensity?: number;
}) {
  const a = (o: number) => Math.min(o * intensity, 1);

  const twinkles = [
    { top: "14%", left: "12%", s: 4, d: 0 },
    { top: "26%", left: "88%", s: 3, d: 1.2 },
    { top: "54%", left: "7%",  s: 5, d: 2 },
    { top: "70%", left: "82%", s: 3, d: 0.6 },
    { top: "82%", left: "30%", s: 4, d: 1.6 },
    { top: "40%", left: "50%", s: 2, d: 2.4 },
  ];

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* Drifting blobs */}
      <motion.div
        animate={{ x: [0, 34, 0], y: [0, -22, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: -140, right: -120, width: 460, height: 460, borderRadius: "50%",
          background: `radial-gradient(circle, ${tint}${hex(a(0.16))} 0%, transparent 68%)`,
          filter: "blur(6px)",
        }}
      />
      <motion.div
        animate={{ x: [0, -28, 0], y: [0, 26, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        style={{
          position: "absolute", bottom: -120, left: -100, width: 360, height: 360, borderRadius: "50%",
          background: `radial-gradient(circle, ${tint2}${hex(a(0.14))} 0%, transparent 70%)`,
          filter: "blur(6px)",
        }}
      />
      <motion.div
        animate={{ x: [0, 22, 0], y: [0, 18, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        style={{
          position: "absolute", top: "38%", left: "44%", width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${tint}${hex(a(0.08))} 0%, transparent 72%)`,
          filter: "blur(10px)",
        }}
      />

      {/* Twinkles */}
      {twinkles.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute", top: p.top, left: p.left, width: p.s, height: p.s,
            borderRadius: "50%", background: twinkle,
          }}
          animate={{ opacity: [a(0.15), a(0.7), a(0.15)], scale: [1, 1.6, 1] }}
          transition={{ duration: 3.2, delay: p.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* 0..1 alpha → 2-digit hex */
function hex(a: number): string {
  return Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");
}
