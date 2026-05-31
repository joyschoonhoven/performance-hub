"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Loader2, MapPin, ChevronLeft, ChevronRight, Sparkles, Brain, Target, Zap } from "lucide-react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { POSITION_LABELS } from "@/lib/types";
import type { PlayerWithDetails, PositionType } from "@/lib/types";

/* ─────────────────────────────────────────────────────────
   FOOTBALL FIELD COORDINATES (relative %)
   ───────────────────────────────────────────────────────── */
const POSITION_ZONES: Record<PositionType, { x: number; y: number; w: number; h: number }> = {
  GK:  { x: 50, y: 92, w: 18, h: 14 },
  CB:  { x: 50, y: 78, w: 30, h: 14 },
  LB:  { x: 18, y: 76, w: 16, h: 24 },
  RB:  { x: 82, y: 76, w: 16, h: 24 },
  CDM: { x: 50, y: 60, w: 30, h: 14 },
  CM:  { x: 50, y: 48, w: 36, h: 18 },
  CAM: { x: 50, y: 34, w: 30, h: 14 },
  LW:  { x: 18, y: 26, w: 18, h: 24 },
  RW:  { x: 82, y: 26, w: 18, h: 24 },
  ST:  { x: 50, y: 14, w: 26, h: 14 },
  SS:  { x: 50, y: 22, w: 24, h: 14 },
};

/* ─────────────────────────────────────────────────────────
   POSITION INSIGHT DATA
   sociotypes: leider | strijder | denker | kunstenaar |
               professional | rustbrenger | joker | killer
   ───────────────────────────────────────────────────────── */
interface SociotypeEntry {
  name: string;
  emoji: string;
  fit: string;
  traits: string[];
}

interface InsightSlide {
  type: "info" | "sociotype" | "tip" | "kenmerken";
  label: string;
  icon: string;
  content: string;
  bullets?: string[];
  accent: string;
}

interface PositionInsight {
  description: string;
  zone: string;
  zoneColor: string;
  sociotypes: SociotypeEntry[];
  tips: string[];
  kenmerken: string[];
}

const POSITION_INSIGHTS: Record<PositionType, PositionInsight> = {
  GK: {
    description: "De keeper is de ogen en oren van het team. Jij ziet het hele veld en bepaalt het defensieve ritme.",
    zone: "Verdediging", zoneColor: "#D64045",
    sociotypes: [
      { name: "Leider", emoji: "👑", fit: "Perfecte match", traits: ["Organiseert de achterlinie", "Spreekt de defensie aan", "Neemt risicovolle maar slimme beslissingen"] },
      { name: "Rustbrenger", emoji: "🧘", fit: "Sterke match", traits: ["Uitstraalt rust onder druk", "Stabiel in groot momenten", "Kalmte werkt aanstekelijk op team"] },
      { name: "Professional", emoji: "🎯", fit: "Goede match", traits: ["Consequent in techniek", "Elke training maximaal", "Serieus in voorbereiding"] },
    ],
    tips: [
      "Praat continu — jouw stem organiseert de defensie die jou niet kan zien",
      "Kom uit naar ballen buiten de zestien die jij als enige kunt pakken",
      "Positionering voorkomt 8 van de 10 moeilijke reddingen",
      "Uit handen rollen is bijna altijd beter dan uittrappen — controleer de herstart",
      "Kijk voor elk schot: waar is de aanvaller, waar zijn mijn spelers?",
      "Na een tegendoelpunt — reset mentaal in 10 seconden, ga staan en communiceer",
    ],
    kenmerken: ["Reflexen & reactie", "Ruimtegevoel", "Communicatie", "Kalmte onder druk", "Beslissingssnelheid", "Handenwerk"],
  },
  CB: {
    description: "Als centrale verdediger ben jij de ruggengraat van de defensie. Lucht winnen, lijnen trekken, risico elimineren.",
    zone: "Verdediging", zoneColor: "#D64045",
    sociotypes: [
      { name: "Leider", emoji: "👑", fit: "Perfecte match", traits: ["Trekt verdedigingslijn omhoog/omlaag", "Spreekt aanvallers aan bij corners", "Voert defensief leiderschap uit"] },
      { name: "Strijder", emoji: "⚔️", fit: "Sterke match", traits: ["Duels aangaan zonder aarzelen", "Winnen door intensiteit", "Fysiek dominant aanwezig zijn"] },
      { name: "Professional", emoji: "🎯", fit: "Sterke match", traits: ["Nooit een makkelijk duel verliezen", "Positionering altijd correct", "Discipline in lijn houden"] },
    ],
    tips: [
      "Houd altijd één oog op de aanvaller en één oog op de bal — nooit beide op de bal",
      "Communiceer elke run: 'man achter je', 'jij hebt 'm', 'ik dek af'",
      "Bij twijfel — weg met de bal, veiligheid boven schoonheid",
      "Na een tackle direct opstaan en terugpositie innemen",
      "Leer de voorkeursbeweging van élke aanvaller die je tegenkomt",
      "Verdedigingslijn hoger leggen vergt vertrouwen — bouw dat op in de warming-up",
    ],
    kenmerken: ["Kopduel", "Anticiperen", "Positiespel", "1v1 defensief", "Opbouw kort", "Agressiviteit"],
  },
  LB: {
    description: "Links back combineert verdediging met aanvallend overmacht creëren langs de flank. Atletiek en slim.",
    zone: "Defensief Breed", zoneColor: "#D64045",
    sociotypes: [
      { name: "Strijder", emoji: "⚔️", fit: "Perfecte match", traits: ["Overlappende runs vol doorzetten", "Nooit stoppen met bijdragen aan aanval", "Vecht voor elke meter flankruimte"] },
      { name: "Kunstenaar", emoji: "🎨", fit: "Sterke match", traits: ["Creatieve voorzetten vinden van de flank", "Verrassende aanvalsacties bedenken", "Speelplezier tonen in aanval"] },
      { name: "Joker", emoji: "🃏", fit: "Goede match", traits: ["Onverwacht opduiken in aanval", "Verrassing als wapen gebruiken", "Energie injecteren in ploeg"] },
    ],
    tips: [
      "Jouw diagonale run naar voren is moeilijker te volgen dan een rechte sprint",
      "Als de bal aan de overkant is, trek dan de lijn op — niet blijven staan",
      "Zorg dat je bij balverlies in aanval altijd één stap voor bent op terugdrukken",
      "Communiceer met je vleugelspeler: wie gaat diep, wie blijft aan de bal?",
      "Voorzet laag over de grond naar de tweede paal vindt vaker een speler dan een hoge bal",
      "Durf de 1-2 aan te vragen — backs worden te weinig aangespeeld in kleine ruimtes",
    ],
    kenmerken: ["Snelheid", "Uithouding", "Voorzetten", "1v1 defensief", "Overlopen", "Omschakelen"],
  },
  RB: {
    description: "Rechts back domineert de rechterkant, zowel defensief als aanvallend. Energie en discipline gecombineerd.",
    zone: "Defensief Breed", zoneColor: "#D64045",
    sociotypes: [
      { name: "Strijder", emoji: "⚔️", fit: "Perfecte match", traits: ["Overlappende runs vol doorzetten", "Nooit stoppen met bijdragen aan aanval", "Vecht voor elke meter flankruimte"] },
      { name: "Professional", emoji: "🎯", fit: "Sterke match", traits: ["Defensieve taken nooit vergeten", "Consequent in teruglopen na aanval", "Tactisch bewust van positie"] },
      { name: "Kunstenaar", emoji: "🎨", fit: "Goede match", traits: ["Snelle combinaties langs de flank", "Creatieve voorzetten vinden", "Technisch hoogstaand 1v1"] },
    ],
    tips: [
      "De rechterflank is jouw eigendom — geen bal mag er ongestraft langs",
      "Inverteer naar binnen als ruimte is achter de flankspeler — verras de verdediging",
      "Jouw timing van de overlap bepaalt of je een aangespeelopties bent of niet",
      "Zorg dat je weet waar je winger naartoe gaat voordat je start met overlopen",
      "Snelle combinatie met CM kan een extra man creëren op de flank",
      "Na verlies van de bal: eerste sprint altijd terug naar positie, dan pressen",
    ],
    kenmerken: ["Snelheid", "Voorzetten", "Werklust", "Positiespel", "1v1", "Omschakelen"],
  },
  CDM: {
    description: "Controlerende midfielder filtert aanvallen, wint duels en is de schakel tussen defensie en aanval.",
    zone: "Middenveld", zoneColor: "#4DAEE5",
    sociotypes: [
      { name: "Denker", emoji: "🧠", fit: "Perfecte match", traits: ["Leest het spel drie stappen vooruit", "Positie kiezen is beslissingsprocess", "Minimaliseert risico met juiste keuze"] },
      { name: "Professional", emoji: "🎯", fit: "Sterke match", traits: ["Elke bal wordt gecontroleerd", "Discipline in positie nooit opgeven", "Serieus in kleine details van rol"] },
      { name: "Rustbrenger", emoji: "🧘", fit: "Sterke match", traits: ["Brengt rust als het hectisch wordt", "Vertraagt spel op juiste moment", "Stabiele aanwezigheid in middenveld"] },
    ],
    tips: [
      "Jij bent de scharnier — als jij positie verlaat, schiet het hele systeem tekort",
      "Kijk vóór je de bal krijgt waar de ruimte is en waar de aanval vandaan komt",
      "Horizontale pass is onderschat — verplaats spel en creëer een nieuw aanvalmoment",
      "Interceptie begint niet met het duel maar met de juiste loopweg vóór de pass",
      "Communiceer met je CB's: wie dekt, wie loopt mee, wie pakt de tweede bal",
      "Na balverlies: direct druk zetten op de bal, niet achterom kijken naar ruimte",
    ],
    kenmerken: ["Intercepties", "Duels winnen", "Spelverdelen", "Positionering", "Werklust", "Anticiperen"],
  },
  CM: {
    description: "De centrale motor van het team. Overal opduiken, verbinden en het spel dicteren van binnenuit.",
    zone: "Middenveld", zoneColor: "#4DAEE5",
    sociotypes: [
      { name: "Denker", emoji: "🧠", fit: "Perfecte match", traits: ["Ziet verbanden die anderen missen", "Kiest de slimme pass boven de makkelijke", "Analyseert drukpatronen van tegenstander"] },
      { name: "Leider", emoji: "👑", fit: "Sterke match", traits: ["Dicteert tempo van het spel", "Geeft richtlijn aan ploeggenoten", "Neemt verantwoordelijkheid als het moeilijk wordt"] },
      { name: "Joker", emoji: "🃏", fit: "Goede match", traits: ["Verrast met onverwachte bewegingen", "Energie en creativiteit injecteren", "Dynamisch en adaptief spelen"] },
    ],
    tips: [
      "Wees het ankerpunt — maak jezelf altijd beschikbaar om druk te breken",
      "Jouw derde man-beweging creëert ruimte voor je ploeggenoten, ook als jij de bal niet krijgt",
      "Draai vóór het ontvangen van de bal — zo win je 0.5 seconde op de tegenstander",
      "In druk: vertrouw de korte pass, ga niet 1v1 tenzij je een overduidelijke kans ziet",
      "Kijk altijd eerst diagonaal achter je defensielijn voor je horizontaal speelt",
      "Wissel van flanken in de opbouw — zo verschuif je de defensie",
    ],
    kenmerken: ["Pasnauwkeurigheid", "Werkbereik", "Verdelen", "Dribbelkracht", "Spelinzicht", "Positionering"],
  },
  CAM: {
    description: "Aanvallende middenvelder tussen de linies. Creativiteit en slimme bewegingen om kansen te creëren.",
    zone: "Aanval", zoneColor: "#F0A500",
    sociotypes: [
      { name: "Kunstenaar", emoji: "🎨", fit: "Perfecte match", traits: ["Bedenkt combinaties die anderen niet zien", "Speelt vanuit gevoel en creativiteit", "Techniek is zijn uitdrukkingsvorm"] },
      { name: "Denker", emoji: "🧠", fit: "Sterke match", traits: ["Leest ruimtes tussen de linies", "Dicteert tempo met slimme bewegingen", "Beslissingen baseren op analyse"] },
      { name: "Joker", emoji: "🃏", fit: "Goede match", traits: ["Onvoorspelbaar voor de verdediging", "Energie en creativiteit injecteren", "Verrassing als vaste stijl"] },
    ],
    tips: [
      "Jouw beste positie is de ruimte tussen hun middenveld en defensie — zoek die constant",
      "Laat de bal op je terug komen: zo creëer je ruimte en draai je weg van druk",
      "Goede CAM geeft soms de pass zonder te passen — de dreiging is genoeg",
      "Beweeg altijd als de bal bij anderen is — statische CAM is makkelijk te verdedigen",
      "Wissel je looprichting: dan kunnen twee verdedigers je niet uitspelen",
      "Assist begint bij de eerste beweging zonder bal — niet bij de pass zelf",
    ],
    kenmerken: ["Techniek", "Creativiteit", "Pasvision", "Finishing", "Dribbelen", "Gevoel voor ruimte"],
  },
  LW: {
    description: "Linksbuiten verslaat de rechtsback, creëert diepte en gevaar. Snelheid en lef als kernwapen.",
    zone: "Aanval", zoneColor: "#F0A500",
    sociotypes: [
      { name: "Kunstenaar", emoji: "🎨", fit: "Perfecte match", traits: ["Dribbelen als kunstuiting", "Verrassende actie als standaard", "Speelt op intuïtie en gevoel"] },
      { name: "Strijder", emoji: "⚔️", fit: "Sterke match", traits: ["Geen angst voor de 1v1", "Elke keer opnieuw het duel aangaan", "Frustratie van tegenstander als doel"] },
      { name: "Killer", emoji: "🔪", fit: "Sterke match", traits: ["Afwerking koud en doelgericht", "Geen onnodige passen als kans is", "Instinct voor het juiste moment"] },
    ],
    tips: [
      "Speel altijd naar buiten eerst — trek de rechtsback mee, dan snij naar binnen",
      "Eerste aanraking richting doel, tweede aanraking schot — minder is meer in de zestien",
      "Verander je snelheid: laat de back denken dat je stopt, dan versnellen",
      "Lage voorzet naar de eerste paal is moeilijker te verdedigen dan een hoge bal",
      "Na balverlies: eerst druk op de bal zetten, dan terugsprinten — jij bent de eerste pressing",
      "Vraag om de bal in de voet, draai en versnellen — zo versla je de back",
    ],
    kenmerken: ["Snelheid", "Dribbelen", "1v1 aanvallend", "Voorzetten", "Afwerking", "Diepte zoeken"],
  },
  RW: {
    description: "Rechtsbuiten gebruikt snelheid en techniek om de linksback te verschalken en kansen te leveren.",
    zone: "Aanval", zoneColor: "#F0A500",
    sociotypes: [
      { name: "Kunstenaar", emoji: "🎨", fit: "Perfecte match", traits: ["Dribbelen als kunstuiting", "Verrassende actie als standaard", "Technische creativiteit"] },
      { name: "Joker", emoji: "🃏", fit: "Sterke match", traits: ["Onverwacht opduiken op andere posities", "Energie injecteren in het team", "Creatieve chaos als wapen"] },
      { name: "Killer", emoji: "🔪", fit: "Sterke match", traits: ["Afmaken als de kans komt", "Gedisciplineerd in benutten van kansen", "Koelbloedigheid voor doel"] },
    ],
    tips: [
      "Snij naar binnen op je linkervoet — dat is jouw meest krachtige actie als rechtsbuiten",
      "Verander je startpositie elke actie: soms breed, soms compact — houdt back op het verkeerde been",
      "Als back dichterbij komt, speel één-twee en ga diep — hij kan niet bijhouden",
      "Kruisbeweging met de spits trekt verdedigers mee en maakt ruimte",
      "Hoog tempo dribbelactie + plotseling stoppen = ruimte voor schot of voorzet",
      "Communiceer met rechtsback: jij gaat diep, hij gaat overlappen — of andersom",
    ],
    kenmerken: ["Snelheid", "Techniek", "Finesse", "1v1", "Afwerking links", "Dieptelopers"],
  },
  ST: {
    description: "Spits is de punt van de speer. Kansen afwerken, diepte geven en de verdediging bezig houden.",
    zone: "Aanval", zoneColor: "#F0A500",
    sociotypes: [
      { name: "Killer", emoji: "🔪", fit: "Perfecte match", traits: ["Koud voor doel zonder emotie", "Geen enkel schot overdenken", "Instinct gaat boven analyse in de zestien"] },
      { name: "Strijder", emoji: "⚔️", fit: "Sterke match", traits: ["Backs en backs-verdedigers aanvallen", "Fysiek dominant in duels", "Nooit opgeven bij verdedigers"] },
      { name: "Kunstenaar", emoji: "🎨", fit: "Goede match", traits: ["Technische afwerking als handelsmerk", "Creatieve lobbal of hakbal", "Speciale goals als uiting van klasse"] },
    ],
    tips: [
      "Jouw basispositie is bewegen — stilstaande spitsen zijn makkelijk te verdedigen",
      "Loopbewegingen zonder de bal creëren ruimte voor anderen: ook dat is jouw werk",
      "Eerste aanraking naar de verre paal bij voorzetten — keeper kan nooit bij",
      "Rugdekking geven: ontvangen op je rug en draaien is een vaardigheid, train het",
      "Na een gemiste kans — vergetenisvermogen is de beste eigenschap van een spits",
      "Aanwezig zijn in de tweede paal bij elke voorzet, ook als jij niet de eerste bal krijgt",
    ],
    kenmerken: ["Afwerking", "Positionering", "Instinct", "Kracht/snelheid", "Kopspel", "Rugdekking"],
  },
  SS: {
    description: "Schaduwspits opereert tussen de linies als tweede aanvaller. Onverwacht en gevaarlijk vanuit diepte.",
    zone: "Aanval", zoneColor: "#F0A500",
    sociotypes: [
      { name: "Denker", emoji: "🧠", fit: "Perfecte match", traits: ["Leest wanneer verdediging open valt", "Timing van run is wetenschappelijk", "Positie kiezen op basis van analyse"] },
      { name: "Kunstenaar", emoji: "🎨", fit: "Sterke match", traits: ["Creatieve bewegingen tussen linies", "Technisch hoogstaand in kleine ruimtes", "Onverwachte passes vinden"] },
      { name: "Joker", emoji: "🃏", fit: "Sterke match", traits: ["Opduiken waar niemand verwacht", "Onvoorspelbaarheid als kernkwaliteit", "Verwarring zaaien bij de tegenstander"] },
    ],
    tips: [
      "Jij valt niet te verdedigen als je blijft bewegen — nooit stillstaan",
      "Wacht op de derde man positie: als spits en middenvelder de bal circuleren, loop jij diep",
      "Draai weg van je bewaker in de rug — loop hem langs, niet in zijn gezichtsveld",
      "Timing van de diepteloop: start als de middenvelder al de bal heeft, niet erna",
      "Dubbele-beweging: vraag de bal, loop weg, kom dan terug — zo verlies je je bewaker",
      "Combineer met de spits: één gaat diep, één blijft hoog — afwisselen per situatie",
    ],
    kenmerken: ["Looplijn", "Timing", "Techniek", "Dieptegevoel", "Afwerking", "Creativiteit"],
  },
};

/* ─────────────────────────────────────────────────────────
   BUILD ROTATING SLIDES FROM INSIGHT DATA
   ───────────────────────────────────────────────────────── */
function buildSlides(pos: PositionType): InsightSlide[] {
  const data = POSITION_INSIGHTS[pos];
  const slides: InsightSlide[] = [];

  // Slide 1 — positie info
  slides.push({
    type: "info",
    label: "Over deze positie",
    icon: "📌",
    content: data.description,
    accent: data.zoneColor,
  });

  // Slide 2..N — kenmerken
  slides.push({
    type: "kenmerken",
    label: "Kernkwaliteiten",
    icon: "⚡",
    content: `Wat maakt een goede ${POSITION_LABELS[pos]}?`,
    bullets: data.kenmerken,
    accent: data.zoneColor,
  });

  // Slide per sociotype
  data.sociotypes.forEach((soc) => {
    slides.push({
      type: "sociotype",
      label: `${soc.name} — ${soc.fit}`,
      icon: soc.emoji,
      content: `Als ${soc.name} op ${pos} zijn je karakter­eigenschappen:`,
      bullets: soc.traits,
      accent: data.zoneColor,
    });
  });

  // Tip slides
  data.tips.forEach((tip, i) => {
    slides.push({
      type: "tip",
      label: `Tip ${i + 1} van ${data.tips.length}`,
      icon: "💡",
      content: tip,
      accent: data.zoneColor,
    });
  });

  return slides;
}

/* ─────────────────────────────────────────────────────────
   ROTATING INSIGHTS PANEL
   ───────────────────────────────────────────────────────── */
const SLIDE_DURATION = 4500; // ms per slide

function RotatingInsightsPanel({ position }: { position: PositionType }) {
  const slides = buildSlides(position);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    setVisible(false);
    setTimeout(() => {
      setCurrent((idx + slides.length) % slides.length);
      setVisible(true);
    }, 280);
  };

  const startAuto = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setVisible(true);
      }, 280);
    }, SLIDE_DURATION);
  };

  useEffect(() => {
    startAuto();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  // Reset to 0 when position changes
  useEffect(() => {
    setCurrent(0);
    setVisible(true);
  }, [position]);

  const slide = slides[current];

  const typeColors: Record<InsightSlide["type"], string> = {
    info: "#4DAEE5",
    kenmerken: "#F0A500",
    sociotype: "#A78BFA",
    tip: "#34D399",
  };
  const typeColor = typeColors[slide.type];

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid rgba(${hexToRgb(typeColor)},0.22)`,
      background: `linear-gradient(145deg, rgba(${hexToRgb(typeColor)},0.06) 0%, rgba(0,0,0,0.18) 100%)`,
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 }}>{slide.icon}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            color: typeColor, textTransform: "uppercase",
          }}>
            {slide.type === "info" ? "Positie-info"
              : slide.type === "kenmerken" ? "Kenmerken"
              : slide.type === "sociotype" ? "Sociotype"
              : "Tip"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => { goTo(current - 1); startAuto(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "rgba(255,255,255,0.35)", display: "flex" }}
          >
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", minWidth: 28, textAlign: "center" }}>
            {current + 1}/{slides.length}
          </span>
          <button
            onClick={() => { goTo(current + 1); startAuto(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "rgba(255,255,255,0.35)", display: "flex" }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div style={{
        padding: "14px 16px 16px",
        minHeight: 130,
        transition: "opacity 0.28s ease, transform 0.28s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(4px)",
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
          color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
          marginBottom: 8,
        }}>
          {slide.label}
        </p>

        <p style={{
          fontSize: 12.5,
          color: slide.type === "tip" ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.7)",
          lineHeight: 1.58,
          marginBottom: slide.bullets ? 10 : 0,
          fontStyle: slide.type === "tip" ? "italic" : "normal",
        }}>
          {slide.type === "tip" && (
            <span style={{ color: typeColor, fontStyle: "normal", marginRight: 6 }}>"</span>
          )}
          {slide.content}
          {slide.type === "tip" && (
            <span style={{ color: typeColor, fontStyle: "normal", marginLeft: 4 }}>"</span>
          )}
        </p>

        {slide.bullets && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {slide.bullets.map((b, i) => (
              <li key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                fontSize: 11.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.45,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: typeColor,
                  flexShrink: 0, marginTop: 5,
                }} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
        <div
          key={`${position}-${current}`}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${typeColor}, ${typeColor}88)`,
            borderRadius: 999,
            animation: `slideProgress ${SLIDE_DURATION}ms linear forwards`,
          }}
        />
      </div>

      {/* Dot indicators */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 4, padding: "8px 0 10px",
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); startAuto(); }}
            style={{
              width: i === current ? 14 : 5,
              height: 5,
              borderRadius: 999,
              background: i === current ? typeColor : "rgba(255,255,255,0.18)",
              border: "none", cursor: "pointer", padding: 0,
              transition: "all 0.25s ease",
            }}
          />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      ` }} />
    </div>
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

/* ─────────────────────────────────────────────────────────
   QUICK STATS BAR
   ───────────────────────────────────────────────────────── */
function PositionQuickStats({ pos, data }: { pos: PositionType; data: PositionInsight }) {
  const icons = [<Target key="t" size={11} />, <Brain key="b" size={11} />, <Zap key="z" size={11} />, <Sparkles key="s" size={11} />];
  const cats = data.kenmerken.slice(0, 4);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16,
    }}>
      {cats.map((k, i) => (
        <div key={k} style={{
          padding: "8px 10px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ color: data.zoneColor, opacity: 0.8, flexShrink: 0 }}>{icons[i]}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.2 }}>{k}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────── */
export default function HeatmapPage() {
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
      <div style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#4DAEE5" }} />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-12">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Geen spelersgegevens</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Vul eerst je profiel aan.</p>
        <Link href="/onboarding" className="btn-primary">Naar onboarding</Link>
      </div>
    );
  }

  // Aggregate position counts
  const evals = player.evaluations ?? [];
  const positionCounts: Partial<Record<PositionType, number>> = {};

  evals.forEach(ev => {
    if (ev.assessed_position) {
      const p = ev.assessed_position as PositionType;
      positionCounts[p] = (positionCounts[p] ?? 0) + 1;
    }
  });

  positionCounts[player.position] = (positionCounts[player.position] ?? 0) + 5;
  if (player.secondary_position) {
    positionCounts[player.secondary_position] = (positionCounts[player.secondary_position] ?? 0) + 2;
  }

  const maxCount = Math.max(...Object.values(positionCounts) as number[], 1);
  const ranked = (Object.entries(positionCounts) as [PositionType, number][])
    .sort((a, b) => b[1] - a[1]);

  const primaryInsight = POSITION_INSIGHTS[player.position];

  return (
    <div style={{
      margin: "-28px -28px -40px",
      minHeight: "calc(100vh - 52px)",
      background: "#0A0E14",
      color: "#fff",
      padding: "32px 24px 60px",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1050px) {
          .hm-grid { grid-template-columns: 1fr !important; }
          .hm-sidebar { display: none !important; }
        }
        @media (max-width: 900px) {
          .hm-main-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      ` }} />

      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 10, letterSpacing: "0.14em", fontWeight: 700,
            color: "#4DAEE5", textTransform: "uppercase", marginBottom: 12,
          }}>
            <MapPin size={11} /> Posities · Sterke zones
          </div>
          <h1 style={{
            fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em",
            lineHeight: 1, marginBottom: 8,
          }}>
            Hier ben jij goed
          </h1>
          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.5)",
            lineHeight: 1.55, maxWidth: 580,
          }}>
            Gebaseerd op jouw geregistreerde positie + waar je coach jou observeerde.
            Hoe vaker een zone is gemarkeerd, hoe sterker hij oplicht.
          </p>
        </div>

        {/* 3-col layout: field | ranking | insights */}
        <div className="hm-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px 280px",
          gap: 32,
          alignItems: "start",
        }}>
          {/* ── FIELD ── */}
          <FootballField
            positionCounts={positionCounts}
            maxCount={maxCount}
            primary={player.position}
            secondary={player.secondary_position}
          />

          {/* ── RANKING ── */}
          <aside>
            <SidebarHeader title="Positie Ranking" sub="Posities op basis van invoer" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {ranked.length === 0 ? (
                <EmptyState />
              ) : ranked.map(([pos, count], i) => {
                const isPrimary = pos === player.position;
                const isSecondary = pos === player.secondary_position;
                const intensity = count / maxCount;
                return (
                  <div key={pos} style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: isPrimary ? "rgba(240,165,0,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isPrimary ? "rgba(240,165,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", width: 18 }}>
                      0{i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 14, fontWeight: 700,
                          color: isPrimary ? "#F0A500" : "rgba(255,255,255,0.92)",
                          letterSpacing: "-0.01em",
                        }}>
                          {pos}
                        </span>
                        {isPrimary && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                            padding: "1px 6px", borderRadius: 3,
                            background: "rgba(240,165,0,0.15)", color: "#F0A500",
                            textTransform: "uppercase",
                          }}>Primair</span>
                        )}
                        {isSecondary && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                            padding: "1px 6px", borderRadius: 3,
                            background: "rgba(77,174,229,0.15)", color: "#4DAEE5",
                            textTransform: "uppercase",
                          }}>Secundair</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                        {POSITION_LABELS[pos]}
                      </div>
                      <div style={{ height: 2, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden", marginTop: 8 }}>
                        <div style={{
                          height: "100%", width: `${intensity * 100}%`,
                          background: isPrimary ? "#F0A500" : "#4DAEE5",
                          borderRadius: 999,
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: 14, borderRadius: 10,
              background: "rgba(77,174,229,0.04)",
              border: "1px dashed rgba(77,174,229,0.2)",
              fontSize: 11, lineHeight: 1.55, color: "rgba(255,255,255,0.55)",
            }}>
              <strong style={{ color: "#4DAEE5" }}>Hoe wordt dit gevuld?</strong><br />
              • Jouw primaire + secundaire positie (uit profiel)<br />
              • Elke evaluatie met positie-aanduiding<br />
              • Geen GPS — puur op observatie
            </div>
          </aside>

          {/* ── INSIGHTS PANEL ── */}
          <aside className="hm-sidebar">
            <SidebarHeader
              title={`${player.position} · Inzichten`}
              sub={`${POSITION_LABELS[player.position]} — sociotype & tips`}
            />

            {/* Quick characteristic chips */}
            <PositionQuickStats pos={player.position} data={primaryInsight} />

            {/* Rotating panel */}
            <RotatingInsightsPanel position={player.position} />

            {/* Zone badge */}
            <div style={{
              marginTop: 14,
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: `rgba(${hexToRgb(primaryInsight.zoneColor)},0.08)`,
              border: `1px solid rgba(${hexToRgb(primaryInsight.zoneColor)},0.2)`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: primaryInsight.zoneColor, flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                Zone: <strong style={{ color: primaryInsight.zoneColor }}>{primaryInsight.zone}</strong>
              </span>
              <span style={{
                marginLeft: "auto", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
              }}>
                {player.position}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SHARED COMPONENTS
   ───────────────────────────────────────────────────────── */
function SidebarHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", marginBottom: 4 }}>
        {title}
      </h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{sub}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: "32px 20px", textAlign: "center", borderRadius: 12,
      border: "1px dashed rgba(255,255,255,0.1)",
      color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.55,
    }}>
      Nog geen positie-data.<br />Vraag je coach om de eerste evaluatie.
    </div>
  );
}

function FootballField({
  positionCounts, maxCount, primary, secondary,
}: {
  positionCounts: Partial<Record<PositionType, number>>;
  maxCount: number;
  primary: PositionType;
  secondary?: PositionType;
}) {
  return (
    <div style={{
      position: "relative",
      aspectRatio: "0.65 / 1",
      maxHeight: 720,
      borderRadius: 16,
      overflow: "hidden",
      background: "linear-gradient(180deg, #163e1f 0%, #0e2914 100%)",
      boxShadow: "0 16px 48px rgba(0,0,0,0.3), inset 0 0 80px rgba(0,0,0,0.5)",
    }}>
      <svg
        viewBox="0 0 100 154"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <rect key={i} x={0} y={i * 22} width={100} height={11} fill="rgba(255,255,255,0.02)" />
        ))}
        <rect x={3} y={3} width={94} height={148} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <line x1={3} y1={77} x2={97} y2={77} stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <circle cx={50} cy={77} r={10} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <circle cx={50} cy={77} r={0.7} fill="rgba(255,255,255,0.5)" />
        <rect x={26} y={3} width={48} height={18} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <rect x={38} y={3} width={24} height={7} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <circle cx={50} cy={14} r={0.7} fill="rgba(255,255,255,0.5)" />
        <rect x={26} y={133} width={48} height={18} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <rect x={38} y={144} width={24} height={7} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />
        <circle cx={50} cy={140} r={0.7} fill="rgba(255,255,255,0.5)" />
      </svg>

      {(Object.entries(positionCounts) as [PositionType, number][]).map(([pos, count]) => {
        const zone = POSITION_ZONES[pos];
        if (!zone) return null;
        const intensity = count / maxCount;
        const isPrimary = pos === primary;
        const isSecondary = pos === secondary;
        const color = isPrimary ? "#F0A500" : "#4DAEE5";
        const baseOpacity = isPrimary ? 0.85 : 0.6;
        return (
          <div
            key={pos}
            style={{
              position: "absolute",
              left: `${zone.x - zone.w / 2}%`,
              top: `${zone.y - zone.h / 2}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}${Math.round(intensity * baseOpacity * 100).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
              filter: `blur(${(1 - intensity) * 4}px)`,
            }}
          >
            <div style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: isPrimary ? "rgba(240,165,0,0.95)" : "rgba(13,27,42,0.85)",
              backdropFilter: "blur(10px)",
              border: `1px solid ${isPrimary ? "#F0A500" : "rgba(77,174,229,0.4)"}`,
              fontSize: 11, fontWeight: 700,
              color: isPrimary ? "#0D1B2A" : "#fff",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}>
              {pos}
              {count > 1 && (
                <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.8 }}>×{count}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
