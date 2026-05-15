"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ChevronRight, HeartPulse, Zap, Activity, Brain,
  TrendingUp, TrendingDown, Minus, Trophy, Target, Sparkles,
  Calendar, X, ArrowRight, Award, Flame, ChevronLeft,
  Moon, Battery, Smile, AlertCircle,
} from "lucide-react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORY_LABELS, POSITION_LABELS, ARCHETYPES, SOCIOTYPES,
  SORENESS_LOCATION_LABELS,
} from "@/lib/types";
import { getRatingLabel, formatDate } from "@/lib/utils";
import { Tilt3D } from "@/components/ui/Tilt3D";
import type {
  Evaluation, EvaluationCategory, PlayerWithDetails, DailyCheckin, GameScore,
} from "@/lib/types";

/* ─────────────────────────────────────────────────────────
   COLOR SYSTEM
   ───────────────────────────────────────────────────────── */

const ACCENTS = {
  blue:   "#4DAEE5",
  navy:   "#1B6CA8",
  gold:   "#F0A500",
  green:  "#16A34A",
  red:    "#D64045",
  purple: "#7C3AED",
};

const CAT_META: Record<EvaluationCategory, { color: string; glow: string; icon: React.ReactNode; emoji: string }> = {
  techniek: { color: "#4DAEE5", glow: "rgba(77,174,229,0.45)", icon: <Sparkles size={16} />, emoji: "⚽" },
  fysiek:   { color: "#16A34A", glow: "rgba(22,163,74,0.45)",  icon: <Flame size={16} />,   emoji: "⚡" },
  tactiek:  { color: "#F0A500", glow: "rgba(240,165,0,0.45)",  icon: <Brain size={16} />,   emoji: "🧠" },
  mentaal:  { color: "#D64045", glow: "rgba(214,64,69,0.45)",  icon: <HeartPulse size={16} />, emoji: "🔥" },
  teamplay: { color: "#7C3AED", glow: "rgba(124,58,237,0.45)", icon: <Trophy size={16} />,  emoji: "🤝" },
};

/* ─────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────── */

export default function PlayerDashboardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSkill, setExpandedSkill] = useState<EvaluationCategory | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles").select("full_name").eq("id", user.id).single();
        setUserName(profile?.full_name ?? "");
      }
      const p = await getMyPlayerData();
      setPlayer(p);
      if (p?.id) {
        const { data: cs } = await supabase
          .from("daily_checkins")
          .select("*")
          .eq("player_id", p.id)
          .order("checkin_date", { ascending: false })
          .limit(30);
        setCheckins((cs ?? []) as DailyCheckin[]);

        const { data: gs } = await supabase
          .from("game_scores")
          .select("*")
          .eq("player_id", p.id)
          .order("total_score", { ascending: false })
          .limit(20);
        setGameScores((gs ?? []) as GameScore[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <FullScreenLoader />;

  if (!player) {
    return (
      <div style={dashboardBg}>
        <BgMesh />
        <div style={{
          maxWidth: 460, margin: "120px auto",
          padding: "44px 32px", borderRadius: 24,
          background: "#FFFFFF",
          border: "1px solid rgba(13,27,42,0.05)",
          textAlign: "center", color: "#0D1B2A",
          boxShadow: "0 1px 3px rgba(13,27,42,0.04), 0 24px 64px rgba(13,27,42,0.08)",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Welkom{userName ? `, ${userName.split(" ")[0]}` : ""}</h2>
          <p style={{ fontSize: 14, color: "rgba(13,27,42,0.55)", marginBottom: 22 }}>
            Vul je profiel in zodat je coach je kan evalueren.
          </p>
          <Link href="/onboarding" style={primaryBtn}>
            Profiel aanvullen <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  /* ── Data derivations ── */
  const evals = player.evaluations ?? [];
  const latestEval = evals[0];
  const prevEval = evals[1];

  const today = new Date().toISOString().slice(0, 10);
  const todayCheckin = checkins.find(c => c.checkin_date.slice(0, 10) === today);

  // Per-category data
  type CatData = {
    cat: EvaluationCategory;
    label: string;
    score: number;
    delta: number;
    series: number[];
  };
  const catData: CatData[] = (["techniek", "fysiek", "tactiek", "mentaal"] as EvaluationCategory[]).map(cat => {
    const score = latestEval?.scores?.find(s => s.category === cat)?.score ?? 0;
    const prev = prevEval?.scores?.find(s => s.category === cat)?.score ?? score;
    const series = evals.slice(0, 7).reverse().map(ev =>
      ev.scores?.find(s => s.category === cat)?.score ?? 0
    );
    return { cat, label: CATEGORY_LABELS[cat], score, delta: score - prev, series };
  });

  // Wellbeing tiles
  const wellbeingTiles = [
    {
      key: "sleep_quality" as const,
      label: "Slaap",
      icon: <Moon size={20} />,
      value: todayCheckin?.sleep_quality ?? null,
      color: "#7C3AED",
      emoji: ["😴", "😪", "🙂", "😊", "🌟"],
    },
    {
      key: "perceived_recovery" as const,
      label: "Herstel",
      icon: <Battery size={20} />,
      value: todayCheckin?.perceived_recovery ?? null,
      color: "#16A34A",
      emoji: ["🪫", "🔋", "⚡", "💪", "🔥"],
    },
    {
      key: "soreness" as const,
      label: "Pijn",
      icon: <AlertCircle size={20} />,
      value: todayCheckin?.soreness ?? null,
      color: "#D64045",
      inverted: true,
      emoji: ["✅", "🙂", "😐", "😣", "🤕"],
    },
    {
      key: "mood" as const,
      label: "Stemming",
      icon: <Smile size={20} />,
      value: todayCheckin?.mood ?? null,
      color: "#F0A500",
      emoji: ["😢", "😕", "😐", "🙂", "😄"],
    },
  ];

  // Achievements (derived from real data)
  const achievements: Array<{ label: string; icon: React.ReactNode; color: string; sub: string }> = [];
  const completedChallenges = player.challenges?.filter(c => c.status === "completed") ?? [];
  if (completedChallenges.length >= 1) {
    achievements.push({
      label: `${completedChallenges.length} ${completedChallenges.length === 1 ? "Challenge" : "Challenges"}`,
      icon: <Trophy size={18} />, color: "#F0A500",
      sub: "voltooid",
    });
  }
  if (checkins.length >= 7) {
    achievements.push({
      label: `${checkins.length}-day Streak`,
      icon: <Flame size={18} />, color: "#D64045",
      sub: "check-ins",
    });
  }
  if (evals.length >= 3) {
    achievements.push({
      label: `${evals.length} Evaluaties`,
      icon: <Award size={18} />, color: "#4DAEE5",
      sub: "ontvangen",
    });
  }
  if (player.overall_rating >= 80) {
    achievements.push({
      label: "Elite Status",
      icon: <Sparkles size={18} />, color: "#16A34A",
      sub: `OVR ${player.overall_rating}+`,
    });
  }

  // Best Tactical IQ score
  const bestGameScore = gameScores[0];  // already sorted by total_score desc
  if (bestGameScore) {
    achievements.push({
      label: `IQ Highscore ${bestGameScore.total_score}`,
      icon: <Brain size={18} />, color: "#7C3AED",
      sub: bestGameScore.iq_label ?? "Tactisch IQ",
    });
  }

  // Player goals from in-progress challenges
  const playerGoals = (player.challenges ?? [])
    .filter(c => c.status === "in_progress")
    .slice(0, 4)
    .map(c => ({
      title: c.title,
      progress: c.progress,
      category: c.category as EvaluationCategory | undefined,
    }));

  // Performance timeline — combine evaluations + check-ins
  const timelineEvents: Array<{
    date: Date; type: "eval" | "checkin"; data: Evaluation | DailyCheckin; score?: number;
  }> = [];
  evals.slice(0, 8).forEach(ev => {
    timelineEvents.push({
      date: new Date(ev.evaluation_date),
      type: "eval",
      data: ev,
      score: ev.overall_score ?? undefined,
    });
  });
  checkins.slice(0, 10).forEach(c => {
    timelineEvents.push({
      date: new Date(c.checkin_date),
      type: "checkin",
      data: c,
    });
  });
  timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

  const archetype = player.identity?.primary_archetype ? ARCHETYPES[player.identity.primary_archetype] : null;
  const sociotype = player.identity?.primary_sociotype ? SOCIOTYPES[player.identity.primary_sociotype] : null;

  return (
    <div style={dashboardBg}>
      <BgMesh />
      <NoiseOverlay />

      <div className="dash-page" style={{
        position: "relative",
        zIndex: 1,
        margin: "-28px -28px -40px",
        padding: "32px 24px 80px",
        minHeight: "calc(100vh - 52px)",
        maxWidth: "100%",
      }}>
        <style dangerouslySetInnerHTML={{ __html: globalCss }} />

        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ═══════════════════ HERO ═══════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Hero
              player={player}
              archetype={archetype}
              sociotype={sociotype}
              userName={userName}
            />
          </motion.div>

          {/* ═══════════════════ SKILL MODULES ═══════════════════ */}
          <Section title="Performance" subtitle="Categorieën uit jouw laatste coach evaluatie">
            <div className="dash-grid-skills">
              {catData.map((c, i) => (
                <motion.div
                  key={c.cat}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  <SkillCard
                    cat={c.cat}
                    label={c.label}
                    score={c.score}
                    delta={c.delta}
                    series={c.series}
                    onClick={() => setExpandedSkill(c.cat)}
                  />
                </motion.div>
              ))}
            </div>
          </Section>

          {/* ═══════════════════ WELLBEING + ACHIEVEMENTS ═══════════════════ */}
          <div className="dash-grid-wellbeing">
            <Section title="Wellbeing" subtitle="Vandaag — uit jouw check-in" action={
              <Link href="/dashboard/player/checkin" style={ghostBtnDark}>
                <HeartPulse size={12} /> {todayCheckin ? "Aanpassen" : "Invullen"}
              </Link>
            }>
              <div className="dash-grid-checkin">
                {wellbeingTiles.map((tile, i) => (
                  <motion.div
                    key={tile.key}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                  >
                    <WellbeingTile {...tile} />
                  </motion.div>
                ))}
              </div>
            </Section>

            <Section title="Achievements" subtitle={achievements.length === 0 ? "Werk aan je doelen" : `${achievements.length} badges`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {achievements.length === 0 ? (
                  <EmptyHint text="Voltooi challenges en evaluaties om badges te ontgrendelen." />
                ) : (
                  achievements.map((a, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                    >
                      <AchievementBadge {...a} />
                    </motion.div>
                  ))
                )}
              </div>
            </Section>
          </div>

          {/* ═══════════════════ TACTICAL IQ HIGHSCORE ═══════════════════ */}
          {gameScores.length > 0 && (
            <Section
              title="Tactisch IQ"
              subtitle={`${gameScores.length} ${gameScores.length === 1 ? "game" : "games"} gespeeld`}
              action={
                <Link href="/dashboard/player/game" style={ghostBtnDark}>
                  Speel opnieuw <ArrowRight size={12} />
                </Link>
              }
            >
              <IQScoreTile bestScore={bestGameScore} recentScores={gameScores.slice(0, 5)} />
            </Section>
          )}

          {/* ═══════════════════ PITCH TILE ═══════════════════ */}
          <Section title="Mijn Veld" subtitle="Jouw positie op het veld" action={
            <Link href="/dashboard/player/heatmap" style={ghostBtnDark}>
              Volledige posities <ArrowRight size={12} />
            </Link>
          }>
            <PitchTile
              primary={player.position}
              secondary={player.secondary_position}
              assessedCounts={(() => {
                const counts: Record<string, number> = {};
                evals.forEach(ev => {
                  if (ev.assessed_position) counts[ev.assessed_position] = (counts[ev.assessed_position] ?? 0) + 1;
                });
                return counts;
              })()}
            />
          </Section>

          {/* ═══════════════════ PERFORMANCE TIMELINE ═══════════════════ */}
          {timelineEvents.length > 0 && (
            <Section title="Activity Timeline" subtitle="Recente trainingen, evaluaties en check-ins">
              <Timeline events={timelineEvents} />
            </Section>
          )}

          {/* ═══════════════════ PLAYER GOALS ═══════════════════ */}
          {playerGoals.length > 0 && (
            <Section title="Goals" subtitle={`${playerGoals.length} actief`} action={
              <Link href="/dashboard/player/challenges" style={ghostBtnDark}>
                Alle goals <ArrowRight size={12} />
              </Link>
            }>
              <div className="dash-grid-goals">
                {playerGoals.map((g, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                  >
                    <GoalCard goal={g} />
                  </motion.div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Skill detail slide-in */}
      <AnimatePresence>
        {expandedSkill && (
          <SkillDetailModal
            cat={expandedSkill}
            score={latestEval?.scores?.find(s => s.category === expandedSkill)?.score ?? 0}
            evaluations={evals}
            onClose={() => setExpandedSkill(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   HERO — Player Card style
   ───────────────────────────────────────────────────────── */

function Hero({ player, archetype, sociotype, userName }: {
  player: PlayerWithDetails;
  archetype: { label: string; icon: string; color: string; description: string } | null;
  sociotype: { label: string; icon: string; color_hex: string; description: string } | null;
  userName: string;
}) {
  const overall = player.overall_rating;
  const initials = `${player.first_name?.[0] ?? ""}${player.last_name?.[0] ?? ""}`;
  const photoUrl = player.photo_url ?? player.avatar_url ?? null;
  const ratingLabel = getRatingLabel(overall);

  // greeting from time of day
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "Goedenacht" : hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  const firstName = userName.split(" ")[0] || player.first_name || "";

  return (
    <Tilt3D max={5} lift={4} scale={1.005} glare={false}>
      <div className="dash-hero" style={{
        position: "relative",
        borderRadius: 32,
        overflow: "hidden",
        background: "linear-gradient(135deg, #FFFFFF 0%, #FAFCFE 50%, #F4F7FA 100%)",
        border: "1px solid rgba(13,27,42,0.05)",
        boxShadow: `
          0 4px 16px rgba(13,27,42,0.04),
          0 24px 64px rgba(13,27,42,0.06),
          0 56px 120px -24px rgba(27,108,168,0.12),
          0 1px 0 rgba(255,255,255,0.8) inset
        `,
        padding: 36,
        color: "#0D1B2A",
      }}>
        <PitchPattern />

        {/* Ambient blue-gold glow on light bg */}
        <div style={{
          position: "absolute", top: -120, right: -120,
          width: 420, height: 420,
          background: "radial-gradient(circle, rgba(240,165,0,0.10) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -100, left: -100,
          width: 360, height: 360,
          background: "radial-gradient(circle, rgba(77,174,229,0.10) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        <div className="dash-hero-grid" style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 1fr) auto",
          gap: 40,
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
              color: "#1B6CA8", textTransform: "uppercase",
              marginBottom: 18,
              padding: "5px 12px", borderRadius: 999,
              background: "rgba(77,174,229,0.08)",
              border: "1px solid rgba(77,174,229,0.18)",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#4DAEE5",
                boxShadow: "0 0 10px #4DAEE5",
                animation: "dashPulse 2s ease-in-out infinite",
              }} />
              {greeting}, {firstName || "Athlete"}
            </div>

            <h1 className="dash-hero-name" style={{
              fontSize: 56, fontWeight: 700, letterSpacing: "-0.035em",
              lineHeight: 0.95, marginBottom: 6, color: "#0D1B2A",
            }}>
              {player.first_name}
            </h1>
            <h1 className="dash-hero-name" style={{
              fontSize: 56, fontWeight: 800, letterSpacing: "-0.04em",
              lineHeight: 0.95, marginBottom: 18,
              background: "linear-gradient(180deg, #1B6CA8 0%, #0D1B2A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {player.last_name}
            </h1>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
              <HeroChip label={player.position} accent="#1B6CA8" emphasis />
              <HeroChip label={POSITION_LABELS[player.position]} />
              {player.jersey_number && <HeroChip label={`#${player.jersey_number}`} mono />}
              {archetype && <HeroChip label={archetype.label} accent={archetype.color} icon={archetype.icon} />}
              {sociotype && <HeroChip label={sociotype.label} accent={sociotype.color_hex} icon={sociotype.icon} />}
            </div>

            <div style={{
              display: "flex", gap: 32,
              paddingTop: 22,
              borderTop: "1px solid rgba(13,27,42,0.06)",
              flexWrap: "wrap",
            }}>
              <HeroStat label="Evaluaties" value={String(player.evaluations?.length ?? 0)} />
              <HeroStat label="Challenges" value={String(player.challenges?.length ?? 0)} />
              <HeroStat label="Club" value={player.team_name ?? player.club ?? "SFA"} />
              <HeroStat label="Status" value={ratingLabel} valueColor={overallColor(overall)} />
            </div>
          </div>

          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <OVRRing rating={overall} photoUrl={photoUrl} initials={initials} />
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              color: overallColor(overall), textTransform: "uppercase",
              padding: "5px 12px", borderRadius: 999,
              background: `${overallColor(overall)}12`,
              border: `1px solid ${overallColor(overall)}30`,
            }}>
              {ratingLabel}
            </div>
          </div>
        </div>
      </div>
    </Tilt3D>
  );
}

function OVRRing({ rating, photoUrl, initials }: { rating: number; photoUrl: string | null; initials: string }) {
  const size = 220;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dash = (rating / 99) * C;
  const color = overallColor(rating);

  return (
    <div style={{ position: "relative", width: size, height: size }} className="dash-ovr-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="ovrRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="50%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
          <filter id="ovrGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(13,27,42,0.06)" strokeWidth={stroke} />
        {/* Glow */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeOpacity="0.35"
          strokeWidth={stroke + 4}
          strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round"
          filter="url(#ovrGlow)"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        {/* Foreground */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#ovrRing)" strokeWidth={stroke}
          strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>

      <div style={{
        position: "absolute",
        inset: stroke + 6,
        borderRadius: "50%",
        overflow: "hidden",
        background: "radial-gradient(circle at 30% 20%, #FFFFFF, #F4F7FA 75%)",
        border: "1px solid rgba(13,27,42,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column",
        boxShadow: "0 8px 24px rgba(13,27,42,0.06) inset",
      }}>
        {photoUrl ? (
          <div style={{ position: "absolute", inset: 0 }}>
            <Image
              src={photoUrl}
              alt=""
              fill
              style={{ objectFit: "cover", objectPosition: "top center" }}
              unoptimized
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.96) 95%)",
            }} />
            <div style={{
              position: "absolute", bottom: 18, left: 0, right: 0,
              textAlign: "center",
              fontSize: 56, fontWeight: 800,
              fontFamily: '"Inter", system-ui, sans-serif',
              color: overallColor(rating),
              letterSpacing: "-0.04em",
            }}>
              {rating}
            </div>
            <div style={{
              position: "absolute", bottom: 8, left: 0, right: 0,
              textAlign: "center", fontSize: 9, fontWeight: 700,
              letterSpacing: "0.22em", color: "rgba(13,27,42,0.4)",
            }}>
              OVR
            </div>
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 36, fontWeight: 700,
              fontFamily: '"Inter", system-ui, sans-serif',
              color: "rgba(27,108,168,0.18)", letterSpacing: "-0.04em",
              position: "absolute", top: 30,
            }}>
              {initials}
            </div>
            <div style={{
              fontSize: 72, fontWeight: 800,
              fontFamily: '"Inter", system-ui, sans-serif',
              color: overallColor(rating),
              letterSpacing: "-0.05em",
            }}>
              {rating}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: "0.24em", color: "rgba(13,27,42,0.4)",
              marginTop: -4,
            }}>
              OVR
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SKILL CARD (4 main modules)
   ───────────────────────────────────────────────────────── */

function SkillCard({ cat, label, score, delta, series, onClick }: {
  cat: EvaluationCategory; label: string; score: number; delta: number; series: number[];
  onClick: () => void;
}) {
  const meta = CAT_META[cat];
  const hasData = score > 0;

  return (
    <Tilt3D max={10} lift={8} scale={1.02} glare>
      <button
        onClick={onClick}
        style={{
          width: "100%", textAlign: "left",
          background: "linear-gradient(180deg, #FFFFFF 0%, #FAFCFE 100%)",
          border: "1px solid rgba(13,27,42,0.05)",
          borderRadius: 22,
          padding: "22px 24px",
          color: "#0D1B2A",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          boxShadow: `
            0 1px 3px rgba(13,27,42,0.03),
            0 8px 24px rgba(13,27,42,0.05),
            0 32px 64px -16px ${meta.color}1F,
            0 1px 0 rgba(255,255,255,0.9) inset
          `,
        }}
      >
        <div style={{
          position: "absolute", top: -50, right: -50,
          width: 180, height: 180,
          background: `radial-gradient(circle, ${meta.color}1A 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 14,
              background: `linear-gradient(135deg, ${meta.color}1F, ${meta.color}10)`,
              border: `1px solid ${meta.color}24`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: meta.color,
              boxShadow: `0 4px 12px ${meta.color}25, inset 0 1px 0 rgba(255,255,255,0.6)`,
            }}>
              {meta.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0D1B2A", letterSpacing: "-0.015em" }}>
                {label}
              </div>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(13,27,42,0.4)", textTransform: "uppercase", marginTop: 2, fontWeight: 600 }}>
                Skill module
              </div>
            </div>
          </div>
          <ChevronRight size={14} style={{ color: "rgba(13,27,42,0.3)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <div style={{
            fontSize: 52, fontWeight: 700,
            fontFamily: '"Inter", system-ui, sans-serif',
            color: hasData ? meta.color : "rgba(13,27,42,0.18)",
            letterSpacing: "-0.04em", lineHeight: 1,
          }}>
            {hasData ? score.toFixed(1) : "—"}
          </div>
          {hasData && Math.abs(delta) >= 0.05 && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 12, fontWeight: 700,
              padding: "4px 9px", borderRadius: 999,
              background: delta > 0 ? "rgba(22,163,74,0.1)" : "rgba(214,64,69,0.1)",
              border: `1px solid ${delta > 0 ? "rgba(22,163,74,0.2)" : "rgba(214,64,69,0.2)"}`,
              color: delta > 0 ? "#16A34A" : "#D64045",
            }}>
              {delta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {delta > 0 ? "+" : ""}{delta.toFixed(1)}
            </div>
          )}
        </div>

        <MiniSparkline series={series} color={meta.color} />

        <div style={{
          marginTop: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11, color: "rgba(13,27,42,0.4)", letterSpacing: "0.02em",
        }}>
          <span>{series.filter(v => v > 0).length} evaluaties</span>
          <span style={{ color: meta.color, fontWeight: 600 }}>Bekijk detail →</span>
        </div>
      </button>
    </Tilt3D>
  );
}

function MiniSparkline({ series, color }: { series: number[]; color: string }) {
  const W = 200;
  const H = 40;
  const PAD = 3;
  const max = Math.max(...series.filter(v => v > 0), 10);
  if (series.filter(v => v > 0).length < 2) {
    return (
      <div style={{
        height: H,
        display: "flex", alignItems: "center",
        fontSize: 11, color: "rgba(13,27,42,0.3)",
      }}>
        Onvoldoende data
      </div>
    );
  }
  // Smooth bezier curve for soft, rounded line
  const xs = (i: number) => PAD + (i / (series.length - 1)) * (W - 2 * PAD);
  const ys = (v: number) => H - PAD - (v / max) * (H - 2 * PAD);
  const points = series.map((v, i) => ({ x: xs(i), y: ys(v) }));
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  const fillPath = `${path} L${points[points.length - 1].x},${H - PAD} L${points[0].x},${H - PAD} Z`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#spark-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => i === points.length - 1 && series[i] > 0 ? (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} stroke="#FFFFFF" strokeWidth={2} />
      ) : null)}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   WELLBEING TILE
   ───────────────────────────────────────────────────────── */

function WellbeingTile({ label, icon, value, color, emoji, inverted }: {
  label: string; icon: React.ReactNode; value: number | null; color: string;
  emoji: string[]; inverted?: boolean;
}) {
  const hasValue = value !== null && value !== undefined;
  // For inverted, low = good; map to emoji accordingly
  const emojiIdx = hasValue
    ? inverted
      ? Math.max(0, Math.min(4, 4 - Math.floor(value / 2.5)))
      : Math.max(0, Math.min(4, Math.floor((value - 1) / 2)))
    : 2;

  const pct = hasValue ? (value / 10) * 100 : 0;
  const displayColor = hasValue
    ? inverted
      ? value <= 3 ? "#16A34A" : value <= 6 ? "#F0A500" : "#D64045"
      : value >= 7 ? "#16A34A" : value >= 4 ? "#F0A500" : "#D64045"
    : "rgba(255,255,255,0.2)";

  return (
    <Tilt3D max={12} lift={6} scale={1.025} glare>
      <div style={{
        position: "relative",
        padding: 20,
        borderRadius: 22,
        background: "linear-gradient(180deg, #FFFFFF 0%, #FAFCFE 100%)",
        border: "1px solid rgba(13,27,42,0.05)",
        boxShadow: `
          0 1px 3px rgba(13,27,42,0.03),
          0 6px 18px rgba(13,27,42,0.05),
          0 24px 48px -12px ${color}1A,
          0 1px 0 rgba(255,255,255,0.9) inset
        `,
        color: "#0D1B2A",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 110, height: 110,
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ color }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(13,27,42,0.5)", textTransform: "uppercase" }}>
                {label}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 26, opacity: hasValue ? 1 : 0.3 }}>{emoji[emojiIdx]}</div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 14 }}>
          <span style={{
            fontSize: 38, fontWeight: 700,
            fontFamily: '"Inter", system-ui, sans-serif',
            color: displayColor,
            letterSpacing: "-0.03em", lineHeight: 0.9,
          }}>
            {hasValue ? value : "—"}
          </span>
          {hasValue && (
            <span style={{ fontSize: 12, color: "rgba(13,27,42,0.35)", fontWeight: 500 }}>
              /10
            </span>
          )}
        </div>

        <div style={{
          height: 6, borderRadius: 999,
          background: "rgba(13,27,42,0.05)",
          overflow: "hidden", position: "relative",
        }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${pct}%`,
            background: hasValue
              ? `linear-gradient(90deg, ${displayColor}, ${displayColor}cc)`
              : "transparent",
            borderRadius: 999,
            transition: "width 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }} />
        </div>
      </div>
    </Tilt3D>
  );
}

/* ─────────────────────────────────────────────────────────
   ACHIEVEMENT BADGE
   ───────────────────────────────────────────────────────── */

function AchievementBadge({ label, icon, color, sub }: {
  label: string; icon: React.ReactNode; color: string; sub: string;
}) {
  return (
    <Tilt3D max={8} lift={5} scale={1.015} glare>
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px",
        borderRadius: 16,
        background: "linear-gradient(135deg, #FFFFFF 0%, #FAFCFE 100%)",
        border: "1px solid rgba(13,27,42,0.05)",
        boxShadow: `
          0 1px 3px rgba(13,27,42,0.03),
          0 6px 18px rgba(13,27,42,0.05),
          0 16px 32px -10px ${color}25,
          0 1px 0 rgba(255,255,255,0.9) inset
        `,
        color: "#0D1B2A",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 14,
          background: `linear-gradient(135deg, ${color}22, ${color}08)`,
          border: `1px solid ${color}24`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color, flexShrink: 0,
          boxShadow: `0 4px 10px ${color}25, inset 0 1px 0 rgba(255,255,255,0.6)`,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2A", letterSpacing: "-0.01em" }}>{label}</div>
          <div style={{ fontSize: 11, color: "rgba(13,27,42,0.45)" }}>{sub}</div>
        </div>
      </div>
    </Tilt3D>
  );
}

/* ─────────────────────────────────────────────────────────
   TIMELINE (horizontal scroll)
   ───────────────────────────────────────────────────────── */

function Timeline({ events }: {
  events: Array<{ date: Date; type: "eval" | "checkin"; data: Evaluation | DailyCheckin; score?: number }>;
}) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 22,
      background: "#FFFFFF",
      border: "1px solid rgba(13,27,42,0.05)",
      padding: 4,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(13,27,42,0.03), 0 8px 24px rgba(13,27,42,0.05)",
    }}>
      <div className="timeline-scroll" style={{
        display: "flex", gap: 14,
        padding: 18,
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}>
        {events.map((ev, i) => (
          <TimelineCard key={i} event={ev} index={i} />
        ))}
      </div>
    </div>
  );
}

function TimelineCard({ event, index }: {
  event: { date: Date; type: "eval" | "checkin"; data: Evaluation | DailyCheckin; score?: number };
  index: number;
}) {
  const isEval = event.type === "eval";
  const color = isEval ? "#4DAEE5" : "#F0A500";
  const icon = isEval ? <Award size={14} /> : <HeartPulse size={14} />;
  const label = isEval ? "Evaluatie" : "Check-in";

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.04 * index }}
      style={{
        flex: "0 0 210px",
        scrollSnapAlign: "start",
        padding: 18,
        borderRadius: 18,
        background: "linear-gradient(180deg, #FAFCFE 0%, #F4F7FA 100%)",
        border: "1px solid rgba(13,27,42,0.05)",
        color: "#0D1B2A",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 4, height: "100%",
        background: color,
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color, textTransform: "uppercase" }}>
          {label}
        </span>
      </div>

      <div style={{ fontSize: 12, color: "rgba(13,27,42,0.5)", marginBottom: 10 }}>
        {event.date.toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
      </div>

      {isEval && event.score !== undefined && (
        <div style={{
          fontSize: 32, fontWeight: 700,
          fontFamily: '"Inter", system-ui, sans-serif',
          color: overallColor(((event.score - 1) / 9) * 59 + 40),
          letterSpacing: "-0.03em", lineHeight: 1,
        }}>
          {event.score.toFixed(1)}
          <span style={{ fontSize: 12, color: "rgba(13,27,42,0.35)", fontWeight: 500, marginLeft: 4 }}>/10</span>
        </div>
      )}

      {!isEval && (
        <div style={{ display: "flex", gap: 10, marginTop: 4, fontFamily: '"Inter", system-ui, sans-serif' }}>
          {(event.data as DailyCheckin).sleep_quality && (
            <span style={{ fontSize: 11, color: "rgba(13,27,42,0.65)" }}>
              😴 {(event.data as DailyCheckin).sleep_quality}
            </span>
          )}
          {(event.data as DailyCheckin).mood && (
            <span style={{ fontSize: 11, color: "rgba(13,27,42,0.65)" }}>
              😊 {(event.data as DailyCheckin).mood}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   GOAL CARD
   ───────────────────────────────────────────────────────── */

function GoalCard({ goal }: { goal: { title: string; progress: number; category?: EvaluationCategory } }) {
  const color = goal.category ? CAT_META[goal.category].color : "#4DAEE5";
  return (
    <Tilt3D max={10} lift={6} scale={1.015} glare>
      <div style={{
        padding: 20,
        borderRadius: 20,
        background: "#FFFFFF",
        border: "1px solid rgba(13,27,42,0.05)",
        color: "#0D1B2A",
        boxShadow: `
          0 1px 3px rgba(13,27,42,0.03),
          0 6px 18px rgba(13,27,42,0.05),
          0 20px 48px -12px ${color}1F,
          0 1px 0 rgba(255,255,255,0.9) inset
        `,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 130, height: 130,
          background: `radial-gradient(circle, ${color}14 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color, textTransform: "uppercase", marginBottom: 4 }}>
              {goal.category ? CATEGORY_LABELS[goal.category] : "Goal"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0D1B2A", lineHeight: 1.3 }}>
              {goal.title}
            </div>
          </div>
          <Target size={18} style={{ color, flexShrink: 0 }} />
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{
            fontSize: 26, fontWeight: 700,
            fontFamily: '"Inter", system-ui, sans-serif',
            color, letterSpacing: "-0.03em",
          }}>
            {goal.progress}<span style={{ fontSize: 13, color: "rgba(13,27,42,0.35)", fontWeight: 500 }}>%</span>
          </span>
          <span style={{ fontSize: 10, color: "rgba(13,27,42,0.45)" }}>
            voltooid
          </span>
        </div>

        <div style={{
          height: 6, borderRadius: 999,
          background: "rgba(13,27,42,0.05)",
          overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              borderRadius: 999,
            }}
          />
        </div>
      </div>
    </Tilt3D>
  );
}

/* ─────────────────────────────────────────────────────────
   SKILL DETAIL MODAL (slide-in)
   ───────────────────────────────────────────────────────── */

function SkillDetailModal({ cat, score, evaluations, onClose }: {
  cat: EvaluationCategory; score: number; evaluations: Evaluation[]; onClose: () => void;
}) {
  const meta = CAT_META[cat];
  const label = CATEGORY_LABELS[cat];

  const series = useMemo(() => {
    return [...evaluations]
      .filter(ev => ev.scores?.find(s => s.category === cat))
      .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
      .map(ev => ({
        date: ev.evaluation_date,
        score: ev.scores!.find(s => s.category === cat)!.score,
        notes: ev.notes,
      }));
  }, [evaluations, cat]);

  // 14-day & 30-day avg
  const now = Date.now();
  const day = 86400000;
  const last14 = series.filter(s => now - new Date(s.date).getTime() <= 14 * day);
  const last30 = series.filter(s => now - new Date(s.date).getTime() <= 30 * day);
  const avg14 = last14.length ? (last14.reduce((s, x) => s + x.score, 0) / last14.length) : null;
  const avg30 = last30.length ? (last30.reduce((s, x) => s + x.score, 0) / last30.length) : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(13,27,42,0.25)", backdropFilter: "blur(6px)",
        }}
      />
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(560px, 100vw)", zIndex: 51,
          background: "linear-gradient(180deg, #FFFFFF 0%, #FAFCFE 100%)",
          borderLeft: "1px solid rgba(13,27,42,0.06)",
          boxShadow: "-24px 0 64px rgba(13,27,42,0.18)",
          color: "#0D1B2A", overflow: "auto",
        }}
      >
        <div style={{
          padding: "24px 28px",
          borderBottom: "1px solid rgba(13,27,42,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          zIndex: 2,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: `linear-gradient(135deg, ${meta.color}1F, ${meta.color}10)`,
              border: `1px solid ${meta.color}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: meta.color,
              boxShadow: `0 4px 12px ${meta.color}20, inset 0 1px 0 rgba(255,255,255,0.6)`,
            }}>
              {meta.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(13,27,42,0.45)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>
                Skill Module
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#0D1B2A" }}>{label}</h2>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 38, height: 38, borderRadius: 12,
            background: "#FFFFFF",
            border: "1px solid rgba(13,27,42,0.08)",
            color: "#0D1B2A", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 3px rgba(13,27,42,0.05), 0 4px 12px rgba(13,27,42,0.05)",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{
            padding: 28, borderRadius: 22,
            background: `linear-gradient(135deg, ${meta.color}10 0%, #FFFFFF 100%)`,
            border: `1px solid ${meta.color}24`,
            position: "relative", overflow: "hidden",
            boxShadow: `0 1px 3px rgba(13,27,42,0.03), 0 12px 32px ${meta.color}1A`,
          }}>
            <div style={{
              position: "absolute", top: -40, right: -40,
              width: 160, height: 160,
              background: `radial-gradient(circle, ${meta.color}1F 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              color: meta.color, textTransform: "uppercase", marginBottom: 10,
            }}>
              Huidige Score
            </div>
            <div style={{
              fontSize: 96, fontWeight: 700,
              fontFamily: '"Inter", system-ui, sans-serif',
              color: meta.color, letterSpacing: "-0.05em", lineHeight: 0.85,
            }}>
              {score > 0 ? score.toFixed(1) : "—"}
            </div>
            <div style={{ display: "flex", gap: 22, marginTop: 18 }}>
              <DetailStat label="14-dagen gem." value={avg14?.toFixed(1) ?? "—"} color={meta.color} />
              <DetailStat label="30-dagen gem." value={avg30?.toFixed(1) ?? "—"} color={meta.color} />
              <DetailStat label="Datapunten" value={String(series.length)} color={meta.color} />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(13,27,42,0.5)", textTransform: "uppercase", marginBottom: 14 }}>
              Geschiedenis
            </h3>
            {series.length === 0 ? (
              <EmptyHint text="Nog geen evaluaties voor deze categorie." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...series].reverse().slice(0, 10).map((s, i) => (
                  <div key={i} style={{
                    padding: "14px 18px", borderRadius: 14,
                    background: "#FFFFFF",
                    border: "1px solid rgba(13,27,42,0.05)",
                    display: "flex", alignItems: "center", gap: 14,
                    boxShadow: "0 1px 3px rgba(13,27,42,0.03)",
                  }}>
                    <div style={{
                      fontSize: 22, fontWeight: 700,
                      fontFamily: '"Inter", system-ui, sans-serif',
                      color: meta.color, letterSpacing: "-0.03em",
                      width: 52, textAlign: "right",
                    }}>
                      {s.score.toFixed(1)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#0D1B2A", fontWeight: 600 }}>
                        {formatDate(s.date)}
                      </div>
                      {s.notes && (
                        <div style={{ fontSize: 11, color: "rgba(13,27,42,0.5)", marginTop: 3 }}>
                          {s.notes.slice(0, 70)}{s.notes.length > 70 ? "…" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   SUB-PIECES
   ───────────────────────────────────────────────────────── */

function Section({ title, subtitle, children, action }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section>
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        marginBottom: 16, gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0D1B2A", letterSpacing: "-0.022em" }}>
            {title}
          </h2>
          {subtitle && (
            <div style={{ fontSize: 12.5, color: "rgba(13,27,42,0.5)", marginTop: 3 }}>
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function HeroChip({ label, accent, icon, mono, emphasis }: {
  label: string; accent?: string; icon?: string; mono?: boolean; emphasis?: boolean;
}) {
  const color = accent ?? "rgba(13,27,42,0.6)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 11, fontWeight: emphasis ? 700 : 600, letterSpacing: emphasis ? "0.08em" : "0.02em",
      padding: emphasis ? "6px 14px" : "5px 12px",
      borderRadius: 999,
      background: accent ? `${accent}10` : "rgba(13,27,42,0.04)",
      color: accent ? color : "rgba(13,27,42,0.7)",
      border: `1px solid ${accent ? `${accent}24` : "rgba(13,27,42,0.06)"}`,
      fontFamily: mono ? '"Inter", system-ui, sans-serif' : undefined,
      textTransform: emphasis ? "uppercase" : undefined,
      boxShadow: emphasis ? `0 4px 12px ${accent}1F` : "none",
    }}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

function HeroStat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div style={{
        fontSize: 10, letterSpacing: "0.14em", fontWeight: 600,
        color: "rgba(13,27,42,0.4)", textTransform: "uppercase", marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 16, fontWeight: 700,
        color: valueColor ?? "#0D1B2A", letterSpacing: "-0.015em",
      }}>
        {value}
      </div>
    </div>
  );
}

function DetailStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, letterSpacing: "0.14em", color: "rgba(13,27,42,0.45)", textTransform: "uppercase", marginBottom: 5, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 700,
        fontFamily: '"Inter", system-ui, sans-serif',
        color, letterSpacing: "-0.02em",
      }}>
        {value}
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={{
      padding: "22px 18px", borderRadius: 16,
      background: "rgba(13,27,42,0.02)",
      border: "1px dashed rgba(13,27,42,0.1)",
      textAlign: "center",
      fontSize: 12, color: "rgba(13,27,42,0.5)", lineHeight: 1.55,
    }}>
      {text}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TACTICAL IQ HIGHSCORE TILE
   ───────────────────────────────────────────────────────── */

function IQScoreTile({ bestScore, recentScores }: {
  bestScore: GameScore | undefined;
  recentScores: GameScore[];
}) {
  if (!bestScore) return null;
  const pct = (bestScore.total_score / Math.max(bestScore.max_possible, 1)) * 100;

  return (
    <Tilt3D max={8} lift={6} scale={1.01} glare>
      <div style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        background: "linear-gradient(135deg, #fff 0%, #FAFCFE 60%, #F0F4F9 100%)",
        border: "1px solid rgba(13,27,42,0.05)",
        boxShadow: `
          0 1px 3px rgba(13,27,42,0.03),
          0 12px 32px rgba(13,27,42,0.05),
          0 40px 80px -20px rgba(124,58,237,0.15)
        `,
        padding: 28,
      }}>
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 240, height: 240,
          background: "radial-gradient(circle, rgba(124,58,237,0.14), transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="iq-grid" style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 32,
          alignItems: "center",
        }}>
          {/* Big highscore */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              color: "#7C3AED", textTransform: "uppercase", marginBottom: 8,
              padding: "4px 10px", borderRadius: 999,
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.18)",
            }}>
              <Brain size={11} /> Highscore
            </div>
            <div style={{
              fontSize: 72, fontWeight: 800,
              color: "#7C3AED",
              letterSpacing: "-0.04em", lineHeight: 0.9,
              fontVariantNumeric: "tabular-nums",
            }}>
              {bestScore.total_score}
              <span style={{ fontSize: 22, color: "rgba(124,58,237,0.4)", fontWeight: 600 }}>
                /{bestScore.max_possible}
              </span>
            </div>
            <div style={{
              marginTop: 8, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                padding: "4px 10px", borderRadius: 999,
                background: "rgba(124,58,237,0.1)",
                color: "#7C3AED",
                border: "1px solid rgba(124,58,237,0.2)",
              }}>
                {bestScore.iq_label ?? "Speler"}
              </span>
              <span style={{ fontSize: 12, color: "#6B7280" }}>
                {Math.round(pct)}% accuracy
              </span>
            </div>
          </div>

          {/* Recent scores list */}
          <div>
            <div style={{
              fontSize: 10, letterSpacing: "0.14em", fontWeight: 700,
              color: "#6B7280", textTransform: "uppercase", marginBottom: 12,
            }}>
              Recente sessies
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentScores.map((s, i) => {
                const sPct = (s.total_score / Math.max(s.max_possible, 1)) * 100;
                const isBest = s.id === bestScore.id;
                return (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 12px",
                    borderRadius: 10,
                    background: isBest ? "rgba(124,58,237,0.06)" : "rgba(13,27,42,0.025)",
                    border: `1px solid ${isBest ? "rgba(124,58,237,0.18)" : "rgba(13,27,42,0.04)"}`,
                  }}>
                    <span style={{
                      fontSize: 10, color: "#9CA3AF",
                      width: 20, fontVariantNumeric: "tabular-nums",
                    }}>
                      {i + 1}.
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0D1B2A" }}>
                        {s.iq_label ?? "Sessie"}
                        {isBest && <span style={{ marginLeft: 6, color: "#F0A500" }}>👑</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "#9CA3AF" }}>
                        {new Date(s.created_at).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })} · {s.mode === "classic" ? "Klassiek" : "Oneindig"}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 700,
                      color: isBest ? "#7C3AED" : "#0D1B2A",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {s.total_score}
                      <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>/{s.max_possible}</span>
                    </span>
                    <span style={{
                      width: 36, fontSize: 10, color: "#9CA3AF",
                      textAlign: "right", fontVariantNumeric: "tabular-nums",
                    }}>
                      {Math.round(sPct)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 720px) { .iq-grid { grid-template-columns: 1fr !important; gap: 20px !important; } }
        ` }} />
      </div>
    </Tilt3D>
  );
}

/* ─────────────────────────────────────────────────────────
   PITCH TILE — Aesthetic green football field (top-down)
   ───────────────────────────────────────────────────────── */

const PITCH_ZONES: Record<string, { x: number; y: number; label: string }> = {
  GK:  { x: 50, y: 92, label: "Keeper" },
  CB:  { x: 50, y: 76, label: "CB" },
  LB:  { x: 18, y: 72, label: "LB" },
  RB:  { x: 82, y: 72, label: "RB" },
  CDM: { x: 50, y: 60, label: "CDM" },
  CM:  { x: 50, y: 48, label: "CM" },
  CAM: { x: 50, y: 34, label: "CAM" },
  LW:  { x: 18, y: 26, label: "LW" },
  RW:  { x: 82, y: 26, label: "RW" },
  ST:  { x: 50, y: 14, label: "ST" },
  SS:  { x: 50, y: 22, label: "SS" },
};

function PitchTile({ primary, secondary, assessedCounts }: {
  primary: string;
  secondary?: string;
  assessedCounts: Record<string, number>;
}) {
  // Combine assessed counts with player's primary/secondary
  const allCounts = { ...assessedCounts };
  allCounts[primary] = (allCounts[primary] ?? 0) + 5;
  if (secondary) allCounts[secondary] = (allCounts[secondary] ?? 0) + 2;
  const maxCount = Math.max(...Object.values(allCounts), 1);

  return (
    <Tilt3D max={6} lift={6} scale={1.01} glare={false}>
      <div style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        // Aesthetic muted green — deep forest/sage not bright fluorescent
        background: "linear-gradient(180deg, #2A4D33 0%, #1E3B26 40%, #16301E 100%)",
        boxShadow: `
          0 4px 12px rgba(13,27,42,0.08),
          0 24px 56px rgba(13,27,42,0.15),
          0 1px 0 rgba(255,255,255,0.1) inset
        `,
        aspectRatio: "1.6 / 1",
        maxHeight: 380,
      }}>
        {/* Aesthetic vertical mowing stripes (alternating slightly lighter/darker green) */}
        <div style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${i * 10}%`,
                top: 0,
                width: "10%",
                height: "100%",
                background: i % 2 === 0
                  ? "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))"
                  : "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.08))",
              }}
            />
          ))}
        </div>

        {/* Subtle radial vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }} />

        {/* Pitch lines */}
        <svg
          viewBox="0 0 100 62"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient id="pitchLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
            </linearGradient>
          </defs>
          {/* outer line */}
          <rect x={2} y={2} width={96} height={58} fill="none"
            stroke="url(#pitchLine)" strokeWidth={0.3} />
          {/* halfway */}
          <line x1={2} y1={31} x2={98} y2={31}
            stroke="rgba(255,255,255,0.4)" strokeWidth={0.3} />
          {/* center circle */}
          <circle cx={50} cy={31} r={6.5} fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth={0.3} />
          <circle cx={50} cy={31} r={0.6} fill="rgba(255,255,255,0.5)" />
          {/* top penalty area */}
          <rect x={26} y={2} width={48} height={11} fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth={0.3} />
          <rect x={38} y={2} width={24} height={4.5} fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth={0.3} />
          <circle cx={50} cy={9} r={0.6} fill="rgba(255,255,255,0.5)" />
          {/* bottom penalty area */}
          <rect x={26} y={49} width={48} height={11} fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth={0.3} />
          <rect x={38} y={55.5} width={24} height={4.5} fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth={0.3} />
          <circle cx={50} cy={53} r={0.6} fill="rgba(255,255,255,0.5)" />
        </svg>

        {/* Position markers */}
        {(Object.entries(allCounts) as [string, number][]).map(([pos, count]) => {
          const zone = PITCH_ZONES[pos];
          if (!zone) return null;
          const intensity = count / maxCount;
          const isPrimary = pos === primary;
          const isSecondary = pos === secondary;
          const color = isPrimary ? "#F0A500" : isSecondary ? "#4DAEE5" : "#4DAEE5";

          return (
            <div
              key={pos}
              style={{
                position: "absolute",
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            >
              {/* Heat glow */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 80, height: 80,
                background: `radial-gradient(circle, ${color}${Math.round(intensity * 60).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
                filter: `blur(${(1 - intensity) * 6}px)`,
                pointerEvents: "none",
              }} />
              {/* Position dot */}
              <div style={{
                position: "relative",
                padding: isPrimary ? "5px 11px" : "4px 9px",
                borderRadius: 999,
                background: isPrimary
                  ? "linear-gradient(135deg, #F0A500, #B07700)"
                  : "rgba(13,27,42,0.85)",
                backdropFilter: "blur(4px)",
                border: `1px solid ${isPrimary ? "#FFC04C" : `${color}50`}`,
                fontSize: 10, fontWeight: 800,
                letterSpacing: "0.06em",
                color: isPrimary ? "#0D1B2A" : "#fff",
                whiteSpace: "nowrap",
                boxShadow: `0 4px 12px rgba(0,0,0,0.4), 0 0 16px ${color}50`,
              }}>
                {pos}
              </div>
            </div>
          );
        })}

        {/* Bottom label overlay */}
        <div style={{
          position: "absolute",
          bottom: 14, left: 14,
          padding: "6px 12px",
          borderRadius: 999,
          background: "rgba(13,27,42,0.6)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.8)",
          textTransform: "uppercase",
        }}>
          ⚽ Posities
        </div>

        {/* Legend top-right */}
        <div style={{
          position: "absolute", top: 14, right: 14,
          display: "flex", gap: 8,
          padding: "6px 12px", borderRadius: 999,
          background: "rgba(13,27,42,0.55)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.85)",
          textTransform: "uppercase",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F0A500" }} />
            Primair
          </span>
          {secondary && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4DAEE5" }} />
              Secundair
            </span>
          )}
        </div>
      </div>
    </Tilt3D>
  );
}

function FullScreenLoader() {
  return (
    <div style={dashboardBg}>
      <BgMesh />
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        minHeight: "calc(100vh - 52px)", justifyContent: "center",
        margin: "-28px -28px -40px",
      }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#1B6CA8" }} />
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(13,27,42,0.5)", textTransform: "uppercase", fontWeight: 600 }}>
          Performance Lab
        </div>
      </div>
    </div>
  );
}

function BgMesh() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `
        radial-gradient(ellipse 70% 60% at 15% 0%, rgba(77,174,229,0.10), transparent 55%),
        radial-gradient(ellipse 50% 50% at 95% 25%, rgba(240,165,0,0.08), transparent 60%),
        radial-gradient(ellipse 60% 70% at 50% 100%, rgba(27,108,168,0.06), transparent 65%)
      `,
      pointerEvents: "none",
      zIndex: 0,
    }} />
  );
}

function NoiseOverlay() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.025 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      opacity: 0.5,
      mixBlendMode: "multiply",
      pointerEvents: "none",
      zIndex: 0,
    }} />
  );
}

function PitchPattern() {
  return (
    <svg style={{
      position: "absolute", inset: 0, width: "100%", height: "100%",
      opacity: 0.08, pointerEvents: "none",
    }} viewBox="0 0 100 60" preserveAspectRatio="none">
      <rect x={2} y={2} width={96} height={56} fill="none" stroke="#1B6CA8" strokeWidth={0.15} />
      <line x1={50} y1={2} x2={50} y2={58} stroke="#1B6CA8" strokeWidth={0.15} />
      <circle cx={50} cy={30} r={6} fill="none" stroke="#1B6CA8" strokeWidth={0.15} />
      <rect x={2} y={18} width={14} height={24} fill="none" stroke="#1B6CA8" strokeWidth={0.15} />
      <rect x={84} y={18} width={14} height={24} fill="none" stroke="#1B6CA8" strokeWidth={0.15} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   STYLES & HELPERS
   ───────────────────────────────────────────────────────── */

const dashboardBg: React.CSSProperties = {
  margin: "-28px -28px -40px",
  minHeight: "calc(100vh - 52px)",
  background: "linear-gradient(180deg, #F4F7FA 0%, #FFFFFF 40%, #F0F4F9 100%)",
  position: "relative",
  overflow: "hidden",
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "10px 22px", borderRadius: 10,
  background: "linear-gradient(180deg, #4DAEE5 0%, #1B6CA8 100%)",
  color: "#fff", fontSize: 13, fontWeight: 700,
  textDecoration: "none",
  boxShadow: "0 4px 16px rgba(77,174,229,0.4), 0 1px 0 rgba(255,255,255,0.2) inset",
};

const ghostBtnDark: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "7px 14px", borderRadius: 999,
  background: "#FFFFFF",
  border: "1px solid rgba(13,27,42,0.08)",
  color: "rgba(13,27,42,0.7)",
  fontSize: 11.5, fontWeight: 600, textDecoration: "none",
  boxShadow: "0 1px 3px rgba(13,27,42,0.04), 0 4px 12px rgba(13,27,42,0.04)",
};

function overallColor(r: number): string {
  if (r >= 85) return "#F0A500";
  if (r >= 75) return "#4DAEE5";
  if (r >= 65) return "#16A34A";
  if (r >= 55) return "#7C3AED";
  return "#8A9BB0";
}

const globalCss = `
  @keyframes dashPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.55; transform: scale(1.3); }
  }
  .dash-grid-skills {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .dash-grid-wellbeing {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
  }
  .dash-grid-checkin {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .dash-grid-goals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }
  .timeline-scroll::-webkit-scrollbar { height: 6px; }
  .timeline-scroll::-webkit-scrollbar-track { background: transparent; }
  .timeline-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
  @media (max-width: 1080px) {
    .dash-grid-skills { grid-template-columns: repeat(2, 1fr); }
    .dash-grid-wellbeing { grid-template-columns: 1fr; }
  }
  @media (max-width: 720px) {
    .dash-hero-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
    .dash-hero-name { font-size: 38px !important; }
    .dash-grid-skills { grid-template-columns: 1fr !important; }
    .dash-grid-checkin { grid-template-columns: repeat(2, 1fr); }
    .dash-ovr-wrap { width: 180px !important; height: 180px !important; }
  }
  @media (max-width: 480px) {
    .dash-page { padding: 16px 12px 60px !important; margin: -28px -28px -40px !important; }
    .dash-hero { padding: 22px !important; border-radius: 22px !important; }
    .dash-hero-name { font-size: 30px !important; letter-spacing: -0.02em !important; }
    .dash-hero-grid { gap: 18px !important; }
    .dash-ovr-wrap { width: 150px !important; height: 150px !important; }
    .dash-grid-goals { grid-template-columns: 1fr !important; }
  }
`;
