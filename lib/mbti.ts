// ============================================================
//  MBTI voor voetballers — vragenlijst, scoring, type-profielen
//  en situationele cues (onder druk / in balbezit / verdedigend …)
// ============================================================

export type Axis = "EI" | "SN" | "TF" | "JP";
export type MbtiCode =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

/* ── Vragenlijst: forced-choice, elke keuze telt voor één pool ── */
export interface MbtiQuestion {
  id: string;
  axis: Axis;
  a: { text: string; pole: string };   // pole = één letter
  b: { text: string; pole: string };
}

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  // E / I
  { id: "q1",  axis: "EI", a: { text: "Ik krijg energie van de groep en praat veel op het veld.", pole: "E" }, b: { text: "Ik laad op in mijn eigen focus en houd het rustig.", pole: "I" } },
  { id: "q2",  axis: "EI", a: { text: "Ik zoek meteen contact en neem het voortouw in de kleedkamer.", pole: "E" }, b: { text: "Ik kijk eerst de kat uit de boom voor ik me laat horen.", pole: "I" } },
  { id: "q3",  axis: "EI", a: { text: "Na een wedstrijd wil ik napraten met het team.", pole: "E" }, b: { text: "Na een wedstrijd verwerk ik het liever voor mezelf.", pole: "I" } },
  { id: "q4",  axis: "EI", a: { text: "Ik denk hardop en stuur anderen aan tijdens het spel.", pole: "E" }, b: { text: "Ik denk van binnen en leid vooral door mijn acties.", pole: "I" } },
  // S / N
  { id: "q5",  axis: "SN", a: { text: "Ik vertrouw op wat ik concreet zie en de vaste patronen.", pole: "S" }, b: { text: "Ik zie kansen en mogelijkheden die er nog niet zijn.", pole: "N" } },
  { id: "q6",  axis: "SN", a: { text: "Ik werk stap voor stap en houd van duidelijke afspraken.", pole: "S" }, b: { text: "Ik improviseer graag en zoek de verrassende oplossing.", pole: "N" } },
  { id: "q7",  axis: "SN", a: { text: "Details en uitvoering: daar draait het om.", pole: "S" }, b: { text: "Het grote plaatje en het idee erachter boeien me het meest.", pole: "N" } },
  { id: "q8",  axis: "SN", a: { text: "Ik onthoud vooral feiten en wat er precies gebeurde.", pole: "S" }, b: { text: "Ik onthoud vooral het gevoel en de betekenis van een moment.", pole: "N" } },
  // T / F
  { id: "q9",  axis: "TF", a: { text: "Beslissingen neem ik koel en rationeel, op basis van logica.", pole: "T" }, b: { text: "Beslissingen neem ik op gevoel en wat goed is voor de groep.", pole: "F" } },
  { id: "q10", axis: "TF", a: { text: "Eerlijke, directe kritiek helpt me het meest.", pole: "T" }, b: { text: "Ik heb waardering en steun nodig om te groeien.", pole: "F" } },
  { id: "q11", axis: "TF", a: { text: "Ik blijf zakelijk, ook als het emotioneel wordt.", pole: "T" }, b: { text: "Ik voel de sfeer in het team sterk aan en pas me aan.", pole: "F" } },
  { id: "q12", axis: "TF", a: { text: "Winnen gaat vóór aardig gevonden worden.", pole: "T" }, b: { text: "Een goede teamsfeer is voor mij net zo belangrijk als winnen.", pole: "F" } },
  // J / P
  { id: "q13", axis: "JP", a: { text: "Ik hou van een vast plan en structuur voor de wedstrijd.", pole: "J" }, b: { text: "Ik speel het liefst op gevoel en zie wel wat er komt.", pole: "P" } },
  { id: "q14", axis: "JP", a: { text: "Ik ben graag op tijd en goed voorbereid.", pole: "J" }, b: { text: "Ik ben flexibel en beslis het liefst op het laatste moment.", pole: "P" } },
  { id: "q15", axis: "JP", a: { text: "Duidelijke taken en afspraken geven me rust.", pole: "J" }, b: { text: "Te veel regels benauwen me; ik wil ruimte om te improviseren.", pole: "P" } },
  { id: "q16", axis: "JP", a: { text: "Ik werk taken graag af en maak dingen netjes af.", pole: "J" }, b: { text: "Ik hou opties open en spring van het één naar het ander.", pole: "P" } },
];

/* ── Scoring ── */
export function scoreMbti(answers: Record<string, "a" | "b">): { code: MbtiCode; scores: Record<string, number> } {
  const tally: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  for (const q of MBTI_QUESTIONS) {
    const choice = answers[q.id];
    if (!choice) continue;
    const pole = choice === "a" ? q.a.pole : q.b.pole;
    tally[pole]++;
  }
  const code = (
    (tally.E >= tally.I ? "E" : "I") +
    (tally.S >= tally.N ? "S" : "N") +
    (tally.T >= tally.F ? "T" : "F") +
    (tally.J >= tally.P ? "J" : "P")
  ) as MbtiCode;
  return { code, scores: tally };
}

/* ── Type-profielen (voetbal-gericht) ── */
export interface MbtiProfile {
  code: MbtiCode;
  nickname: string;
  icon: string;
  color: string;
  summary: string;
  strengths: string[];   // handelingen / vaardigheden
  pitfalls: string[];    // valkuilen
}

export const MBTI_PROFILES: Record<MbtiCode, MbtiProfile> = {
  INTJ: { code:"INTJ", nickname:"De Strateeg", icon:"♟️", color:"#6C5CE7", summary:"Denkt in systemen en leest het spel vooruit. Zoekt de meest efficiënte weg naar de winst.",
    strengths:["Leest patronen en anticipeert","Neemt onafhankelijk goede beslissingen","Blijft rustig en doelgericht"],
    pitfalls:["Kan te veel in z'n hoofd zitten","Onderschat het teamgevoel","Perfectionisme remt actie"] },
  INTP: { code:"INTP", nickname:"De Analist", icon:"🧩", color:"#5B8DEF", summary:"Nieuwsgierig en creatief in oplossingen. Wil begrijpen waaróm iets werkt.",
    strengths:["Vindt onorthodoxe oplossingen","Blijft kalm en objectief","Leert razendsnel nieuwe patronen"],
    pitfalls:["Twijfelt te lang bij keuzes","Verliest focus zonder uitdaging","Communiceert te weinig"] },
  ENTJ: { code:"ENTJ", nickname:"De Aanvoerder", icon:"👑", color:"#E17055", summary:"Geboren leider die het team stuurt en de lat hoog legt. Wil vooruit, altijd.",
    strengths:["Neemt de leiding en stuurt aan","Beslist snel en met overtuiging","Trekt het team mee omhoog"],
    pitfalls:["Kan te dominant worden","Weinig geduld met fouten","Vergeet te luisteren"] },
  ENTP: { code:"ENTP", nickname:"De Vernieuwer", icon:"⚡", color:"#00B894", summary:"Onvoorspelbaar en durft risico's. Zoekt constant de verrassing en de uitdaging.",
    strengths:["Bedenkt creatieve acties","Past zich snel aan","Houdt de tegenstander bezig"],
    pitfalls:["Neemt te veel risico","Raakt verveeld bij routine","Maakt dingen niet af"] },
  INFJ: { code:"INFJ", nickname:"De Visionair", icon:"🌙", color:"#A29BFE", summary:"Rustige denker met een sterk kompas. Voelt aan wat het team nodig heeft.",
    strengths:["Leest mensen en sfeer","Speelt met visie en overzicht","Betrouwbaar onder druk"],
    pitfalls:["Neemt kritiek persoonlijk","Cijfert zichzelf te veel weg","Piekert over fouten"] },
  INFP: { code:"INFP", nickname:"De Idealist", icon:"🎨", color:"#FD79A8", summary:"Speelt met hart en creativiteit. Bloeit op als het klikt en de sfeer goed is.",
    strengths:["Technisch verfijnd en creatief","Loyaal aan het team","Speelt met passie"],
    pitfalls:["Gevoelig voor kritiek","Wisselvallig bij tegenslag","Twijfelt aan zichzelf"] },
  ENFJ: { code:"ENFJ", nickname:"De Verbinder", icon:"🤝", color:"#0984E3", summary:"Het sociale hart van het team. Tilt anderen op en houdt de groep samen.",
    strengths:["Motiveert en verbindt","Communiceert helder","Voelt de groep haarfijn aan"],
    pitfalls:["Vergeet zichzelf","Neemt te veel op zich","Vermijdt confrontatie"] },
  ENFP: { code:"ENFP", nickname:"De Aanjager", icon:"🔥", color:"#E84393", summary:"Bruisende energie en spontaniteit. Zet het team en de wedstrijd in vuur en vlam.",
    strengths:["Aanstekelijke energie","Creatief en spontaan","Motiveert het hele team"],
    pitfalls:["Verliest focus","Wisselende vorm","Moeite met routine en discipline"] },
  ISTJ: { code:"ISTJ", nickname:"De Betrouwbare", icon:"🛡️", color:"#636E72", summary:"Consistent, gedisciplineerd en altijd op z'n post. Op wie je kunt bouwen.",
    strengths:["Uiterst consistent","Gedisciplineerd en positioneel","Doet altijd z'n taak"],
    pitfalls:["Star bij verandering","Weinig improvisatie","Toont weinig emotie"] },
  ISFJ: { code:"ISFJ", nickname:"De Beschermer", icon:"🧱", color:"#00CEC9", summary:"Onbaatzuchtige teamspeler die de boel afdekt. Werkt hard, zonder show.",
    strengths:["Onvermoeibare werker","Dekt ploeggenoten af","Betrouwbaar en loyaal"],
    pitfalls:["Cijfert zichzelf weg","Vermijdt de spotlight","Kropt frustratie op"] },
  ESTJ: { code:"ESTJ", nickname:"De Organisator", icon:"📋", color:"#D63031", summary:"Structuur en discipline. Houdt de linie op orde en zegt waar het op staat.",
    strengths:["Organiseert de ploeg","Neemt verantwoordelijkheid","Duidelijk en direct"],
    pitfalls:["Kan te streng zijn","Weinig flexibel","Ongeduldig met chaos"] },
  ESFJ: { code:"ESFJ", nickname:"De Teamspeler", icon:"💛", color:"#FDCB6E", summary:"Warm en betrokken, de lijm van de groep. Zorgt dat iedereen erbij hoort.",
    strengths:["Bindende factor","Harde werker voor het team","Positieve sfeermaker"],
    pitfalls:["Te afhankelijk van waardering","Vermijdt conflict","Gevoelig voor kritiek"] },
  ISTP: { code:"ISTP", nickname:"De Vakman", icon:"🔧", color:"#2D3436", summary:"Koel, technisch en effectief. Lost het op het moment zelf op, zonder poespas.",
    strengths:["IJzig kalm onder druk","Technisch en efficiënt","Reageert snel en pragmatisch"],
    pitfalls:["Communiceert weinig","Kan afhaken bij routine","Neemt soms te veel risico"] },
  ISFP: { code:"ISFP", nickname:"De Kunstenaar", icon:"🎭", color:"#FF7675", summary:"Speelt op gevoel en intuïtie. Verrast met techniek en flair als hij vrij is.",
    strengths:["Creatief en technisch","Intuïtief spelinzicht","Kalm en bescheiden"],
    pitfalls:["Wisselvallig","Vermijdt de leiding","Gevoelig voor sfeer"] },
  ESTP: { code:"ESTP", nickname:"De Durfal", icon:"🎯", color:"#FDCB6E", summary:"Lef, actie en instinct. Bloeit op in het heetst van de strijd en pakt z'n moment.",
    strengths:["Koelbloedig in de beslissende actie","Reageert razendsnel","Durft en pakt risico"],
    pitfalls:["Te impulsief","Ongeduldig","Moeite met discipline"] },
  ESFP: { code:"ESFP", nickname:"De Entertainer", icon:"✨", color:"#E84393", summary:"Show, energie en plezier. Speelt vrij en steekt het publiek en team aan.",
    strengths:["Speelt vrij en met flair","Aanstekelijke energie","Presteert op grote momenten"],
    pitfalls:["Verliest concentratie","Houdt niet van kritiek","Wisselende inzet"] },
};

/* ── Situationele cues — afgeleid van de 4 letters ── */
export interface SituationCue { situation: string; icon: string; trait: string; }

export function situationalCues(code: MbtiCode): SituationCue[] {
  const [ei, sn, tf, jp] = code.split("");
  return [
    {
      situation: "Onder druk", icon: "🔥",
      trait: jp === "P"
        ? "ben je intuïtief sterk — je leest het moment en past je flexibel aan."
        : "val je terug op structuur en discipline — je houdt vast aan het plan.",
    },
    {
      situation: "In balbezit", icon: "⚽",
      trait: sn === "N"
        ? "ben je creatief en onvoorspelbaar — je zoekt de verrassende pass of actie."
        : "ben je doelgericht en concreet — je kiest de sterke, betrouwbare optie.",
    },
    {
      situation: "Verdedigend", icon: "🛡️",
      trait: jp === "J"
        ? "sta je gedisciplineerd en positioneel — je houdt je taak strak vast."
        : "ben je reactief en gokt op de interceptie — je leest de tegenstander.",
    },
    {
      situation: "Als leider", icon: "👑",
      trait: ei === "E"
        ? "stuur je hardop aan — je bent de stem op het veld."
        : "leid je door het voorbeeld — rustig, zeker, met je acties.",
    },
    {
      situation: "Bij tegenslag", icon: "💪",
      trait: tf === "T"
        ? "analyseer je koel en past je aan — emotie zet je opzij."
        : "haal je kracht uit het team — support en sfeer tillen je op.",
    },
  ];
}
