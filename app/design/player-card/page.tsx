"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Quote, Trophy, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   MOCK DATA — pure static, for visual iteration only
   ───────────────────────────────────────────────────────── */

const PLAYER = {
  first_name: "Joy",
  last_name: "Schoonhoven",
  position: "CAM",
  position_label: "Aanvallende Middenvelder",
  jersey: 10,
  age: 17,
  nationality: "🇳🇱 Nederland",
  club: "SFA · A1",
  height: "1.78 m",
  foot: "Rechts",
  joined: "Aug 2024",
  contract: "2027",
  overall: 87,
  overall_label: "Elite",
  trend_delta: -1,
  badge: "Rising Star",
};

const ATTRIBUTES = [
  { label: "Techniek",  value: 8.7, color: "#4DAEE5" },
  { label: "Fysiek",    value: 7.4, color: "#7DC4EE" },
  { label: "Tactiek",   value: 9.2, color: "#F0A500" },
  { label: "Mentaal",   value: 8.8, color: "#D64045" },
  { label: "Teamplay",  value: 8.1, color: "#16A34A" },
];

const SOCIOTYPE = {
  label: "De Denker",
  icon: "🧠",
  description:
    "Analytisch en strategisch. Leest het spel sneller dan medespelers en kiest de optimale route waar anderen kracht zoeken. Coach geeft jou vrijheid van positie omdat jouw beslissingen vaak juist zijn.",
  traits: ["Tactisch", "Analytisch", "Strategisch"],
  impact:
    "Je krijgt vrijheid om posities te kiezen. Verwachting: jij dicteert het tempo in de opbouwfase en bepaalt wanneer het team druk moet zetten.",
};

const ARCHETYPE = {
  label: "Classic 10",
  icon: "🌟",
  description: "Traditionele aanvallende middenvelder, creatief hart van het team.",
  color: "#F0A500",
  traits: ["Creativiteit", "Schot", "Assist"],
};

const CORE_VALUES = [
  { label: "Noodzaak",     value: 7.2, color: "#D64045",
    levelLabel: "Gezonde balans",
    desc: "Je voelt urgentie wanneer nodig, maar blijft vrij." },
  { label: "Creativiteit", value: 9.1, color: "#7C3AED",
    levelLabel: "Onorthodox",
    desc: "Je daagt patronen uit; onvoorspelbaar voor tegenstander." },
  { label: "Vertrouwen",   value: 8.4, color: "#16A34A",
    levelLabel: "Zelfverzekerd",
    desc: "Je staat achter je beslissingen, ook bij fouten." },
];

const EVOLUTION = [
  { month: "Sep", value: 79 },
  { month: "Okt", value: 81 },
  { month: "Nov", value: 80 },
  { month: "Dec", value: 84 },
  { month: "Jan", value: 86 },
  { month: "Feb", value: 88 },
  { month: "Mrt", value: 87 },
];

const COACH_NOTE = {
  body:
    "Joy combineert spelinzicht van een 22-jarige met de verbeeldingskracht van een straatvoetballer. De challenge is om zijn fysieke piek volgend seizoen in lijn te brengen met zijn mentale niveau.",
  coach: "M. van der Berg",
  role: "Hoofdcoach SFA A1",
  date: "Mar 14, 2026",
};

const MISSION = {
  title: "Box-to-Box Conditie",
  subtitle: "Maand 7 — Fysieke ontwikkeling",
  progress: 64,
  deadline: "31 Maart",
  category: "Fysiek",
};

/* ─────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────── */

export default function PlayerCardDesignPage() {
  const initials = `${PLAYER.first_name[0]}${PLAYER.last_name[0]}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0E14",
      color: "#fff",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Ambient background — subtle gradient mesh */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: `
          radial-gradient(ellipse at 15% 0%, rgba(27,108,168,0.15), transparent 50%),
          radial-gradient(ellipse at 85% 30%, rgba(240,165,0,0.08), transparent 50%),
          radial-gradient(ellipse at 50% 100%, rgba(77,174,229,0.06), transparent 60%)
        `,
        pointerEvents: "none",
      }} />

      {/* ── TOP NAV (minimal) ── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "20px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(10,14,20,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <Link href="/design" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          textDecoration: "none",
          letterSpacing: "0.02em",
        }}>
          <ArrowLeft size={14} /> Design preview
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            fontSize: 10,
            letterSpacing: "0.16em",
            fontWeight: 600,
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
          }}>
            SFA · Player Card
          </div>
          <button style={{
            padding: "8px 16px",
            borderRadius: 6,
            background: "rgba(77,174,229,0.1)",
            border: "1px solid rgba(77,174,229,0.25)",
            color: "#4DAEE5",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}>
            Share <ArrowUpRight size={11} />
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        padding: "60px 40px 0",
        maxWidth: 1280,
        margin: "0 auto",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: 60,
          alignItems: "start",
        }}>
          {/* LEFT: Name & identity */}
          <div style={{ paddingTop: 40 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 10px",
              borderRadius: 999,
              background: "rgba(240,165,0,0.08)",
              border: "1px solid rgba(240,165,0,0.25)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#F0A500",
              textTransform: "uppercase",
              marginBottom: 28,
            }}>
              <Sparkles size={11} /> {PLAYER.badge}
            </div>

            <div style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              fontWeight: 600,
              color: "rgba(77,174,229,0.7)",
              marginBottom: 18,
              textTransform: "uppercase",
            }}>
              N° {PLAYER.jersey} · {PLAYER.position} · {PLAYER.position_label}
            </div>

            <h1 style={{
              fontSize: 96,
              fontWeight: 200,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              color: "rgba(255,255,255,0.95)",
              marginBottom: 6,
            }}>
              {PLAYER.first_name}
            </h1>
            <h1 style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              lineHeight: 0.95,
              color: "#fff",
              marginBottom: 32,
            }}>
              {PLAYER.last_name}.
            </h1>

            {/* Identity row */}
            <div style={{
              display: "flex",
              gap: 40,
              marginTop: 36,
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}>
              <Stat label="AGE" value={`${PLAYER.age}`} />
              <Stat label="HEIGHT" value={PLAYER.height} />
              <Stat label="FOOT" value={PLAYER.foot} />
              <Stat label="CLUB" value={PLAYER.club} />
              <Stat label="CONTRACT" value={PLAYER.contract} />
            </div>
          </div>

          {/* RIGHT: Rating monolith */}
          <div style={{ position: "relative", paddingTop: 8 }}>
            <div style={{
              position: "relative",
              padding: "44px 36px 36px",
              borderRadius: 18,
              background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
            }}>
              {/* Glow */}
              <div style={{
                position: "absolute",
                top: -100,
                right: -80,
                width: 280,
                height: 280,
                background: "radial-gradient(circle, rgba(240,165,0,0.15) 0%, transparent 65%)",
                pointerEvents: "none",
              }} />

              <div style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                fontWeight: 600,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 12,
                textTransform: "uppercase",
              }}>
                Overall Rating
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20 }}>
                <div style={{
                  fontSize: 160,
                  fontWeight: 700,
                  letterSpacing: "-0.06em",
                  lineHeight: 0.85,
                  color: "#F0A500",
                  fontFamily: '"JetBrains Mono", monospace',
                  textShadow: "0 4px 24px rgba(240,165,0,0.3)",
                }}>
                  {PLAYER.overall}
                </div>
                <div style={{ paddingBottom: 18 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#F0A500",
                    letterSpacing: "-0.01em",
                    marginBottom: 4,
                  }}>
                    {PLAYER.overall_label}
                  </div>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: PLAYER.trend_delta >= 0 ? "#16A34A" : "#D64045",
                  }}>
                    {PLAYER.trend_delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {PLAYER.trend_delta >= 0 ? "+" : ""}{PLAYER.trend_delta} vs last
                  </div>
                </div>
              </div>

              {/* Profile photo / initials */}
              <div style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1/1",
                borderRadius: 12,
                overflow: "hidden",
                background: "linear-gradient(135deg, #1A2E45 0%, #0D1B2A 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 4,
              }}>
                {/* Layered initials with depth */}
                <div style={{
                  position: "absolute",
                  fontSize: 240,
                  fontWeight: 900,
                  letterSpacing: "-0.08em",
                  color: "rgba(77,174,229,0.04)",
                  fontFamily: '"JetBrains Mono", monospace',
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%) scale(1.2)",
                }}>
                  {initials}
                </div>
                <div style={{
                  fontSize: 180,
                  fontWeight: 700,
                  letterSpacing: "-0.06em",
                  background: "linear-gradient(180deg, #4DAEE5 0%, #1B6CA8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: '"JetBrains Mono", monospace',
                  position: "relative",
                  zIndex: 2,
                }}>
                  {initials}
                </div>
                {/* Position chip overlay */}
                <div style={{
                  position: "absolute",
                  bottom: 14,
                  left: 14,
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "rgba(13,27,42,0.8)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(240,165,0,0.3)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#F0A500",
                  letterSpacing: "0.08em",
                }}>
                  {PLAYER.position}
                </div>
                <div style={{
                  position: "absolute",
                  bottom: 14,
                  right: 14,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.08em",
                }}>
                  #{PLAYER.jersey}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ATTRIBUTES + SOCIOTYPE
          ═══════════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: 1280,
        margin: "120px auto 0",
        padding: "0 40px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "440px 1fr",
          gap: 60,
        }}>
          {/* Attributes radar */}
          <div>
            <SectionMark label="01" title="Attributes" sub="Latest evaluation" />
            <div style={{ marginTop: 32 }}>
              <PentagonRadar attrs={ATTRIBUTES} />
            </div>

            {/* Numeric breakdown */}
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
              {ATTRIBUTES.map((a) => (
                <div key={a.label} style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr 60px",
                  gap: 14,
                  alignItems: "center",
                }}>
                  <span style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}>
                    {a.label}
                  </span>
                  <div style={{
                    height: 4,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.05)",
                    overflow: "hidden",
                    position: "relative",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${a.value * 10}%`,
                      background: `linear-gradient(90deg, ${a.color}, ${a.color}88)`,
                      borderRadius: 2,
                      boxShadow: `0 0 12px ${a.color}80`,
                    }} />
                  </div>
                  <span style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 15,
                    fontWeight: 700,
                    color: a.color,
                    textAlign: "right",
                    letterSpacing: "-0.02em",
                  }}>
                    {a.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sociotype card */}
          <div>
            <SectionMark label="02" title="Sociotype" sub="Behavioral profile" />
            <div style={{ marginTop: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 68,
                  height: 68,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, rgba(96,165,250,0.12), rgba(96,165,250,0.03))",
                  border: "1px solid rgba(96,165,250,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}>
                  {SOCIOTYPE.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}>
                    Primary type
                  </div>
                  <h2 style={{
                    fontSize: 36,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    color: "#60A5FA",
                  }}>
                    {SOCIOTYPE.label}
                  </h2>
                </div>
              </div>

              <p style={{
                fontSize: 16,
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.75)",
                marginBottom: 32,
                maxWidth: 520,
              }}>
                {SOCIOTYPE.description}
              </p>

              {/* Traits grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 32,
              }}>
                {SOCIOTYPE.traits.map((t, i) => (
                  <div key={t} style={{
                    padding: "16px 14px",
                    borderRadius: 10,
                    background: "rgba(96,165,250,0.04)",
                    border: "1px solid rgba(96,165,250,0.15)",
                  }}>
                    <div style={{
                      fontSize: 10,
                      fontFamily: '"JetBrains Mono", monospace',
                      color: "rgba(96,165,250,0.6)",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                    }}>
                      0{i + 1}
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.92)",
                      letterSpacing: "-0.01em",
                    }}>
                      {t}
                    </div>
                  </div>
                ))}
              </div>

              {/* Impact callout */}
              <div style={{
                padding: 22,
                borderRadius: 12,
                background: "rgba(96,165,250,0.04)",
                borderLeft: "3px solid #60A5FA",
              }}>
                <div style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  fontWeight: 600,
                  color: "rgba(96,165,250,0.7)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                }}>
                  Wat dit betekent voor jouw spel
                </div>
                <p style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.85)",
                }}>
                  {SOCIOTYPE.impact}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CORE VALUES
          ═══════════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: 1280,
        margin: "120px auto 0",
        padding: "0 40px",
      }}>
        <SectionMark label="03" title="Core values" sub="Drivers behind your game" />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginTop: 40,
        }}>
          {CORE_VALUES.map((cv) => (
            <CoreValueCard key={cv.label} {...cv} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          EVOLUTION + COACH NOTE
          ═══════════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: 1280,
        margin: "120px auto 0",
        padding: "0 40px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 60,
        }}>
          <div>
            <SectionMark label="04" title="Evolution" sub="7-month trajectory" />
            <EvolutionChart data={EVOLUTION} />
          </div>

          <div>
            <SectionMark label="05" title="Coach view" sub="Latest assessment" />
            <div style={{
              marginTop: 32,
              padding: 32,
              borderRadius: 14,
              background: "linear-gradient(180deg, rgba(240,165,0,0.05) 0%, transparent 100%)",
              border: "1px solid rgba(240,165,0,0.15)",
              position: "relative",
              overflow: "hidden",
            }}>
              <Quote size={28} style={{
                color: "rgba(240,165,0,0.25)",
                position: "absolute",
                top: 18,
                right: 18,
              }} />
              <p style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.88)",
                fontWeight: 400,
                marginBottom: 28,
                letterSpacing: "-0.005em",
              }}>
                &ldquo;{COACH_NOTE.body}&rdquo;
              </p>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingTop: 20,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #F0A500, #B07700)",
                  color: "#0D1B2A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}>
                  {COACH_NOTE.coach.split(" ").map((n) => n[0]).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                    {COACH_NOTE.coach}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                    {COACH_NOTE.role} · {COACH_NOTE.date}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ACTIVE MISSION
          ═══════════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: 1280,
        margin: "120px auto 0",
        padding: "0 40px 120px",
      }}>
        <SectionMark label="06" title="Active mission" sub="What you're building toward" />

        <div style={{
          marginTop: 40,
          padding: "40px 44px",
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(77,174,229,0.06) 0%, rgba(13,27,42,0.4) 100%)",
          border: "1px solid rgba(77,174,229,0.18)",
          display: "grid",
          gridTemplateColumns: "1fr 200px",
          gap: 60,
          alignItems: "center",
        }}>
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 11px",
              borderRadius: 999,
              background: "rgba(77,174,229,0.1)",
              border: "1px solid rgba(77,174,229,0.25)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#4DAEE5",
              textTransform: "uppercase",
              marginBottom: 18,
            }}>
              <Trophy size={11} /> {MISSION.category}
            </div>
            <h3 style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: 8,
              color: "#fff",
            }}>
              {MISSION.title}
            </h3>
            <p style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 28,
            }}>
              {MISSION.subtitle} · Deadline {MISSION.deadline}
            </p>

            <div style={{ position: "relative", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                position: "absolute",
                left: 0, top: 0, bottom: 0,
                width: `${MISSION.progress}%`,
                background: "linear-gradient(90deg, #4DAEE5, #1B6CA8)",
                borderRadius: 3,
                boxShadow: "0 0 16px rgba(77,174,229,0.5)",
              }} />
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 84,
              fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace',
              color: "#4DAEE5",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              textShadow: "0 4px 24px rgba(77,174,229,0.3)",
            }}>
              {MISSION.progress}<span style={{ fontSize: 28, color: "rgba(77,174,229,0.5)" }}>%</span>
            </div>
            <div style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.4)",
              marginTop: 6,
              textTransform: "uppercase",
              fontWeight: 600,
            }}>
              Completion
            </div>
          </div>
        </div>
      </section>

      {/* Footer marker */}
      <div style={{
        textAlign: "center",
        padding: "0 0 60px",
        fontSize: 10,
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.2)",
        textTransform: "uppercase",
        fontWeight: 600,
      }}>
        SFA Performance Hub · Design v1
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
        fontSize: 10,
        letterSpacing: "0.16em",
        color: "rgba(255,255,255,0.35)",
        marginBottom: 6,
        textTransform: "uppercase",
        fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 16,
        fontWeight: 600,
        color: "rgba(255,255,255,0.92)",
        letterSpacing: "-0.01em",
      }}>
        {value}
      </div>
    </div>
  );
}

function SectionMark({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        marginBottom: 4,
      }}>
        <span style={{
          fontSize: 11,
          fontFamily: '"JetBrains Mono", monospace',
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.04em",
        }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>
      <h2 style={{
        fontSize: 42,
        fontWeight: 700,
        letterSpacing: "-0.04em",
        lineHeight: 1.05,
        color: "#fff",
        marginBottom: 4,
      }}>
        {title}
      </h2>
      <div style={{
        fontSize: 13,
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.01em",
      }}>
        {sub}
      </div>
    </div>
  );
}

function PentagonRadar({ attrs }: { attrs: typeof ATTRIBUTES }) {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const R = 130;
  const n = attrs.length;

  const points = attrs.map((a, i) => {
    const ratio = a.value / 10;
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DAEE5" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1B6CA8" stopOpacity="0.08" />
        </linearGradient>
        <filter id="radarGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((ring) => {
        const ringPath = Array.from({ length: n }).map((_, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          return `${i === 0 ? "M" : "L"}${cx + Math.cos(a) * R * ring},${cy + Math.sin(a) * R * ring}`;
        }).join(" ") + " Z";
        return (
          <path
            key={ring}
            d={ringPath}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={ring === 1 ? 1 : 0.7}
          />
        );
      })}

      {/* Spokes */}
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(a) * R}
            y2={cy + Math.sin(a) * R}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.7}
          />
        );
      })}

      {/* Glow underlay */}
      <path d={path} fill="#4DAEE5" fillOpacity={0.35} filter="url(#radarGlow)" />

      {/* Filled polygon */}
      <path d={path} fill="url(#radarFill)" stroke="#4DAEE5" strokeWidth={1.5} />

      {/* Vertices */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill={attrs[i].color} stroke="#0A0E14" strokeWidth={2} />
          <circle cx={p.x} cy={p.y} r={9} fill={attrs[i].color} fillOpacity={0.2} />
        </g>
      ))}

      {/* Labels */}
      {labelPoints.map((p, i) => (
        <g key={i}>
          <text
            x={p.x}
            y={p.y - 5}
            fontSize={10}
            fill="rgba(255,255,255,0.4)"
            textAnchor="middle"
            style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', letterSpacing: "0.12em", fontWeight: 600, textTransform: "uppercase" }}
          >
            {attrs[i].label.toUpperCase()}
          </text>
          <text
            x={p.x}
            y={p.y + 10}
            fontSize={16}
            fill={attrs[i].color}
            textAnchor="middle"
            style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {attrs[i].value.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Center value */}
      <text x={cx} y={cy + 3} fontSize={28} fontWeight={700} fill="rgba(255,255,255,0.85)" textAnchor="middle"
        style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: "-0.04em" }}>
        {PLAYER.overall}
      </text>
      <text x={cx} y={cy + 22} fontSize={9} fill="rgba(255,255,255,0.3)" textAnchor="middle"
        style={{ letterSpacing: "0.18em", fontWeight: 600 }}>
        OVR
      </text>
    </svg>
  );
}

function CoreValueCard({ label, value, color, levelLabel, desc }: typeof CORE_VALUES[number]) {
  return (
    <div style={{
      padding: 28,
      borderRadius: 14,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: 0, right: 0,
        width: 100,
        height: 100,
        background: `radial-gradient(circle at top right, ${color}25, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600,
            marginBottom: 4,
            textTransform: "uppercase",
          }}>
            {label}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: "-0.01em" }}>
            {levelLabel}
          </div>
        </div>
        <div style={{
          fontSize: 44,
          fontWeight: 700,
          color,
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: "-0.04em",
          lineHeight: 0.9,
          textShadow: `0 4px 16px ${color}40`,
        }}>
          {value.toFixed(1)}
        </div>
      </div>

      <div style={{
        height: 3,
        borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden",
        marginBottom: 16,
      }}>
        <div style={{
          height: "100%",
          width: `${value * 10}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: 999,
          boxShadow: `0 0 10px ${color}80`,
        }} />
      </div>

      <p style={{
        fontSize: 13,
        lineHeight: 1.55,
        color: "rgba(255,255,255,0.55)",
      }}>
        {desc}
      </p>
    </div>
  );
}

function EvolutionChart({ data }: { data: typeof EVOLUTION }) {
  const W = 700;
  const H = 240;
  const PAD = { top: 28, right: 32, bottom: 32, left: 32 };

  const min = 75;
  const max = 92;
  const range = max - min;

  const xs = (i: number) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);
  const ys = (v: number) => H - PAD.bottom - ((v - min) / range) * (H - PAD.top - PAD.bottom);

  // Smooth curve via catmull-rom-ish bezier
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

        {/* Y grid */}
        {[80, 85, 90].map(v => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={ys(v)} y2={ys(v)} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" />
            <text x={PAD.left - 8} y={ys(v) + 3} fontSize={9} fill="rgba(255,255,255,0.3)" textAnchor="end"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {v}
            </text>
          </g>
        ))}

        <path d={fillPath} fill="url(#evoFill)" />
        <path d={path} fill="none" stroke="url(#evoStroke)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill="#0A0E14" stroke="#F0A500" strokeWidth={2} />
            <text x={p.x} y={H - 8} fontSize={10} fill="rgba(255,255,255,0.4)" textAnchor="middle"
              style={{ letterSpacing: "0.08em", fontWeight: 600 }}>
              {data[i].month.toUpperCase()}
            </text>
            <text x={p.x} y={p.y - 14} fontSize={11} fill="rgba(255,255,255,0.8)" textAnchor="middle"
              style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, letterSpacing: "-0.02em" }}>
              {data[i].value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
