"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Welcome / splash screen for Schoonhoven Sports Performance Hub.
 *
 * Drop this file at: app/welcome/page.tsx
 *
 * It sits OUTSIDE the (auth) layout on purpose — it has its own
 * full-bleed animated background. Link to it from your marketing
 * site or use it as the default landing route by pointing
 * app/page.tsx at /welcome.
 */

// ─── Data nodes orbiting the logo ──────────────────────────
const NODES = [
  { cx: 54,  cy: 80,  label: "LIVE",          delay: 0.3 },
  { cx: 300, cy: 80,  label: "PERFORMANCE",   delay: 0.55 },
  { cx: 300, cy: 200, label: "DATA",          delay: 0.8 },
  { cx: 54,  cy: 200, label: "ONTWIKKELING",  delay: 1.05 },
] as const;

const CX = 177;
const CY = 140;

function HeroAnimation() {
  return (
    <div className="relative w-[354px] h-[280px] flex items-center justify-center">
      <svg
        width={354}
        height={280}
        viewBox="0 0 354 280"
        className="absolute inset-0"
      >
        <defs>
          <radialGradient id="welcomeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#4FA9E6" stopOpacity={0.55} />
            <stop offset="60%"  stopColor="#2B8AC7" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#0A2540" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="welcomeLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#4FA9E6" stopOpacity={0} />
            <stop offset="50%"  stopColor="#4FA9E6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#4FA9E6" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Central glow */}
        <circle cx={CX} cy={CY} r={110} fill="url(#welcomeGlow)" />

        {/* Slow-rotating concentric rings */}
        {[60, 95, 128].map((r, i) => (
          <motion.circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke="#4FA9E6"
            strokeOpacity={0.14 - i * 0.035}
            strokeDasharray="2 6"
            style={{ transformOrigin: `${CX}px ${CY}px` }}
            animate={{ rotate: i % 2 ? -360 : 360 }}
            transition={{
              duration: 24 + i * 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* Connection lines drawing in */}
        {NODES.map((n, i) => {
          const len = Math.hypot(n.cx - CX, n.cy - CY);
          return (
            <motion.line
              key={`l-${i}`}
              x1={CX}
              y1={CY}
              x2={n.cx}
              y2={n.cy}
              stroke="url(#welcomeLine)"
              strokeWidth={1.2}
              strokeDasharray={len}
              initial={{ strokeDashoffset: len }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.2, delay: n.delay, ease: "easeOut" }}
            />
          );
        })}

        {/* Data nodes */}
        {NODES.map((n, i) => (
          <motion.g
            key={`n-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: n.delay + 0.5,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          >
            <circle
              cx={n.cx}
              cy={n.cy}
              r={16}
              fill="rgba(79,169,230,0.12)"
              stroke="#4FA9E6"
              strokeWidth={1}
              strokeOpacity={0.6}
            />
            <motion.circle
              cx={n.cx}
              cy={n.cy}
              r={4}
              fill="#4FA9E6"
              animate={{ r: [3, 6, 3], opacity: [1, 0.5, 1] }}
              transition={{
                duration: 2,
                delay: n.delay + 1,
                repeat: Infinity,
              }}
            />
            <text
              x={n.cx}
              y={n.cy + 32}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              letterSpacing={1}
              fill="rgba(10,37,64,0.6)"
              style={{ fontFamily: "Outfit, system-ui, sans-serif" }}
            >
              {n.label}
            </text>
          </motion.g>
        ))}

        {/* Orbiting ball */}
        <motion.g
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <g transform={`translate(${CX + 128}, ${CY})`}>
            <circle r={7} fill="#fff" />
            <circle r={7} fill="none" stroke="#0A2540" strokeWidth={1} />
            <path
              d="M-3 -5 L 0 -2 L 3 -5 M -4 2 L 0 4 L 4 2"
              stroke="#0A2540"
              strokeWidth={1}
              fill="none"
            />
          </g>
        </motion.g>
      </svg>

      {/* Logo with breathing */}
      <motion.div
        className="relative z-10"
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute inset-[-10px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(79,169,230,0.35), transparent 70%)",
            filter: "blur(8px)",
          }}
        />
        <Image
          src="/logo.png"
          alt="Schoonhoven Sports"
          width={132}
          height={132}
          className="relative"
          priority
        />
      </motion.div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden px-6 py-10"
      style={{
        background:
          "radial-gradient(ellipse at 50% 20%, #DCE9F9 0%, #BFD4EE 55%, #A5C1E3 100%)",
      }}
    >
      {/* Soft atmospheric blobs */}
      <div
        className="absolute w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(79,169,230,0.22), transparent 70%)",
          top: -100,
          right: -120,
        }}
      />
      <div
        className="absolute w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(127,168,214,0.35), transparent 70%)",
          bottom: 60,
          left: -100,
        }}
      />

      {/* Floating twinkles */}
      {[
        { top: "12%", left: "18%", s: 3, d: 0 },
        { top: "22%", left: "85%", s: 2, d: 1 },
        { top: "58%", left: "10%", s: 4, d: 2 },
        { top: "68%", left: "88%", s: 2, d: 0.5 },
        { top: "78%", left: "28%", s: 3, d: 1.5 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: p.top,
            left: p.left,
            width: p.s,
            height: p.s,
            background: "#2B8AC7",
          }}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.5, 1] }}
          transition={{
            duration: 3,
            delay: p.d,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Spacer top so content sits centred */}
      <div />

      {/* Hero + copy */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full">
        <HeroAnimation />

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
        >
          <div
            className="text-[11px] font-bold uppercase mb-3"
            style={{
              color: "#2B8AC7",
              letterSpacing: "0.25em",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            Schoonhoven Sports Intelligence
          </div>
          <h1
            className="text-[32px] font-black leading-[1.05] tracking-tight mb-3"
            style={{ color: "#0A2540", fontFamily: "Outfit, sans-serif" }}
          >
            Jouw spelers.
            <br />
            Jouw data.
          </h1>
          <p
            className="text-[15px] leading-snug max-w-[300px] mx-auto"
            style={{ color: "rgba(10,37,64,0.6)" }}
          >
            Real-time tracking, AI-analyse en spelersprofiling voor moderne coaches.
          </p>
        </motion.div>
      </div>

      {/* CTA buttons */}
      <motion.div
        className="relative z-10 flex flex-col w-full max-w-md gap-1"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.2 }}
      >
        <Link
          href="/register"
          className="h-14 rounded-2xl flex items-center justify-center font-semibold text-[17px] text-white transition-all"
          style={{
            background: "#4FA9E6",
            boxShadow: "0 10px 28px rgba(79,169,230,0.45)",
            fontFamily: "Outfit, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          Account aanmaken
        </Link>
        <Link
          href="/login"
          className="h-[50px] flex items-center justify-center text-[15px] font-medium transition-colors"
          style={{ color: "rgba(10,37,64,0.7)" }}
        >
          Ik heb al een account
        </Link>
      </motion.div>
    </main>
  );
}
