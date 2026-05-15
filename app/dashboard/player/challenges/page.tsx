"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, CheckCircle2, Clock, Target, Zap, Loader2, X,
  TrendingUp, ChevronRight, Flame, Star, Award, Sparkles, Calendar,
} from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Tilt3D } from "@/components/ui/Tilt3D";
import type { Challenge, ChallengeStatus, EvaluationCategory } from "@/lib/types";

const STATUS_CONFIG: Record<ChallengeStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:         { label: "Open",     color: "#6B7280", bg: "rgba(107,114,128,0.08)", icon: <Clock size={12} /> },
  in_progress:  { label: "Bezig",    color: "#F0A500", bg: "rgba(240,165,0,0.10)",   icon: <Zap size={12} /> },
  completed:    { label: "Voltooid", color: "#16A34A", bg: "rgba(22,163,74,0.10)",   icon: <CheckCircle2 size={12} /> },
  expired:      { label: "Verlopen", color: "#D64045", bg: "rgba(214,64,69,0.10)",   icon: <Target size={12} /> },
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChallengeStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<EvaluationCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: player } = await supabase
        .from("players").select("id").eq("profile_id", user.id).maybeSingle();
      if (!player) { setLoading(false); return; }
      const { data } = await supabase
        .from("challenges").select("*")
        .eq("player_id", player.id)
        .order("created_at", { ascending: false });
      setChallenges((data ?? []) as Challenge[]);
      setLoading(false);
    }
    load();
  }, []);

  async function updateProgress(id: string, progress: number) {
    const status: ChallengeStatus = progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "open";
    const wasNotCompleted = challenges.find(c => c.id === id)?.status !== "completed";

    setChallenges(cs =>
      cs.map(c => c.id === id ? { ...c, progress, status, updated_at: new Date().toISOString() } : c)
    );

    if (progress >= 100 && wasNotCompleted) {
      setShowCompletion(id);
      setTimeout(() => setShowCompletion(null), 2400);
    }

    const supabase = createClient();
    await supabase.from("challenges").update({ progress, status }).eq("id", id);
  }

  const filtered = challenges.filter(c => {
    if (filter !== "all" && c.status !== filter) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    return true;
  });

  const stats = {
    total: challenges.length,
    completed: challenges.filter(c => c.status === "completed").length,
    in_progress: challenges.filter(c => c.status === "in_progress").length,
    open: challenges.filter(c => c.status === "open").length,
    overall_progress: challenges.length
      ? Math.round(challenges.reduce((s, c) => s + c.progress, 0) / challenges.length)
      : 0,
  };

  const selected = challenges.find(c => c.id === selectedId);
  const completed = challenges.find(c => c.id === showCompletion);

  if (loading) {
    return (
      <div className="ch-page-wrap" style={pageBg}>
        <PageMesh />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <Loader2 size={28} className="animate-spin" style={{ color: "#1B6CA8" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="ch-page-wrap" style={pageBg}>
      <PageMesh />

      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 24 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
            color: "#F0A500", textTransform: "uppercase", marginBottom: 12,
            padding: "5px 12px", borderRadius: 999,
            background: "rgba(240,165,0,0.08)",
            border: "1px solid rgba(240,165,0,0.2)",
          }}>
            <Trophy size={11} /> Persoonlijke doelen
          </div>
          <h1 style={{
            fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em",
            lineHeight: 1, marginBottom: 6, color: "#0D1B2A",
          }}>
            Challenges
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            {stats.total === 0
              ? "Nog geen challenges. Je coach maakt ze voor jou aan."
              : `${stats.in_progress} bezig · ${stats.completed} voltooid · ${stats.open} open`}
          </p>
        </motion.div>

        {/* Stats hero */}
        {stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="ch-hero-grid"
            style={{
              display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
              gap: 14, marginBottom: 28,
            }}
          >
            <Tilt3D max={8} lift={6} scale={1.01}>
              <ProgressRingTile
                completed={stats.completed}
                total={stats.total}
                overallProgress={stats.overall_progress}
              />
            </Tilt3D>
            <Tilt3D max={12} lift={8} scale={1.025}>
              <StatTile label="Bezig" value={stats.in_progress} color="#F0A500" icon={<Flame size={16} />} />
            </Tilt3D>
            <Tilt3D max={12} lift={8} scale={1.025}>
              <StatTile label="Open" value={stats.open} color="#6B7280" icon={<Clock size={16} />} />
            </Tilt3D>
            <Tilt3D max={12} lift={8} scale={1.025}>
              <StatTile label="Voltooid" value={stats.completed} color="#16A34A" icon={<Award size={16} />} />
            </Tilt3D>
          </motion.div>
        )}

        {/* Filter chips */}
        {challenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{ marginBottom: 20 }}
          >
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {(["all", "open", "in_progress", "completed"] as const).map(s => (
                <FilterChip
                  key={s}
                  active={filter === s}
                  onClick={() => setFilter(s)}
                  label={s === "all" ? "Alle status" : STATUS_CONFIG[s].label}
                  color={s === "all" ? "#1B6CA8" : STATUS_CONFIG[s].color}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <FilterChip
                active={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
                label="Alle categorieën"
                color="#1B6CA8"
                small
              />
              {(["techniek","fysiek","tactiek","mentaal","teamplay"] as EvaluationCategory[]).map(cat => (
                <FilterChip
                  key={cat}
                  active={categoryFilter === cat}
                  onClick={() => setCategoryFilter(cat)}
                  label={CATEGORY_LABELS[cat]}
                  color={CATEGORY_COLORS[cat]}
                  small
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Challenge grid */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${filter}-${categoryFilter}`}
            className="ch-grid"
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.length === 0 ? (
              <div style={{
                gridColumn: "1 / -1",
                padding: "60px 32px",
                borderRadius: 20,
                background: "#fff",
                border: "1px dashed #E1E4EB",
                textAlign: "center",
              }}>
                <Trophy size={32} style={{ color: "#C8CDD9", margin: "0 auto 12px" }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0D1B2A", marginBottom: 6 }}>
                  {challenges.length === 0 ? "Nog geen challenges" : "Geen resultaten"}
                </div>
                <p style={{ fontSize: 12, color: "#6B7280", maxWidth: 360, margin: "0 auto", lineHeight: 1.55 }}>
                  {challenges.length === 0
                    ? "Je coach voegt challenges toe op basis van jouw evaluaties."
                    : "Probeer een andere filter combinatie."}
                </p>
              </div>
            ) : filtered.map((ch, idx) => (
              <motion.div
                key={ch.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <Tilt3D max={10} lift={10} scale={1.02}>
                  <ChallengeCard
                    challenge={ch}
                    onSelect={() => setSelectedId(ch.id)}
                    onQuickProgress={(p) => updateProgress(ch.id, p)}
                  />
                </Tilt3D>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <ChallengeDetailModal
            challenge={selected}
            onClose={() => setSelectedId(null)}
            onUpdate={(p) => updateProgress(selected.id, p)}
          />
        )}
      </AnimatePresence>

      {/* Completion celebration */}
      <AnimatePresence>
        {completed && <CompletionToast challenge={completed} />}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PROGRESS RING TILE — main hero stat
   ───────────────────────────────────────────────────────── */

function ProgressRingTile({ completed, total, overallProgress }: {
  completed: number; total: number; overallProgress: number;
}) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dash = (overallProgress / 100) * C;

  return (
    <div style={{
      padding: 20,
      background: "linear-gradient(135deg, #fff 0%, #F4F7FA 100%)",
      border: "1px solid rgba(13,27,42,0.05)",
      borderRadius: 22,
      boxShadow: "0 1px 3px rgba(13,27,42,0.03), 0 12px 32px rgba(13,27,42,0.05)",
      display: "flex", alignItems: "center", gap: 16,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -50, right: -50,
        width: 160, height: 160,
        background: "radial-gradient(circle, rgba(27,108,168,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="prog-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1B6CA8" />
              <stop offset="100%" stopColor="#4DAEE5" />
            </linearGradient>
          </defs>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="rgba(13,27,42,0.06)" strokeWidth={stroke} />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke="url(#prog-ring)" strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            initial={{ strokeDasharray: `0 ${C}` }}
            animate={{ strokeDasharray: `${dash} ${C}` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            fontSize: 30, fontWeight: 800, color: "#0D1B2A",
            letterSpacing: "-0.03em", lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}>
            {overallProgress}<span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600 }}>%</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          color: "#6B7280", textTransform: "uppercase", marginBottom: 4,
        }}>
          Totale voortgang
        </div>
        <div style={{
          fontSize: 22, fontWeight: 800, color: "#0D1B2A",
          letterSpacing: "-0.02em", marginBottom: 4,
          fontVariantNumeric: "tabular-nums",
        }}>
          {completed} / {total}
        </div>
        <div style={{ fontSize: 12, color: "#6B7280" }}>
          {completed === total ? "🎉 Alles voltooid!" : "Voltooide challenges"}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      padding: 20,
      background: "linear-gradient(135deg, #fff 0%, #FAFCFE 100%)",
      border: "1px solid rgba(13,27,42,0.05)",
      borderRadius: 22,
      boxShadow: `0 1px 3px rgba(13,27,42,0.03), 0 12px 32px rgba(13,27,42,0.05), 0 24px 48px -16px ${color}1A`,
      position: "relative", overflow: "hidden",
      height: "100%",
    }}>
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 100, height: 100,
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `${color}14`, border: `1px solid ${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color,
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontSize: 36, fontWeight: 800, color,
        letterSpacing: "-0.03em", lineHeight: 0.9,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
        color: "#6B7280", textTransform: "uppercase", marginTop: 8,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FILTER CHIP
   ───────────────────────────────────────────────────────── */

function FilterChip({ active, onClick, label, color, small }: {
  active: boolean; onClick: () => void; label: string; color: string; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? "5px 11px" : "7px 14px",
        borderRadius: 999,
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        border: `1px solid ${active ? `${color}40` : "rgba(13,27,42,0.08)"}`,
        background: active ? `${color}14` : "#fff",
        color: active ? color : "#6B7280",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: active
          ? `0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 12px ${color}1A`
          : "0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(13,27,42,0.03)",
      }}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   CHALLENGE CARD
   ───────────────────────────────────────────────────────── */

function ChallengeCard({ challenge: ch, onSelect, onQuickProgress }: {
  challenge: Challenge;
  onSelect: () => void;
  onQuickProgress: (p: number) => void;
}) {
  const cfg = STATUS_CONFIG[ch.status];
  const catColor = ch.category ? CATEGORY_COLORS[ch.category as EvaluationCategory] : "#6B7280";
  const isCompleted = ch.status === "completed";

  return (
    <div
      onClick={onSelect}
      style={{
        background: isCompleted
          ? "linear-gradient(135deg, rgba(22,163,74,0.04) 0%, #fff 100%)"
          : "linear-gradient(135deg, #fff 0%, #FAFCFE 100%)",
        border: `1px solid ${isCompleted ? "rgba(22,163,74,0.2)" : "rgba(13,27,42,0.05)"}`,
        borderRadius: 22,
        padding: 22,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        boxShadow: `
          0 1px 3px rgba(13,27,42,0.03),
          0 8px 24px rgba(13,27,42,0.05),
          0 24px 48px -16px ${catColor}1A
        `,
      }}
    >
      {/* Top corner glow */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 120, height: 120,
        background: `radial-gradient(circle, ${catColor}14 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Left accent bar */}
      <div style={{
        position: "absolute", top: 22, left: 0, bottom: 22, width: 3,
        background: catColor, borderRadius: "0 999px 999px 0",
        boxShadow: `0 0 12px ${catColor}80`,
      }} />

      {/* Status + category chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 9px", borderRadius: 999,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.color}30`,
        }}>
          {cfg.icon} {cfg.label}
        </span>
        {ch.category && (
          <span style={{
            padding: "3px 9px", borderRadius: 999,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            background: `${catColor}10`, color: catColor,
            border: `1px solid ${catColor}25`,
          }}>
            {CATEGORY_LABELS[ch.category as EvaluationCategory]}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 17, fontWeight: 700, color: "#0D1B2A",
        letterSpacing: "-0.015em", lineHeight: 1.3,
        marginBottom: 6,
      }}>
        {ch.title}
      </h3>

      {/* Description */}
      {ch.description && (
        <p style={{
          fontSize: 12.5, color: "#6B7280", lineHeight: 1.55,
          marginBottom: 16,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {ch.description}
        </p>
      )}

      {/* Progress bar with big % */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{
            fontSize: 28, fontWeight: 800, color: catColor,
            letterSpacing: "-0.03em", lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}>
            {ch.progress}<span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600 }}>%</span>
          </span>
          {!isCompleted && (
            <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.06em" }}>
              KLIK VOOR DETAIL
            </span>
          )}
          {isCompleted && (
            <CheckCircle2 size={20} style={{ color: "#16A34A" }} />
          )}
        </div>
        <div style={{
          height: 6, borderRadius: 999,
          background: "rgba(13,27,42,0.05)",
          overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ch.progress}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${catColor}, ${catColor}aa)`,
              borderRadius: 999,
              boxShadow: `0 0 10px ${catColor}50`,
            }}
          />
        </div>
      </div>

      {/* Quick action buttons (only for in_progress / open) */}
      {!isCompleted && (
        <div
          style={{ display: "flex", gap: 5, flexWrap: "wrap" }}
          onClick={(e) => e.stopPropagation()}
        >
          {[25, 50, 75, 100].map(p => (
            <button
              key={p}
              onClick={() => onQuickProgress(p)}
              style={{
                flex: 1, minWidth: 50,
                padding: "5px 8px", borderRadius: 8,
                fontSize: 11, fontWeight: 600,
                background: ch.progress >= p ? `${catColor}14` : "rgba(13,27,42,0.03)",
                color: ch.progress >= p ? catColor : "#6B7280",
                border: `1px solid ${ch.progress >= p ? `${catColor}30` : "rgba(13,27,42,0.05)"}`,
                cursor: "pointer",
                transition: "all 0.15s",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {p === 100 ? "✓" : `${p}%`}
            </button>
          ))}
        </div>
      )}

      {/* Deadline */}
      {ch.deadline && !isCompleted && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: "1px solid rgba(13,27,42,0.05)",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, color: "#6B7280",
        }}>
          <Calendar size={11} />
          Deadline {formatDate(ch.deadline)}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DETAIL MODAL — slide-in from right
   ───────────────────────────────────────────────────────── */

function ChallengeDetailModal({ challenge: ch, onClose, onUpdate }: {
  challenge: Challenge; onClose: () => void; onUpdate: (p: number) => void;
}) {
  const cfg = STATUS_CONFIG[ch.status];
  const catColor = ch.category ? CATEGORY_COLORS[ch.category as EvaluationCategory] : "#1B6CA8";
  const [draftProgress, setDraftProgress] = useState(ch.progress);

  useEffect(() => { setDraftProgress(ch.progress); }, [ch.id, ch.progress]);

  function commit() {
    if (draftProgress !== ch.progress) onUpdate(draftProgress);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(13,27,42,0.4)", backdropFilter: "blur(6px)",
        }}
      />
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(540px, 100vw)", zIndex: 51,
          background: "#fff", color: "#0D1B2A",
          boxShadow: "-24px 0 80px rgba(13,27,42,0.2)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px",
          borderBottom: "1px solid rgba(13,27,42,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "#fff", zIndex: 2,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${catColor}14`,
              border: `1px solid ${catColor}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: catColor,
            }}>
              <Trophy size={18} />
            </div>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                color: "#6B7280", textTransform: "uppercase",
              }}>
                Challenge
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2A" }}>
                {ch.category ? CATEGORY_LABELS[ch.category as EvaluationCategory] : "Algemeen"}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 12,
            background: "rgba(13,27,42,0.04)",
            border: "1px solid rgba(13,27,42,0.06)",
            color: "#0D1B2A", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Title */}
          <h2 style={{
            fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
            color: "#0D1B2A", lineHeight: 1.15,
          }}>
            {ch.title}
          </h2>

          {/* Status pill */}
          <div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 11px", borderRadius: 999,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              background: cfg.bg, color: cfg.color,
              border: `1px solid ${cfg.color}30`,
            }}>
              {cfg.icon} {cfg.label.toUpperCase()}
            </span>
          </div>

          {/* Description */}
          {ch.description && (
            <div style={{
              padding: 18, borderRadius: 14,
              background: "#F4F7FA",
              border: "1px solid rgba(13,27,42,0.04)",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                color: "#6B7280", textTransform: "uppercase", marginBottom: 6,
              }}>
                Beschrijving
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "#374151" }}>
                {ch.description}
              </p>
            </div>
          )}

          {/* Progress slider section */}
          <div>
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              marginBottom: 12,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                color: "#6B7280", textTransform: "uppercase",
              }}>
                Voortgang
              </div>
              <div style={{
                fontSize: 48, fontWeight: 800, color: catColor,
                letterSpacing: "-0.04em", lineHeight: 0.9,
                fontVariantNumeric: "tabular-nums",
              }}>
                {draftProgress}<span style={{ fontSize: 18, color: "#9CA3AF", fontWeight: 600 }}>%</span>
              </div>
            </div>

            {/* Slider */}
            <div style={{
              position: "relative", padding: "16px 8px",
              borderRadius: 14,
              background: "#F4F7FA",
              border: "1px solid rgba(13,27,42,0.04)",
            }}>
              <input
                type="range"
                min={0} max={100} step={5}
                value={draftProgress}
                onChange={(e) => setDraftProgress(parseInt(e.target.value))}
                onMouseUp={commit}
                onTouchEnd={commit}
                style={{
                  width: "100%",
                  accentColor: catColor,
                  cursor: "pointer",
                }}
              />
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginTop: 6, fontSize: 10, color: "#9CA3AF",
                fontVariantNumeric: "tabular-nums",
              }}>
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Quick presets */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {[0, 25, 50, 75, 100].map(p => (
                <button
                  key={p}
                  onClick={() => { setDraftProgress(p); onUpdate(p); }}
                  style={{
                    flex: 1, padding: "9px 6px", borderRadius: 12,
                    fontSize: 12, fontWeight: 600,
                    background: draftProgress === p ? `${catColor}14` : "#fff",
                    color: draftProgress === p ? catColor : "#6B7280",
                    border: `1px solid ${draftProgress === p ? `${catColor}30` : "rgba(13,27,42,0.06)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {p === 100 ? "Klaar ✓" : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 12, paddingTop: 16,
            borderTop: "1px solid rgba(13,27,42,0.06)",
          }}>
            <MetaItem label="Aangemaakt" value={formatDate(ch.created_at)} />
            <MetaItem label="Laatst bijgewerkt" value={formatDate(ch.updated_at)} />
            {ch.deadline && <MetaItem label="Deadline" value={formatDate(ch.deadline)} color="#F0A500" />}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function MetaItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
        color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color ?? "#0D1B2A" }}>
        {value}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPLETION CELEBRATION TOAST
   ───────────────────────────────────────────────────────── */

function CompletionToast({ challenge }: { challenge: Challenge }) {
  return (
    <motion.div
      initial={{ y: -120, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -60, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      style={{
        position: "fixed", top: 28, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        padding: "16px 22px",
        background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
        color: "#fff", borderRadius: 14,
        boxShadow: "0 16px 48px rgba(22,163,74,0.45), 0 8px 24px rgba(13,27,42,0.2)",
        display: "flex", alignItems: "center", gap: 12,
        minWidth: 320,
      }}
    >
      <motion.div
        animate={{ rotate: [0, 14, -8, 0] }}
        transition={{ duration: 0.6 }}
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Sparkles size={20} />
      </motion.div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.85 }}>
          Voltooid!
        </div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          {challenge.title}
        </div>
      </div>
    </motion.div>
  );
}

function PageMesh() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `
        radial-gradient(ellipse 60% 50% at 0% 0%, rgba(240,165,0,0.06), transparent 55%),
        radial-gradient(ellipse 50% 50% at 100% 30%, rgba(77,174,229,0.08), transparent 60%),
        radial-gradient(ellipse 60% 60% at 50% 100%, rgba(27,108,168,0.04), transparent 65%)
      `,
      pointerEvents: "none",
    }} />
  );
}

const pageBg: React.CSSProperties = {
  margin: "-28px -28px -40px",
  minHeight: "calc(100vh - 52px)",
  background: "linear-gradient(180deg, #F4F7FA 0%, #FFFFFF 40%, #F0F4F9 100%)",
  position: "relative",
  overflow: "hidden",
  padding: "36px 28px 80px",
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
};

// className applied via wrapper below
const _ = "ch-page-wrap";

const pageCss = `
  @media (max-width: 900px) {
    .ch-hero-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
  }
  @media (max-width: 540px) {
    .ch-hero-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .ch-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 480px) {
    .ch-page-wrap { padding: 20px 14px 60px !important; }
    .ch-hero-grid { grid-template-columns: 1fr !important; }
    .ch-hero-grid > div:first-child { grid-column: 1 / -1 !important; }
  }
`;
