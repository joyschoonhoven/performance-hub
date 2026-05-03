"use client";

import { useState, useEffect, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMyPlayerData, getAllPlayers } from "@/lib/supabase/queries";
import { ARCHETYPES, SOCIOTYPES, POSITION_LABELS, CATEGORY_LABELS, EVALUATION_SCHEMA } from "@/lib/types";
import type { ArchetypeType, SociotypeName } from "@/lib/types";
import { getRatingColor, getRatingLabel, getAge, formatDate, getScoreColor } from "@/lib/utils";
import {
  Loader2, Settings, Sparkles, Camera, Wand2, Map, Brain,
  ChevronRight, ShieldAlert, BarChart3, Activity, Zap,
} from "lucide-react";
import type { PlayerWithDetails } from "@/lib/types";
import { SOCIOTYPE_ICONS } from "@/components/PlayerTypeHero";
import { AvatarUpload } from "@/components/AvatarUpload";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { PlayerComparisonChart } from "@/components/charts/PlayerComparisonChart";
import { InjuryBodyMap, type BodyRegion, type DominantFoot } from "@/components/InjuryBodyMap";
import { DUTCH_CLUBS } from "@/lib/dutch-clubs";

/* ─── Data Maps ───────────────────────────────────────────────── */

const ARCHETYPE_TIPS: Partial<Record<ArchetypeType, string[]>> = {
  sweeper_keeper: ["Train je distributie — initieer aanvallen met korte én lange pass", "Communiceer constant met je defensie over positie en dieptelijn", "Werk aan je één-op-één reddingen buiten de zestien"],
  command_keeper: ["Domineer je zestien — claimen is jouw verantwoordelijkheid", "Organiseer de defensie actief bij elke standaardsituatie", "Train je kopspel en positionering bij corners"],
  shot_stopper: ["Train je reflexen dagelijks met reactie-oefeningen", "Bestudeer schietpatronen van tegenstanders", "Focus op je positie — elke redding begint met de juiste stand"],
  ball_playing_cb: ["Oefen de lijnbrekende pass wekelijks onder druk", "Wees het rustpunt bij opbouw — jij initieert het spel", "Train je twee-voetigheid zodat je altijd een uitweg hebt"],
  defensive_blocker: ["Positionering gaat boven alles — lees het spel één stap voor", "Train je timing van tackling zodat je nooit te vroeg ingaat", "Bestudeer de bewegingen van je directe tegenstander vóór de wedstrijd"],
  aerial_dominant: ["Train je sprongkracht en koptechniek tweemaal per week", "Positioneer bij corners altijd op de gevaarlijkste plek", "Versterk je romp en nekspieren voor meer krachtkopballen"],
  attacking_fullback: ["Maak vroege overlaps aan — timing met je vleugelaanvaller is alles", "Train je crossing zodat voorzetten direct gevaarlijk zijn", "Zorg dat je terugloopsnelheid net zo hoog is als je aanloopsnelheid"],
  defensive_fullback: ["Focus op je 1-op-1 verdediging — goed positioneren is de eerste stap", "Communiceer constant met je centrale verdediger over bezetting", "Bouw je aanvalsbijdrage stap voor stap op"],
  inverted_winger_back: ["Train je schot intensief op je sterkste voet — dat is jouw wapen", "Werk aan je snijdende loopacties om verdedigers te passeren", "Verras tegenstanders door te wisselen tussen buiten en snijden"],
  destroyer: ["Train je anticipatie — het gaat om het voorkomen van kansen", "Timing van je tackle is cruciaal — wacht op het juiste moment", "Wees agressief maar altijd gecontroleerd"],
  deep_lying_playmaker: ["Scan continu je omgeving — kijk minstens 3x per 10 seconden", "Train zowel de korte combinatie als de lange lijnbrekende pass", "Wees het rustpunt van je team: ontvang, verdeel, creëer tempo"],
  box_to_box: ["Train je uithoudingsvermogen intensief — je moet 90 minuten overal zijn", "Wees versatiel: zowel verdedigend als aanvallend een bedreiging", "Kies je looproutes slim — energie is je kapitaal"],
  progressive_passer: ["Zie de lijnbrekende pas als je primaire wapen", "Train je pass-precisie op 25-40 meter onder wedstrijddruk", "Scan voor ontvangst altijd de dieptelopers"],
  engine: ["Train je conditie intensief — jij kan meer lopen dan anderen", "Wees overal aanwezig maar kies je pressing momenten slim", "Herstel actief tussen inspanningen — tempo hoog houden is jouw taak"],
  press_master: ["Train pressing in groepsverband — het werkt alleen samen", "Communiceer je pressing-triggers aan teamgenoten", "Herstel mentaal en fysiek razendsnel na balverlies"],
  classic_ten: ["Creëer ruimte door slim te bewegen vóór ontvangst", "Train je schot — een 10 die ook scoort is onhoudbaar", "Wees de dirigent van het team: communiceer je visie constant"],
  shadow_striker: ["Beweeg slim achter de spits — timing van je aanloop is alles", "Train je afwerken in kleine ruimtes met weinig aanlooptijd", "Verras met variatie: soms achterin bewegen om diep te gaan"],
  creative_hub: ["Zoek positie tussen de linies — jij bent de verbinding", "Train je twee-voetigheid zodat je altijd een oplossing hebt", "Gebruik combinaties en snelle wisselingen om tegenstanders te breken"],
  pace_dribbler: ["Train je eerste aanzet — die bepaalt of je een verdediger passeert", "Werk aan je eindproduct: voorzet óf schot, altijd gevaarlijk", "Gebruik je snelheid ook zonder bal — loopacties creëren ruimte"],
  crossing_winger: ["Train je crossing met beide voeten onder tijdsdruk", "Communiceer met je spits: wanneer vlak, wanneer in de rug?", "Zoek de ruimte achter de back — dat is het gevaarlijkste gebied"],
  inverted_forward: ["Train je schot intensief op je sterkste voet — jij bent finisher", "Leer te snijden op topsnelheid zonder vaart te verliezen", "Gebruik je buitenkant ook — onvoorspelbaarheid is je kracht"],
  target_man: ["Train je rug-naar-doel spel met lichaamsbescherming", "Gebruik je lichaam als schild — creëer ruimte voor medespelers", "Train je kopkracht en timing bij lange ballen"],
  poacher: ["Positioneer jezelf altijd op de verwachte rebound-plek", "Train je afwerking dagelijks — ook met de zwakke voet", "Wees geduldig en explosief tegelijk — jouw kans komt altijd"],
  complete_forward: ["Verbreed je spel constant — werk aan het zwakste aspect", "Wees leider in de aanvalslinie — inspireer met je werkethiek", "Combineer goals, assists en druk — jij bepaalt het aanvalstempo"],
};

const ARCHETYPE_PITCH_ROLE: Partial<Record<ArchetypeType, string>> = {
  sweeper_keeper: "Jij bent de uitvoetende keeper die het aanvalsspel initieert. De eerste schakel in opbouw.",
  command_keeper: "Jij bent de baas van je strafschopgebied. Een echte leider achterin.",
  shot_stopper: "Jij bent de pure reddende keeper. Wanneer het erop aankomt, ben jij er.",
  ball_playing_cb: "Jij bent de verdediger die het spel aanstuurt. Positiespel én opbouw.",
  defensive_blocker: "Jij stopt aanvallers voordat ze gevaarlijk worden. Solide en betrouwbaar.",
  aerial_dominant: "Jij wint de luchtduels en domineert bij standaardsituaties.",
  attacking_fullback: "Jij maakt de breedte én de diepte. Gevaarlijk in aanval, altijd aanwezig.",
  defensive_fullback: "Jij bent de solide flankbeschermer. Rustig, georganiseerd, betrouwbaar.",
  inverted_winger_back: "Jij snijdt naar binnen en creëert gevaar met jouw sterke voet.",
  destroyer: "Jij breekt aanvallen af. Agressief, scherp, altijd in de buurt.",
  deep_lying_playmaker: "Jij regisseert het spel vanuit de diepte. De onzichtbare architect.",
  box_to_box: "Jij bent overal. Van eigen strafschopgebied tot vijandelijk gebied.",
  progressive_passer: "Jij speelt lijnen kapot. Lijnbrekende passes zijn jouw specialiteit.",
  engine: "Jij bent de motor van het team. Non-stop, vol gas, altijd present.",
  press_master: "Jij jaagt de tegenstander op hoge intensiteit op. Pressing is jouw kunst.",
  classic_ten: "Jij bent het creatieve hart. Alles gaat via jou — assists, visie, vrijheid.",
  shadow_striker: "Jij valt aan vanuit de schaduw. Onzichtbaar tot het moment ertoe doet.",
  creative_hub: "Jij bent het verbindingspunt. Ruimte creëren, combinaties breken, anderen beter maken.",
  pace_dribbler: "Jij terroriseert verdedigers met snelheid en één-op-één skills.",
  crossing_winger: "Jij speelt breed en geeft gevaarlijke voorzetten die aanvallers blij maken.",
  inverted_forward: "Jij snijdt naar binnen en eindigt met jouw sterkste voet. Onhoudbaar.",
  target_man: "Jij bent het referentiepunt. Holds the ball, wins headers, maakt ruimte.",
  poacher: "Jij pikt ballen op in de zestien. Puur instinct, puur goals.",
  complete_forward: "Jij kunt alles. Scoort, assisteert, drukt, leidt. De totaalspits.",
};

const SOCIOTYPE_DATA: Record<SociotypeName, { quote: string; in_game: string; tips: string[] }> = {
  leider: {
    quote: "\"Ik draag verantwoordelijkheid — voor mezelf én voor mijn team.\"",
    in_game: "Je organiseert het team vanuit het veld, neemt verantwoordelijkheid in cruciale momenten en trekt anderen mee naar een hoger niveau. Coaches bouwen op jou als verlengstuk op het veld.",
    tips: ["Spreek teamgenoten positief aan na fouten — leid met empathie", "Neem initiatief bij standaardsituaties en tactische aanpassingen", "Leid door voorbeeld — jouw inzet en attitude zetten de toon"],
  },
  strijder: {
    quote: "\"Ik geef nooit op — ook niet als het moeilijk wordt.\"",
    in_game: "Je geeft nooit op, ook niet bij een achterstand of na een fout. Je intensiteit inspireert teammates en zorgt dat het team altijd strijdbaar en hongerig blijft.",
    tips: ["Gebruik je energie slim — kies je pressing momenten bewust", "Kanaliseer je intensiteit constructief, niet agressief", "Herstel snel mentaal na tegenslagen — de volgende actie telt"],
  },
  denker: {
    quote: "\"Ik analyseer, ik anticipeer, ik win met mijn hoofd.\"",
    in_game: "Je leest het spel sneller dan anderen. Jij ziet ruimtes vóór ze ontstaan, anticipeert op tegenstanders en maakt slimme keuzes waar anderen impulsief handelen.",
    tips: ["Analyseer wedstrijdvideo's bewust — zoek patronen en triggers", "Deel je inzichten actief met coaches en teamgenoten", "Vertrouw op je analyse als de druk oploopt — jouw hoofd is jouw wapen"],
  },
  kunstenaar: {
    quote: "\"Ik zie oplossingen die anderen niet zien.\"",
    in_game: "Je brengt onverwachte oplossingen in het spel. Tegenstanders kunnen je niet voorspellen, wat je tot een constant gevaar en een unieke troef voor je team maakt.",
    tips: ["Zoek vrijheid in je bewegingen — improvisatie is jouw kracht", "Experimenteer in trainingen — neem risico's om te groeien", "Vertrouw op je creativiteit ook als het een keer fout gaat"],
  },
  professional: {
    quote: "\"Ik ben er altijd — betrouwbaar, consistent, klaar.\"",
    in_game: "Je betrouwbaarheid is de stille kracht van het team. Coaches bouwen op jou, teammates weten wat ze kunnen verwachten. Elke dag, elke wedstrijd.",
    tips: ["Bereid elke training professioneel voor — details winnen wedstrijden", "Wees consistent ook op je mindere dagen — professionals leveren altijd", "Stel hoge eisen aan jezelf én je directe omgeving"],
  },
  rustbrenger: {
    quote: "\"Als het chaotisch wordt, breng ik de rust terug.\"",
    in_game: "In drukke momenten breng jij kalmte. Jouw aanwezigheid stabiliseert het team en zorgt voor een evenwichtige groepsdynamiek, ook wanneer het moeilijk wordt.",
    tips: ["Gebruik je kalmte bewust in chaotische situaties — praat rustig", "Communiceer duidelijk bij spanning — jouw stem kalmert anderen", "Wees het ankerpunt waarop teammates terugvallen in moeilijke momenten"],
  },
  joker: {
    quote: "\"Ik breng positieve energie — een goed team lacht en wint.\"",
    in_game: "Jij creëert een sfeer die het team beter laat presteren. Humor en positiviteit zijn jouw superkrachten als groepsverbinder — onderschat dat nooit.",
    tips: ["Gebruik je positiviteit ook op moeilijke momenten — team heeft je nodig", "Zorg dat sfeer en serieuze inzet in balans blijven", "Jij hebt grote invloed op cohesie — gebruik dat bewust voor het team"],
  },
  killer: {
    quote: "\"Als anderen stoppen, ga ik door. Winnen is de enige optie.\"",
    in_game: "In beslissende momenten schakelen anderen af, jij schakelt aan. Je mentaliteit maakt het verschil tussen een gelijk spel en een overwinning.",
    tips: ["Train je mentale hardheid net zo gericht als je fysiek", "Visualiseer succesvolle momenten bewust vóór wedstrijden", "Combineer je killerinstinct met teamgeest — samen winnen is sterker"],
  },
};

function getSynergyText(archId: ArchetypeType, socioId: SociotypeName): string {
  const key = `${archId}_${socioId}`;
  const map: Record<string, string> = {
    creative_hub_denker: "Je combineert technische creativiteit met tactische intelligentie. Dit maakt jou tot de ideale #10 — iemand die het spel leest én het spel maakt.",
    classic_ten_denker: "Creativiteit gecombineerd met analytisch denken maakt jou tot een compleet aanvallend middenvelder die tegenstanders puzzelt.",
    classic_ten_kunstenaar: "Een pure voetbalkunstenaar op de tien — onvoorspelbaar, creatief, gevaarlijk. Dit is hoe legenden worden gemaakt.",
    progressive_passer_denker: "Visie plus analytisch vermogen maakt jouw passspel bijna onfeilbaar. Jij ziet de pass al vóórdat anderen de speler zien.",
    deep_lying_playmaker_denker: "De ultieme regisseur: je leest het spel, je verdeelt het spel, je controleert het tempo. Defensies weten niet wat hen overkomt.",
    engine_strijder: "Een niet te stoppen motor met een strijdersmentaliteit. Jij bepaalt het tempo en je geeft nooit op — ideaal voor intensieve pressing teams.",
    destroyer_strijder: "Pure intensiteit gecombineerd met doorzettingsvermogen. Je bent de nachtmerrie van elke aanvaller.",
    poacher_killer: "Killerinstinct in de zestien — de combinatie van pure positiebepaling en dodelijke mentaliteit. Doelpunten zijn jouw bestemming.",
    complete_forward_leider: "Een compleet aanvaller met leiderschapskwaliteiten. Jij leidt de aanvalslinie niet alleen met goals maar ook met attitude en aanwijzingen.",
    target_man_leider: "Jij bent het baken voorin. Iedereen speelt op jou, jij organiseert, jij leidt — met hoofd en met lichaam.",
    pace_dribbler_kunstenaar: "Explosieve snelheid gecombineerd met artistieke creativiteit maakt jou onhoudbaar op de flank.",
    shadow_striker_killer: "Killerinstinct gecombineerd met slimme loopacties: jij valt aan vanuit de schaduw en beslist wedstrijden.",
  };
  return map[key] ?? `Als ${ARCHETYPES[archId]?.label} met de persoonlijkheid van ${SOCIOTYPES[socioId]?.label} breng jij een unieke combinatie van voetbalkwaliteit en mentaliteit die jou onderscheidt van de rest. Benut beide kanten van wie je bent.`;
}

/* ─── helpers ─────────────────────────────────────────────────── */
function parseSubScores(n?: string): Record<string, number> | null {
  if (!n) return null; try { return JSON.parse(n); } catch { return null; }
}
function toFifa(v: number) { return Math.round(v * 10); }

/* ─── FIFA FUT Card ─────────────────────────────────────────────
   Real FIFA Ultimate Team card shape — simple rounded rect only.
──────────────────────────────────────────────────────────────── */
const CW = 210;
const CH = 296;
const CR = 11;
const BD = 4;

const IW = CW - BD * 2;
const IH = CH - BD * 2;
const IR = CR - BD;

function cardPath(w: number, h: number, r: number) {
  return `M ${r},0 L ${w - r},0 Q ${w},0 ${w},${r} L ${w},${h - r} Q ${w},${h} ${w - r},${h} L ${r},${h} Q 0,${h} 0,${h - r} L 0,${r} Q 0,0 ${r},0 Z`;
}

const OUTER_PATH = cardPath(CW, CH, CR);
const INNER_PATH = cardPath(IW, IH, IR);

function getFutTier(rating: number) {
  if (rating >= 90) return {
    label: "Icon", dark: "#0A0A0A", mid: "#C0A000",
    bg1: "#FFD700", bg2: "#1C1C1C", ring: "#FFE855", accent: "#FFFFFF",
  };
  if (rating >= 85) return {
    label: "TOTW", dark: "#1A0D45", mid: "#5A35B0",
    bg1: "#8B5CF6", bg2: "#2D1A6E", ring: "#C4B5FD", accent: "#E0D4FF",
  };
  if (rating >= 80) return {
    label: "Speciaal", dark: "#4A1800", mid: "#C05010",
    bg1: "#F97316", bg2: "#7C2D00", ring: "#FDB575", accent: "#FFD4A8",
  };
  if (rating >= 65) return {
    label: "Goud", dark: "#4A3000", mid: "#B8860B",
    bg1: "#F5C842", bg2: "#8A6000", ring: "#FFD700", accent: "#FFF0A0",
  };
  if (rating >= 50) return {
    label: "Zilver", dark: "#303030", mid: "#909090",
    bg1: "#D8D8D8", bg2: "#707070", ring: "#F0F0F0", accent: "#FFFFFF",
  };
  if (rating >= 0) return {
    label: "Brons", dark: "#5C2E00", mid: "#A05820",
    bg1: "#CD7F32", bg2: "#8B4513", ring: "#E8A060", accent: "#F0C080",
  };
  return {
    label: "Basis", dark: "#1E2830", mid: "#5A6B7A",
    bg1: "#9BA4B5", bg2: "#4A5560", ring: "#B0BCC8", accent: "#D0D8E4",
  };
}

function FifaCard({
  player, rColor, avatarOverride,
}: { player: PlayerWithDetails; rColor: string; avatarOverride?: string | null }) {
  const uid = useId().replace(/:/g, "");
  const s = player.recent_scores;
  const rating = player.overall_rating;
  const tier = getFutTier(rating);

  const fifaStats = s ? [
    { v: toFifa(s.fysiek),                                                  l: "PAC", full: "Pace — Snelheid & explosiviteit" },
    { v: toFifa(s.techniek),                                                l: "SHO", full: "Shooting — Technische schietkwaliteit" },
    { v: Math.round(toFifa(s.teamplay) * 0.6 + toFifa(s.techniek) * 0.4), l: "PAS", full: "Passing — Aanspeel- & teamplay kwaliteit" },
    { v: Math.round(toFifa(s.techniek) * 0.55 + toFifa(s.fysiek) * 0.45), l: "DRI", full: "Dribbling — Balcontrole & wendbaarheid" },
    { v: Math.round(toFifa(s.tactiek) * 0.65 + toFifa(s.mentaal) * 0.35), l: "DEF", full: "Defending — Tactisch inzicht & mentale kracht" },
    { v: Math.round(toFifa(s.fysiek) * 0.60 + toFifa(s.mentaal) * 0.40),  l: "PHY", full: "Physical — Fysieke kracht & mentale weerbaarheid" },
  ] : [];

  const av = avatarOverride ?? player.avatar_url;

  let metalStops: { offset: string; color: string }[];
  if (rating >= 65) {
    metalStops = [
      { offset: "0%",   color: "#FFE580" },
      { offset: "30%",  color: "#B8860B" },
      { offset: "50%",  color: "#7A5500" },
      { offset: "70%",  color: "#C89830" },
      { offset: "100%", color: "#FFE580" },
    ];
  } else if (rating >= 50) {
    metalStops = [
      { offset: "0%",   color: "#F4F4F4" },
      { offset: "40%",  color: "#A0A0A0" },
      { offset: "55%",  color: "#707070" },
      { offset: "75%",  color: "#C0C0C0" },
      { offset: "100%", color: "#F4F4F4" },
    ];
  } else if (rating >= 0) {
    metalStops = [
      { offset: "0%",   color: "#F0A870" },
      { offset: "40%",  color: "#8B4513" },
      { offset: "55%",  color: "#5C2E00" },
      { offset: "75%",  color: "#A05820" },
      { offset: "100%", color: "#F0A060" },
    ];
  } else {
    metalStops = [
      { offset: "0%",   color: "#B0C0D0" },
      { offset: "40%",  color: "#4A5560" },
      { offset: "55%",  color: "#2E3840" },
      { offset: "75%",  color: "#6A7A8A" },
      { offset: "100%", color: "#B0C0D0" },
    ];
  }

  return (
    <div className="relative mx-auto select-none"
      style={{ width: CW, height: CH, flexShrink: 0 }}>

      <svg
        className="absolute inset-0 pointer-events-none"
        width={CW} height={CH}
        viewBox={`0 0 ${CW} ${CH}`}
        style={{
          zIndex: 1,
          filter: `drop-shadow(0 16px 48px ${tier.mid}90) drop-shadow(0 4px 16px rgba(0,0,0,0.8))`,
        }}>
        <defs>
          <linearGradient id={`metalGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {metalStops.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
          <linearGradient id={`cardbg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={tier.bg1} />
            <stop offset="45%"  stopColor={tier.bg2} />
            <stop offset="100%" stopColor="#010508" />
          </linearGradient>
          <linearGradient id={`shimmer-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="18%"  stopColor="rgba(255,255,255,0.18)" />
            <stop offset="60%"  stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <clipPath id={`clip-inner-${uid}`}>
            <path d={INNER_PATH} />
          </clipPath>
        </defs>

        <path d={OUTER_PATH} fill={`url(#metalGrad-${uid})`} />

        <g transform={`translate(${BD},${BD})`} clipPath={`url(#clip-inner-${uid})`}>
          <path d={INNER_PATH} fill={`url(#cardbg-${uid})`} />
          <path d={INNER_PATH} fill={`url(#shimmer-${uid})`} />
          <g opacity="0.05">
            <line x1="150" y1="-20" x2="-10" y2="250" stroke="white" strokeWidth="40" />
            <line x1="200" y1="-20" x2="40"  y2="250" stroke="white" strokeWidth="22" />
          </g>
        </g>
      </svg>

      <div
        className="absolute"
        style={{
          zIndex: 2,
          left: BD, top: BD,
          width: IW, height: IH,
          borderRadius: `${IR}px`,
          overflow: "hidden",
        }}>
        {av ? (
          <Image src={av} alt={player.first_name} fill className="object-contain object-bottom" style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.6))" }} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-black"
            style={{
              fontSize: 64,
              background: `linear-gradient(180deg,${tier.bg1}30,${tier.bg2}60)`,
              color: `${tier.ring}80`,
            }}>
            {player.first_name[0]}{player.last_name[0]}
          </div>
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.92) 72%, rgba(0,0,0,0.98) 100%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 0% 0%, rgba(0,0,0,0.55) 0%, transparent 52%)" }}
        />
      </div>

      <div className="absolute" style={{ zIndex: 3, top: BD + 7, left: BD + 8 }}>
        <div
          className="font-black leading-none"
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 40,
            color: "white",
            textShadow: "0 0 24px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.8)",
          }}>
          {rating}
        </div>
        <div
          className="font-black uppercase tracking-widest"
          style={{ fontSize: 10, color: tier.ring, textShadow: "0 1px 8px rgba(0,0,0,1)", marginTop: 1 }}>
          {player.position}
        </div>
        <div style={{ fontSize: 17, lineHeight: 1, marginTop: 3, filter: "drop-shadow(0 1px 6px rgba(0,0,0,1))" }}>
          🇳🇱
        </div>
      </div>

      <div
        className="absolute text-center"
        style={{ zIndex: 3, left: BD, right: BD, bottom: BD + 52 }}>
        <div
          className="font-black text-white uppercase"
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 14,
            letterSpacing: "0.07em",
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}>
          {player.last_name.toUpperCase()}
        </div>
      </div>

      <div
        className="absolute"
        style={{
          zIndex: 3,
          left: BD + 3, right: BD + 3,
          bottom: BD + 48,
          height: 1,
          background: `linear-gradient(to right, transparent, ${tier.ring}65, transparent)`,
        }}
      />

      {fifaStats.length > 0 && (
        <div className="absolute" style={{ zIndex: 3, left: BD + 6, right: BD + 6, bottom: BD + 7 }}>
          <div className="grid grid-cols-3" style={{ gap: "2px 3px" }}>
            {fifaStats.map((st) => (
              <div key={st.l} className="flex items-center gap-1" title={st.full}>
                <span
                  className="font-black tabular-nums"
                  style={{ color: tier.ring, fontFamily: "Outfit, sans-serif", fontSize: 13, lineHeight: 1.2 }}>
                  {st.v}
                </span>
                <span
                  className="font-bold uppercase"
                  style={{ color: "rgba(255,255,255,0.40)", fontSize: 9, letterSpacing: "0.04em" }}>
                  {st.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <svg
        className="absolute inset-0 pointer-events-none"
        width={CW} height={CH}
        viewBox={`0 0 ${CW} ${CH}`}
        style={{ zIndex: 4 }}>
        <path d={OUTER_PATH} fill="none" stroke={tier.dark} strokeWidth="1.5" strokeOpacity="0.7" />
        <path
          d={INNER_PATH}
          fill="none"
          stroke={tier.accent}
          strokeWidth="1"
          strokeOpacity="0.4"
          transform={`translate(${BD},${BD})`}
        />
      </svg>
    </div>
  );
}

/* ─── semicircle score gauge ───────────────────────────────────── */
function SemiGauge({ score, color }: { score: number; color: string }) {
  const r = 26;
  const circ = Math.PI * r;
  const fill = circ * (score / 100);
  return (
    <svg width="64" height="42" viewBox="0 0 64 42">
      <path d="M 6 38 A 26 26 0 0 1 58 38" fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />
      <path d="M 6 38 A 26 26 0 0 1 58 38" fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`} />
      <text x="32" y="37" textAnchor="middle" fill="white"
        fontSize="14" fontWeight="900" fontFamily="Outfit, sans-serif">{score}</text>
    </svg>
  );
}

/* ─── attribute column ────────────────────────────────────────── */
function AttributeColumn({ categoryId, score, subNotes }: {
  categoryId: string; score: number; subNotes?: string
}) {
  const schema = EVALUATION_SCHEMA.find((c) => c.id === categoryId)!;
  const sub = parseSubScores(subNotes);
  const sc = getScoreColor(score);
  const display = toFifa(score);
  return (
    <div className="flex flex-col items-center min-w-[120px]">
      <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1">{schema.label}</div>
      <SemiGauge score={display} color={sc} />
      <div className="mt-2 w-full space-y-1.5">
        {schema.subcategories.map((s) => {
          const val = sub?.[s.id];
          const hasVal = val !== undefined;
          const barColor = hasVal ? getScoreColor(val) : sc;
          const barPct = hasVal ? val * 10 : score * 10;
          return (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/40 w-24 truncate flex-shrink-0">{s.label}</span>
              <div className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)", minWidth: 30 }}>
                <div className="h-full rounded-full"
                  style={{ width: `${barPct}%`, backgroundColor: hasVal ? barColor : `${barColor}60` }} />
              </div>
              <span className="text-[10px] font-bold w-5 text-right tabular-nums flex-shrink-0"
                style={{ color: hasVal ? barColor : `${barColor}60` }}>
                {hasVal ? val : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────────── */
export default function PlayerCardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"statistieken" | "dna" | "evaluaties" | "medisch">("statistieken");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [iqData, setIqData] = useState<{ score: number; label: string; color: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tacticalIQ");
      if (saved) setIqData(JSON.parse(saved) as { score: number; label: string; color: string });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([getMyPlayerData(), getAllPlayers()]).then(([p, all]) => {
      setPlayer(p);
      setAvatarUrl(p?.avatar_url ?? null);
      setAllPlayers(all);
      setLoading(false);
    });
  }, []);

  async function handleGenerateAI() {
    if (!avatarUrl || !player) return;
    setGeneratingAI(true);
    setAiError(null);
    try {
      const res = await fetch("/api/generate-player-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: avatarUrl,
          playerName: `${player.first_name} ${player.last_name}`,
        }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) {
        setAvatarUrl(json.url);
      } else {
        setAiError(json.error ?? "AI generatie mislukt");
      }
    } catch {
      setAiError("Verbindingsfout");
    } finally {
      setGeneratingAI(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin" style={{ color: "#4FA9E6" }} />
    </div>
  );

  if (!player) return (
    <div className="p-8 text-center space-y-4">
      <div className="text-slate-600">Vul je profiel in om je spelerskaart te zien.</div>
      <Link href="/dashboard/player/settings" className="hub-btn-primary inline-flex items-center gap-2">
        <Settings size={14} /> Profiel invullen
      </Link>
    </div>
  );

  const identity = player.identity;
  const archId = identity?.primary_archetype as ArchetypeType | undefined;
  const socioId = identity?.primary_sociotype as SociotypeName | undefined;
  const arch  = archId  ? ARCHETYPES[archId]  : null;
  const socio = socioId ? SOCIOTYPES[socioId] : null;
  const rColor = getRatingColor(player.overall_rating);
  const rLabel = getRatingLabel(player.overall_rating);
  const club = DUTCH_CLUBS.find((c) => c.id === (player as unknown as Record<string, unknown>).club as string);
  const p = player as unknown as Record<string, unknown>;
  const age = p.date_of_birth ? getAge(p.date_of_birth as string) : null;
  const dominantFoot = (p.dominant_foot as DominantFoot) ?? "right";
  const injuries = (p.injury_locations as BodyRegion[]) ?? [];
  const latestEval = player.evaluations?.[0];
  const scores = latestEval?.scores ?? [];
  const radarData = scores.map((s) => ({
    subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category,
    value: s.score, fullMark: 10,
  }));

  const evalCount = player.evaluations?.length ?? 0;
  const bestScore = player.evaluations?.reduce((best, ev) =>
    (ev.overall_score ?? 0) > best ? (ev.overall_score ?? 0) : best, 0) ?? 0;

  const tabs = [
    { id: "statistieken" as const, label: "Statistieken",  icon: <BarChart3 size={13} /> },
    { id: "dna"          as const, label: "Speler DNA",    icon: <Zap size={13} /> },
    { id: "evaluaties"   as const, label: "Evaluaties",    icon: <Activity size={13} /> },
    { id: "medisch"      as const, label: "Medisch",       icon: <ShieldAlert size={13} /> },
  ];

  const socioData = socioId ? SOCIOTYPE_DATA[socioId] : null;
  const archTips  = archId  ? ARCHETYPE_TIPS[archId]  : null;
  const archRole  = archId  ? ARCHETYPE_PITCH_ROLE[archId] : null;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8" style={{ fontFamily: "Outfit, sans-serif" }}>

      {/* ══════════════════════════════════════════════════════════
          HERO — dark, full-bleed
      ══════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "#050d1a", minHeight: 480 }}>

        {/* Background glow blobs */}
        <div className="absolute pointer-events-none" style={{
          top: -100, left: -60, width: 500, height: 500,
          borderRadius: "50%", opacity: 0.10, filter: "blur(80px)",
          background: rColor, zIndex: 0,
        }} />
        <div className="absolute pointer-events-none" style={{
          bottom: -80, right: -80, width: 340, height: 340,
          borderRadius: "50%", opacity: 0.07, filter: "blur(60px)",
          background: "#4FA9E6", zIndex: 0,
        }} />

        {/* Player photo — right side, desktop only */}
        {avatarUrl && (
          <div
            className="hidden sm:block absolute pointer-events-none"
            style={{
              zIndex: 1, right: 0, top: 0, bottom: 0, width: "52%",
              background: "linear-gradient(to right, #050d1a 0%, #050d1a 28%, transparent 55%)",
            }}>
            <Image
              src={avatarUrl}
              alt={player.first_name}
              fill
              className="object-contain object-bottom"
              style={{ filter: "drop-shadow(-16px 0 40px #050d1a)" }}
            />
          </div>
        )}

        {/* Hero content */}
        <div className="relative px-6 sm:px-8 lg:px-10 pt-8 pb-0" style={{ zIndex: 10 }}>
          <div className="max-w-[520px]">

            {/* Label */}
            <div
              className="font-bold uppercase mb-4"
              style={{ fontSize: 10, letterSpacing: "0.22em", color: "#4FA9E6" }}>
              Performance Hub · Spelersprofiel
            </div>

            {/* Mobile avatar */}
            {avatarUrl && (
              <div className="sm:hidden absolute top-6 right-6 w-20 h-20 rounded-full overflow-hidden border-2"
                style={{ borderColor: `${rColor}40` }}>
                <Image src={avatarUrl} alt={player.first_name} fill className="object-cover object-top" />
              </div>
            )}

            {/* FIRSTNAME — big */}
            <h1
              className="font-black text-white uppercase leading-none"
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "clamp(3rem,10vw,5.5rem)",
                letterSpacing: "-0.02em",
              }}>
              {player.first_name.toUpperCase()}
            </h1>

            {/* LASTNAME — slightly smaller, rColor */}
            <h2
              className="font-black uppercase leading-none mb-4"
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "clamp(2rem,7vw,3.8rem)",
                color: rColor,
                letterSpacing: "-0.02em",
                textShadow: `0 0 40px ${rColor}40`,
              }}>
              {player.last_name.toUpperCase()}
            </h2>

            {/* Position badge + club + jersey + rating */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span
                className="font-black uppercase text-xs px-3 py-1 rounded-full"
                style={{ background: `${rColor}20`, color: rColor, border: `1px solid ${rColor}35` }}>
                {POSITION_LABELS[player.position] ?? player.position}
              </span>
              {(player.team_name ?? club?.name) && (
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {player.team_name ?? club?.name}
                  {player.jersey_number ? ` · #${player.jersey_number}` : ""}
                </span>
              )}
              {rLabel && (
                <span
                  className="ml-auto font-black text-xs px-3 py-1 rounded-full tabular-nums"
                  style={{ background: `${rColor}18`, color: rColor, border: `1px solid ${rColor}30` }}>
                  {player.overall_rating} OVR
                </span>
              )}
            </div>
          </div>

          {/* ── Stats strip ── */}
          {(() => {
            const items: { v: string; l: string; color?: string }[] = [
              { v: player.overall_rating.toString(), l: "OVR" },
              { v: evalCount.toString(),             l: "EVALS" },
              ...(bestScore > 0 ? [{ v: bestScore.toFixed(1), l: "PIEK" }] : []),
              ...(age            ? [{ v: age.toString(),       l: "AGE" }] : []),
              ...(iqData         ? [{ v: `${iqData.score}`,    l: "IQ",  color: iqData.color }] : []),
            ].slice(0, 6);

            return (
              <div className="flex gap-1 -mx-6 sm:-mx-8 lg:-mx-10 px-6 sm:px-8 lg:px-10 mt-4 overflow-x-auto scrollbar-none">
                {items.map((item) => (
                  <div
                    key={item.l}
                    className="flex-1 flex flex-col items-center justify-center px-3 py-2.5 rounded-t-xl"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderBottom: "none",
                      minWidth: 52,
                    }}>
                    <div
                      className="text-lg font-black tabular-nums leading-none"
                      style={{ fontFamily: "Outfit, sans-serif", color: item.color ?? "white" }}>
                      {item.v}
                    </div>
                    <div className="text-[9px] mt-1 uppercase tracking-wider font-medium"
                      style={{ color: item.color ? `${item.color}90` : "rgba(255,255,255,0.3)" }}>
                      {item.l}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Tab bar ── */}
          <div
            className="flex -mx-6 sm:-mx-8 lg:-mx-10 px-6 sm:px-8 lg:px-10 overflow-x-auto"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={tab === t.id ? { color: rColor } : { color: "rgba(255,255,255,0.3)" }}>
                {t.icon}{t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t" style={{ background: rColor }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB CONTENT
      ══════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-12" style={{ background: "#08111e" }}>

        {/* ── TAB 1: STATISTIEKEN ── */}
        {tab === "statistieken" && (
          <div className="space-y-8">

            {/* FIFA card + attribute columns row */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
                FIFA Kaart &amp; Attributen
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="flex gap-6 px-4 sm:px-0 pb-3 min-w-max sm:min-w-0">

                  {/* FIFA card column */}
                  <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    <FifaCard player={player} rColor={rColor} avatarOverride={avatarUrl} />
                    {rLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                        style={{ color: rColor, background: `${rColor}15`, border: `1px solid ${rColor}25` }}>
                        {rLabel}
                      </span>
                    )}
                    {/* Upload + AI buttons */}
                    <div className="flex items-center gap-2">
                      <AvatarUpload
                        currentUrl={avatarUrl}
                        userId={(p.profile_id as string) ?? ""}
                        name={`${player.first_name} ${player.last_name}`}
                        onUpload={(url) => setAvatarUrl(url)}
                        size={38}
                      />
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                        <Camera size={10} className="inline mr-1" />Foto uploaden
                      </span>
                    </div>
                    {avatarUrl && (
                      <button
                        onClick={handleGenerateAI}
                        disabled={generatingAI}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: generatingAI ? "rgba(79,169,230,0.12)" : "rgba(79,169,230,0.18)",
                          color: "#4FA9E6",
                          border: "1px solid rgba(79,169,230,0.28)",
                        }}>
                        {generatingAI ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                        {generatingAI ? "AI bezig..." : "AI voetbalfoto"}
                      </button>
                    )}
                    {aiError && (
                      <div className="text-[10px] text-red-400 text-center max-w-[200px]">{aiError}</div>
                    )}
                    <Link
                      href="/dashboard/player/settings"
                      className="text-[11px] font-semibold px-4 py-1.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.40)", border: "1px solid rgba(255,255,255,0.10)" }}>
                      <Settings size={11} className="inline mr-1" />Bewerken
                    </Link>
                  </div>

                  {/* Attribute columns — scrollable */}
                  {scores.map((s) => (
                    <AttributeColumn
                      key={s.category}
                      categoryId={s.category}
                      score={s.score}
                      subNotes={(s as unknown as Record<string, unknown>).sub_notes as string | undefined}
                    />
                  ))}

                  {scores.length === 0 && (
                    <div className="flex items-center justify-center text-white/20 text-sm w-64 h-40">
                      Nog geen evaluatiedata beschikbaar
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Performance Radar ── */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                Performance Radar
              </div>
              {radarData.length > 0 ? (
                <div className="rounded-2xl border flex justify-center py-4"
                  style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <PlayerRadarChart data={radarData} color={rColor} size={300} />
                </div>
              ) : (
                <div className="rounded-2xl border flex items-center justify-center h-32 text-sm"
                  style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.20)" }}>
                  Radar beschikbaar na eerste evaluatie van je coach
                </div>
              )}
            </div>

            {/* Tactical IQ widget */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                Tactisch IQ
              </div>
              {iqData ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl border"
                  style={{ background: `${iqData.color}0d`, borderColor: `${iqData.color}25` }}>
                  <div className="flex-shrink-0 relative w-16 h-16">
                    <svg width="64" height="64" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                      <circle cx="32" cy="32" r="26" fill="none"
                        stroke={iqData.color} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${(iqData.score / 24) * 163} 163`}
                        transform="rotate(-90 32 32)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black" style={{ color: iqData.color, fontFamily: "Outfit, sans-serif" }}>{iqData.score}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-lg leading-tight" style={{ color: iqData.color, fontFamily: "Outfit, sans-serif" }}>
                      {iqData.label}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{iqData.score}/24 punten</div>
                    <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.30)" }}>
                      Je tactisch inzicht is gemeten via 8 scenario scenario&apos;s. Hoe hoger, hoe meer je het spel leest.
                    </div>
                  </div>
                  <Link href="/dashboard/player/game"
                    className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: `${iqData.color}18`, color: iqData.color, border: `1px solid ${iqData.color}30` }}>
                    Opnieuw
                  </Link>
                </div>
              ) : (
                <Link href="/dashboard/player/game"
                  className="flex items-center gap-3 p-4 rounded-2xl border transition-all"
                  style={{ background: "rgba(79,169,230,0.05)", borderColor: "rgba(79,169,230,0.16)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(79,169,230,0.14)" }}>
                    <Brain size={20} style={{ color: "#4FA9E6" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">Doe de Tactisch IQ Test</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>8 scenario&apos;s · 11v11 situaties · Max 24 punten</div>
                  </div>
                  <ChevronRight size={16} style={{ color: "#4FA9E6", flexShrink: 0 }} />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: SPELER DNA ── */}
        {tab === "dna" && (
          <div className="space-y-6">

            {(arch || socio || identity?.ai_summary) ? (
              <>
                {/* A) Archetype deep card */}
                {arch && archId && (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${arch.color}30`, background: `${arch.color}08` }}>
                    {/* Top bar */}
                    <div className="flex items-center gap-3 px-5 pt-5 pb-4"
                      style={{ borderBottom: `1px solid ${arch.color}18` }}>
                      <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>{arch.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                          style={{ color: arch.color }}>ARCHETYPE</div>
                        <div className="font-black text-white text-lg leading-tight"
                          style={{ fontFamily: "Outfit, sans-serif" }}>{arch.label}</div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {arch.position.map((pos) => (
                          <span key={pos} className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{ background: `${arch.color}20`, color: arch.color }}>
                            {pos}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="px-5 py-4 space-y-4">
                      {/* Description as first-person */}
                      {archRole && (
                        <p className="text-sm font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.80)" }}>
                          {archRole}
                        </p>
                      )}

                      {/* Traits */}
                      <div className="flex flex-wrap gap-1.5">
                        {arch.traits.map((t) => (
                          <span key={t} className="text-xs font-bold px-3 py-1 rounded-full"
                            style={{ background: `${arch.color}20`, color: arch.color }}>
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Wat betekent dit */}
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest mb-2"
                          style={{ color: "rgba(255,255,255,0.30)" }}>WAT BETEKENT DIT?</div>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
                          {arch.description}. Als {arch.label} wordt van jou verwacht dat je dit profiel elke wedstrijd belichaamt. Coaches herkennen dit archetype en spelen hun systeem hierop af.
                        </p>
                      </div>

                      {/* Tips */}
                      {archTips && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest mb-2"
                            style={{ color: "rgba(255,255,255,0.30)" }}>3 TIPS OM DIT TE BENUTTEN</div>
                          <div className="space-y-2">
                            {archTips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className="text-xs font-black mt-0.5 w-4 flex-shrink-0 tabular-nums"
                                  style={{ color: arch.color }}>{i + 1}</span>
                                <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* B) Sociotype deep card */}
                {socio && socioId && socioData && (() => {
                  const SIcon = SOCIOTYPE_ICONS[socio.id];
                  return (
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ border: `1px solid ${socio.color_hex}30`, background: `${socio.color_hex}08` }}>
                      {/* Top bar */}
                      <div className="flex items-center gap-3 px-5 pt-5 pb-4"
                        style={{ borderBottom: `1px solid ${socio.color_hex}18` }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${socio.color_hex}20` }}>
                          <SIcon size={22} style={{ color: socio.color_hex }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                            style={{ color: socio.color_hex }}>PERSOONLIJKHEID</div>
                          <div className="font-black text-white text-lg leading-tight"
                            style={{ fontFamily: "Outfit, sans-serif" }}>{socio.label}</div>
                        </div>
                      </div>

                      <div className="px-5 py-4 space-y-4">
                        {/* Quote */}
                        <p className="text-sm italic font-medium leading-relaxed"
                          style={{ color: socio.color_hex, opacity: 0.9 }}>
                          {socioData.quote}
                        </p>

                        {/* Op het veld */}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest mb-2"
                            style={{ color: "rgba(255,255,255,0.30)" }}>OP HET VELD</div>
                          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                            {socioData.in_game}
                          </p>
                        </div>

                        {/* Traits */}
                        <div className="flex flex-wrap gap-1.5">
                          {socio.traits.map((t) => (
                            <span key={t} className="text-xs font-bold px-3 py-1 rounded-full"
                              style={{ background: `${socio.color_hex}18`, color: socio.color_hex }}>
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* How to use it */}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest mb-2"
                            style={{ color: "rgba(255,255,255,0.30)" }}>HOE ZET JE DIT IN?</div>
                          <div className="space-y-2">
                            {socioData.tips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className="text-xs font-black mt-0.5 w-4 flex-shrink-0 tabular-nums"
                                  style={{ color: socio.color_hex }}>{i + 1}</span>
                                <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* C) Synergy block */}
                {arch && socio && archId && socioId && (
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span style={{ fontSize: "1.1rem" }}>✨</span>
                      <div className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.30)" }}>JOUW COMBINATIE</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="font-black text-sm px-3 py-1 rounded-full"
                        style={{ background: `${arch.color}20`, color: arch.color }}>{arch.label}</span>
                      <span className="text-white/40 font-black">×</span>
                      <span className="font-black text-sm px-3 py-1 rounded-full"
                        style={{ background: `${socio.color_hex}20`, color: socio.color_hex }}>{socio.label}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.70)" }}>
                      {getSynergyText(archId, socioId)}
                    </p>
                  </div>
                )}

                {/* D) AI Scouting */}
                {identity?.ai_summary && (
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(79,169,230,0.06)", border: "1px solid rgba(79,169,230,0.22)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={15} style={{ color: "#4FA9E6", flexShrink: 0 }} />
                      <span className="font-black text-sm" style={{ color: "#4FA9E6" }}>AI Scouting Analyse</span>
                      {identity.ai_fit_score && (
                        <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-full"
                          style={{ color: rColor, background: `${rColor}18`, border: `1px solid ${rColor}30` }}>
                          Fit {identity.ai_fit_score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {identity.ai_summary}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  <Zap size={24} style={{ color: "rgba(255,255,255,0.20)" }} />
                </div>
                <div className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.50)" }}>
                  Speler DNA nog niet ingesteld
                </div>
                <p className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.30)" }}>
                  Je coach heeft je speler DNA nog niet ingesteld. Vraag je coach een evaluatie in te vullen met je archetype en sociotype.
                </p>
                <Link href="/dashboard/player/settings"
                  className="mt-5 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <Settings size={12} /> Instellingen
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: EVALUATIES ── */}
        {tab === "evaluaties" && (
          <div className="space-y-5">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
              Evaluatiehistorie — {evalCount} {evalCount === 1 ? "beoordeling" : "beoordelingen"}
            </div>

            {/* Radar of latest eval */}
            {radarData.length > 0 && (
              <div className="flex justify-center py-2">
                <PlayerRadarChart data={radarData} color={rColor} size={320} />
              </div>
            )}

            {/* Progress line if 2+ evals */}
            {(player.evaluations?.length ?? 0) >= 2 && (
              <div
                className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Progressie
                </div>
                <div className="flex items-end gap-2 overflow-x-auto pb-1">
                  {[...(player.evaluations ?? [])].reverse().map((ev, i, arr) => {
                    const pct = ((ev.overall_score ?? 0) / 10) * 100;
                    const rC = getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40);
                    const isLast = i === arr.length - 1;
                    return (
                      <div key={ev.id} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 48 }}>
                        <span className="text-xs font-black tabular-nums" style={{ color: isLast ? rC : "rgba(255,255,255,0.50)" }}>
                          {ev.overall_score?.toFixed(1)}
                        </span>
                        <div className="w-8 rounded-t-lg" style={{
                          height: `${Math.max(12, pct * 0.8)}px`,
                          background: isLast ? rC : `${rC}50`,
                          transition: "height 0.3s ease",
                        }} />
                        <span className="text-[9px] text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
                          {new Date(ev.evaluation_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evaluation history cards */}
            {(player.evaluations ?? []).length === 0 ? (
              <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.25)" }}>
                <Activity size={28} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">Nog geen evaluaties</div>
              </div>
            ) : (
              (player.evaluations ?? []).map((ev, i) => {
                const rC = getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40);
                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div>
                        <div className="text-sm font-semibold text-white">{formatDate(ev.evaluation_date)}</div>
                        {ev.coach_name && (
                          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{ev.coach_name}</div>
                        )}
                      </div>
                      <div className="text-2xl font-black tabular-nums"
                        style={{ color: rC, fontFamily: "Outfit, sans-serif" }}>
                        {ev.overall_score?.toFixed(1)}<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.25)" }}>/10</span>
                      </div>
                    </div>

                    {/* Latest eval — full attribute columns */}
                    {i === 0 && ev.scores && ev.scores.length > 0 && (
                      <div className="overflow-x-auto">
                        <div className="flex gap-5 p-5 min-w-max">
                          {ev.scores.map((s) => (
                            <AttributeColumn
                              key={s.category}
                              categoryId={s.category}
                              score={s.score}
                              subNotes={(s as unknown as Record<string, unknown>).sub_notes as string | undefined}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Older evals — compact scores grid */}
                    {i > 0 && ev.scores && (
                      <div className="flex flex-wrap gap-3 px-5 py-3">
                        {ev.scores.map((s) => {
                          const sc = getScoreColor(s.score);
                          const schema = EVALUATION_SCHEMA.find((c) => c.id === s.category);
                          return (
                            <div key={s.category} className="flex items-center gap-1.5 text-xs font-bold">
                              <span>{schema?.icon}</span>
                              <span style={{ color: "rgba(255,255,255,0.35)" }}>
                                {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                              </span>
                              <span style={{ color: sc }}>{toFifa(s.score)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {ev.notes && (
                      <div className="px-5 pb-4 text-xs italic" style={{ color: "rgba(255,255,255,0.30)" }}>
                        &ldquo;{ev.notes}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── TAB 4: MEDISCH ── */}
        {tab === "medisch" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                Medisch Profiel
              </div>
              <Link
                href="/dashboard/player/settings"
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.40)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <Settings size={11} /> Bewerken
              </Link>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <InjuryBodyMap injuries={injuries} dominantFoot={dominantFoot} readonly={true} />
            </div>

            {injuries.length === 0 && (
              <div className="text-center py-6">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                  Geen blessures geregistreerd. Ga naar{" "}
                  <Link href="/dashboard/player/settings" className="underline" style={{ color: "#4FA9E6" }}>
                    instellingen
                  </Link>{" "}
                  om blessuregeschiedenis toe te voegen.
                </p>
              </div>
            )}

            {/* Heatmap link */}
            <Link
              href="/dashboard/player/heatmap"
              className="flex items-center gap-3 p-4 rounded-2xl border transition-all"
              style={{ background: "rgba(255,100,50,0.05)", borderColor: "rgba(255,100,50,0.18)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,100,50,0.12)" }}>
                <Map size={18} style={{ color: "rgba(255,140,80,0.9)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">Positie Heatmap</div>
                <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>Bekijk je bewegingspatronen op het veld</div>
              </div>
              <ChevronRight size={16} style={{ color: "rgba(255,140,80,0.6)", flexShrink: 0 }} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
