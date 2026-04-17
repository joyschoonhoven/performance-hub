import { NextResponse } from "next/server";

interface DevPlanRequest {
  player: {
    first_name: string;
    position: string;
    overall_rating: number;
  };
  recent_scores?: Record<string, number>;
  evaluations_count: number;
  challenges: { title: string; status: string; category?: string }[];
  trend?: string;
}

// Rule-based fallback: generate a development plan without Claude
function generateRuleBasedPlan(req: DevPlanRequest): string[] {
  const { player, recent_scores, challenges, trend, evaluations_count } = req;
  const points: string[] = [];

  if (!recent_scores || evaluations_count === 0) {
    return [
      "Zorg dat je coach een eerste evaluatie invult zodat je gepersonaliseerde aanbevelingen krijgt.",
      "Meld je aan bij je coach en vraag om een intake-evaluatie.",
      "Vul je spelersprofiel volledig in voor betere analyse.",
    ];
  }

  // Sort categories by score (ascending = weakest first)
  const sorted = Object.entries(recent_scores).sort((a, b) => a[1] - b[1]);
  const weakest = sorted.slice(0, 2);
  const strongest = sorted[sorted.length - 1];

  const categoryAdvice: Record<string, string> = {
    techniek: "Werk dagelijks aan balvaardigheid en pasvaardigheid — minimaal 15 minuten techniek training.",
    fysiek: "Focus op conditie en snelheid: interval training 2x per week toevoegen aan je schema.",
    tactiek: "Analyseer wedstrijdvideo's van je eigen positie en bestudeer positionering bij standaardsituaties.",
    mentaal: "Train drukbestendigheid: oefen beslissingen nemen in kleine-veld oefenspellen.",
    teamplay: "Werk aan samenspel en communicatie: praat actief tijdens trainingen en vraag om feedback.",
  };

  // Weakest areas → focus points
  for (const [cat, score] of weakest) {
    const advice = categoryAdvice[cat];
    if (advice) {
      const label = score < 6
        ? `Prioriteit — ${cat} (${score.toFixed(1)}/10): ${advice}`
        : `Aandachtspunt — ${cat} (${score.toFixed(1)}/10): ${advice}`;
      points.push(label);
    }
  }

  // Strongest area → leverage
  if (strongest && strongest[1] >= 7) {
    points.push(
      `Sterk punt — ${strongest[0]} (${strongest[1].toFixed(1)}/10): Bouw hierop voort en gebruik dit als basis in wedstrijden.`
    );
  }

  // Active challenges
  const activeChallenges = challenges.filter((c) => c.status === "in_progress" || c.status === "open");
  if (activeChallenges.length > 0) {
    points.push(
      `Je hebt ${activeChallenges.length} actieve challenge${activeChallenges.length > 1 ? "s" : ""} — focus op "${activeChallenges[0].title}" als eerste prioriteit.`
    );
  }

  // Trend
  if (trend === "up") {
    points.push(`Je bent in progressie. Blijf consistent en verhoog de intensiteit van trainingen om door te groeien.`);
  } else if (trend === "down") {
    points.push(`Herstel focus: analyseer wat er de laatste weken veranderd is en bespreek dit met je coach.`);
  }

  // Rating context
  if (player.overall_rating < 65) {
    points.push(`Rating ${player.overall_rating}: Basis fundamenten versterken — prioriteit op techniek en tactisch begrip.`);
  } else if (player.overall_rating >= 80) {
    points.push(`Rating ${player.overall_rating}: Op hoog niveau — werk aan consistentie en verfijn je zwakkere punten voor de volgende stap.`);
  }

  return points.slice(0, 4);
}

export async function POST(request: Request) {
  const body: DevPlanRequest = await request.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── Claude API path ────────────────────────────────────────────────────────
  if (apiKey) {
    try {
      const scoreLines = body.recent_scores
        ? Object.entries(body.recent_scores)
            .map(([cat, score]) => `${cat}: ${score.toFixed(1)}/10`)
            .join(", ")
        : "nog geen scores";

      const activeChallenges = body.challenges
        .filter((c) => c.status !== "completed")
        .map((c) => c.title)
        .join(", ") || "geen";

      const prompt = `Je bent een professionele voetbalcoach assistent voor Schoonhoven Sports Performance Hub.

Genereer een KORT persoonlijk ontwikkelplan voor een speler. Geef precies 3 tot 4 concrete actiepunten in het Nederlands. Elke punt is maximaal 1-2 zinnen. Geen inleiding, geen afsluiting — alleen de actiepunten.

SPELERDATA:
- Naam: ${body.player.first_name}
- Positie: ${body.player.position}
- Overall rating: ${body.player.overall_rating}/99
- Trend: ${body.trend ?? "stabiel"}
- Evaluaties: ${body.evaluations_count}
- Categorie scores: ${scoreLines}
- Actieve challenges: ${activeChallenges}

Geef de punten terug als JSON array van strings, bijv: ["punt 1", "punt 2", "punt 3"]
Alleen JSON, geen extra tekst.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text ?? "";
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json({ plan: parsed, source: "claude" });
        }
      }
    } catch {
      // Fall through to rule-based
    }
  }

  // ── Rule-based fallback ─────────────────────────────────────────────────────
  const plan = generateRuleBasedPlan(body);
  return NextResponse.json({ plan, source: "rules" });
}
