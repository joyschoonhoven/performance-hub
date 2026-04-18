// ============================================================
// SCHOONHOVEN SPORTS PERFORMANCE HUB — Type Definitions
// ============================================================

export type UserRole = "coach" | "player" | "admin";

export type PositionType =
  | "GK" | "CB" | "LB" | "RB"
  | "CDM" | "CM" | "CAM"
  | "LW" | "RW" | "ST" | "SS";

export type ArchetypeType =
  // GK
  | "sweeper_keeper" | "command_keeper" | "shot_stopper"
  // CB
  | "ball_playing_cb" | "defensive_blocker" | "aerial_dominant"
  // Backs
  | "attacking_fullback" | "defensive_fullback" | "inverted_winger_back"
  // CDM
  | "destroyer" | "deep_lying_playmaker" | "box_to_box"
  // CM
  | "progressive_passer" | "engine" | "press_master"
  // CAM
  | "classic_ten" | "shadow_striker" | "creative_hub"
  // Winger
  | "pace_dribbler" | "crossing_winger" | "inverted_forward"
  // ST
  | "target_man" | "poacher" | "complete_forward";

export type SociotypeName =
  | "leider" | "strijder" | "denker" | "kunstenaar"
  | "professional" | "rustbrenger" | "joker" | "killer";

export type ChallengeStatus = "open" | "in_progress" | "completed" | "expired";
export type BadgeType = "elite" | "talent" | "prospect" | "rising_star" | "veteran";
export type EvaluationCategory = "techniek" | "fysiek" | "tactiek" | "mentaal" | "teamplay";

// ============================================================
// ARCHETYPE META
// ============================================================

export interface ArchetypeMeta {
  id: ArchetypeType;
  label: string;
  position: PositionType[];
  description: string;
  icon: string;
  color: string;
  traits: string[];
}

export const ARCHETYPES: Record<ArchetypeType, ArchetypeMeta> = {
  // GK
  sweeper_keeper: {
    id: "sweeper_keeper", label: "Sweeper Keeper", position: ["GK"],
    description: "Actief buiten de zestien, initieert aanvallen",
    icon: "🧤", color: "#6366f1",
    traits: ["Uitlopen", "Vloetvoetig", "Opbouwspel"],
  },
  command_keeper: {
    id: "command_keeper", label: "Command Keeper", position: ["GK"],
    description: "Domineert de zestien, organiseert defensie",
    icon: "🦁", color: "#f59e0b",
    traits: ["Leadership", "Kopspel", "Positiespel"],
  },
  shot_stopper: {
    id: "shot_stopper", label: "Shot Stopper", position: ["GK"],
    description: "Pure keeper, schot-reddingskwaliteiten",
    icon: "🛑", color: "#ef4444",
    traits: ["Reflexen", "Positionering", "Reddingen"],
  },
  // CB
  ball_playing_cb: {
    id: "ball_playing_cb", label: "Ball-Playing CB", position: ["CB"],
    description: "Speelt mee in opbouw, lange passes",
    icon: "🎯", color: "#10B981",
    traits: ["Passing", "Rustig onder druk", "Lijnbreker"],
  },
  defensive_blocker: {
    id: "defensive_blocker", label: "Defensive Blocker", position: ["CB"],
    description: "Pure verdediger, houdt aanvallers stop",
    icon: "🏰", color: "#64748b",
    traits: ["Intercepties", "Tackle", "Positionering"],
  },
  aerial_dominant: {
    id: "aerial_dominant", label: "Aerial Dominant", position: ["CB"],
    description: "Dominant in de lucht bij corners en vrije trappen",
    icon: "✈️", color: "#8b5cf6",
    traits: ["Koppen", "Springen", "Kracht"],
  },
  // Backs
  attacking_fullback: {
    id: "attacking_fullback", label: "Attacking Full-Back", position: ["LB", "RB"],
    description: "Gevaarlijk in aanval, maakt overlaps",
    icon: "⚡", color: "#f59e0b",
    traits: ["Snelheid", "Crossing", "Overlappen"],
  },
  defensive_fullback: {
    id: "defensive_fullback", label: "Defensive Full-Back", position: ["LB", "RB"],
    description: "Verdedigende back, solide en betrouwbaar",
    icon: "🛡️", color: "#64748b",
    traits: ["Dekking", "Positiespel", "Discipline"],
  },
  inverted_winger_back: {
    id: "inverted_winger_back", label: "Inverted Winger-Back", position: ["LB", "RB"],
    description: "Snijdt naar binnen, schot van ver",
    icon: "🔄", color: "#ec4899",
    traits: ["Dribbling", "Snijdend lopen", "Schot"],
  },
  // CDM
  destroyer: {
    id: "destroyer", label: "Destroyer", position: ["CDM"],
    description: "Breekt aanvallen af, puur defensief",
    icon: "💥", color: "#ef4444",
    traits: ["Tackle", "Agressie", "Intercepties"],
  },
  deep_lying_playmaker: {
    id: "deep_lying_playmaker", label: "Deep Lying Playmaker", position: ["CDM"],
    description: "Regisseert vanuit de diepte, verdeelt het spel",
    icon: "🧠", color: "#10B981",
    traits: ["Visie", "Passing", "Positiespel"],
  },
  box_to_box: {
    id: "box_to_box", label: "Box-to-Box", position: ["CDM", "CM"],
    description: "Overal op het veld, hoog werktempo",
    icon: "🔋", color: "#f59e0b",
    traits: ["Uithoudingsvermogen", "Balans", "Goals"],
  },
  // CM
  progressive_passer: {
    id: "progressive_passer", label: "Progressive Passer", position: ["CM"],
    description: "Lijn-brekende passes, speelt meters vooruit",
    icon: "📐", color: "#6366f1",
    traits: ["Lange pass", "Visie", "Precisie"],
  },
  engine: {
    id: "engine", label: "The Engine", position: ["CM"],
    description: "Motor van het team, non-stop rennen",
    icon: "⚙️", color: "#f97316",
    traits: ["Hardlopen", "Pressing", "Winnen van ballen"],
  },
  press_master: {
    id: "press_master", label: "Press Master", position: ["CM"],
    description: "Hoog druk zetten, balverovering",
    icon: "🦅", color: "#84cc16",
    traits: ["Pressing", "Sprint", "Anticipatie"],
  },
  // CAM
  classic_ten: {
    id: "classic_ten", label: "Classic 10", position: ["CAM"],
    description: "Traditionele aanvallende middenvelder, creatief hart",
    icon: "🌟", color: "#f59e0b",
    traits: ["Creativiteit", "Schot", "Assist"],
  },
  shadow_striker: {
    id: "shadow_striker", label: "Shadow Striker", position: ["CAM", "SS"],
    description: "Beweegt achter de spits, scoort goals",
    icon: "👤", color: "#a855f7",
    traits: ["Loopacties", "Afwerken", "Timing"],
  },
  creative_hub: {
    id: "creative_hub", label: "Creative Hub", position: ["CAM"],
    description: "Centraal verbindingspunt, maakt ruimte voor anderen",
    icon: "🎨", color: "#10B981",
    traits: ["Dribbelen", "Combinaties", "Visie"],
  },
  // Winger
  pace_dribbler: {
    id: "pace_dribbler", label: "Pace Dribbler", position: ["LW", "RW"],
    description: "Explosieve snelheid en één-op-één skills",
    icon: "🚀", color: "#ef4444",
    traits: ["Sprint", "Dribbelen", "Acties"],
  },
  crossing_winger: {
    id: "crossing_winger", label: "Crossing Winger", position: ["LW", "RW"],
    description: "Speelt breed, geeft gevaarlijke voorzetten",
    icon: "📏", color: "#3b82f6",
    traits: ["Crossing", "Snelheid", "Voorzetten"],
  },
  inverted_forward: {
    id: "inverted_forward", label: "Inverted Forward", position: ["LW", "RW"],
    description: "Snijdt naar binnen, schot op zijn sterkste voet",
    icon: "↙️", color: "#ec4899",
    traits: ["Snijden", "Schot", "Goals"],
  },
  // ST
  target_man: {
    id: "target_man", label: "Target Man", position: ["ST"],
    description: "Referentiepunt, houdt bal vast, hoofd aanvaller",
    icon: "🎯", color: "#f59e0b",
    traits: ["Kracht", "Kopballen", "Rug-naar-doel"],
  },
  poacher: {
    id: "poacher", label: "Poacher", position: ["ST"],
    description: "Goalscorer in de zestien, pikt ballen op",
    icon: "🐆", color: "#ef4444",
    traits: ["Positioning", "Afwerken", "Timing"],
  },
  complete_forward: {
    id: "complete_forward", label: "Complete Forward", position: ["ST"],
    description: "Totaalspits — scoort, assisteert, koppelt druk",
    icon: "💎", color: "#10B981",
    traits: ["Alles", "Leadership", "Impact"],
  },
};

// ============================================================
// SOCIOTYPE META
// ============================================================

export interface SociotypeMeta {
  id: SociotypeName;
  label: string;
  description: string;
  icon: string;
  color: string;
  traits: string[];
  color_hex: string;
}

export const SOCIOTYPES: Record<SociotypeName, SociotypeMeta> = {
  leider: {
    id: "leider", label: "De Leider", description: "Neemt verantwoordelijkheid, motiveert team",
    icon: "👑", color: "text-amber-400", color_hex: "#f59e0b",
    traits: ["Verantwoordelijk", "Motiverend", "Besluitvaardig"],
  },
  strijder: {
    id: "strijder", label: "De Strijder", description: "Vecht altijd door, geeft nooit op",
    icon: "⚔️", color: "text-red-400", color_hex: "#ef4444",
    traits: ["Doorzettingsvermogen", "Intensiteit", "Onverzadigbaar"],
  },
  denker: {
    id: "denker", label: "De Denker", description: "Analyseert, anticipeert, speelt met het hoofd",
    icon: "🧠", color: "text-blue-400", color_hex: "#60a5fa",
    traits: ["Tactisch", "Analytisch", "Strategisch"],
  },
  kunstenaar: {
    id: "kunstenaar", label: "De Kunstenaar", description: "Creatief, technisch, onvoorspelbaar",
    icon: "🎨", color: "text-purple-400", color_hex: "#a855f7",
    traits: ["Creativiteit", "Techniek", "Vrijheid"],
  },
  professional: {
    id: "professional", label: "De Professional", description: "Betrouwbaar, consistent, altijd klaar",
    icon: "💼", color: "text-teal-400", color_hex: "#2dd4bf",
    traits: ["Consistentie", "Discipline", "Betrouwbaarheid"],
  },
  rustbrenger: {
    id: "rustbrenger", label: "De Rustbrenger", description: "Stabiliteit, kalm onder druk, balans",
    icon: "🌊", color: "text-sky-400", color_hex: "#38bdf8",
    traits: ["Kalmte", "Stabiliteit", "Evenwicht"],
  },
  joker: {
    id: "joker", label: "De Joker", description: "Positieve sfeer, ontspanning, groepsdynamiek",
    icon: "🃏", color: "text-green-400", color_hex: "#4ade80",
    traits: ["Humor", "Positiviteit", "Teamcohesie"],
  },
  killer: {
    id: "killer", label: "De Killer", description: "Koud afwerken, mentale hardheid, winnaar",
    icon: "🎯", color: "text-orange-400", color_hex: "#fb923c",
    traits: ["Mentaliteit", "Killerinstinct", "Winnen"],
  },
};

// ============================================================
// DATABASE ENTITIES
// ============================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  club?: string;
  created_at: string;
}

export interface Player {
  id: string;
  profile_id?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  date_of_birth?: string;
  nationality: string;
  position: PositionType;
  secondary_position?: PositionType;
  jersey_number?: number;
  avatar_url?: string;
  overall_rating: number;
  badge?: BadgeType;
  is_active: boolean;
  club?: string;
  team_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerIdentity {
  id: string;
  player_id: string;
  primary_archetype?: ArchetypeType;
  secondary_archetype?: ArchetypeType;
  primary_sociotype?: SociotypeName;
  secondary_sociotype?: SociotypeName;
  core_noodzaak: number;
  core_creativiteit: number;
  core_vertrouwen: number;
  ai_fit_score: number;
  ai_summary?: string;
  last_ai_analysis?: string;
  coach_notes?: string;
}

export interface Evaluation {
  id: string;
  player_id: string;
  coach_id?: string;
  coach_name?: string;
  overall_score?: number;
  notes?: string;
  match_context?: string;
  evaluation_date: string;
  created_at: string;
  scores?: EvaluationScore[];
  assessed_archetype?: ArchetypeType;
  assessed_sociotype?: SociotypeName;
  assessed_position?: PositionType;
}

export interface EvaluationScore {
  id: string;
  evaluation_id: string;
  category: EvaluationCategory;
  score: number;
  sub_notes?: string;
}

export interface Challenge {
  id: string;
  player_id: string;
  coach_id?: string;
  title: string;
  description?: string;
  category?: EvaluationCategory;
  status: ChallengeStatus;
  deadline?: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ENRICHED PLAYER (for UI)
// ============================================================

export interface PlayerWithDetails extends Player {
  identity?: PlayerIdentity;
  evaluations?: Evaluation[];
  challenges?: Challenge[];
  recent_scores?: {
    techniek: number;
    fysiek: number;
    tactiek: number;
    mentaal: number;
    teamplay: number;
  };
  trend?: "up" | "down" | "stable";
}

// ============================================================
// AI ENGINE TYPES
// ============================================================

export interface AIAnalysisInput {
  player: Player;
  evaluations: Evaluation[];
  coach_notes?: string;
}

export interface AIAnalysisOutput {
  archetype: ArchetypeType;
  secondary_archetype?: ArchetypeType;
  primary_sociotype: SociotypeName;
  secondary_sociotype?: SociotypeName;
  core_values: {
    noodzaak: number;
    creativiteit: number;
    vertrouwen: number;
  };
  fit_score: number;
  summary: string;
  reasoning: string;
}

// ============================================================
// UI HELPERS
// ============================================================

export const POSITION_LABELS: Record<PositionType, string> = {
  GK: "Keeper", CB: "Centrale Verdediger", LB: "Linksback", RB: "Rechtsback",
  CDM: "Defensieve Mid.", CM: "Centrale Mid.", CAM: "Aanvallende Mid.",
  LW: "Linkervleugel", RW: "Rechtervleugel", ST: "Spits", SS: "Shadow Striker",
};

export const POSITION_COLORS: Record<PositionType, string> = {
  GK: "#f59e0b", CB: "#3b82f6", LB: "#3b82f6", RB: "#3b82f6",
  CDM: "#84cc16", CM: "#84cc16", CAM: "#a855f7",
  LW: "#ef4444", RW: "#ef4444", ST: "#ef4444", SS: "#f97316",
};

export const BADGE_CONFIG: Record<BadgeType, { label: string; color: string; bg: string }> = {
  elite: { label: "ELITE", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  talent: { label: "TALENT", color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  prospect: { label: "PROSPECT", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  rising_star: { label: "RISING STAR", color: "#ec4899", bg: "rgba(236,72,153,0.15)" },
  veteran: { label: "VETERAN", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
};

export const CATEGORY_LABELS: Record<EvaluationCategory, string> = {
  techniek: "Techniek", fysiek: "Fysiek", tactiek: "Tactiek",
  mentaal: "Mentaal", teamplay: "Teamplay",
};

export const CATEGORY_ICONS: Record<EvaluationCategory, string> = {
  techniek: "TEC", fysiek: "FYS", tactiek: "TAC", mentaal: "MEN", teamplay: "TEA",
};

export const CATEGORY_COLORS: Record<EvaluationCategory, string> = {
  techniek: "#00b891",
  fysiek: "#6366f1",
  tactiek: "#d97706",
  mentaal: "#ef4444",
  teamplay: "#8b5cf6",
};

// ============================================================
// UEFA PRO EVALUATION SCHEMA (subcategories per category)
// ============================================================

export interface SubcategoryDef {
  id: string;
  label: string;
  description: string;
}

export interface CategoryDef {
  id: EvaluationCategory;
  label: string;
  icon: string;
  color: string;
  subcategories: SubcategoryDef[];
}

export const EVALUATION_SCHEMA: CategoryDef[] = [
  {
    id: "techniek",
    label: "Techniek",
    icon: "⚽",
    color: "#00b891",
    subcategories: [
      { id: "korte_pass", label: "Korte pass", description: "Kwaliteit en precisie van korte passes" },
      { id: "lange_pass", label: "Lange pass / Dieptepass", description: "Kwaliteit van lange ballen en dieptepasses" },
      { id: "aanname", label: "Eerste aanname", description: "Balcontrole en aanname kwaliteit" },
      { id: "dribbling", label: "Dribbelen (1v1)", description: "Dribbelvaardigheid in één-op-één situaties" },
      { id: "schot", label: "Schot (kracht & plaatsing)", description: "Schotkwaliteit: kracht, plaatsing en variatie" },
      { id: "kopbal", label: "Kopbal", description: "Kopkwaliteit aanvallend en verdedigend" },
      { id: "zwakke_voet", label: "Zwakke voet", description: "Kwaliteit met zwakkere voet" },
      { id: "standaard", label: "Standaardsituaties", description: "Vrije trappen, corners, inworpen" },
    ],
  },
  {
    id: "fysiek",
    label: "Fysiek",
    icon: "⚡",
    color: "#6366f1",
    subcategories: [
      { id: "sprint", label: "Sprint snelheid", description: "Maximale sprint snelheid over 10–30m" },
      { id: "acceleratie", label: "Acceleratie / Explosiviteit", description: "Eerste stap en explosief vermogen" },
      { id: "uithoudingsvermogen", label: "Uithoudingsvermogen", description: "Vermogen om 90 minuten te presteren" },
      { id: "duelkracht", label: "Duelkracht", description: "Fysieke kracht in één-op-één duels" },
      { id: "sprongkracht", label: "Sprongkracht", description: "Verticaal en horizontaal springvermogen" },
      { id: "wendbaarheid", label: "Wendbaarheid / Coördinatie", description: "Lenigheid, coördinatie en richtingsverandering" },
    ],
  },
  {
    id: "tactiek",
    label: "Tactiek",
    icon: "🧠",
    color: "#d97706",
    subcategories: [
      { id: "positiespel", label: "Positiespel", description: "Positie bij balbezit en balverlies" },
      { id: "spelinzicht", label: "Spelinzicht / Overzicht", description: "Ruimtelijk inzicht en spelbegrip" },
      { id: "loopacties", label: "Loopacties / Aanlopen", description: "Intelligente loopacties zonder bal" },
      { id: "defensief", label: "Defensieve discipline", description: "Positie en discipline bij balverlies" },
      { id: "pressing", label: "Pressing / Duels", description: "Kwaliteit van pressing en duels" },
      { id: "omschakeling", label: "Omschakeling (O↔D)", description: "Snelheid en kwaliteit van omschakeling" },
      { id: "ruimtegebruik", label: "Ruimtegebruik", description: "Creëren en benutten van ruimte" },
    ],
  },
  {
    id: "mentaal",
    label: "Mentaal",
    icon: "🔥",
    color: "#ef4444",
    subcategories: [
      { id: "weerbaarheid", label: "Weerbaarheid", description: "Mentale sterkte na fouten en tegenslagen" },
      { id: "concentratie", label: "Concentratie", description: "Focus gedurende de volledige wedstrijd" },
      { id: "drukbestendigheid", label: "Drukbestendigheid", description: "Presteren onder druk en in sleutelmomenten" },
      { id: "leiderschap", label: "Leiderschap", description: "Aanvoerderskwaliteiten en voorbeeldgedrag" },
      { id: "werkethiek", label: "Werkethiek & Motivatie", description: "Inzet tijdens training en wedstrijd" },
      { id: "discipline", label: "Discipline & Zelfkritiek", description: "Vermogen tot zelfreflectie en aanpassing" },
    ],
  },
  {
    id: "teamplay",
    label: "Teamplay",
    icon: "🤝",
    color: "#8b5cf6",
    subcategories: [
      { id: "communicatie", label: "Communicatie", description: "Verbale en non-verbale communicatie op het veld" },
      { id: "samenwerking", label: "Samenwerking / Teamgeest", description: "Bijdrage aan de teamdynamiek" },
      { id: "coaching", label: "Coachen van medespelers", description: "Begeleiding en ondersteuning van teamgenoten" },
      { id: "pressing_team", label: "Pressing als team", description: "Deelnemen aan georganiseerde teamdruk" },
      { id: "aanpassing", label: "Aanpassingsvermogen", description: "Aanpassen aan tactische wijzigingen" },
      { id: "gedrag", label: "Gedrag & Sportiviteit", description: "Omgang met tegenstanders, scheidsrechter en publiek" },
    ],
  },
];

export const POTENTIAL_LEVELS = [
  { value: "lokaal", label: "Lokaal niveau" },
  { value: "regionaal", label: "Regionaal niveau" },
  { value: "nationaal", label: "Nationaal niveau (Eredivisie / 1e Divisie)" },
  { value: "internationaal", label: "Internationaal niveau (Top competities)" },
  { value: "wereldklasse", label: "Wereldklasse potentieel" },
] as const;

export const OBSERVATION_CONTEXTS = [
  { value: "training", label: "Training" },
  { value: "wedstrijd_thuis", label: "Wedstrijd (thuis)" },
  { value: "wedstrijd_uit", label: "Wedstrijd (uit)" },
  { value: "toernooi", label: "Toernooi" },
  { value: "testwedstrijd", label: "Testwedstrijd / Selectietraining" },
] as const;
