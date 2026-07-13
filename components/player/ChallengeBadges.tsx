"use client";

// ============================================================
//  CHALLENGE BADGES — clubstijl badgemuur (schilden met
//  voortgang), verdiend door challenges te voltooien.
// ============================================================

import { ShieldBadge, type CrestPattern } from "@/components/ui/ShieldBadge";
import { MBTI_PROFILES, type MbtiCode } from "@/lib/mbti";
import { CATEGORY_LABELS } from "@/lib/types";
import type { Challenge, EvaluationCategory } from "@/lib/types";

/* Huisstijl-palet voor emblemen */
const NAVY = "#0D1B2A";
const BLUE = "#5A90BA";
const GOLD = "#C9A227";

interface BadgeDef {
  id: string;
  name: string;
  label: string;              // korte code in het schild
  crest: CrestPattern;        // heraldisch embleem
  color: string;
  goal: number;
  current: number;
}

/** Embleem per categorie — elk een eigen wapenschild. */
export const CATEGORY_BADGE: Record<EvaluationCategory, { label: string; crest: CrestPattern }> = {
  techniek: { label: "TEC", crest: "star" },
  fysiek:   { label: "FYS", crest: "stripes" },
  tactiek:  { label: "TAC", crest: "chevron" },
  mentaal:  { label: "MEN", crest: "rays" },
  teamplay: { label: "TEA", crest: "laurel" },
};

export function ChallengeBadges({ challenges, mbtiType }: {
  challenges: Challenge[];
  mbtiType?: string | null;
}) {
  const done = challenges.filter((c) => c.status === "completed");
  const doneInCat = (cat: EvaluationCategory) => done.filter((c) => c.category === cat).length;

  const milestones: BadgeDef[] = [
    { id: "first", name: "Eerste stap",    label: "1",  crest: "chevron", color: BLUE, goal: 1,  current: done.length },
    { id: "c5",    name: "Op dreef",       label: "5",  crest: "stripes", color: NAVY, goal: 5,  current: done.length },
    { id: "c10",   name: "Doorzetter",     label: "10", crest: "rays",    color: BLUE, goal: 10, current: done.length },
    { id: "c25",   name: "Onverzadigbaar", label: "25", crest: "laurel",  color: GOLD, goal: 25, current: done.length },
  ];

  const categories: BadgeDef[] = (Object.keys(CATEGORY_LABELS) as EvaluationCategory[]).map((cat) => ({
    id: `cat-${cat}`,
    name: CATEGORY_LABELS[cat],
    label: CATEGORY_BADGE[cat].label,
    crest: CATEGORY_BADGE[cat].crest,
    color: NAVY,
    goal: 3,
    current: doneInCat(cat),
  }));

  const mbtiProfile = mbtiType && mbtiType in MBTI_PROFILES ? MBTI_PROFILES[mbtiType as MbtiCode] : null;

  const all: (BadgeDef & { mbti?: boolean })[] = [
    // Speler-DNA badge: verdiend door de persoonlijkheidstest af te ronden
    {
      id: "dna",
      name: mbtiProfile ? mbtiProfile.nickname : "Speler-DNA",
      label: mbtiProfile ? mbtiProfile.code : "DNA",
      crest: "star",
      color: mbtiProfile ? mbtiProfile.color : BLUE,
      goal: 1,
      current: mbtiProfile ? 1 : 0,
      mbti: true,
    },
    ...milestones,
    ...categories,
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(13,27,42,0.09)", borderRadius: 16, padding: "18px 18px 20px" }}>
      <div className="club-h" style={{ fontSize: 14, color: "#0D1B2A", marginBottom: 4 }}>Badges</div>
      <p style={{ fontSize: 12, color: "#5A6B80", marginBottom: 16 }}>
        Voltooi challenges om badges te verdienen — verzamel ze allemaal.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 12 }}>
        {all.map((b) => {
          const earned = b.current >= b.goal;
          const pct = Math.min(100, Math.round((b.current / b.goal) * 100));
          return (
            <div key={b.id} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "14px 8px 12px", borderRadius: 14,
              background: earned ? "#FDFDFD" : "#F7F8FA",
              border: `1px solid ${earned ? `${b.color}45` : "rgba(13,27,42,0.07)"}`,
            }}>
              <ShieldBadge
                color={b.color}
                icon={b.mbti && mbtiProfile ? mbtiProfile.icon : undefined}
                label={b.label}
                crest={b.crest}
                size={56}
                earned={earned}
              />
              <div style={{
                fontSize: 11.5, fontWeight: 700, textAlign: "center", lineHeight: 1.25,
                color: earned ? "#0D1B2A" : "#8A93A1",
              }}>
                {b.name}
              </div>
              {earned ? (
                <div style={{ fontSize: 10, fontWeight: 600, color: b.color }}>✓ Behaald</div>
              ) : (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                  <div style={{ width: "80%", height: 4, borderRadius: 999, background: "rgba(13,27,42,0.10)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#D64045", borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#9BAABB", fontFeatureSettings: '"tnum" 1' }}>
                    {Math.min(b.current, b.goal)} / {b.goal}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
