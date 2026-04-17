import type {
  AIAnalysisInput, AIAnalysisOutput, ArchetypeType, SociotypeName,
  EvaluationCategory,
} from "./types";
import { ARCHETYPES } from "./types";

// ============================================================
// RULE-BASED AI ENGINE (works without API key)
// ============================================================

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getScoresByCategory(input: AIAnalysisInput): Record<EvaluationCategory, number[]> {
  const result: Record<EvaluationCategory, number[]> = {
    techniek: [], fysiek: [], tactiek: [], mentaal: [], teamplay: [],
  };
  for (const ev of input.evaluations) {
    for (const score of (ev.scores ?? [])) {
      result[score.category as EvaluationCategory].push(score.score);
    }
  }
  return result;
}

// Map position + scores → best archetype
function inferArchetype(input: AIAnalysisInput, scores: Record<EvaluationCategory, number[]>): ArchetypeType {
  const pos = input.player.position;
  const tAvg = avg(scores.techniek);
  const fAvg = avg(scores.fysiek);
  const taAvg = avg(scores.tactiek);
  const mAvg = avg(scores.mentaal);
  const teAvg = avg(scores.teamplay);

  // Filter archetypes for this position
  const candidates = Object.values(ARCHETYPES).filter((a) =>
    a.position.includes(pos)
  );
  if (!candidates.length) return "complete_forward";

  // Score each archetype by trait alignment
  const scored = candidates.map((a) => {
    let score = 0;
    // Simple heuristic mapping
    if (a.id.includes("passing") || a.id.includes("playmaker") || a.id.includes("hub")) score += taAvg + tAvg;
    if (a.id.includes("pace") || a.id.includes("destroyer") || a.id.includes("engine")) score += fAvg * 1.5;
    if (a.id.includes("keeper") || a.id.includes("stopper") || a.id.includes("blocker")) score += fAvg + mAvg;
    if (a.id.includes("creative") || a.id.includes("artistic") || a.id.includes("ten")) score += tAvg * 1.5;
    if (a.id.includes("complete") || a.id.includes("box")) score += (tAvg + fAvg + taAvg) / 3;
    if (a.id.includes("poacher")) score += mAvg * 1.5;
    if (a.id.includes("target")) score += fAvg + mAvg;
    return { archetype: a.id as ArchetypeType, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].archetype;
}

function inferSociotype(scores: Record<EvaluationCategory, number[]>): SociotypeName {
  const m = avg(scores.mentaal);
  const t = avg(scores.techniek);
  const ta = avg(scores.tactiek);
  const te = avg(scores.teamplay);
  const f = avg(scores.fysiek);

  // Weighted decision
  if (m >= 8.5 && te >= 8) return "leider";
  if (f >= 8.5 && m >= 8) return "strijder";
  if (ta >= 8.5 && m >= 7.5) return "denker";
  if (t >= 8.5 && ta >= 7) return "kunstenaar";
  if (m >= 8 && te >= 7.5) return "professional";
  if (m >= 7.5 && te >= 8) return "rustbrenger";
  if (ta >= 7 && te >= 8) return "joker";
  if (m >= 8 && f >= 7.5) return "killer";
  return "professional";
}

function inferSecondarySociotype(primary: SociotypeName, scores: Record<EvaluationCategory, number[]>): SociotypeName | undefined {
  const options: SociotypeName[] = ["leider", "strijder", "denker", "kunstenaar", "professional", "rustbrenger", "joker", "killer"];
  const secondary = options.filter((s) => s !== primary);
  const m = avg(scores.mentaal);
  const ta = avg(scores.tactiek);

  if (m >= 7.5 && !["leider"].includes(primary)) return "leider";
  if (ta >= 7.5 && !["denker"].includes(primary)) return "denker";
  return secondary[0];
}

function inferCoreValues(scores: Record<EvaluationCategory, number[]>): {
  noodzaak: number; creativiteit: number; vertrouwen: number
} {
  // Noodzaak = fysiek + discipline signals
  const noodzaak = Math.round(
    Math.min(100, ((avg(scores.fysiek) * 8) + (avg(scores.mentaal) * 2)) / 10)
  );
  // Creativiteit = techniek + tactiek
  const creativiteit = Math.round(
    Math.min(100, ((avg(scores.techniek) * 7) + (avg(scores.tactiek) * 3)) / 10)
  );
  // Vertrouwen = consistentie (low variance) + mentaal + teamplay
  const allScores = [...scores.mentaal, ...scores.teamplay];
  const consistencyBonus = allScores.length > 2 ? 5 : 0;
  const vertrouwen = Math.round(
    Math.min(100, ((avg(scores.mentaal) * 6) + (avg(scores.teamplay) * 4)) / 10 + consistencyBonus)
  );
  return { noodzaak, creativiteit, vertrouwen };
}

function generateSummary(
  input: AIAnalysisInput,
  archetype: ArchetypeType,
  sociotype: SociotypeName,
  coreValues: { noodzaak: number; creativiteit: number; vertrouwen: number }
): string {
  const name = `${input.player.first_name}`;
  const pos = input.player.position;
  const archetypeName = ARCHETYPES[archetype]?.label ?? archetype;

  const dominant = Object.entries(coreValues).sort((a, b) => b[1] - a[1])[0];
  const dominantLabel = dominant[0] === "noodzaak" ? "noodzaak" : dominant[0] === "creativiteit" ? "creativiteit" : "vertrouwen";

  const strengths = [];
  if (coreValues.noodzaak >= 75) strengths.push("hoge werkethiek");
  if (coreValues.creativiteit >= 75) strengths.push("uitstekende techniek en visie");
  if (coreValues.vertrouwen >= 75) strengths.push("mentale sterk­heid");

  return `${name} profileert zich als ${archetypeName} op positie ${pos}. De dominante kernwaarde is ${dominantLabel} (${dominant[1]}). ${
    strengths.length ? `Uitblinkers: ${strengths.join(", ")}.` : ""
  } ${input.coach_notes ? `Coach notitie: ${input.coach_notes.slice(0, 100)}...` : ""}`.trim();
}

// ============================================================
// MAIN RULE-BASED ENGINE
// ============================================================

export function analyzePlayerLocal(input: AIAnalysisInput): AIAnalysisOutput {
  const scores = getScoresByCategory(input);
  const archetype = inferArchetype(input, scores);
  const secondaryArchetype = inferSecondaryArchetype(input, archetype, scores);
  const primarySociotype = inferSociotype(scores);
  const secondarySociotype = inferSecondarySociotype(primarySociotype, scores);
  const coreValues = inferCoreValues(scores);
  const fitScore = Math.round(
    (coreValues.noodzaak * 0.3 + coreValues.creativiteit * 0.35 + coreValues.vertrouwen * 0.35)
  );
  const summary = generateSummary(input, archetype, primarySociotype, coreValues);

  return {
    archetype,
    secondary_archetype: secondaryArchetype,
    primary_sociotype: primarySociotype,
    secondary_sociotype: secondarySociotype,
    core_values: coreValues,
    fit_score: fitScore,
    summary,
    reasoning: `Analyse gebaseerd op ${input.evaluations.length} evaluaties. Dominante categorie scores gebruikt voor archetype en sociotype bepaling.`,
  };
}

function inferSecondaryArchetype(
  input: AIAnalysisInput,
  primary: ArchetypeType,
  scores: Record<EvaluationCategory, number[]>
): ArchetypeType | undefined {
  const pos = input.player.secondary_position ?? input.player.position;
  const candidates = Object.values(ARCHETYPES)
    .filter((a) => a.position.includes(pos) && a.id !== primary);
  if (!candidates.length) return undefined;
  // Return the one with highest creative traits if techniek is high
  const tAvg = avg(scores.techniek);
  if (tAvg >= 8) {
    const creative = candidates.find((c) => c.traits.includes("Creativiteit"));
    if (creative) return creative.id as ArchetypeType;
  }
  return candidates[0].id as ArchetypeType;
}

// ============================================================
// PROMPT BUILDER (for Claude API route)
// ============================================================

export function buildAnalysisPrompt(input: AIAnalysisInput): string {
  const scores = getScoresByCategory(input);
  const avgScores = Object.entries(scores).map(([cat, vals]) => ({
    category: cat,
    average: avg(vals).toFixed(1),
  }));

  return `Je bent een elite voetbal scout en performance analyst voor Schoonhoven Sports Performance Hub.

Analyseer de volgende speler en geef een gestructureerde AI scouting output in exact dit JSON formaat:

{
  "archetype": "<archetype_type>",
  "secondary_archetype": "<archetype_type of null>",
  "primary_sociotype": "<sociotype>",
  "secondary_sociotype": "<sociotype of null>",
  "core_values": {
    "noodzaak": <0-100>,
    "creativiteit": <0-100>,
    "vertrouwen": <0-100>
  },
  "fit_score": <0-100>,
  "summary": "<professionele Nederlandse samenvatting van 2-3 zinnen>",
  "reasoning": "<korte uitleg van je analyse>"
}

SPELERPROFIEL:
Naam: ${input.player.first_name} ${input.player.last_name}
Positie: ${input.player.position}
Leeftijd: geboren ${input.player.date_of_birth ?? "onbekend"}

EVALUATIESCORES (gemiddelden over ${input.evaluations.length} evaluaties):
${avgScores.map((s) => `- ${s.category}: ${s.average}/10`).join("\n")}

COACH NOTITIES: ${input.coach_notes ?? "Geen notities"}

BESCHIKBARE ARCHETYPES (gebruik exact deze IDs):
GK: sweeper_keeper, command_keeper, shot_stopper
CB: ball_playing_cb, defensive_blocker, aerial_dominant
LB/RB: attacking_fullback, defensive_fullback, inverted_winger_back
CDM: destroyer, deep_lying_playmaker, box_to_box
CM: progressive_passer, engine, press_master
CAM: classic_ten, shadow_striker, creative_hub
LW/RW: pace_dribbler, crossing_winger, inverted_forward
ST: target_man, poacher, complete_forward

BESCHIKBARE SOCIOTYPES: leider, strijder, denker, kunstenaar, professional, rustbrenger, joker, killer

LOGICA:
- Noodzaak = fysiek + discipline (hardwerken, mentaliteit)
- Creativiteit = techniek + tactisch inzicht + passing
- Vertrouwen = consistentie + mentale kracht + teamplay

Geef ALLEEN geldig JSON terug, geen extra tekst.`;
}
