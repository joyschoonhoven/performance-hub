"use client";

// ============================================================
//  PLAYER CARD — spelersprofiel in Football Manager-opzet,
//  uitgevoerd in de SFA-huisstijl (wit, #5A90BA, condensed).
//  Kolommen met attribuutscores uit de laatste evaluatie,
//  posities op een minipitch, infopaneel en vormtegels.
// ============================================================

import Image from "next/image";
import { CATEGORY_LABELS, EVALUATION_SCHEMA, POSITION_LABELS, POTENTIAL_LEVELS, ARCHETYPES } from "@/lib/types";
import { MBTI_PROFILES, type MbtiCode } from "@/lib/mbti";
import { MbtiShield } from "@/components/ui/ShieldBadge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { EvaluationCategory, PlayerWithDetails, PositionType } from "@/lib/types";

const ACCENT = "#5A90BA";
const INK = "#1F2937";
const SUB = "#6B7280";
const DIM = "#9CA3AF";
const LINE = "#E5E7EB";

/* Cijferkleur naar niveau — FM-conventie */
function scoreColor(v: number): string {
  if (v >= 8) return "#2E7D4F";
  if (v >= 6.5) return "#C9A227";
  if (v >= 5) return "#D07A2E";
  return "#B4534A";
}

function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

function parseSubScores(subNotes?: string): Record<string, number> | null {
  if (!subNotes) return null;
  try { return JSON.parse(subNotes); } catch { return null; }
}

/* Positiecoördinaten op de minipitch (x 0-100, y 0-100; y=0 is eigen doel) */
const POS_XY: Partial<Record<PositionType, [number, number]>> = {
  GK: [50, 7], CB: [50, 22], LB: [16, 28], RB: [84, 28],
  CDM: [50, 40], CM: [50, 54], CAM: [50, 68],
  LW: [18, 78], RW: [82, 78], ST: [50, 88], SS: [50, 78],
};

function MiniPitch({ primary, secondary }: { primary: PositionType; secondary?: PositionType | null }) {
  const p = POS_XY[primary] ?? [50, 55];
  const s = secondary ? POS_XY[secondary] : null;
  return (
    <svg viewBox="0 0 100 140" style={{ width: "100%", maxWidth: 170, display: "block" }}>
      <rect x="1" y="1" width="98" height="138" rx="3" fill="#F4F8F6" stroke="#CBD8D0" strokeWidth="1.5" />
      <line x1="1" y1="70" x2="99" y2="70" stroke="#CBD8D0" strokeWidth="1" />
      <circle cx="50" cy="70" r="11" fill="none" stroke="#CBD8D0" strokeWidth="1" />
      <rect x="28" y="1" width="44" height="16" fill="none" stroke="#CBD8D0" strokeWidth="1" />
      <rect x="28" y="123" width="44" height="16" fill="none" stroke="#CBD8D0" strokeWidth="1" />
      {s && (
        <circle cx={s[0]} cy={140 - s[1] * 1.4 * 0.97 - 2} r="5" fill="#fff" stroke={ACCENT} strokeWidth="1.5" opacity={0.9} />
      )}
      <circle cx={p[0]} cy={140 - p[1] * 1.4 * 0.97 - 2} r="6.5" fill={ACCENT} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

/* Eén attribuutrij: label + score-chip (FM-stijl) */
function AttrRow({ label, value, real }: { label: string; value: number; real: boolean }) {
  const c = real ? scoreColor(value) : DIM;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${LINE}` }}>
      <span style={{ fontSize: 12, color: SUB, lineHeight: 1.25 }}>{label}</span>
      <span className="display-font" style={{
        fontSize: 13.5, fontWeight: 600, minWidth: 34, textAlign: "center",
        color: c, background: `${c}14`, padding: "1px 6px",
        clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
        fontFeatureSettings: '"tnum" 1',
      }}>
        {value > 0 ? value.toFixed(value % 1 ? 1 : 0) : "—"}
      </span>
    </div>
  );
}

/* Sterren voor rolgeschiktheid */
function Stars({ n }: { n: number }) {
  return (
    <span style={{ fontSize: 12, letterSpacing: 1, color: "#C9A227", whiteSpace: "nowrap" }}>
      {"★".repeat(n)}<span style={{ color: LINE }}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

/* Rollen per positie — geschiktheid berekend uit categoriescores */
type CatScores = Record<EvaluationCategory, number>;
const ROLE_DEFS: Partial<Record<PositionType, { name: string; calc: (c: CatScores) => number }[]>> = {
  GK:  [{ name: "Sweeper-keeper", calc: c => (c.tactiek + c.techniek) / 2 }, { name: "Lijnkeeper", calc: c => (c.mentaal + c.fysiek) / 2 }],
  CB:  [{ name: "Opbouwende verdediger", calc: c => (c.techniek + c.tactiek) / 2 }, { name: "Stopper", calc: c => (c.fysiek + c.mentaal) / 2 }, { name: "Libero", calc: c => (c.tactiek + c.teamplay) / 2 }],
  LB:  [{ name: "Vleugelverdediger", calc: c => (c.fysiek + c.techniek) / 2 }, { name: "Controlerende back", calc: c => (c.tactiek + c.teamplay) / 2 }],
  RB:  [{ name: "Vleugelverdediger", calc: c => (c.fysiek + c.techniek) / 2 }, { name: "Controlerende back", calc: c => (c.tactiek + c.teamplay) / 2 }],
  CDM: [{ name: "Controleur", calc: c => (c.tactiek + c.teamplay) / 2 }, { name: "Balafpakker", calc: c => (c.fysiek + c.mentaal) / 2 }, { name: "Diepe spelmaker", calc: c => (c.techniek + c.tactiek) / 2 }],
  CM:  [{ name: "Box-to-box", calc: c => (c.fysiek + c.teamplay) / 2 }, { name: "Spelmaker", calc: c => (c.techniek + c.tactiek) / 2 }, { name: "Aanjager", calc: c => (c.mentaal + c.teamplay) / 2 }],
  CAM: [{ name: "Schaduwspits", calc: c => (c.techniek + c.tactiek) / 2 }, { name: "Spelmaker", calc: c => (c.techniek + c.teamplay) / 2 }, { name: "Vrije rol", calc: c => (c.techniek + c.mentaal) / 2 }],
  LW:  [{ name: "Buitenspeler", calc: c => (c.techniek + c.fysiek) / 2 }, { name: "Omgekeerde vleugel", calc: c => (c.techniek + c.tactiek) / 2 }],
  RW:  [{ name: "Buitenspeler", calc: c => (c.techniek + c.fysiek) / 2 }, { name: "Omgekeerde vleugel", calc: c => (c.techniek + c.tactiek) / 2 }],
  ST:  [{ name: "Diepe spits", calc: c => (c.fysiek + c.tactiek) / 2 }, { name: "Targetspits", calc: c => (c.fysiek + c.mentaal) / 2 }, { name: "Afmaker", calc: c => (c.techniek + c.mentaal) / 2 }],
  SS:  [{ name: "Schaduwspits", calc: c => (c.techniek + c.tactiek) / 2 }, { name: "Tweede spits", calc: c => (c.teamplay + c.mentaal) / 2 }],
};

/* Kolomkop */
function ColHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="display-font" style={{
      fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: INK,
      paddingBottom: 6, marginBottom: 2, borderBottom: `2px solid ${ACCENT}`,
      display: "flex", alignItems: "center", gap: 7,
    }}>
      <span style={{ width: 3, height: 11, background: ACCENT, transform: "skewX(-12deg)" }} />
      {children}
    </div>
  );
}

/* Attributenblok voor één categorie */
function CategoryBlock({ catId, catScore, subScores }: {
  catId: EvaluationCategory; catScore: number; subScores: Record<string, number> | null;
}) {
  const schema = EVALUATION_SCHEMA.find((c) => c.id === catId);
  if (!schema) return null;
  const hasReal = !!subScores && Object.keys(subScores).length > 0;
  return (
    <div>
      <ColHead>{schema.label}</ColHead>
      {schema.subcategories.map((sub) => (
        <AttrRow key={sub.id}
          label={sub.label}
          value={hasReal ? (subScores![sub.id] ?? catScore) : catScore}
          real={hasReal ? subScores![sub.id] != null : catScore > 0}
        />
      ))}
    </div>
  );
}

/* Infopaneel-rij */
function InfoRow({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${LINE}` }}>
      <span style={{ fontSize: 12, color: SUB }}>{k}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: color ?? INK, textAlign: "right" }}>{v}</span>
    </div>
  );
}

/* Voetsterkte-streepjes zoals FM */
function FootDashes({ strength }: { strength: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{
          width: 8, height: 3, transform: "skewX(-12deg)",
          background: i < strength ? "#2E7D4F" : LINE,
        }} />
      ))}
    </span>
  );
}

export function PlayerCardView({ player }: { player: PlayerWithDetails }) {
  const ovr = player.overall_rating;
  const latest = player.evaluations?.[0];
  const age = calcAge(player.date_of_birth);
  const photo = player.photo_url ?? player.avatar_url ?? null;
  const mbti = player.mbti_type && player.mbti_type in MBTI_PROFILES ? MBTI_PROFILES[player.mbti_type as MbtiCode] : null;
  const archetype = player.identity?.primary_archetype ? ARCHETYPES[player.identity.primary_archetype] : null;

  const catScore = (cat: EvaluationCategory) => latest?.scores?.find((s) => s.category === cat)?.score ?? 0;
  const catSubs = (cat: EvaluationCategory) => parseSubScores(latest?.scores?.find((s) => s.category === cat)?.sub_notes);

  const potential = latest?.potential_level ? POTENTIAL_LEVELS.find((p) => p.value === latest.potential_level)?.label : null;

  // Vorm: laatste 5 evaluaties
  const form = (player.evaluations ?? []).slice(0, 5).map((e) => e.overall_score ?? 0).reverse();
  const trend = (player.evaluations?.length ?? 0) >= 2
    ? (player.evaluations![0].overall_score ?? 0) - (player.evaluations![1].overall_score ?? 0)
    : null;
  const doneCh = player.challenges?.filter((c) => c.status === "completed").length ?? 0;
  const totalCh = player.challenges?.length ?? 0;

  const foot = player.dominant_foot;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1180, margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .pcv-main { display: grid; grid-template-columns: 190px 1fr 1fr 1fr 200px; gap: 22px; }
        .pcv-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 1100px) { .pcv-main { grid-template-columns: 1fr 1fr; } .pcv-side { grid-column: span 2; } }
        @media (max-width: 640px)  { .pcv-main { grid-template-columns: 1fr; } .pcv-side { grid-column: span 1; } .pcv-tiles { grid-template-columns: repeat(2, 1fr); } }
      ` }} />

      {/* ══ KOP ══ */}
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ height: 4, background: ACCENT }} />
        <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          {/* Foto */}
          <div style={{
            width: 84, height: 84, borderRadius: 10, overflow: "hidden", flexShrink: 0,
            background: "#F7F8FA", border: `1px solid ${LINE}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {photo
              ? <Image src={photo} alt="" width={84} height={84} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              : <span className="display-font" style={{ fontSize: 26, fontWeight: 600, color: ACCENT }}>{player.first_name[0]}{player.last_name?.[0] ?? ""}</span>}
          </div>

          {/* Naam + chips */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: SUB, lineHeight: 1 }}>{player.first_name}</div>
            <div className="display-font" style={{ fontSize: 30, fontWeight: 600, color: INK, lineHeight: 1.05, textTransform: "uppercase" }}>
              {player.last_name || player.first_name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <span className="cut-sm display-font" style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", background: ACCENT, color: "#fff" }}>
                {POSITION_LABELS[player.position]}
              </span>
              {player.secondary_position && (
                <span className="cut-sm display-font" style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", background: "#F7F8FA", color: SUB, border: `1px solid ${LINE}` }}>
                  {POSITION_LABELS[player.secondary_position]}
                </span>
              )}
              <span style={{ fontSize: 12, color: SUB }}>
                {age !== null ? `${age} jaar` : ""}{age !== null && player.nationality ? " · " : ""}{player.nationality ?? ""}
              </span>
            </div>
          </div>

          {/* Club + type + rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 44, height: 44, borderRadius: 9, background: "#F7F8FA", border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Image src="/logo.png" alt="" width={32} height={32} style={{ objectFit: "contain" }} />
              </div>
              <span className="display-font" style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: SUB, maxWidth: 90, textAlign: "center" }}>
                {player.team_name || player.club || "SFA"}
              </span>
            </div>
            {mbti && <MbtiShield code={mbti.code} size={52} />}
            <div style={{ textAlign: "right" }}>
              <div className="display-font" style={{ fontSize: 54, fontWeight: 600, lineHeight: 1, color: scoreColor(ovr / 10), fontFeatureSettings: '"tnum" 1' }}>
                {ovr}
              </div>
              <div className="display-font" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", color: DIM }}>RATING</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ HOOFDPANEEL ══ */}
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 22 }}>
        {!latest ? (
          <div style={{ padding: "36px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 6 }}>Nog geen evaluatie</div>
            <p style={{ fontSize: 12.5, color: SUB }}>Zodra je coach je evalueert, verschijnen hier je attribuutscores.</p>
          </div>
        ) : (
          <div className="pcv-main">
            {/* Posities */}
            <div>
              <ColHead>Posities</ColHead>
              <div style={{ paddingTop: 10 }}>
                <MiniPitch primary={player.position} secondary={player.secondary_position} />
                <div style={{ marginTop: 10, fontSize: 12, color: SUB, lineHeight: 1.5 }}>
                  <b style={{ color: INK }}>{POSITION_LABELS[player.position]}</b>
                  {player.secondary_position && <><br />{POSITION_LABELS[player.secondary_position]}</>}
                </div>
                {archetype && (
                  <div style={{ marginTop: 14 }}>
                    <div className="display-font" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: DIM, marginBottom: 5 }}>SPEELSTIJL</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{archetype.label}</div>
                  </div>
                )}
                {(() => {
                  const roles = ROLE_DEFS[player.position];
                  if (!roles) return null;
                  const cs: CatScores = {
                    techniek: catScore("techniek"), fysiek: catScore("fysiek"), tactiek: catScore("tactiek"),
                    mentaal: catScore("mentaal"), teamplay: catScore("teamplay"),
                  };
                  return (
                    <div style={{ marginTop: 14 }}>
                      <div className="display-font" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: DIM, marginBottom: 6 }}>ROLLEN</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {roles.map((r) => {
                          const v = r.calc(cs);
                          const stars = Math.max(1, Math.min(5, Math.round(v / 2)));
                          return (
                            <div key={r.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <span style={{ fontSize: 11.5, color: SUB }}>{r.name}</span>
                              <Stars n={stars} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Attribuutkolommen */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <CategoryBlock catId="techniek" catScore={catScore("techniek")} subScores={catSubs("techniek")} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <CategoryBlock catId="tactiek" catScore={catScore("tactiek")} subScores={catSubs("tactiek")} />
              <CategoryBlock catId="teamplay" catScore={catScore("teamplay")} subScores={catSubs("teamplay")} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <CategoryBlock catId="fysiek" catScore={catScore("fysiek")} subScores={catSubs("fysiek")} />
              <CategoryBlock catId="mentaal" catScore={catScore("mentaal")} subScores={catSubs("mentaal")} />
            </div>

            {/* Info */}
            <div className="pcv-side">
              <ColHead>Info</ColHead>
              <InfoRow k="Lengte" v={player.height_cm ? `${player.height_cm} cm` : "—"} />
              <InfoRow k="Gewicht" v={player.weight_kg ? `${player.weight_kg} kg` : "—"} />
              <InfoRow k="Leeftijd" v={age !== null ? `${age}` : "—"} />
              {potential && <InfoRow k="Potentieel" v={potential} color={ACCENT} />}
              <InfoRow k="Persoonlijkheid" v={mbti ? mbti.nickname : "Nog geen test"} color={mbti ? mbti.color : DIM} />
              <InfoRow k="Evaluaties" v={String(player.evaluations?.length ?? 0)} />

              <div style={{ marginTop: 16 }}>
                <div className="display-font" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: DIM, marginBottom: 8 }}>VOETEN</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: SUB }}>Links</span>
                    <FootDashes strength={foot === "left" ? 5 : foot === "both" ? 4 : 2} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: SUB }}>Rechts</span>
                    <FootDashes strength={foot === "right" ? 5 : foot === "both" ? 4 : 2} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ TEGELS ══ */}
      <div className="pcv-tiles">
        {/* Vorm */}
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
          <div className="display-font" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: SUB, marginBottom: 10 }}>VORM</div>
          {form.length ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 44 }}>
              {form.map((v, i) => (
                <div key={i} title={v.toFixed(1)} style={{
                  flex: 1, height: `${Math.max(v * 10, 6)}%`,
                  background: scoreColor(v), transform: "skewX(-6deg)", borderRadius: 1,
                }} />
              ))}
            </div>
          ) : <div style={{ fontSize: 12, color: DIM }}>Nog geen evaluaties</div>}
          <div style={{ fontSize: 11, color: DIM, marginTop: 8 }}>Laatste {form.length || 0} evaluaties</div>
        </div>

        {/* Ontwikkeling */}
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
          <div className="display-font" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: SUB, marginBottom: 10 }}>ONTWIKKELING</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {trend === null ? <Minus size={18} style={{ color: DIM }} />
              : trend >= 0 ? <TrendingUp size={18} style={{ color: "#2E7D4F" }} />
              : <TrendingDown size={18} style={{ color: "#B4534A" }} />}
            <span className="display-font" style={{ fontSize: 24, fontWeight: 600, color: trend === null ? DIM : trend >= 0 ? "#2E7D4F" : "#B4534A" }}>
              {trend === null ? "—" : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}`}
            </span>
          </div>
          <div style={{ fontSize: 11, color: DIM, marginTop: 8 }}>t.o.v. vorige evaluatie</div>
        </div>

        {/* Challenges */}
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
          <div className="display-font" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: SUB, marginBottom: 10 }}>CHALLENGES</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span className="display-font" style={{ fontSize: 24, fontWeight: 600, color: INK }}>{doneCh}</span>
            <span style={{ fontSize: 12, color: DIM }}>/ {totalCh} voltooid</span>
          </div>
          <div style={{ height: 5, background: "#EEF1F4", marginTop: 10, overflow: "hidden", transform: "skewX(-12deg)" }}>
            <div style={{ width: totalCh ? `${(doneCh / totalCh) * 100}%` : 0, height: "100%", background: ACCENT }} />
          </div>
        </div>

        {/* Persoonlijkheid */}
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
          {mbti ? (
            <>
              <MbtiShield code={mbti.code} size={44} />
              <div>
                <div className="display-font" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: SUB }}>PERSOONLIJKHEID</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginTop: 3 }}>{mbti.nickname}</div>
                <div style={{ fontSize: 11, color: DIM }}>{mbti.code}</div>
              </div>
            </>
          ) : (
            <div>
              <div className="display-font" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: SUB }}>PERSOONLIJKHEID</div>
              <div style={{ fontSize: 12, color: DIM, marginTop: 4 }}>Nog geen test ingevuld</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
