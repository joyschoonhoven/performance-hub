import type {
  Player, PlayerIdentity, Evaluation, Challenge, PlayerWithDetails,
  ArchetypeType, SociotypeName, PositionType,
} from "./types";

// ============================================================
// COACH + ASSESSMENT DATA (must be defined before MOCK_PLAYERS)
// ============================================================

const MOCK_COACHES = [
  { id: "coach1", name: "Marco van der Laan" },
  { id: "coach2", name: "Steven de Ruiter" },
  { id: "coach3", name: "Arjan Pieters" },
];

const PLAYER_COACH_ASSESSMENTS: Record<string, Array<{
  archetype: ArchetypeType; sociotype: SociotypeName; position: PositionType;
}>> = {
  p1: [
    { archetype: "complete_forward", sociotype: "killer", position: "ST" },
    { archetype: "complete_forward", sociotype: "strijder", position: "ST" },
    { archetype: "poacher", sociotype: "killer", position: "ST" },
  ],
  p2: [
    { archetype: "progressive_passer", sociotype: "denker", position: "CM" },
    { archetype: "progressive_passer", sociotype: "leider", position: "CM" },
    { archetype: "engine", sociotype: "denker", position: "CAM" },
  ],
  p3: [
    { archetype: "sweeper_keeper", sociotype: "leider", position: "GK" },
    { archetype: "command_keeper", sociotype: "leider", position: "GK" },
    { archetype: "sweeper_keeper", sociotype: "rustbrenger", position: "GK" },
  ],
  p4: [
    { archetype: "pace_dribbler", sociotype: "kunstenaar", position: "LW" },
    { archetype: "inverted_forward", sociotype: "kunstenaar", position: "LW" },
    { archetype: "pace_dribbler", sociotype: "joker", position: "LW" },
  ],
  p5: [
    { archetype: "defensive_blocker", sociotype: "strijder", position: "CB" },
    { archetype: "defensive_blocker", sociotype: "professional", position: "CB" },
    { archetype: "ball_playing_cb", sociotype: "strijder", position: "CB" },
  ],
  p6: [
    { archetype: "classic_ten", sociotype: "kunstenaar", position: "CAM" },
    { archetype: "classic_ten", sociotype: "leider", position: "CAM" },
    { archetype: "creative_hub", sociotype: "kunstenaar", position: "CAM" },
  ],
  p7: [
    { archetype: "defensive_fullback", sociotype: "professional", position: "RB" },
    { archetype: "defensive_fullback", sociotype: "rustbrenger", position: "RB" },
  ],
  p8: [
    { archetype: "destroyer", sociotype: "strijder", position: "CDM" },
    { archetype: "destroyer", sociotype: "denker", position: "CDM" },
    { archetype: "deep_lying_playmaker", sociotype: "strijder", position: "CDM" },
  ],
};

/** Deterministic pseudo-random based on a string seed — no Math.random() */
function seededRandom(seed: string, index: number): number {
  let h = 2166136261;
  const s = seed + index;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return (h >>> 0) / 4294967296;
}

function generateEvaluations(playerId: string, count: number): Evaluation[] {
  const categories = ["techniek", "fysiek", "tactiek", "mentaal", "teamplay"] as const;
  const evals: Evaluation[] = [];
  const baseDate = new Date("2025-01-15");
  const assessments = PLAYER_COACH_ASSESSMENTS[playerId] ?? [];

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i * 14);
    const evalId = `e${playerId}${i}`;
    const coach = MOCK_COACHES[i % MOCK_COACHES.length];
    const assessment = assessments[i % assessments.length];
    const scores = categories.map((cat, ci) => ({
      id: `es${evalId}${cat}`,
      evaluation_id: evalId,
      category: cat,
      score: Math.round((6 + seededRandom(`${playerId}${i}${ci}`, ci) * 3 + (i === 0 ? 0.3 : 0)) * 10) / 10,
    }));
    const overall = scores.reduce((a, s) => a + s.score, 0) / scores.length;
    evals.push({
      id: evalId,
      player_id: playerId,
      coach_id: coach.id,
      coach_name: coach.name,
      overall_score: Math.round(overall * 10) / 10,
      notes: i === 0 ? "Goede training vandaag, focus op positiespel." : undefined,
      evaluation_date: date.toISOString().split("T")[0],
      created_at: date.toISOString(),
      scores,
      assessed_archetype: assessment?.archetype,
      assessed_sociotype: assessment?.sociotype,
      assessed_position: assessment?.position,
    });
  }
  return evals;
}

// ============================================================
// MOCK PLAYERS
// ============================================================

export const MOCK_PLAYERS: PlayerWithDetails[] = [
  {
    id: "p1",
    first_name: "Lars",
    last_name: "van der Berg",
    full_name: "Lars van der Berg",
    date_of_birth: "2007-03-15",
    nationality: "Nederlands",
    position: "ST",
    jersey_number: 9,
    avatar_url: undefined,
    overall_rating: 82,
    badge: "talent",
    is_active: true,
    team_name: "U17 A",
    club: "Schoonhoven FC",
    created_at: "2024-08-01T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
    trend: "up",
    recent_scores: { techniek: 8.2, fysiek: 8.5, tactiek: 7.8, mentaal: 8.0, teamplay: 7.5 },
    identity: {
      id: "pi1", player_id: "p1",
      primary_archetype: "complete_forward",
      secondary_archetype: "poacher",
      primary_sociotype: "killer",
      secondary_sociotype: "strijder",
      core_noodzaak: 75,
      core_creativiteit: 60,
      core_vertrouwen: 82,
      ai_fit_score: 88,
      ai_summary: "Lars is een complete spits met uitstekende afwerking en een killermentaliteit in de zestien. Zijn combinatie van techniek en loopvermogen maakt hem moeilijk te verdedigen. Vertrouwen is zijn sterkste kernwaarde — hij blijft kalm in cruciale momenten.",
      last_ai_analysis: "2025-01-15T00:00:00Z",
    },
    evaluations: generateEvaluations("p1", 6),
    challenges: generateChallenges("p1", 3),
  },
  {
    id: "p2",
    first_name: "Jaylen",
    last_name: "Martens",
    full_name: "Jaylen Martens",
    date_of_birth: "2006-07-22",
    nationality: "Nederlands",
    position: "CM",
    jersey_number: 8,
    overall_rating: 79,
    badge: "talent",
    is_active: true,
    team_name: "U17 A",
    club: "Schoonhoven FC",
    created_at: "2024-08-01T00:00:00Z",
    updated_at: "2025-01-10T00:00:00Z",
    trend: "up",
    recent_scores: { techniek: 7.8, fysiek: 7.5, tactiek: 8.1, mentaal: 7.9, teamplay: 8.3 },
    identity: {
      id: "pi2", player_id: "p2",
      primary_archetype: "progressive_passer",
      secondary_archetype: "engine",
      primary_sociotype: "denker",
      secondary_sociotype: "leider",
      core_noodzaak: 65,
      core_creativiteit: 85,
      core_vertrouwen: 72,
      ai_fit_score: 82,
      ai_summary: "Jaylen denkt twee stappen vooruit. Zijn visie en passing-range maken hem tot de motor van het middenveld. Als creatieve denker legt hij verbindingen die anderen niet zien.",
      last_ai_analysis: "2025-01-10T00:00:00Z",
    },
    evaluations: generateEvaluations("p2", 5),
    challenges: generateChallenges("p2", 2),
  },
  {
    id: "p3",
    first_name: "Daan",
    last_name: "Kooistra",
    full_name: "Daan Kooistra",
    date_of_birth: "2007-11-04",
    nationality: "Nederlands",
    position: "GK",
    jersey_number: 1,
    overall_rating: 77,
    badge: "talent",
    is_active: true,
    team_name: "U17 A",
    club: "Schoonhoven FC",
    created_at: "2024-08-01T00:00:00Z",
    updated_at: "2025-01-08T00:00:00Z",
    trend: "stable",
    recent_scores: { techniek: 7.5, fysiek: 7.8, tactiek: 8.0, mentaal: 8.2, teamplay: 7.0 },
    identity: {
      id: "pi3", player_id: "p3",
      primary_archetype: "sweeper_keeper",
      secondary_archetype: "command_keeper",
      primary_sociotype: "leider",
      secondary_sociotype: "rustbrenger",
      core_noodzaak: 80,
      core_creativiteit: 55,
      core_vertrouwen: 78,
      ai_fit_score: 79,
      ai_summary: "Daan heeft de mentaliteit van een leider tussen de palen. Zijn sweeper keeper stijl past perfect bij opbouwspel. Rust en autoriteit zijn zijn sleutelwoorden.",
      last_ai_analysis: "2025-01-08T00:00:00Z",
    },
    evaluations: generateEvaluations("p3", 4),
    challenges: generateChallenges("p3", 2),
  },
  {
    id: "p4",
    first_name: "Senna",
    last_name: "El Hassouni",
    full_name: "Senna El Hassouni",
    date_of_birth: "2008-02-18",
    nationality: "Nederlands",
    position: "LW",
    jersey_number: 11,
    overall_rating: 74,
    badge: "prospect",
    is_active: true,
    team_name: "U17 A",
    club: "Schoonhoven FC",
    created_at: "2024-08-01T00:00:00Z",
    updated_at: "2024-12-20T00:00:00Z",
    trend: "up",
    recent_scores: { techniek: 8.0, fysiek: 7.2, tactiek: 6.8, mentaal: 7.0, teamplay: 7.1 },
    identity: {
      id: "pi4", player_id: "p4",
      primary_archetype: "pace_dribbler",
      secondary_archetype: "inverted_forward",
      primary_sociotype: "kunstenaar",
      secondary_sociotype: "joker",
      core_noodzaak: 55,
      core_creativiteit: 90,
      core_vertrouwen: 62,
      ai_fit_score: 75,
      ai_summary: "Senna is een kunstenaar op het veld — onvoorspelbaar en technisch hoogstaand. Zijn creativiteit is zijn grootste wapen. Met meer tactische discipline kan hij de stap naar elite maken.",
      last_ai_analysis: "2024-12-20T00:00:00Z",
    },
    evaluations: generateEvaluations("p4", 3),
    challenges: generateChallenges("p4", 3),
  },
  {
    id: "p5",
    first_name: "Tim",
    last_name: "Schoonhoven",
    full_name: "Tim Schoonhoven",
    date_of_birth: "2007-06-30",
    nationality: "Nederlands",
    position: "CB",
    jersey_number: 5,
    overall_rating: 71,
    badge: "prospect",
    is_active: true,
    team_name: "U17 A",
    club: "Schoonhoven FC",
    created_at: "2024-08-01T00:00:00Z",
    updated_at: "2024-12-15T00:00:00Z",
    trend: "stable",
    recent_scores: { techniek: 6.8, fysiek: 8.0, tactiek: 7.2, mentaal: 7.5, teamplay: 7.8 },
    identity: {
      id: "pi5", player_id: "p5",
      primary_archetype: "defensive_blocker",
      secondary_archetype: "ball_playing_cb",
      primary_sociotype: "strijder",
      secondary_sociotype: "professional",
      core_noodzaak: 88,
      core_creativiteit: 42,
      core_vertrouwen: 75,
      ai_fit_score: 72,
      ai_summary: "Tim is een echte strijder — zijn noodzaak om te winnen drijft zijn defensieve werk. Betrouwbaar en agressief in duels. Moet zijn balspel verder ontwikkelen.",
      last_ai_analysis: "2024-12-15T00:00:00Z",
    },
    evaluations: generateEvaluations("p5", 4),
    challenges: generateChallenges("p5", 2),
  },
  {
    id: "p6",
    first_name: "Noah",
    last_name: "Fernandez",
    full_name: "Noah Fernandez",
    date_of_birth: "2006-09-12",
    nationality: "Spaans",
    position: "CAM",
    jersey_number: 10,
    overall_rating: 86,
    badge: "elite",
    is_active: true,
    team_name: "U18 A",
    club: "Schoonhoven FC",
    created_at: "2024-08-01T00:00:00Z",
    updated_at: "2025-01-16T00:00:00Z",
    trend: "up",
    recent_scores: { techniek: 9.1, fysiek: 7.8, tactiek: 8.8, mentaal: 8.5, teamplay: 8.0 },
    identity: {
      id: "pi6", player_id: "p6",
      primary_archetype: "classic_ten",
      secondary_archetype: "creative_hub",
      primary_sociotype: "kunstenaar",
      secondary_sociotype: "leider",
      core_noodzaak: 65,
      core_creativiteit: 95,
      core_vertrouwen: 88,
      ai_fit_score: 94,
      ai_summary: "Noah is een generatietalent. Zijn techniek en creativiteit zijn op een ander niveau. Als klassieke 10 dicteert hij het spel. Zijn zelfvertrouwen groeit elke week — een toekomstige profs.",
      last_ai_analysis: "2025-01-16T00:00:00Z",
    },
    evaluations: generateEvaluations("p6", 8),
    challenges: generateChallenges("p6", 1),
  },
  {
    id: "p7",
    first_name: "Kevin",
    last_name: "de Jong",
    full_name: "Kevin de Jong",
    date_of_birth: "2007-04-05",
    nationality: "Nederlands",
    position: "RB",
    jersey_number: 2,
    overall_rating: 68,
    badge: "prospect",
    is_active: true,
    team_name: "U17 A",
    club: "Schoonhoven FC",
    created_at: "2024-08-01T00:00:00Z",
    updated_at: "2024-11-30T00:00:00Z",
    trend: "down",
    recent_scores: { techniek: 6.5, fysiek: 7.5, tactiek: 6.8, mentaal: 6.2, teamplay: 7.0 },
    identity: {
      id: "pi7", player_id: "p7",
      primary_archetype: "defensive_fullback",
      secondary_archetype: undefined,
      primary_sociotype: "professional",
      secondary_sociotype: "rustbrenger",
      core_noodzaak: 70,
      core_creativiteit: 45,
      core_vertrouwen: 55,
      ai_fit_score: 62,
      ai_summary: "Kevin is een betrouwbare professional maar mist momenteel het vertrouwen na een blessure. Zijn werkethiek is sterk. Focus op herstel van zelfvertrouwen is prioriteit.",
      last_ai_analysis: "2024-11-30T00:00:00Z",
    },
    evaluations: generateEvaluations("p7", 3),
    challenges: generateChallenges("p7", 4),
  },
  {
    id: "p8",
    first_name: "Rayan",
    last_name: "Ouali",
    full_name: "Rayan Ouali",
    date_of_birth: "2008-12-01",
    nationality: "Marokkaans",
    position: "CDM",
    jersey_number: 6,
    overall_rating: 70,
    badge: "prospect",
    is_active: true,
    team_name: "U16 A",
    club: "Schoonhoven FC",
    created_at: "2024-09-01T00:00:00Z",
    updated_at: "2024-12-28T00:00:00Z",
    trend: "up",
    recent_scores: { techniek: 7.0, fysiek: 8.2, tactiek: 7.5, mentaal: 7.8, teamplay: 7.4 },
    identity: {
      id: "pi8", player_id: "p8",
      primary_archetype: "destroyer",
      secondary_archetype: "deep_lying_playmaker",
      primary_sociotype: "strijder",
      secondary_sociotype: "denker",
      core_noodzaak: 85,
      core_creativiteit: 58,
      core_vertrouwen: 72,
      ai_fit_score: 78,
      ai_summary: "Rayan combineert de agressiviteit van een destroyer met het inzicht van een regisseur. Zijn noodzaak-score is exceptioneel. Een speler die wedstrijden kan domineren.",
      last_ai_analysis: "2024-12-28T00:00:00Z",
    },
    evaluations: generateEvaluations("p8", 4),
    challenges: generateChallenges("p8", 2),
  },
];

function generateChallenges(playerId: string, count: number): Challenge[] {
  const templates = [
    { title: "100 vrije trappen per week", category: "techniek" as const, status: "in_progress" as const },
    { title: "Sprint snelheid verbeteren (-0.2s)", category: "fysiek" as const, status: "open" as const },
    { title: "Positie houden bij pressing", category: "tactiek" as const, status: "in_progress" as const },
    { title: "Leadership in de kleedkamer", category: "mentaal" as const, status: "open" as const },
    { title: "10 assists in training", category: "teamplay" as const, status: "completed" as const },
    { title: "Video analyse 2x per week", category: "tactiek" as const, status: "open" as const },
  ];
  const deadlines = [
    "2025-02-12", "2025-02-26", "2025-03-12", "2025-03-26", "2025-04-09", "2025-04-23",
  ];
  const inProgressValues = [45, 62, 38, 55, 70, 48];
  return templates.slice(0, count).map((t, i) => ({
    id: `ch${playerId}${i}`,
    player_id: playerId,
    coach_id: "coach1",
    title: t.title,
    category: t.category,
    status: t.status,
    progress: t.status === "completed" ? 100 : t.status === "in_progress" ? inProgressValues[i % inProgressValues.length] : 0,
    deadline: deadlines[i % deadlines.length],
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  }));
}

// Quick lookup
export function getMockPlayer(id: string): PlayerWithDetails | undefined {
  return MOCK_PLAYERS.find((p) => p.id === id);
}

export function getMockPlayersForCoach(): PlayerWithDetails[] {
  return MOCK_PLAYERS;
}

/** Returns the most frequently assessed archetype/sociotype/position across all evaluations */
export function getConsensusAssessment(evaluations: Evaluation[]) {
  function mostCommon<T>(arr: T[]): T | undefined {
    const counts = new Map<T, number>();
    for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
    let best: T | undefined;
    let max = 0;
    counts.forEach((count, key) => { if (count > max) { max = count; best = key; } });
    return best;
  }
  const archetypes = evaluations.map((e) => e.assessed_archetype).filter(Boolean) as ArchetypeType[];
  const sociotypes = evaluations.map((e) => e.assessed_sociotype).filter(Boolean) as SociotypeName[];
  const positions = evaluations.map((e) => e.assessed_position).filter(Boolean) as PositionType[];
  return {
    archetype: mostCommon(archetypes),
    sociotype: mostCommon(sociotypes),
    position: mostCommon(positions),
    totalAssessments: archetypes.length,
  };
}
