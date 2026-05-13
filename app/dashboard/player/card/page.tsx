"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Loader2, Quote, TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import { getMyPlayerData } from "@/lib/supabase/queries";
import {
  ARCHETYPES, SOCIOTYPES, POSITION_LABELS, CATEGORY_LABELS,
} from "@/lib/types";
import { getRatingLabel, formatDate } from "@/lib/utils";
import type { Evaluation, EvaluationCategory, PlayerWithDetails } from "@/lib/types";

/* ───────────────────────────────────────────────────────────── */
/*  Helpers                                                      */
/* ───────────────────────────────────────────────────────────── */

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

function sociotypeImpact(id: string): string {
  const impacts: Record<string, string> = {
    leider:       "Je trekt het team mee in lastige momenten. Coach communiceert direct met jou over teamtaken.",
    strijder:     "Je tempo zakt nooit. Je wordt ingezet in duels die mentaal en fysiek pijn doen.",
    denker:       "Je leest het spel sneller dan medespelers. Je krijgt vrijheid om posities te kiezen.",
    kunstenaar:   "Je beslissingen zijn moeilijk te lezen voor verdedigers. Coach geeft je de ruimte om risico te nemen.",
    professional: "Je presteert constant op een hoog gemiddelde. Je bent betrouwbaar in elke wedstrijd.",
    rustbrenger:  "Je houdt het team kalm onder druk. Jij bent de speler die de bal vraagt als anderen panikeren.",
    joker:        "Je houdt de groep mentaal lichtvoetig. In zware fases bouw jij de spanning af.",
    killer:       "Je kunt afsluiten als het moment er is. Coach plaatst jou waar afronding telt.",
  };
  return impacts[id] ?? "";
}

/* ───────────────────────────────────────────────────────────── */
/*  Page                                                         */
/* ───────────────────────────────────────────────────────────── */

export default function PlayerCardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<string>(String(new Date().getFullYear()));

  useEffect(() => {
    async function load() {
      const data = await getMyPlayerData();
      setPlayer(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--sfa-blue)" }} />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-12">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Geen spelersgegevens</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Vul eerst je profiel aan.</p>
        <Link href="/onboarding" className="btn-primary">Naar onboarding</Link>
      </div>
    );
  }

  // ── Derive seasons from evaluation history ─────────────
  const evals = player.evaluations ?? [];
  const latestEval = evals[0];
  const archetype = player.identity?.primary_archetype ? ARCHETYPES[player.identity.primary_archetype] : null;
  const sociotype = player.identity?.primary_sociotype ? SOCIOTYPES[player.identity.primary_sociotype] : null;
  const age = calculateAge(player.date_of_birth);
  const progressData = buildProgressData(evals);

  const evalYears = Array.from(new Set(evals.map(e => new Date(e.evaluation_date).getFullYear().toString())))
    .sort((a, b) => parseInt(b) - parseInt(a));
  const seasons = evalYears.length ? evalYears.slice(0, 3) : [String(new Date().getFullYear())];

  const trendDelta = evals.length >= 2 && evals[0].overall_score && evals[1].overall_score
    ? evals[0].overall_score - evals[1].overall_score
    : 0;

  // ── Attributes for the radar (matches Liga BBVA columns) ────
  const ATTRIBUTES = [
    { label: "PACE",      value: latestEval?.scores?.find(s => s.category === "fysiek")?.score ?? 0 },
    { label: "SHOOTING",  value: latestEval?.scores?.find(s => s.category === "techniek")?.score ?? 0 },
    { label: "PASSING",   value: latestEval?.scores?.find(s => s.category === "techniek")?.score ?? 0 },
    { label: "DRIBBLING", value: latestEval?.scores?.find(s => s.category === "techniek")?.score ?? 0 },
    { label: "DEFENDING", value: latestEval?.scores?.find(s => s.category === "tactiek")?.score ?? 0 },
    { label: "FORM",      value: latestEval?.scores?.find(s => s.category === "mentaal")?.score ?? 0 },
    { label: "HEALTH",    value: latestEval?.scores?.find(s => s.category === "teamplay")?.score ?? 0 },
  ];

  // ── Foot stats ────────────────────────────────────────
  const techniekScore = latestEval?.scores?.find(s => s.category === "techniek")?.score ?? 0;
  const FOOT_STATS = [
    { label: player.dominant_foot === "left" ? "LEFT FOOT" : "RIGHT FOOT", value: techniekScore },
    { label: player.dominant_foot === "left" ? "RIGHT FOOT" : "LEFT FOOT", value: Math.max(0, techniekScore - 2.5) },
    { label: "SKILLS",     value: techniekScore },
    { label: "WORK RATE",  value: latestEval?.scores?.find(s => s.category === "mentaal")?.score ?? 0 },
  ];

  const firstNameLine = `${player.first_name ?? ""}`.trim();
  const lastNameLine = `${player.last_name ?? ""}`.trim();
  const photoUrl = player.photo_url ?? player.avatar_url ?? null;

  // Bio composed from identity / archetype
  const bioLead = player.identity?.ai_summary
    ? player.identity.ai_summary.split(".").slice(0, 1).join(".") + "."
    : archetype
      ? `${player.first_name} speelt als ${archetype.label} — ${archetype.description}.`
      : `${player.first_name} ${player.last_name} maakt deel uit van de Schoonhoven Sports Academy A-selectie.`;

  const bioBody = player.identity?.ai_summary
    ? player.identity.ai_summary.split(".").slice(1).join(".").trim() || ""
    : sociotype
      ? `Als ${sociotype.label.toLowerCase()} brengt ${player.first_name} ${sociotype.description.toLowerCase()}`
      : "";

  return (
    <div
      className="pc-page"
      style={{
        margin: "-28px -28px -40px",
        minHeight: "calc(100vh - 52px)",
        background: "#E5E7EB",
        padding: "24px 20px 60px",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <ResponsiveStyles />

      {/* ═══════════════════════ HERO CARD ═══════════════════════ */}
      <section className="pc-hero" style={{
        maxWidth: 1200,
        margin: "0 auto",
        background: "#0D1B2A",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(13,27,42,0.35), 0 8px 24px rgba(13,27,42,0.15)",
        position: "relative",
        minHeight: 600,
      }}>
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

        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={i * 100} y1={0} x2={i * 100 + 200} y2={700} stroke="#fff" strokeWidth={1} />
          ))}
        </svg>

        {/* === Year tabs + Performance selector === */}
        <header className="pc-header" style={{
          position: "relative",
          padding: "26px 36px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 5,
        }}>
          <div style={{ display: "flex", gap: 28 }}>
            {seasons.map((s) => (
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

        {/* === Body grid: text | photo | radar === */}
        <div className="pc-body" style={{
          position: "relative",
          padding: "40px 36px 60px",
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1fr) minmax(280px, 380px) minmax(360px, 1fr)",
          gap: 0,
          zIndex: 5,
        }}>
          {/* LEFT: text + identity */}
          <div className="pc-text" style={{ position: "relative", paddingRight: 20, zIndex: 6 }}>
            <h1 className="pc-name" style={{
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "#fff",
              marginBottom: 10,
              textTransform: "uppercase",
            }}>
              {firstNameLine} {lastNameLine}
            </h1>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#4DAEE5",
              textTransform: "uppercase",
              marginBottom: 28,
            }}>
              {POSITION_LABELS[player.position]}
            </div>

            {bioLead && (
              <p style={{
                fontSize: 14, fontWeight: 700, lineHeight: 1.45,
                color: "#fff", marginBottom: 14,
              }}>
                {bioLead}
              </p>
            )}

            {bioBody && (
              <p style={{
                fontSize: 13, lineHeight: 1.55,
                color: "rgba(255,255,255,0.72)", marginBottom: 40,
              }}>
                {bioBody}
              </p>
            )}

            <div style={{
              display: "flex", flexDirection: "column", gap: 18, color: "#fff",
              marginTop: bioBody ? 0 : 24,
            }}>
              <IdentityStat label="Date of Birth" value={player.date_of_birth ? formatDate(player.date_of_birth) : "—"} />
              <IdentityStat label="Nationality" value={player.nationality ?? "—"} />
              <IdentityStat
                label="Profile"
                value={[
                  player.height_cm ? `${(player.height_cm / 100).toFixed(2)} m` : null,
                  player.weight_kg ? `${player.weight_kg} kg` : null,
                  age ? `${age}j` : null,
                ].filter(Boolean).join(" · ") || "—"}
              />
            </div>
          </div>

          {/* MIDDLE: cutout photo */}
          <div className="pc-photo-col" style={{
            position: "relative",
            minHeight: 540,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 4,
          }}>
            <div className="pc-photo-wrap" style={{
              position: "absolute",
              top: -20,
              left: "50%",
              transform: "translateX(-50%)",
              width: "115%",
              height: "calc(100% + 60px)",
              pointerEvents: "none",
              maxWidth: 440,
            }}>
              {photoUrl ? (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <Image
                    src={photoUrl}
                    alt={`${player.first_name} ${player.last_name}`}
                    fill
                    style={{ objectFit: "contain", objectPosition: "bottom center" }}
                    unoptimized
                  />
                </div>
              ) : (
                <PlayerSilhouette jersey={player.jersey_number ?? null} />
              )}
            </div>
          </div>

          {/* RIGHT: radar + foot stats */}
          <div className="pc-right" style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 5,
          }}>
            <div className="pc-radar-wrap" style={{ display: "flex", justifyContent: "center" }}>
              <BigRadar attrs={ATTRIBUTES} />
            </div>

            <div className="pc-foot-stats" style={{
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
      </section>

      {/* ═══════════════════════ SOCIOTYPE + CORE VALUES ═══════════════════════ */}
      {(sociotype || archetype) && (
        <section style={{
          maxWidth: 1200,
          margin: "32px auto 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }} className="pc-secondary-grid">
          {archetype && (
            <ProfileCard
              eyebrow="Primair Archetype"
              icon={archetype.icon}
              title={archetype.label}
              description={archetype.description}
              traits={archetype.traits}
              accent={archetype.color}
            />
          )}
          {sociotype && (
            <ProfileCard
              eyebrow="Karakter · Sociotype"
              icon={sociotype.icon}
              title={sociotype.label}
              description={sociotype.description}
              traits={sociotype.traits}
              accent={sociotype.color_hex}
              footnote={sociotypeImpact(sociotype.id)}
            />
          )}
        </section>
      )}

      {/* ═══════════════════════ CORE VALUES ═══════════════════════ */}
      {player.identity && (
        <section style={{
          maxWidth: 1200,
          margin: "20px auto 0",
          padding: "32px 32px",
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #E1E4EB",
          boxShadow: "0 4px 20px rgba(13,27,42,0.04)",
        }}>
          <SectionTitle eyebrow="Drivers" title="Core Values" sub="Wat jou drijft op het veld" />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            marginTop: 24,
          }} className="pc-core-grid">
            <CoreValueCard
              label="Noodzaak"
              value={player.identity.core_noodzaak ?? 0}
              color="#D64045"
              description="Hoe sterk je vanuit urgentie speelt — moeten winnen, geen excuus, scherp blijven."
            />
            <CoreValueCard
              label="Creativiteit"
              value={player.identity.core_creativiteit ?? 0}
              color="#7C3AED"
              description="Je vermogen verrassende oplossingen te vinden, patronen te doorbreken."
            />
            <CoreValueCard
              label="Vertrouwen"
              value={player.identity.core_vertrouwen ?? 0}
              color="#16A34A"
              description="Het zelfvertrouwen waarmee je beslissingen neemt, ook na fouten."
            />
          </div>
        </section>
      )}

      {/* ═══════════════════════ EVOLUTION ═══════════════════════ */}
      {progressData.length > 1 && (
        <section style={{
          maxWidth: 1200,
          margin: "20px auto 0",
          padding: "32px 32px",
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #E1E4EB",
          boxShadow: "0 4px 20px rgba(13,27,42,0.04)",
        }}>
          <SectionTitle
            eyebrow="Ontwikkeling"
            title="Rating verloop"
            sub={`${progressData.length} evaluaties`}
            right={
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {trendDelta > 0 ? <TrendingUp size={14} style={{ color: "var(--green)" }} />
                  : trendDelta < 0 ? <TrendingDown size={14} style={{ color: "var(--sfa-red)" }} />
                  : <Minus size={14} style={{ color: "var(--text-dim)" }} />}
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: trendDelta > 0 ? "var(--green)" : trendDelta < 0 ? "var(--sfa-red)" : "var(--text-muted)",
                }}>
                  {trendDelta > 0 ? "+" : ""}{trendDelta.toFixed(1)} vs vorige
                </span>
              </div>
            }
          />
          <div style={{ marginTop: 24, marginLeft: -12, marginRight: -12 }}>
            <ProgressLineChart data={progressData} height={220} />
          </div>
        </section>
      )}

      {/* ═══════════════════════ COACH FEEDBACK ═══════════════════════ */}
      {latestEval?.notes && (
        <section style={{
          maxWidth: 1200,
          margin: "20px auto 0",
          padding: "32px 32px",
          background: "#0D1B2A",
          borderRadius: 18,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: -60, right: -60,
            width: 240, height: 240,
            background: "radial-gradient(circle, rgba(240,165,0,0.12), transparent 70%)",
            pointerEvents: "none",
          }} />
          <Quote size={32} style={{
            color: "rgba(240,165,0,0.3)",
            position: "absolute",
            top: 28,
            right: 28,
          }} />
          <div style={{
            fontSize: 10, letterSpacing: "0.14em",
            fontWeight: 700, color: "#F0A500",
            textTransform: "uppercase", marginBottom: 8,
          }}>
            Coach feedback
          </div>
          <h3 style={{
            fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em",
            marginBottom: 20,
          }}>
            Recente beoordeling
          </h3>
          <p style={{
            fontSize: 16, lineHeight: 1.6,
            color: "rgba(255,255,255,0.88)",
            marginBottom: 24,
            maxWidth: 820,
          }}>
            &ldquo;{latestEval.notes}&rdquo;
          </p>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #F0A500, #B07700)",
              color: "#0D1B2A",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700,
            }}>
              {(latestEval.coach_name ?? "C").split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {latestEval.coach_name ?? "Coach"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                {formatDate(latestEval.evaluation_date)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════ ACTIVE MISSION ═══════════════════════ */}
      {(() => {
        const active = player.challenges?.find(c => c.status === "in_progress");
        if (!active) return null;
        return (
          <section style={{
            maxWidth: 1200,
            margin: "20px auto 0",
            padding: "32px 36px",
            background: "linear-gradient(135deg, rgba(77,174,229,0.08), rgba(13,27,42,0.04))",
            borderRadius: 18,
            border: "1px solid rgba(77,174,229,0.2)",
            display: "grid",
            gridTemplateColumns: "1fr 200px",
            gap: 40,
            alignItems: "center",
          }} className="pc-mission">
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 11px", borderRadius: 999,
                background: "rgba(77,174,229,0.15)",
                border: "1px solid rgba(77,174,229,0.3)",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                color: "#1B6CA8", textTransform: "uppercase",
                marginBottom: 14,
              }}>
                <Trophy size={11} /> Active Challenge
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "#0D1B2A", marginBottom: 6 }}>
                {active.title}
              </h3>
              {active.description && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                  {active.description}
                </p>
              )}
              <div style={{ height: 6, borderRadius: 3, background: "rgba(13,27,42,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${active.progress}%`,
                  background: "linear-gradient(90deg, #4DAEE5, #1B6CA8)",
                  borderRadius: 3,
                  boxShadow: "0 0 12px rgba(77,174,229,0.4)",
                }} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: 64, fontWeight: 700,
                fontFamily: '"JetBrains Mono", monospace',
                color: "#1B6CA8", letterSpacing: "-0.04em", lineHeight: 1,
              }}>
                {active.progress}<span style={{ fontSize: 22, color: "rgba(27,108,168,0.5)" }}>%</span>
              </div>
              <div style={{
                fontSize: 10, letterSpacing: "0.14em",
                color: "var(--text-muted)", marginTop: 6,
                textTransform: "uppercase", fontWeight: 600,
              }}>
                Completion
              </div>
            </div>
          </section>
        );
      })()}

      {/* Empty state if no data at all */}
      {!archetype && !sociotype && !latestEval && (!player.identity || player.identity.core_noodzaak === undefined) && (
        <section style={{
          maxWidth: 760,
          margin: "32px auto 0",
          padding: "48px 32px",
          background: "#fff",
          borderRadius: 14,
          border: "1px dashed #C5D8E5",
          textAlign: "center",
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0D1B2A", marginBottom: 8 }}>
            Profiel wordt opgebouwd
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, maxWidth: 460, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
            Zodra je coach een evaluatie heeft toegevoegd, verschijnen hier je
            attributes, sociotype, core values en ontwikkeling.
          </p>
          <Link href="/dashboard/player/checkin" className="btn-primary">
            Vul je dagelijkse check-in in
          </Link>
        </section>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────────────────────────── */

function IdentityStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.95)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
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
        fontSize: 13, fontStyle: "italic", fontWeight: 700,
        letterSpacing: "0.04em", color: "#fff", marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <div style={{
          height: 3,
          flex: pct / 100 || 0.001,
          background: "linear-gradient(90deg, #1B6CA8, #4DAEE5)",
          borderRadius: 999,
          boxShadow: "0 0 8px rgba(77,174,229,0.6)",
        }} />
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

function SectionTitle({ eyebrow, title, sub, right }: { eyebrow: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div>
        <div style={{
          fontSize: 10, letterSpacing: "0.16em",
          color: "#1B6CA8", fontWeight: 700,
          textTransform: "uppercase", marginBottom: 6,
        }}>
          {eyebrow}
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#0D1B2A" }}>
          {title}
        </h2>
        {sub && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function ProfileCard({ eyebrow, icon, title, description, traits, accent, footnote }: {
  eyebrow: string; icon: string; title: string; description: string;
  traits: string[]; accent: string; footnote?: string;
}) {
  return (
    <div style={{
      padding: "28px 28px 32px",
      background: "#fff",
      borderRadius: 18,
      border: "1px solid #E1E4EB",
      boxShadow: "0 4px 20px rgba(13,27,42,0.04)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: 0, right: 0,
        width: 140, height: 140,
        background: `radial-gradient(circle at top right, ${accent}1A, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: `${accent}15`, border: `1px solid ${accent}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
        }}>
          {icon}
        </div>
        <div>
          <div style={{
            fontSize: 10, letterSpacing: "0.14em",
            color: "var(--text-muted)", textTransform: "uppercase",
            fontWeight: 700, marginBottom: 3,
          }}>
            {eyebrow}
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: accent, letterSpacing: "-0.02em" }}>
            {title}
          </h3>
        </div>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-2)", marginBottom: 18 }}>
        {description}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {traits.map(t => (
          <span key={t} style={{
            fontSize: 11, fontWeight: 600,
            padding: "5px 10px", borderRadius: 5,
            background: `${accent}10`, color: accent,
            border: `1px solid ${accent}25`,
          }}>
            {t}
          </span>
        ))}
      </div>

      {footnote && (
        <p style={{
          marginTop: 18, paddingTop: 16,
          borderTop: "1px solid #E1E4EB",
          fontSize: 12, lineHeight: 1.55,
          color: "var(--text-muted)", fontStyle: "italic",
        }}>
          {footnote}
        </p>
      )}
    </div>
  );
}

function CoreValueCard({ label, value, color, description }: {
  label: string; value: number; color: string; description: string;
}) {
  const pct = (value / 10) * 100;
  return (
    <div style={{
      padding: 24,
      background: "#F4F7FA",
      borderRadius: 14,
      border: "1px solid #E6F4FC",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: 0, right: 0,
        width: 100, height: 100,
        background: `radial-gradient(circle at top right, ${color}22, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          fontSize: 10, letterSpacing: "0.14em",
          color: "var(--text-muted)", textTransform: "uppercase",
          fontWeight: 700,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 42, fontWeight: 700, color,
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: "-0.04em", lineHeight: 0.9,
        }}>
          {value.toFixed(1)}
        </div>
      </div>
      <div style={{
        height: 3, borderRadius: 999,
        background: "rgba(13,27,42,0.06)",
        overflow: "hidden",
        marginBottom: 14,
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: 999,
        }} />
      </div>
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text-muted)" }}>
        {description}
      </p>
    </div>
  );
}

function PlayerSilhouette({ jersey }: { jersey: number | null }) {
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
      <ellipse cx="200" cy="580" rx="120" ry="20" fill="url(#ground)" />
      <g transform="translate(60, 40)">
        <ellipse cx="160" cy="42" rx="34" ry="40" fill="url(#bodyGrad)" />
        <path d="M 130 30 Q 160 -5 195 25 Q 200 38 192 45 Q 175 30 145 35 Z" fill="#fff" opacity="0.55" />
        <path d="M 145 80 L 178 80 L 180 100 L 142 100 Z" fill="url(#bodyGrad)" />
        <path d="M 80 110 Q 130 95 145 100 L 178 100 Q 220 105 250 130 Q 260 145 248 160 L 220 180 Q 200 240 210 290 Q 195 310 170 305 L 140 308 Q 110 305 100 280 Q 95 220 85 175 Q 60 145 80 110 Z" fill="url(#kitGrad)" />
        {jersey !== null && (
          <text x="170" y="190" fontSize="34" fontWeight="900" fill="#1B6CA8" textAnchor="middle" opacity="0.45"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}>{jersey}</text>
        )}
        <path d="M 80 130 Q 50 140 30 165 Q 18 185 15 210 Q 20 220 35 215 Q 50 195 65 175 Q 78 158 88 145 Z" fill="url(#bodyGrad)" />
        <path d="M 250 130 Q 285 140 305 175 Q 312 195 305 215 Q 290 220 280 200 Q 270 185 258 168 Z" fill="url(#bodyGrad)" />
        <path d="M 100 300 L 215 300 L 230 380 L 195 385 L 175 320 L 155 320 L 140 385 L 100 380 Z" fill="url(#kitGrad)" />
        <path d="M 100 380 Q 80 430 70 480 Q 65 510 80 520 Q 100 525 110 510 Q 130 455 140 410 Q 145 392 140 385 Z" fill="url(#bodyGrad)" />
        <path d="M 195 385 Q 220 410 240 450 Q 245 470 235 485 Q 220 490 210 475 Q 195 440 185 420 Q 180 405 195 385 Z" fill="url(#bodyGrad)" />
        <ellipse cx="92" cy="525" rx="22" ry="9" fill="#0D1B2A" opacity="0.75" />
        <ellipse cx="240" cy="490" rx="22" ry="9" fill="#0D1B2A" opacity="0.75" />
      </g>
    </svg>
  );
}

function BigRadar({ attrs }: { attrs: { label: string; value: number }[] }) {
  const size = 440;
  const cx = size / 2;
  const cy = size / 2;
  const R = 150;
  const n = attrs.length;

  const points = attrs.map((a, i) => {
    const ratio = Math.max(0, a.value / 10);
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
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <circle key={ring} cx={cx} cy={cy} r={R * ring} fill="none"
          stroke="rgba(255,255,255,0.12)" strokeWidth={ring === 1 ? 1.5 : 1} />
      ))}
      <path d={path} fill="url(#radarFill)" stroke="#4DAEE5" strokeWidth={2} />
      {labelPoints.map((p, i) => (
        <text key={i} x={p.x} y={p.y} fontSize={13} fill="#fff"
          textAnchor="middle" dominantBaseline="middle"
          style={{ fontWeight: 600, letterSpacing: "0.08em" }}>
          {attrs[i].label}
        </text>
      ))}
    </svg>
  );
}

function ResponsiveStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @media (max-width: 900px) {
        .pc-hero { min-height: 0 !important; border-radius: 14px !important; }
        .pc-header {
          padding: 16px 18px 0 !important;
          flex-wrap: wrap !important;
          gap: 12px !important;
        }
        .pc-header > div { gap: 14px !important; }
        .pc-header button { font-size: 12px !important; padding: 6px 12px !important; }
        .pc-body {
          grid-template-columns: 1fr !important;
          padding: 24px 18px 32px !important;
          gap: 0 !important;
        }
        .pc-name { font-size: 28px !important; }
        .pc-text { padding-right: 0 !important; }
        .pc-text p { max-width: 100% !important; }
        .pc-photo-col {
          min-height: 360px !important;
          order: 2 !important;
          margin-top: 24px !important;
        }
        .pc-photo-wrap {
          width: 80% !important;
          max-width: 280px !important;
          top: 0 !important;
          height: 100% !important;
        }
        .pc-right { order: 3 !important; margin-top: 12px !important; }
        .pc-radar-wrap svg { max-width: 280px !important; height: auto !important; }
        .pc-foot-stats {
          column-gap: 20px !important;
          row-gap: 18px !important;
          margin-top: 22px !important;
        }
        .pc-secondary-grid { grid-template-columns: 1fr !important; }
        .pc-core-grid { grid-template-columns: 1fr !important; }
        .pc-mission { grid-template-columns: 1fr !important; gap: 20px !important; }
      }
      @media (max-width: 480px) {
        .pc-page { padding: 12px 8px !important; }
        .pc-hero { border-radius: 12px !important; }
        .pc-header {
          padding: 12px 14px 0 !important;
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .pc-body { padding: 18px 14px 24px !important; }
        .pc-name { font-size: 22px !important; }
        .pc-photo-col { min-height: 280px !important; }
        .pc-photo-wrap { max-width: 220px !important; }
        .pc-radar-wrap svg { max-width: 240px !important; }
        .pc-foot-stats { column-gap: 14px !important; row-gap: 14px !important; }
      }
    ` }} />
  );
}
