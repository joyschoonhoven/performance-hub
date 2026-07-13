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

/* ── Vragenlijst: stellingen met (on)eens-schaal (−3..+3) ──
   Elke stelling weegt naar één pool; 'eens' telt richting die pool. ── */
export interface MbtiQuestion {
  id: string;
  axis: Axis;
  text: string;   // de stelling
  pole: string;   // pool waar 'helemaal eens' naartoe wijst
}

/** De 'positieve' pool per as (voor scoring). */
export const FIRST_POLE: Record<Axis, string> = { EI: "E", SN: "S", TF: "T", JP: "J" };
export const SECOND_POLE: Record<Axis, string> = { EI: "I", SN: "N", TF: "F", JP: "P" };

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  // ── E / I ──
  { id:"q1",  axis:"EI", pole:"E", text:"Ik krijg energie van drukke, sociale situaties." },
  { id:"q2",  axis:"EI", pole:"E", text:"Ik stap makkelijk op vreemden af en begin een gesprek." },
  { id:"q3",  axis:"EI", pole:"I", text:"Ik voel me vaak een buitenstaander die naar de wereld kijkt." },
  { id:"q4",  axis:"EI", pole:"I", text:"Na veel sociaal contact heb ik tijd alleen nodig om op te laden." },
  { id:"q5",  axis:"EI", pole:"E", text:"In een groep neem ik vaak als eerste het woord." },
  { id:"q6",  axis:"EI", pole:"I", text:"Ik denk het liefst eerst in stilte na voordat ik iets zeg." },
  { id:"q7",  axis:"EI", pole:"I", text:"Ik heb liever een paar diepe vriendschappen dan veel oppervlakkige." },
  { id:"q8",  axis:"EI", pole:"E", text:"Op het veld ben ik de stem die stuurt en aanjaagt." },
  // ── S / N ──
  { id:"q9",  axis:"SN", pole:"N", text:"Ik merk fouten en tegenstrijdigheden op die anderen ontgaan." },
  { id:"q10", axis:"SN", pole:"N", text:"Ik denk vaak na over abstracte ideeën en theorieën." },
  { id:"q11", axis:"SN", pole:"S", text:"Ik vertrouw meer op concrete feiten dan op onderbuikgevoel." },
  { id:"q12", axis:"SN", pole:"N", text:"Ik ben meer bezig met de toekomst en mogelijkheden dan met het hier en nu." },
  { id:"q13", axis:"SN", pole:"S", text:"Ik hou van praktische zaken die direct bruikbaar zijn." },
  { id:"q14", axis:"SN", pole:"N", text:"Ik zie snel verbanden en het grotere geheel." },
  { id:"q15", axis:"SN", pole:"S", text:"Ik werk het liefst met bewezen methodes en duidelijke stappen." },
  { id:"q16", axis:"SN", pole:"N", text:"Ik heb een levendige fantasie en verbeelding." },
  // ── T / F ──
  { id:"q17", axis:"TF", pole:"F", text:"Ik vind het heel bevredigend om anderen met hun persoonlijke problemen te helpen." },
  { id:"q18", axis:"TF", pole:"T", text:"Ik neem beslissingen liever op basis van logica dan op gevoel." },
  { id:"q19", axis:"TF", pole:"F", text:"Ik voel de emoties van anderen sterk met me mee." },
  { id:"q20", axis:"TF", pole:"T", text:"Eerlijkheid is voor mij belangrijker dan iemands gevoelens sparen." },
  { id:"q21", axis:"TF", pole:"F", text:"Harmonie in een groep vind ik belangrijker dan gelijk hebben." },
  { id:"q22", axis:"TF", pole:"T", text:"Ik blijf kalm en objectief, ook in emotionele situaties." },
  { id:"q23", axis:"TF", pole:"F", text:"Kritiek raakt me al snel persoonlijk." },
  { id:"q24", axis:"TF", pole:"T", text:"Ik weeg beslissingen rationeel af, los van wie erbij betrokken is." },
  // ── J / P ──
  { id:"q25", axis:"JP", pole:"J", text:"Ik hou van orde, planning en duidelijke afspraken." },
  { id:"q26", axis:"JP", pole:"P", text:"Ik beslis dingen het liefst op het laatste moment." },
  { id:"q27", axis:"JP", pole:"J", text:"Ik maak een taak graag helemaal af voor ik aan iets nieuws begin." },
  { id:"q28", axis:"JP", pole:"P", text:"Ik voel me vrij als ik mijn opties zo lang mogelijk open kan houden." },
  { id:"q29", axis:"JP", pole:"J", text:"Een strak schema en een vaste routine geven me rust." },
  { id:"q30", axis:"JP", pole:"P", text:"Ik pas me makkelijk aan als plannen op het laatste moment veranderen." },
  { id:"q31", axis:"JP", pole:"J", text:"Ik ben graag ruim op tijd en goed voorbereid." },
  { id:"q32", axis:"JP", pole:"P", text:"Ik werk in vlagen van inspiratie, niet volgens een vast ritme." },
];

/* ── Scoring ──
   answers[id] = agreement van −3 (helemaal oneens) t/m +3 (helemaal eens).
   Per as houden we een signed score bij (+ = FIRST_POLE). Een stelling die
   naar de tweede pool wijst, keert het teken om. ── */
export function scoreMbti(answers: Record<string, number>): { code: MbtiCode; axisScores: Record<Axis, number> } {
  const axisScores: Record<Axis, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  for (const q of MBTI_QUESTIONS) {
    const v = answers[q.id];
    if (v == null) continue;
    axisScores[q.axis] += q.pole === FIRST_POLE[q.axis] ? v : -v;
  }
  const code = (
    (axisScores.EI >= 0 ? FIRST_POLE.EI : SECOND_POLE.EI) +
    (axisScores.SN >= 0 ? FIRST_POLE.SN : SECOND_POLE.SN) +
    (axisScores.TF >= 0 ? FIRST_POLE.TF : SECOND_POLE.TF) +
    (axisScores.JP >= 0 ? FIRST_POLE.JP : SECOND_POLE.JP)
  ) as MbtiCode;
  return { code, axisScores };
}

/* ── Persoonlijkheidsradar ──
   Vertaalt de testscores naar vijf coachbare criteria (0–10).
   Max per as = 8 stellingen × 3 = 24. Zonder opgeslagen scores
   (oudere tests) benaderen we op basis van de vier letters. ── */
export interface PersonalityAxis { label: string; value: number }

const AXIS_MAX = 24;

export function personalityRadar(
  code: MbtiCode,
  axisScores?: Partial<Record<Axis, number>> | null,
): PersonalityAxis[] {
  // pct → 0..10 richting de opgegeven pool
  const toward = (axis: Axis, pole: string): number => {
    const raw = axisScores?.[axis];
    if (raw == null) {
      // fallback: alleen de letter — duidelijk maar niet extreem
      const letter = code[["EI", "SN", "TF", "JP"].indexOf(axis)];
      return letter === pole ? 7 : 4;
    }
    const signed = pole === FIRST_POLE[axis] ? raw : -raw;
    const pct = 0.5 + (signed / AXIS_MAX) * 0.5;           // 0..1
    return Math.round(Math.min(Math.max(pct, 0.08), 0.96) * 100) / 10;
  };

  const E = toward("EI", "E");
  const I = toward("EI", "I");
  const N = toward("SN", "N");
  const T = toward("TF", "T");
  const F = toward("TF", "F");
  const J = toward("JP", "J");

  return [
    { label: "Leiderschap",     value: E },
    { label: "Creativiteit",    value: N },
    { label: "Discipline",      value: J },
    { label: "Teamgevoel",      value: F },
    { label: "Rust onder druk", value: Math.round((T * 6 + I * 4)) / 10 },
  ];
}

/* ── Type-profielen (voetbal-gericht) ── */
/** Elk punt (kracht of valkuil) heeft een gekoppelde concrete handeling/tip. */
export interface MbtiPoint { label: string; tip: string; }
export interface MbtiProfile {
  code: MbtiCode;
  nickname: string;
  icon: string;
  color: string;
  summary: string;
  strengths: MbtiPoint[];   // kracht + hoe je 'm inzet
  pitfalls: MbtiPoint[];    // valkuil + concrete handeling ertegen
}

export const MBTI_PROFILES: Record<MbtiCode, MbtiProfile> = {
  INTJ: { code:"INTJ", nickname:"De Strateeg", icon:"♟️", color:"#6C5CE7", summary:"Denkt in systemen en leest het spel vooruit. Zoekt de meest efficiënte weg naar de winst.",
    strengths:[
      { label:"Leest patronen en anticipeert", tip:"Wijs de ruimte aan vóór de bal komt — stuur je ploeggenoten alvast in." },
      { label:"Neemt onafhankelijk goede beslissingen", tip:"Durf je keuze door te zetten, ook als anderen twijfelen." },
      { label:"Blijft rustig en doelgericht", tip:"Gebruik die rust om het tempo in de opbouw te bepalen." }],
    pitfalls:[
      { label:"Kan te veel in z'n hoofd zitten", tip:"Speel je eerste actie op instinct — niet alles hoeft doordacht." },
      { label:"Onderschat het teamgevoel", tip:"Zoek na een goede actie je ploeggenoot op en vier het samen." },
      { label:"Perfectionisme remt actie", tip:"Neem de simpele pass; een goede keuze nú is beter dan de perfecte te laat." }] },
  INTP: { code:"INTP", nickname:"De Analist", icon:"🧩", color:"#5B8DEF", summary:"Nieuwsgierig en creatief in oplossingen. Wil begrijpen waaróm iets werkt.",
    strengths:[
      { label:"Vindt onorthodoxe oplossingen", tip:"Probeer die verrassende pass in de laatste dertig meter." },
      { label:"Blijft kalm en objectief", tip:"Analyseer bij dood spel de linie en verplaats het spel." },
      { label:"Leert razendsnel nieuwe patronen", tip:"Vraag de coach om nieuwe taken — je pakt ze snel op." }],
    pitfalls:[
      { label:"Twijfelt te lang bij keuzes", tip:"Beslis binnen twee tikken; leg de bal desnoods breed." },
      { label:"Verliest focus zonder uitdaging", tip:"Zet jezelf per fase een klein doel om scherp te blijven." },
      { label:"Communiceert te weinig", tip:"Coach hardop je directe ploeggenoot — één woord is genoeg." }] },
  ENTJ: { code:"ENTJ", nickname:"De Aanvoerder", icon:"👑", color:"#E17055", summary:"Geboren leider die het team stuurt en de lat hoog legt. Wil vooruit, altijd.",
    strengths:[
      { label:"Neemt de leiding en stuurt aan", tip:"Organiseer de pressing: wijs aan wie jaagt en wie dichtknijpt." },
      { label:"Beslist snel en met overtuiging", tip:"Zet je keuzes kracht bij met tempo en lichaamstaal." },
      { label:"Trekt het team mee omhoog", tip:"Loop voorop in de duels — je energie werkt aanstekelijk." }],
    pitfalls:[
      { label:"Kan te dominant worden", tip:"Geef ook eens de bal en het initiatief aan een ander." },
      { label:"Weinig geduld met fouten", tip:"Corrigeer met een schouderklop, niet met gemopper." },
      { label:"Vergeet te luisteren", tip:"Vraag je ploeggenoot wat hij ziet vóór je stuurt." }] },
  ENTP: { code:"ENTP", nickname:"De Vernieuwer", icon:"⚡", color:"#00B894", summary:"Onvoorspelbaar en durft risico's. Zoekt constant de verrassing en de uitdaging.",
    strengths:[
      { label:"Bedenkt creatieve acties", tip:"Zoek de 1-2 of de crosspass om de linie te openen." },
      { label:"Past zich snel aan", tip:"Wissel van tempo en positie om onvoorspelbaar te blijven." },
      { label:"Houdt de tegenstander bezig", tip:"Blijf bewegen tussen de linies en vraag de bal in de ruimte." }],
    pitfalls:[
      { label:"Neemt te veel risico", tip:"Kies in eigen helft de veilige pass; bewaar de trucs voorin." },
      { label:"Raakt verveeld bij routine", tip:"Maak van elke herhaling een mini-wedstrijdje met jezelf." },
      { label:"Maakt dingen niet af", tip:"Rond je actie af — druk door tot de voorzet of het schot." }] },
  INFJ: { code:"INFJ", nickname:"De Visionair", icon:"🌙", color:"#A29BFE", summary:"Rustige denker met een sterk kompas. Voelt aan wat het team nodig heeft.",
    strengths:[
      { label:"Leest mensen en sfeer", tip:"Voel aan wanneer een ploeggenoot een peptalk nodig heeft." },
      { label:"Speelt met visie en overzicht", tip:"Verplaats het spel naar de vrije kant als het vastloopt." },
      { label:"Betrouwbaar onder druk", tip:"Wees het rustpunt: vraag de bal als anderen paniekeren." }],
    pitfalls:[
      { label:"Neemt kritiek persoonlijk", tip:"Zie feedback als info, niet als oordeel — pak er één punt uit." },
      { label:"Cijfert zichzelf te veel weg", tip:"Eis ook eens de bal op en neem zelf de verantwoordelijkheid." },
      { label:"Piekert over fouten", tip:"Reset met een vaste routine: diep ademen, en door." }] },
  INFP: { code:"INFP", nickname:"De Idealist", icon:"🎨", color:"#FD79A8", summary:"Speelt met hart en creativiteit. Bloeit op als het klikt en de sfeer goed is.",
    strengths:[
      { label:"Technisch verfijnd en creatief", tip:"Gebruik je eerste balcontact om meteen ruimte te maken." },
      { label:"Loyaal aan het team", tip:"Wees de ploeggenoot die altijd bijspringt in de omschakeling." },
      { label:"Speelt met passie", tip:"Kanaliseer die passie in je duels en pressing." }],
    pitfalls:[
      { label:"Gevoelig voor kritiek", tip:"Vraag de coach om één concreet verbeterpunt per keer." },
      { label:"Wisselvallig bij tegenslag", tip:"Zet na balverlies meteen een simpele, geslaagde actie neer." },
      { label:"Twijfelt aan zichzelf", tip:"Begin met veilige acties om vertrouwen te tanken." }] },
  ENFJ: { code:"ENFJ", nickname:"De Verbinder", icon:"🤝", color:"#0984E3", summary:"Het sociale hart van het team. Tilt anderen op en houdt de groep samen.",
    strengths:[
      { label:"Motiveert en verbindt", tip:"Coach je linie: geef complimenten en stuur bij." },
      { label:"Communiceert helder", tip:"Roep vroeg en duidelijk waar de ruimte ligt in de opbouw." },
      { label:"Voelt de groep haarfijn aan", tip:"Til een stille ploeggenoot op met een aanmoediging." }],
    pitfalls:[
      { label:"Vergeet zichzelf", tip:"Neem ook je eigen kans — jij mag scoren." },
      { label:"Neemt te veel op zich", tip:"Verdeel taken; je hoeft niet elk gat te dichten." },
      { label:"Vermijdt confrontatie", tip:"Durf een ploeggenoot direct aan te spreken als het moet." }] },
  ENFP: { code:"ENFP", nickname:"De Aanjager", icon:"🔥", color:"#E84393", summary:"Bruisende energie en spontaniteit. Zet het team en de wedstrijd in vuur en vlam.",
    strengths:[
      { label:"Aanstekelijke energie", tip:"Zet de toon in de eerste minuten met fel druk zetten." },
      { label:"Creatief en spontaan", tip:"Zoek de dribbel of de diepe loop op het juiste moment." },
      { label:"Motiveert het hele team", tip:"Vier elke goede actie luid — het team veert mee." }],
    pitfalls:[
      { label:"Verliest focus", tip:"Herpak je concentratie bij elk dood spelmoment." },
      { label:"Wisselende vorm", tip:"Begin met eenvoudige acties tot je in de wedstrijd zit." },
      { label:"Moeite met routine en discipline", tip:"Houd je aan je positionele taak, ook zonder bal." }] },
  ISTJ: { code:"ISTJ", nickname:"De Betrouwbare", icon:"🛡️", color:"#636E72", summary:"Consistent, gedisciplineerd en altijd op z'n post. Op wie je kunt bouwen.",
    strengths:[
      { label:"Uiterst consistent", tip:"Wees het baken: doe je taak, wedstrijd na wedstrijd." },
      { label:"Gedisciplineerd en positioneel", tip:"Houd de linie strak; laat je niet uit positie lokken." },
      { label:"Doet altijd z'n taak", tip:"Neem de rustige, veilige pass om het spel te laten lopen." }],
    pitfalls:[
      { label:"Star bij verandering", tip:"Oefen bewust één nieuwe actie per training." },
      { label:"Weinig improvisatie", tip:"Durf in de laatste zone eens af te wijken van het boekje." },
      { label:"Toont weinig emotie", tip:"Moedig je ploeggenoten hardop aan — ook jij mag sturen." }] },
  ISFJ: { code:"ISFJ", nickname:"De Beschermer", icon:"🧱", color:"#00CEC9", summary:"Onbaatzuchtige teamspeler die de boel afdekt. Werkt hard, zonder show.",
    strengths:[
      { label:"Onvermoeibare werker", tip:"Blijf de loopacties maken die de ploeg laten draaien." },
      { label:"Dekt ploeggenoten af", tip:"Schuif automatisch bij als je maat naar voren gaat." },
      { label:"Betrouwbaar en loyaal", tip:"Wees het aanspeelpunt dat de bal veilig rondtikt." }],
    pitfalls:[
      { label:"Cijfert zichzelf weg", tip:"Vraag ook eens zelf de bal in de aanval." },
      { label:"Vermijdt de spotlight", tip:"Durf de kans te nemen als je 'm krijgt." },
      { label:"Kropt frustratie op", tip:"Zeg het meteen als iets niet lekker loopt." }] },
  ESTJ: { code:"ESTJ", nickname:"De Organisator", icon:"📋", color:"#D63031", summary:"Structuur en discipline. Houdt de linie op orde en zegt waar het op staat.",
    strengths:[
      { label:"Organiseert de ploeg", tip:"Zet de defensie op de juiste lijn bij standaardsituaties." },
      { label:"Neemt verantwoordelijkheid", tip:"Wees de speler die de bal opeist in lastige fases." },
      { label:"Duidelijk en direct", tip:"Geef korte, heldere commando's in de opbouw." }],
    pitfalls:[
      { label:"Kan te streng zijn", tip:"Corrigeer met een aanmoediging erbij, niet alleen kritiek." },
      { label:"Weinig flexibel", tip:"Sta open voor een creatieve oplossing van een ploeggenoot." },
      { label:"Ongeduldig met chaos", tip:"Adem, vertraag het spel en herpak de structuur." }] },
  ESFJ: { code:"ESFJ", nickname:"De Teamspeler", icon:"💛", color:"#FDCB6E", summary:"Warm en betrokken, de lijm van de groep. Zorgt dat iedereen erbij hoort.",
    strengths:[
      { label:"Bindende factor", tip:"Houd de groep scherp met positieve energie." },
      { label:"Harde werker voor het team", tip:"Loop de gaten dicht in de omschakeling." },
      { label:"Positieve sfeermaker", tip:"Til een ploeggenoot op na een foutje." }],
    pitfalls:[
      { label:"Te afhankelijk van waardering", tip:"Speel je eigen spel, ook zonder complimenten." },
      { label:"Vermijdt conflict", tip:"Spreek je uit als een afspraak niet wordt nagekomen." },
      { label:"Gevoelig voor kritiek", tip:"Pak uit feedback één ding om aan te werken." }] },
  ISTP: { code:"ISTP", nickname:"De Vakman", icon:"🔧", color:"#2D3436", summary:"Koel, technisch en effectief. Lost het op het moment zelf op, zonder poespas.",
    strengths:[
      { label:"IJzig kalm onder druk", tip:"Gebruik je rust om de bal uit de druk te dribbelen." },
      { label:"Technisch en efficiënt", tip:"Kies de effectieve actie: één tik, klaar." },
      { label:"Reageert snel en pragmatisch", tip:"Anticipeer op de tweede bal — jij bent er als eerste." }],
    pitfalls:[
      { label:"Communiceert weinig", tip:"Roep kort naar je maat: 'los', 'man', 'tijd'." },
      { label:"Kan afhaken bij routine", tip:"Daag jezelf uit met een doel per oefening." },
      { label:"Neemt soms te veel risico", tip:"In eigen zestien: veiligheid eerst, geen trucs." }] },
  ISFP: { code:"ISFP", nickname:"De Kunstenaar", icon:"🎭", color:"#FF7675", summary:"Speelt op gevoel en intuïtie. Verrast met techniek en flair als hij vrij is.",
    strengths:[
      { label:"Creatief en technisch", tip:"Gebruik je dribbel om de 1-tegen-1 te winnen." },
      { label:"Intuïtief spelinzicht", tip:"Vertrouw op je gevoel voor de juiste loopactie." },
      { label:"Kalm en bescheiden", tip:"Blijf rustig aan de bal, ook onder druk." }],
    pitfalls:[
      { label:"Wisselvallig", tip:"Bouw je wedstrijd op met simpele, geslaagde acties." },
      { label:"Vermijdt de leiding", tip:"Neem in de aanval zelf het initiatief." },
      { label:"Gevoelig voor sfeer", tip:"Focus op je eigen taak, los van de omgeving." }] },
  ESTP: { code:"ESTP", nickname:"De Durfal", icon:"🎯", color:"#FDCB6E", summary:"Lef, actie en instinct. Bloeit op in het heetst van de strijd en pakt z'n moment.",
    strengths:[
      { label:"Koelbloedig in de beslissende actie", tip:"Blijf kalm voor de goal en kies bewust je hoek." },
      { label:"Reageert razendsnel", tip:"Anticipeer op balverlies en schakel meteen om." },
      { label:"Durft en pakt risico", tip:"Ga de dribbel aan in de laatste dertig meter." }],
    pitfalls:[
      { label:"Te impulsief", tip:"Speel de bal ook eens rustig achteruit om het spel te vertragen." },
      { label:"Ongeduldig", tip:"Wacht op het juiste moment i.p.v. de actie te forceren." },
      { label:"Moeite met discipline", tip:"Houd je aan je defensieve taak, ook als het saai is." }] },
  ESFP: { code:"ESFP", nickname:"De Entertainer", icon:"✨", color:"#E84393", summary:"Show, energie en plezier. Speelt vrij en steekt het publiek en team aan.",
    strengths:[
      { label:"Speelt vrij en met flair", tip:"Gebruik je techniek om de 1-tegen-1 te zoeken." },
      { label:"Aanstekelijke energie", tip:"Zet de toon met fel druk zetten vanaf de eerste minuut." },
      { label:"Presteert op grote momenten", tip:"Zoek de bal op als het spannend wordt." }],
    pitfalls:[
      { label:"Verliest concentratie", tip:"Herpak je focus bij elk dood spelmoment." },
      { label:"Houdt niet van kritiek", tip:"Zie feedback als hulp om nog beter te worden." },
      { label:"Wisselende inzet", tip:"Houd je defensieve loopacties vol, ook zonder bal." }] },
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
