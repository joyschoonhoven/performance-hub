"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Quote, Trophy, TrendingUp, TrendingDown, Minus, Sparkles, Loader2,
} from "lucide-react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import {
  ARCHETYPES, SOCIOTYPES, POSITION_LABELS, CATEGORY_LABELS,
} from "@/lib/types";
import { getRatingLabel, formatDate } from "@/lib/utils";
import type { Evaluation, EvaluationCategory, PlayerWithDetails } from "@/lib/types";

/* ───────────────────────────────────────────────────────── */
/*  Helpers                                                  */
/* ───────────────────────────────────────────────────────── */

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

function coreValueLevel(value: number): { levelLabel: string; desc: string } {
  if (value <= 4) {
    return { levelLabel: "Ontwikkelend", desc: "Nog ruimte om hierin te groeien — focus van de coach." };
  }
  if (value <= 6.5) {
    return { levelLabel: "Gezonde balans", desc: "Je voelt het wanneer nodig, maar blijft vrij." };
  }
  if (value <= 8) {
    return { levelLabel: "Sterke driver", desc: "Een duidelijk kenmerk van je spel — anderen merken het." };
  }
  return { levelLabel: "Onorthodox", desc: "Een uitgesproken signatuur — onvoorspelbaar voor tegenstanders." };
}

function sociotypeImpact(id: string): string {
  const impacts: Record<string, string> = {
    leider:       "Je trekt het team mee in lastige momenten. Coach communiceert direct met jou over teamtaken. Verwachting: jij bent de stem op het veld in cruciale fases.",
    strijder:     "Je tempo zakt nooit. Je wordt ingezet in duels die mentaal en fysiek pijn doen. Jouw onverzadigbaarheid drukt het ritme van de tegenstander.",
    denker:       "Je krijgt vrijheid om posities te kiezen. Verwachting: jij dicteert het tempo in de opbouwfase en bepaalt wanneer het team druk moet zetten.",
    kunstenaar:   "Je beslissingen zijn moeilijk te lezen voor verdedigers. Coach geeft je de ruimte om risico te nemen — fouten horen bij creatieve waarde.",
    professional: "Je presteert constant op een hoog gemiddelde. Je bent betrouwbaar in elke wedstrijd — geen pieken nodig, geen dalen geaccepteerd.",
    rustbrenger:  "Je houdt het team kalm onder druk. Jij bent de speler die de bal vraagt als anderen panikeren. Coach rekent op jouw stabiliteit.",
    joker:        "Je houdt de groep mentaal lichtvoetig. In zware fases bouw jij de spanning af — essentieel voor lange-termijn teamcohesie.",
    killer:       "Je kunt afsluiten als het moment er is. Coach plaatst jou waar afronding telt, omdat jouw mentaliteit niet inzakt onder kansen.",
  };
  return impacts[id] ?? "";
}

function buildEvolution(evals: Evaluation[]) {
  return [...evals]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map(ev => ({
      label: new Date(ev.evaluation_date).toLocaleDateString("nl-NL", { month: "short" }),
      value: Math.round((ev.overall_score ?? 7) * 10),
      date: ev.evaluation_date,
    }))
    .slice(-7);
}

const CAT_COLORS: Record<EvaluationCategory, string> = {
  techniek: "#4DAEE5",
  fysiek:   "#7DC4EE",
  tactiek:  "#F0A500",
  mentaal:  "#D64045",
  teamplay: "#16A34A",
};

/* ───────────────────────────────────────────────────────── */
/*  Page                                                     */
/* ───────────────────────────────────────────────────────── */

export default function PlayerCardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div style={{ minHeight: "calc(100vh - 52px)", background: "#0A0E14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#4DAEE5" }} />
      </div>
    );
  }

  if (!player) {
    return (
      <div style={{ minHeight: "calc(100vh - 52px)", background: "#0A0E14", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Geen spelersgegevens</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>Vul eerst je profiel aan.</p>
          <Link href="/onboarding" style={{
            display: "inline-block", padding: "10px 24px",
            background: "#1B6CA8", color: "#fff", borderRadius: 8,
            fontWeight: 600, fontSize: 13, textDecoration: "none",
          }}>
            Naar onboarding
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────
  const evals = player.evaluations ?? [];
  const latestEval = evals[0];
  const archetype = player.identity?.primary_archetype ? ARCHETYPES[player.identity.primary_archetype] : null;
  const sociotype = player.identity?.primary_sociotype ? SOCIOTYPES[player.identity.primary_sociotype] : null;
  const age = calculateAge(player.date_of_birth);

  const initials = `${player.first_name?.[0] ?? ""}${player.last_name?.[0] ?? ""}`;
  const photoUrl = player.photo_url ?? player.avatar_url ?? null;

  const trendDelta = evals.length >= 2 && evals[0].overall_score && evals[1].overall_score
    ? evals[0].overall_score - evals[1].overall_score
    : 0;

  // Attributes from latest evaluation, per category
  const ATTRIBUTES = (["techniek","fysiek","tactiek","mentaal","teamplay"] as EvaluationCategory[]).map(cat => ({
    label: CATEGORY_LABELS[cat],
    value: latestEval?.scores?.find(s => s.category === cat)?.score ?? 0,
    color: CAT_COLORS[cat],
  }));

  const evolution = buildEvolution(evals);

  // Active mission
  const activeMission = player.challenges?.find(c => c.status === "in_progress") ?? null;

  return (
    <div
      className="pc-page"
      style={{
        margin: "-28px -28px -40px",
        minHeight: "calc(100vh - 52px)",
        background: "#0A0E14",
        color: "#fff",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        overflow: "hidden",
        position: "relative",
      }}
    >
      <ResponsiveStyles />

      {/* Ambient background mesh */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse at 15% 0%, rgba(27,108,168,0.15), transparent 50%),
          radial-gradient(ellipse at 85% 30%, rgba(240,165,0,0.08), transparent 50%),
          radial-gradient(ellipse at 50% 100%, rgba(77,174,229,0.06), transparent 60%)
        `,
        pointerEvents: "none",
      }} />

      {/* ═══════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════ */}
      <section className="pc-hero" style={{
        position: "relative",
        padding: "60px 40px 0",
        maxWidth: 1280,
        margin: "0 auto",
      }}>
        <div className="pc-hero-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: 60,
          alignItems: "start",
        }}>
          {/* LEFT: name + identity */}
          <div style={{ paddingTop: 40 }}>
            {player.badge && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "5px 10px", borderRadius: 999,
                background: "rgba(240,165,0,0.08)",
                border: "1px solid rgba(240,165,0,0.25)",
                fontSize: 10, fontWeight: 700,
                letterSpacing: "0.14em", color: "#F0A500",
                textTransform: "uppercase", marginBottom: 28,
              }}>
                <Sparkles size={11} /> {player.badge}
              </div>
            )}

            <div style={{
              fontSize: 11, letterSpacing: "0.22em", fontWeight: 600,
              color: "rgba(77,174,229,0.7)", marginBottom: 18,
              textTransform: "uppercase",
            }}>
              {player.jersey_number ? `N° ${player.jersey_number} · ` : ""}{player.position} · {POSITION_LABELS[player.position]}
            </div>

            <h1 className="pc-firstname" style={{
              fontSize: 96, fontWeight: 200, letterSpacing: "-0.04em",
              lineHeight: 0.95, color: "rgba(255,255,255,0.95)", marginBottom: 6,
            }}>
              {player.first_name}
            </h1>
            <h1 className="pc-lastname" style={{
              fontSize: 96, fontWeight: 800, letterSpacing: "-0.05em",
              lineHeight: 0.95, color: "#fff", marginBottom: 32,
            }}>
              {player.last_name}.
            </h1>

            <div className="pc-stats-row" style={{
              display: "flex", gap: 40, marginTop: 36,
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              flexWrap: "wrap",
            }}>
              {age && <Stat label="AGE" value={`${age}`} />}
              {player.height_cm && <Stat label="HEIGHT" value={`${(player.height_cm / 100).toFixed(2)} m`} />}
              {player.dominant_foot && <Stat label="FOOT" value={player.dominant_foot === "left" ? "Links" : player.dominant_foot === "right" ? "Rechts" : "Beide"} />}
              <Stat label="CLUB" value={player.team_name ?? player.club ?? "SFA"} />
              <Stat label="JOINED" value={new Date(player.created_at).toLocaleDateString("nl-NL", { month: "short", year: "numeric" })} />
            </div>
          </div>

          {/* RIGHT: rating + free-floating cutout photo */}
          <div className="pc-photo-zone" style={{ position: "relative", paddingTop: 8, minHeight: 580 }}>
            {/* Ambient golden glow behind photo */}
            <div style={{
              position: "absolute",
              top: 40, right: -40,
              width: 480, height: 480,
              background: "radial-gradient(circle, rgba(240,165,0,0.18) 0%, transparent 60%)",
              pointerEvents: "none",
              zIndex: 0,
            }} />

            {/* Big OVR display floating top-right */}
            <div className="pc-ovr-block" style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-end",
              gap: 18,
              marginBottom: 24,
              zIndex: 2,
            }}>
              <div className="pc-overall" style={{
                fontSize: 180, fontWeight: 700,
                letterSpacing: "-0.06em", lineHeight: 0.82,
                color: "#F0A500",
                fontFamily: '"JetBrains Mono", monospace',
                textShadow: "0 8px 40px rgba(240,165,0,0.45)",
              }}>
                {player.overall_rating}
              </div>
              <div style={{ paddingBottom: 22 }}>
                <div style={{
                  fontSize: 10, letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 600, textTransform: "uppercase",
                  marginBottom: 6,
                }}>
                  Overall
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 700, color: "#F0A500",
                  letterSpacing: "-0.01em", marginBottom: 6,
                }}>
                  {getRatingLabel(player.overall_rating)}
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 12, fontWeight: 600,
                  color: trendDelta > 0 ? "#16A34A" : trendDelta < 0 ? "#D64045" : "rgba(255,255,255,0.5)",
                }}>
                  {trendDelta > 0 ? <TrendingUp size={12} /> : trendDelta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                  {trendDelta > 0 ? "+" : ""}{trendDelta.toFixed(1)} vs vorige
                </div>
              </div>
            </div>

            {/* FREE-FLOATING CUTOUT PHOTO — no border, bleeds into bg */}
            <div className="pc-photo-wrap" style={{
              position: "relative",
              width: "100%",
              minHeight: 440,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              zIndex: 1,
            }}>
              {/* Subtle huge initials watermark behind */}
              <div className="pc-watermark" style={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%) scale(1.4)",
                fontSize: 320, fontWeight: 900,
                letterSpacing: "-0.08em",
                color: "rgba(77,174,229,0.04)",
                fontFamily: '"JetBrains Mono", monospace',
                pointerEvents: "none",
                whiteSpace: "nowrap",
                zIndex: 0,
              }}>
                {initials}
              </div>

              {photoUrl ? (
                <div className="pc-photo-inner" style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 460,
                  height: 540,
                  zIndex: 2,
                }}>
                  <Image
                    src={photoUrl}
                    alt={`${player.first_name} ${player.last_name}`}
                    fill
                    style={{
                      objectFit: "contain",
                      objectPosition: "bottom center",
                      filter: "drop-shadow(0 24px 32px rgba(0,0,0,0.5))",
                    }}
                    unoptimized
                  />
                </div>
              ) : (
                <div style={{
                  position: "relative", zIndex: 2,
                  fontSize: 220, fontWeight: 700,
                  letterSpacing: "-0.06em",
                  background: "linear-gradient(180deg, #4DAEE5 0%, #1B6CA8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: '"JetBrains Mono", monospace',
                  filter: "drop-shadow(0 12px 32px rgba(77,174,229,0.3))",
                }}>
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ATTRIBUTES + SOCIOTYPE
          ═══════════════════════════════════════════════════════════ */}
      {(latestEval || sociotype) && (
        <section style={{
          maxWidth: 1280, margin: "120px auto 0", padding: "0 40px",
        }}>
          <div className="pc-attr-soc" style={{
            display: "grid",
            gridTemplateColumns: "440px 1fr",
            gap: 60,
          }}>
            {/* Attributes */}
            <div>
              <SectionMark label="01" title="Attributes" sub={latestEval ? `Per ${formatDate(latestEval.evaluation_date)}` : "Nog geen evaluatie"} />
              {latestEval ? (
                <>
                  <div style={{ marginTop: 32 }}>
                    <PentagonRadar attrs={ATTRIBUTES} rating={player.overall_rating} />
                  </div>
                  <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
                    {ATTRIBUTES.map(a => (
                      <AttrRow key={a.label} {...a} />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyHint text="Zodra je coach een evaluatie heeft toegevoegd, verschijnen hier je attributes." />
              )}
            </div>

            {/* Sociotype */}
            <div>
              <SectionMark label="02" title="Sociotype" sub={archetype ? `Speltype: ${archetype.label}` : "Behavioral profile"} />
              <div style={{ marginTop: 32 }}>
                {sociotype ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                      <div style={{
                        width: 68, height: 68, borderRadius: 16,
                        background: `linear-gradient(135deg, ${sociotype.color_hex}1F, ${sociotype.color_hex}06)`,
                        border: `1px solid ${sociotype.color_hex}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 32,
                      }}>
                        {sociotype.icon}
                      </div>
                      <div>
                        <div style={{
                          fontSize: 10, letterSpacing: "0.18em",
                          color: "rgba(255,255,255,0.4)", marginBottom: 4,
                          textTransform: "uppercase", fontWeight: 600,
                        }}>
                          Primary type
                        </div>
                        <h2 className="pc-socio-name" style={{
                          fontSize: 36, fontWeight: 700,
                          letterSpacing: "-0.03em", lineHeight: 1,
                          color: sociotype.color_hex,
                        }}>
                          {sociotype.label}
                        </h2>
                      </div>
                    </div>

                    <p style={{
                      fontSize: 16, lineHeight: 1.65,
                      color: "rgba(255,255,255,0.75)", marginBottom: 32,
                      maxWidth: 520,
                    }}>
                      {sociotype.description}
                    </p>

                    <div className="pc-traits" style={{
                      display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12, marginBottom: 32,
                    }}>
                      {sociotype.traits.map((t, i) => (
                        <div key={t} style={{
                          padding: "16px 14px", borderRadius: 10,
                          background: `${sociotype.color_hex}0A`,
                          border: `1px solid ${sociotype.color_hex}24`,
                        }}>
                          <div style={{
                            fontSize: 10, fontFamily: '"JetBrains Mono", monospace',
                            color: `${sociotype.color_hex}AA`, letterSpacing: "0.06em",
                            marginBottom: 6,
                          }}>
                            0{i + 1}
                          </div>
                          <div style={{
                            fontSize: 14, fontWeight: 700,
                            color: "rgba(255,255,255,0.92)",
                            letterSpacing: "-0.01em",
                          }}>
                            {t}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      padding: 22, borderRadius: 12,
                      background: `${sociotype.color_hex}08`,
                      borderLeft: `3px solid ${sociotype.color_hex}`,
                    }}>
                      <div style={{
                        fontSize: 10, letterSpacing: "0.16em", fontWeight: 600,
                        color: `${sociotype.color_hex}BB`, marginBottom: 10,
                        textTransform: "uppercase",
                      }}>
                        Wat dit betekent voor jouw spel
                      </div>
                      <p style={{
                        fontSize: 14, lineHeight: 1.65,
                        color: "rgba(255,255,255,0.85)",
                      }}>
                        {sociotypeImpact(sociotype.id)}
                      </p>
                    </div>
                  </>
                ) : (
                  <EmptyHint text="Sociotype wordt door je coach bepaald op basis van meerdere evaluaties." />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CORE VALUES
          ═══════════════════════════════════════════════════════════ */}
      {player.identity && (
        player.identity.core_noodzaak !== undefined ||
        player.identity.core_creativiteit !== undefined ||
        player.identity.core_vertrouwen !== undefined
      ) && (
        <section style={{
          maxWidth: 1280, margin: "120px auto 0", padding: "0 40px",
        }}>
          <SectionMark label="03" title="Core values" sub="Drivers behind your game" />
          <div className="pc-core-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20, marginTop: 40,
          }}>
            <CoreValueCard
              label="Noodzaak"
              value={player.identity.core_noodzaak ?? 0}
              color="#D64045"
            />
            <CoreValueCard
              label="Creativiteit"
              value={player.identity.core_creativiteit ?? 0}
              color="#7C3AED"
            />
            <CoreValueCard
              label="Vertrouwen"
              value={player.identity.core_vertrouwen ?? 0}
              color="#16A34A"
            />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          EVOLUTION + COACH NOTE
          ═══════════════════════════════════════════════════════════ */}
      {(evolution.length > 1 || latestEval?.notes) && (
        <section style={{
          maxWidth: 1280, margin: "120px auto 0", padding: "0 40px",
        }}>
          <div className="pc-evo-grid" style={{
            display: "grid",
            gridTemplateColumns: evolution.length > 1 && latestEval?.notes ? "1.6fr 1fr" : "1fr",
            gap: 60,
          }}>
            {evolution.length > 1 && (
              <div>
                <SectionMark label="04" title="Evolution" sub={`${evolution.length}-puntig verloop`} />
                <EvolutionChart data={evolution} />
              </div>
            )}

            {latestEval?.notes && (
              <div>
                <SectionMark label="05" title="Coach view" sub="Latest assessment" />
                <div style={{
                  marginTop: 32, padding: 32, borderRadius: 14,
                  background: "linear-gradient(180deg, rgba(240,165,0,0.05) 0%, transparent 100%)",
                  border: "1px solid rgba(240,165,0,0.15)",
                  position: "relative", overflow: "hidden",
                }}>
                  <Quote size={28} style={{
                    color: "rgba(240,165,0,0.25)",
                    position: "absolute", top: 18, right: 18,
                  }} />
                  <p style={{
                    fontSize: 17, lineHeight: 1.6,
                    color: "rgba(255,255,255,0.88)", marginBottom: 28,
                    letterSpacing: "-0.005em",
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
                      fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em",
                    }}>
                      {(latestEval.coach_name ?? "C").split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                        {latestEval.coach_name ?? "Coach"}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                        {formatDate(latestEval.evaluation_date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ACTIVE MISSION
          ═══════════════════════════════════════════════════════════ */}
      {activeMission && (
        <section style={{
          maxWidth: 1280, margin: "120px auto 0", padding: "0 40px 120px",
        }}>
          <SectionMark label="06" title="Active mission" sub="What you're building toward" />

          <div className="pc-mission" style={{
            marginTop: 40, padding: "40px 44px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(77,174,229,0.06) 0%, rgba(13,27,42,0.4) 100%)",
            border: "1px solid rgba(77,174,229,0.18)",
            display: "grid",
            gridTemplateColumns: "1fr 200px",
            gap: 60, alignItems: "center",
          }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 11px", borderRadius: 999,
                background: "rgba(77,174,229,0.1)",
                border: "1px solid rgba(77,174,229,0.25)",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                color: "#4DAEE5", textTransform: "uppercase", marginBottom: 18,
              }}>
                <Trophy size={11} /> {activeMission.category ? CATEGORY_LABELS[activeMission.category as EvaluationCategory] : "Challenge"}
              </div>
              <h3 style={{
                fontSize: 36, fontWeight: 700,
                letterSpacing: "-0.03em", marginBottom: 8, color: "#fff",
              }}>
                {activeMission.title}
              </h3>
              {activeMission.description && (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>
                  {activeMission.description}
                </p>
              )}

              <div style={{
                position: "relative", height: 6, borderRadius: 3,
                background: "rgba(255,255,255,0.06)", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${activeMission.progress}%`,
                  background: "linear-gradient(90deg, #4DAEE5, #1B6CA8)",
                  borderRadius: 3,
                  boxShadow: "0 0 16px rgba(77,174,229,0.5)",
                }} />
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div className="pc-mission-pct" style={{
                fontSize: 84, fontWeight: 700,
                fontFamily: '"JetBrains Mono", monospace',
                color: "#4DAEE5", letterSpacing: "-0.04em", lineHeight: 1,
                textShadow: "0 4px 24px rgba(77,174,229,0.3)",
              }}>
                {activeMission.progress}<span style={{ fontSize: 28, color: "rgba(77,174,229,0.5)" }}>%</span>
              </div>
              <div style={{
                fontSize: 11, letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.4)", marginTop: 6,
                textTransform: "uppercase", fontWeight: 600,
              }}>
                Completion
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Bottom marker */}
      <div style={{
        textAlign: "center", padding: "60px 0",
        fontSize: 10, letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.2)",
        textTransform: "uppercase", fontWeight: 600,
      }}>
        SFA Performance Hub · {player.first_name} {player.last_name}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: 10, letterSpacing: "0.16em",
        color: "rgba(255,255,255,0.35)", marginBottom: 6,
        textTransform: "uppercase", fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 16, fontWeight: 600,
        color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em",
      }}>
        {value}
      </div>
    </div>
  );
}

function SectionMark({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 4 }}>
        <span style={{
          fontSize: 11, fontFamily: '"JetBrains Mono", monospace',
          color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em",
        }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>
      <h2 className="pc-section-title" style={{
        fontSize: 42, fontWeight: 700, letterSpacing: "-0.04em",
        lineHeight: 1.05, color: "#fff", marginBottom: 4,
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.01em" }}>
        {sub}
      </div>
    </div>
  );
}

function AttrRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "100px 1fr 60px",
      gap: 14, alignItems: "center",
    }}>
      <span style={{
        fontSize: 11, letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase", fontWeight: 600,
      }}>
        {label.toUpperCase()}
      </span>
      <div style={{
        height: 4, borderRadius: 2,
        background: "rgba(255,255,255,0.05)",
        overflow: "hidden", position: "relative",
      }}>
        <div style={{
          height: "100%", width: `${value * 10}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          borderRadius: 2,
          boxShadow: `0 0 12px ${color}80`,
        }} />
      </div>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 15, fontWeight: 700, color,
        textAlign: "right", letterSpacing: "-0.02em",
      }}>
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

function PentagonRadar({ attrs, rating }: { attrs: { label: string; value: number; color: string }[]; rating: number }) {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const R = 130;
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
      x: cx + Math.cos(angle) * (R + 28),
      y: cy + Math.sin(angle) * (R + 28),
    };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", maxWidth: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DAEE5" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1B6CA8" stopOpacity="0.08" />
        </linearGradient>
        <filter id="radarGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {[0.25, 0.5, 0.75, 1].map(ring => {
        const ringPath = Array.from({ length: n }).map((_, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          return `${i === 0 ? "M" : "L"}${cx + Math.cos(a) * R * ring},${cy + Math.sin(a) * R * ring}`;
        }).join(" ") + " Z";
        return (
          <path key={ring} d={ringPath} fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={ring === 1 ? 1 : 0.7} />
        );
      })}

      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy}
            x2={cx + Math.cos(a) * R}
            y2={cy + Math.sin(a) * R}
            stroke="rgba(255,255,255,0.05)" strokeWidth={0.7} />
        );
      })}

      <path d={path} fill="#4DAEE5" fillOpacity={0.35} filter="url(#radarGlow)" />
      <path d={path} fill="url(#radarFill)" stroke="#4DAEE5" strokeWidth={1.5} />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill={attrs[i].color} stroke="#0A0E14" strokeWidth={2} />
          <circle cx={p.x} cy={p.y} r={9} fill={attrs[i].color} fillOpacity={0.2} />
        </g>
      ))}

      {labelPoints.map((p, i) => (
        <g key={i}>
          <text x={p.x} y={p.y - 5} fontSize={10}
            fill="rgba(255,255,255,0.4)" textAnchor="middle"
            style={{ letterSpacing: "0.12em", fontWeight: 600 }}>
            {attrs[i].label.toUpperCase()}
          </text>
          <text x={p.x} y={p.y + 10} fontSize={16}
            fill={attrs[i].color} textAnchor="middle"
            style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, letterSpacing: "-0.02em" }}>
            {attrs[i].value > 0 ? attrs[i].value.toFixed(1) : "—"}
          </text>
        </g>
      ))}

      <text x={cx} y={cy + 3} fontSize={28} fontWeight={700}
        fill="rgba(255,255,255,0.85)" textAnchor="middle"
        style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: "-0.04em" }}>
        {rating}
      </text>
      <text x={cx} y={cy + 22} fontSize={9}
        fill="rgba(255,255,255,0.3)" textAnchor="middle"
        style={{ letterSpacing: "0.18em", fontWeight: 600 }}>
        OVR
      </text>
    </svg>
  );
}

function CoreValueCard({ label, value, color }: { label: string; value: number; color: string }) {
  const { levelLabel, desc } = coreValueLevel(value);
  return (
    <div style={{
      padding: 28, borderRadius: 14,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 100, height: 100,
        background: `radial-gradient(circle at top right, ${color}25, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", marginBottom: 16,
      }}>
        <div>
          <div style={{
            fontSize: 10, letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.4)", fontWeight: 600,
            marginBottom: 4, textTransform: "uppercase",
          }}>
            {label}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: "-0.01em" }}>
            {levelLabel}
          </div>
        </div>
        <div className="pc-cv-num" style={{
          fontSize: 44, fontWeight: 700, color,
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: "-0.04em", lineHeight: 0.9,
          textShadow: `0 4px 16px ${color}40`,
        }}>
          {value.toFixed(1)}
        </div>
      </div>

      <div style={{
        height: 3, borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden", marginBottom: 16,
      }}>
        <div style={{
          height: "100%", width: `${value * 10}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: 999,
          boxShadow: `0 0 10px ${color}80`,
        }} />
      </div>

      <p style={{
        fontSize: 13, lineHeight: 1.55,
        color: "rgba(255,255,255,0.55)",
      }}>
        {desc}
      </p>
    </div>
  );
}

function EvolutionChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 700;
  const H = 240;
  const PAD = { top: 28, right: 32, bottom: 32, left: 32 };

  const values = data.map(d => d.value);
  const min = Math.max(0, Math.min(...values) - 5);
  const max = Math.min(100, Math.max(...values) + 5);
  const range = max - min || 1;

  const xs = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * (W - PAD.left - PAD.right);
  const ys = (v: number) => H - PAD.bottom - ((v - min) / range) * (H - PAD.top - PAD.bottom);

  const points = data.map((d, i) => ({ x: xs(i), y: ys(d.value) }));
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
    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  const fillPath = `${path} L${points[points.length - 1].x},${H - PAD.bottom} L${points[0].x},${H - PAD.bottom} Z`;

  return (
    <div style={{ marginTop: 32 }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="evoFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0A500" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F0A500" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="evoStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4DAEE5" />
            <stop offset="100%" stopColor="#F0A500" />
          </linearGradient>
        </defs>

        {[60, 70, 80, 90].filter(v => v >= min && v <= max).map(v => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={ys(v)} y2={ys(v)}
              stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" />
            <text x={PAD.left - 8} y={ys(v) + 3} fontSize={9}
              fill="rgba(255,255,255,0.3)" textAnchor="end"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {v}
            </text>
          </g>
        ))}

        <path d={fillPath} fill="url(#evoFill)" />
        <path d={path} fill="none" stroke="url(#evoStroke)"
          strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill="#0A0E14" stroke="#F0A500" strokeWidth={2} />
            <text x={p.x} y={H - 8} fontSize={10}
              fill="rgba(255,255,255,0.4)" textAnchor="middle"
              style={{ letterSpacing: "0.08em", fontWeight: 600 }}>
              {data[i].label.toUpperCase()}
            </text>
            <text x={p.x} y={p.y - 14} fontSize={11}
              fill="rgba(255,255,255,0.8)" textAnchor="middle"
              style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, letterSpacing: "-0.02em" }}>
              {data[i].value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={{
      marginTop: 32, padding: "32px 24px",
      border: "1px dashed rgba(255,255,255,0.12)",
      borderRadius: 12, textAlign: "center",
      color: "rgba(255,255,255,0.5)", fontSize: 13,
      lineHeight: 1.55,
    }}>
      {text}
    </div>
  );
}

function ResponsiveStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @media (max-width: 900px) {
        .pc-hero { padding: 40px 24px 0 !important; }
        .pc-hero-grid {
          grid-template-columns: 1fr !important;
          gap: 36px !important;
        }
        .pc-firstname, .pc-lastname { font-size: 56px !important; }
        .pc-stats-row { gap: 20px !important; padding-top: 24px !important; margin-top: 24px !important; }
        .pc-overall { font-size: 130px !important; }
        .pc-photo-zone { min-height: 460px !important; }
        .pc-photo-wrap { min-height: 380px !important; }
        .pc-photo-inner { max-width: 360px !important; height: 440px !important; }
        .pc-watermark { font-size: 220px !important; }
        .pc-attr-soc {
          grid-template-columns: 1fr !important;
          gap: 60px !important;
        }
        .pc-section-title { font-size: 32px !important; }
        .pc-socio-name { font-size: 28px !important; }
        .pc-core-grid { grid-template-columns: 1fr !important; }
        .pc-evo-grid {
          grid-template-columns: 1fr !important;
          gap: 60px !important;
        }
        .pc-mission {
          grid-template-columns: 1fr !important;
          gap: 24px !important;
          padding: 28px !important;
        }
        .pc-mission-pct { font-size: 64px !important; text-align: left !important; }
        .pc-traits { grid-template-columns: 1fr 1fr !important; }
      }
      @media (max-width: 480px) {
        .pc-hero { padding: 24px 16px 0 !important; }
        .pc-firstname, .pc-lastname { font-size: 40px !important; }
        .pc-overall { font-size: 96px !important; }
        .pc-photo-inner { max-width: 280px !important; height: 340px !important; }
        .pc-watermark { font-size: 160px !important; }
        .pc-section-title { font-size: 24px !important; }
        .pc-socio-name { font-size: 22px !important; }
        .pc-cv-num { font-size: 34px !important; }
        .pc-traits { grid-template-columns: 1fr !important; }
      }
    ` }} />
  );
}
