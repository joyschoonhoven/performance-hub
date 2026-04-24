"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Trophy, Brain, ChevronRight, RotateCcw } from "lucide-react"

interface PlayerPos {
  id: number
  team: "blue" | "red"
  x: number
  y: number
  number: number
  highlighted?: boolean
}
interface BallPos { x: number; y: number }
interface Option { text: string; score: 0 | 1 | 2 | 3; explanation: string }
interface Scenario {
  id: number
  phase: string
  title: string
  description: string
  players: PlayerPos[]
  ball: BallPos
  question: string
  options: Option[]
}
type GamePhase = "intro" | "watching" | "question" | "feedback" | "results"

const defaultPlayers: PlayerPos[] = [
  { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
  { id: 2,  team: "blue", x: 0.8,  y: 0.8,  number: 2  },
  { id: 3,  team: "blue", x: 0.4,  y: 0.85, number: 3  },
  { id: 4,  team: "blue", x: 0.6,  y: 0.85, number: 4  },
  { id: 5,  team: "blue", x: 0.2,  y: 0.8,  number: 5  },
  { id: 6,  team: "blue", x: 0.85, y: 0.55, number: 6  },
  { id: 7,  team: "blue", x: 0.42, y: 0.5,  number: 7  },
  { id: 8,  team: "blue", x: 0.58, y: 0.5,  number: 8  },
  { id: 9,  team: "blue", x: 0.15, y: 0.55, number: 9  },
  { id: 10, team: "blue", x: 0.38, y: 0.25, number: 10 },
  { id: 11, team: "blue", x: 0.62, y: 0.25, number: 11 },
  { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
  { id: 13, team: "red",  x: 0.8,  y: 0.2,  number: 2  },
  { id: 14, team: "red",  x: 0.4,  y: 0.15, number: 3  },
  { id: 15, team: "red",  x: 0.6,  y: 0.15, number: 4  },
  { id: 16, team: "red",  x: 0.2,  y: 0.2,  number: 5  },
  { id: 17, team: "red",  x: 0.85, y: 0.45, number: 6  },
  { id: 18, team: "red",  x: 0.42, y: 0.5,  number: 7  },
  { id: 19, team: "red",  x: 0.58, y: 0.5,  number: 8  },
  { id: 20, team: "red",  x: 0.15, y: 0.45, number: 9  },
  { id: 21, team: "red",  x: 0.38, y: 0.75, number: 10 },
  { id: 22, team: "red",  x: 0.62, y: 0.75, number: 11 },
]

const scenarios: Scenario[] = [
  {
    id: 1,
    phase: "Aanval",
    title: "Counter-aanval 3v2",
    description: "Jullie hebben de bal gewonnen op het middenveld. Drie blauwe spelers lopen de counter in een 3v2 situatie tegen twee rode verdedigers.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.78, y: 0.78, number: 2  },
      { id: 3,  team: "blue", x: 0.44, y: 0.82, number: 3  },
      { id: 4,  team: "blue", x: 0.56, y: 0.82, number: 4  },
      { id: 5,  team: "blue", x: 0.22, y: 0.78, number: 5  },
      { id: 6,  team: "blue", x: 0.38, y: 0.62, number: 6  },
      { id: 7,  team: "blue", x: 0.22, y: 0.28, number: 7,  highlighted: true },
      { id: 8,  team: "blue", x: 0.62, y: 0.62, number: 8  },
      { id: 9,  team: "blue", x: 0.5,  y: 0.18, number: 9,  highlighted: true },
      { id: 10, team: "blue", x: 0.5,  y: 0.38, number: 10, highlighted: true },
      { id: 11, team: "blue", x: 0.78, y: 0.28, number: 11, highlighted: true },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.78, y: 0.22, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.18, number: 3,  highlighted: true },
      { id: 15, team: "red",  x: 0.58, y: 0.18, number: 4,  highlighted: true },
      { id: 16, team: "red",  x: 0.22, y: 0.22, number: 5  },
      { id: 17, team: "red",  x: 0.4,  y: 0.48, number: 6  },
      { id: 18, team: "red",  x: 0.2,  y: 0.55, number: 7  },
      { id: 19, team: "red",  x: 0.6,  y: 0.48, number: 8  },
      { id: 20, team: "red",  x: 0.5,  y: 0.62, number: 9  },
      { id: 21, team: "red",  x: 0.5,  y: 0.55, number: 10 },
      { id: 22, team: "red",  x: 0.8,  y: 0.55, number: 11 },
    ],
    ball: { x: 0.5, y: 0.38 },
    question: "Jij bent speler 10 (blauw) met de bal. Je hebt een 3v2 voordeel. Hoe speel jij de counter af?",
    options: [
      { text: "Direct schieten vanuit het middenveld", score: 0, explanation: "Te ver van goal — lage kans op succes." },
      { text: "Speel de bal breed naar de winger die vrijstaat, maak dan de 2v1 af", score: 3, explanation: "Correct! Door de bal breed te spelen creëer je de 2v1 voor de winger en geforceerd de verdediger te kiezen." },
      { text: "Wacht tot een verdediger je aanvalt en dribble dan langs hem", score: 1, explanation: "Te risicovol — bij verlies sta je kwetsbaar." },
      { text: "Speel terug naar de middenvelder voor herstart", score: 0, explanation: "Je verliest het snelheidsvoordeel van de counter." },
    ],
  },
  {
    id: 2,
    phase: "Opbouw",
    title: "Hoge druk ontsnappen",
    description: "De tegenstander drukt hoog en aggressief. Jouw keeper heeft de bal. Twee rode aanvallers komen snel op hem af.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1,  highlighted: true },
      { id: 2,  team: "blue", x: 0.78, y: 0.82, number: 2  },
      { id: 3,  team: "blue", x: 0.42, y: 0.88, number: 3,  highlighted: true },
      { id: 4,  team: "blue", x: 0.58, y: 0.88, number: 4,  highlighted: true },
      { id: 5,  team: "blue", x: 0.22, y: 0.82, number: 5  },
      { id: 6,  team: "blue", x: 0.35, y: 0.7,  number: 6,  highlighted: true },
      { id: 7,  team: "blue", x: 0.18, y: 0.62, number: 7  },
      { id: 8,  team: "blue", x: 0.62, y: 0.55, number: 8  },
      { id: 9,  team: "blue", x: 0.5,  y: 0.38, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.58, number: 10 },
      { id: 11, team: "blue", x: 0.82, y: 0.62, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.82, y: 0.15, number: 2  },
      { id: 14, team: "red",  x: 0.4,  y: 0.18, number: 3  },
      { id: 15, team: "red",  x: 0.6,  y: 0.18, number: 4  },
      { id: 16, team: "red",  x: 0.18, y: 0.15, number: 5  },
      { id: 17, team: "red",  x: 0.38, y: 0.45, number: 6  },
      { id: 18, team: "red",  x: 0.15, y: 0.58, number: 7  },
      { id: 19, team: "red",  x: 0.65, y: 0.45, number: 8  },
      { id: 20, team: "red",  x: 0.45, y: 0.75, number: 9,  highlighted: true },
      { id: 21, team: "red",  x: 0.5,  y: 0.72, number: 10, highlighted: true },
      { id: 22, team: "red",  x: 0.85, y: 0.58, number: 11 },
    ],
    ball: { x: 0.5, y: 0.97 },
    question: "Als keeper (blauw 1) staan twee aanvallers op je. CM6 heeft zich vrijgeloopt. Wat is de slimste actie?",
    options: [
      { text: "Lange bal naar de spits sturen", score: 1, explanation: "Acceptabel maar verlies je balbezit makkelijk." },
      { text: "Korte pass naar de CB die op ruimte staat", score: 2, explanation: "Goed — maar de CB staat nog onder druk." },
      { text: "Pass naar CM6 die zich heeft vrijgeloopt", score: 3, explanation: "Uitstekend! CM6 is vrijgespeeld en kan de druk ontsnappen met goed zicht op het veld." },
      { text: "Houd de bal vast en wacht", score: 0, explanation: "Niet toegestaan en verlies je initiatief." },
    ],
  },
  {
    id: 3,
    phase: "Aanval",
    title: "Overlapping run benutten",
    description: "Jouw linksback (LB5) maakt een overlapping run langs de linksbuiten (LW7). Er is ruimte op de flank.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.8,  y: 0.72, number: 2  },
      { id: 3,  team: "blue", x: 0.44, y: 0.82, number: 3  },
      { id: 4,  team: "blue", x: 0.56, y: 0.82, number: 4  },
      { id: 5,  team: "blue", x: 0.08, y: 0.28, number: 5,  highlighted: true },
      { id: 6,  team: "blue", x: 0.4,  y: 0.55, number: 6  },
      { id: 7,  team: "blue", x: 0.18, y: 0.48, number: 7,  highlighted: true },
      { id: 8,  team: "blue", x: 0.6,  y: 0.55, number: 8  },
      { id: 9,  team: "blue", x: 0.5,  y: 0.18, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.35, number: 10 },
      { id: 11, team: "blue", x: 0.85, y: 0.42, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.82, y: 0.22, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.2,  number: 3  },
      { id: 15, team: "red",  x: 0.58, y: 0.2,  number: 4  },
      { id: 16, team: "red",  x: 0.18, y: 0.22, number: 5  },
      { id: 17, team: "red",  x: 0.38, y: 0.48, number: 6  },
      { id: 18, team: "red",  x: 0.16, y: 0.62, number: 7,  highlighted: true },
      { id: 19, team: "red",  x: 0.62, y: 0.48, number: 8  },
      { id: 20, team: "red",  x: 0.5,  y: 0.62, number: 9  },
      { id: 21, team: "red",  x: 0.5,  y: 0.55, number: 10 },
      { id: 22, team: "red",  x: 0.84, y: 0.62, number: 11 },
    ],
    ball: { x: 0.18, y: 0.48 },
    question: "Jij bent LW7 (blauw) met de bal. LB5 maakt een overlapping run langs jou. Wat is de juiste actie?",
    options: [
      { text: "Zelf naar binnen dribbelen richting goal", score: 1, explanation: "Kan werken, maar je benut de overlapping run niet." },
      { text: "LB5 inspelen langs de buitenkant — gebruik de overlapping run", score: 3, explanation: "Briljant! LB5 staat vrij en creëert een 2v1 op de flank." },
      { text: "Terugspeelbal naar CM voor herstart", score: 0, explanation: "Je verliest momentum en de overlapping run was voor niets." },
      { text: "Hoge cross direct naar de spits", score: 1, explanation: "Minder effectief — LB5 staat in een betere positie." },
    ],
  },
  {
    id: 4,
    phase: "Verdediging",
    title: "1v1 verdedigen",
    description: "De rode spits (9) breekt door met de bal en staat 1v1 tegenover jou als centrale verdediger (CB4).",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1,  highlighted: true },
      { id: 2,  team: "blue", x: 0.78, y: 0.68, number: 2  },
      { id: 3,  team: "blue", x: 0.42, y: 0.8,  number: 3  },
      { id: 4,  team: "blue", x: 0.56, y: 0.75, number: 4,  highlighted: true },
      { id: 5,  team: "blue", x: 0.22, y: 0.68, number: 5  },
      { id: 6,  team: "blue", x: 0.4,  y: 0.58, number: 6  },
      { id: 7,  team: "blue", x: 0.18, y: 0.45, number: 7  },
      { id: 8,  team: "blue", x: 0.6,  y: 0.58, number: 8  },
      { id: 9,  team: "blue", x: 0.5,  y: 0.28, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.42, number: 10 },
      { id: 11, team: "blue", x: 0.82, y: 0.45, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.8,  y: 0.2,  number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.18, number: 3  },
      { id: 15, team: "red",  x: 0.58, y: 0.18, number: 4  },
      { id: 16, team: "red",  x: 0.2,  y: 0.2,  number: 5  },
      { id: 17, team: "red",  x: 0.4,  y: 0.42, number: 6  },
      { id: 18, team: "red",  x: 0.18, y: 0.52, number: 7  },
      { id: 19, team: "red",  x: 0.6,  y: 0.42, number: 8  },
      { id: 20, team: "red",  x: 0.5,  y: 0.62, number: 9,  highlighted: true },
      { id: 21, team: "red",  x: 0.5,  y: 0.52, number: 10 },
      { id: 22, team: "red",  x: 0.82, y: 0.52, number: 11 },
    ],
    ball: { x: 0.5, y: 0.62 },
    question: "Jij bent CB4 (blauw). Rode spits 9 staat 1v1 tegenover jou. Hoe verdedig jij?",
    options: [
      { text: "Direct insliden om de bal te pakken", score: 0, explanation: "Te risicovol! Als je mist sta je helemaal vrij." },
      { text: "Positie houden tussen spits en goal — wacht op de fout", score: 3, explanation: "Correct! Dwing de spits naar buiten of wacht tot hij een fout maakt." },
      { text: "Aanvallen op het moment dat hij iets vertraagt", score: 2, explanation: "Kan werken maar timing is cruciaal." },
      { text: "Roep de keeper en ren weg", score: 0, explanation: "Je laat de spits volledig vrij — nooit doen!" },
    ],
  },
  {
    id: 5,
    phase: "Standaard situatie",
    title: "Corner verdedigen",
    description: "De tegenstander neemt een hoekschop. Jouw team staat in de zestien. Drie rode spelers komen op het doel af.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.95, number: 1,  highlighted: true },
      { id: 2,  team: "blue", x: 0.72, y: 0.8,  number: 2  },
      { id: 3,  team: "blue", x: 0.42, y: 0.84, number: 3,  highlighted: true },
      { id: 4,  team: "blue", x: 0.58, y: 0.84, number: 4,  highlighted: true },
      { id: 5,  team: "blue", x: 0.28, y: 0.8,  number: 5  },
      { id: 6,  team: "blue", x: 0.48, y: 0.72, number: 6  },
      { id: 7,  team: "blue", x: 0.15, y: 0.8,  number: 7  },
      { id: 8,  team: "blue", x: 0.65, y: 0.72, number: 8  },
      { id: 9,  team: "blue", x: 0.35, y: 0.72, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.78, number: 10 },
      { id: 11, team: "blue", x: 0.85, y: 0.8,  number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.05, number: 1  },
      { id: 13, team: "red",  x: 0.9,  y: 0.78, number: 2  },
      { id: 14, team: "red",  x: 0.38, y: 0.72, number: 3  },
      { id: 15, team: "red",  x: 0.55, y: 0.72, number: 4  },
      { id: 16, team: "red",  x: 0.1,  y: 0.78, number: 5  },
      { id: 17, team: "red",  x: 0.42, y: 0.68, number: 6,  highlighted: true },
      { id: 18, team: "red",  x: 0.15, y: 0.88, number: 7,  highlighted: true },
      { id: 19, team: "red",  x: 0.6,  y: 0.68, number: 8  },
      { id: 20, team: "red",  x: 0.45, y: 0.82, number: 9,  highlighted: true },
      { id: 21, team: "red",  x: 0.5,  y: 0.88, number: 10 },
      { id: 22, team: "red",  x: 0.85, y: 0.88, number: 11 },
    ],
    ball: { x: 0.02, y: 0.98 },
    question: "De tegenstander neemt een corner. Hoe organiseer jij jouw verdediging?",
    options: [
      { text: "Iedereen man-op-man dekken", score: 2, explanation: "Acceptabel maar kwetsbaar bij loopacties." },
      { text: "Mix van zone en man-op-man: twee op de paal, rest dekkt zones", score: 3, explanation: "Professionele aanpak! Dit combineert het beste van beide systemen." },
      { text: "Volledig zone — iedereen op vaste posities", score: 2, explanation: "Goed bij getrainde teams, maar kwetsbaar bij slimme loopacties." },
      { text: "Uitlopen om de corner weg te koppen", score: 0, explanation: "Veel te risicovol — als je mist sta je volledig ongedekt." },
    ],
  },
  {
    id: 6,
    phase: "Transitie",
    title: "Defensieve transitie",
    description: "Jullie zijn de bal kwijt op de eigen helft. Drie rode spelers lopen al de counter in. Jullie staan hoog en open.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.82, y: 0.45, number: 2  },
      { id: 3,  team: "blue", x: 0.42, y: 0.72, number: 3,  highlighted: true },
      { id: 4,  team: "blue", x: 0.58, y: 0.72, number: 4,  highlighted: true },
      { id: 5,  team: "blue", x: 0.18, y: 0.45, number: 5  },
      { id: 6,  team: "blue", x: 0.38, y: 0.35, number: 6,  highlighted: true },
      { id: 7,  team: "blue", x: 0.12, y: 0.25, number: 7  },
      { id: 8,  team: "blue", x: 0.6,  y: 0.35, number: 8,  highlighted: true },
      { id: 9,  team: "blue", x: 0.5,  y: 0.12, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.25, number: 10 },
      { id: 11, team: "blue", x: 0.88, y: 0.25, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.75, y: 0.35, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.25, number: 3  },
      { id: 15, team: "red",  x: 0.58, y: 0.25, number: 4  },
      { id: 16, team: "red",  x: 0.25, y: 0.35, number: 5  },
      { id: 17, team: "red",  x: 0.4,  y: 0.48, number: 6  },
      { id: 18, team: "red",  x: 0.22, y: 0.55, number: 7,  highlighted: true },
      { id: 19, team: "red",  x: 0.6,  y: 0.48, number: 8  },
      { id: 20, team: "red",  x: 0.5,  y: 0.55, number: 9,  highlighted: true },
      { id: 21, team: "red",  x: 0.5,  y: 0.62, number: 10 },
      { id: 22, team: "red",  x: 0.78, y: 0.55, number: 11, highlighted: true },
    ],
    ball: { x: 0.5, y: 0.5 },
    question: "Bal verloren — drie rode spelers lopen de counter. Wat is de EERSTE prioriteit voor jouw team?",
    options: [
      { text: "Direct de baldrager aanvallen", score: 1, explanation: "Kan leiden tot gevaarlijke ruimtes achter je." },
      { text: "Compact blok vormen tussen bal en doel — terugrennen", score: 3, explanation: "Correct! Verklein de ruimte, breng structuur terug, beperk de counter." },
      { text: "Wachten op instructies van de coach", score: 0, explanation: "In het spel is er geen tijd om te wachten — handelen!" },
      { text: "Zijdelings drukken om ruimte te beperken", score: 1, explanation: "Goed idee maar eerst terugrennen heeft prioriteit." },
    ],
  },
  {
    id: 7,
    phase: "Aanval",
    title: "Derde-man-combinatie",
    description: "CAM10 heeft de bal. ST9 maakt een afleidingsloop. CM8 breekt diep door met een third man run.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.75, y: 0.72, number: 2  },
      { id: 3,  team: "blue", x: 0.44, y: 0.82, number: 3  },
      { id: 4,  team: "blue", x: 0.56, y: 0.82, number: 4  },
      { id: 5,  team: "blue", x: 0.25, y: 0.72, number: 5  },
      { id: 6,  team: "blue", x: 0.35, y: 0.48, number: 6  },
      { id: 7,  team: "blue", x: 0.15, y: 0.28, number: 7  },
      { id: 8,  team: "blue", x: 0.38, y: 0.28, number: 8,  highlighted: true },
      { id: 9,  team: "blue", x: 0.52, y: 0.18, number: 9,  highlighted: true },
      { id: 10, team: "blue", x: 0.5,  y: 0.38, number: 10, highlighted: true },
      { id: 11, team: "blue", x: 0.82, y: 0.32, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.8,  y: 0.2,  number: 2  },
      { id: 14, team: "red",  x: 0.4,  y: 0.18, number: 3,  highlighted: true },
      { id: 15, team: "red",  x: 0.6,  y: 0.18, number: 4,  highlighted: true },
      { id: 16, team: "red",  x: 0.2,  y: 0.2,  number: 5  },
      { id: 17, team: "red",  x: 0.42, y: 0.42, number: 6  },
      { id: 18, team: "red",  x: 0.18, y: 0.52, number: 7  },
      { id: 19, team: "red",  x: 0.58, y: 0.42, number: 8  },
      { id: 20, team: "red",  x: 0.5,  y: 0.58, number: 9  },
      { id: 21, team: "red",  x: 0.5,  y: 0.5,  number: 10 },
      { id: 22, team: "red",  x: 0.82, y: 0.52, number: 11 },
    ],
    ball: { x: 0.5, y: 0.38 },
    question: "Jij bent CAM10 (blauw). ST9 lokt de verdedigers mee. CM8 breekt ongemerkt diep door. Wat doe je?",
    options: [
      { text: "ST9 aanspelen op zijn afleidingsloop", score: 1, explanation: "ST9 staat onder druk van verdedigers — niet de beste optie." },
      { text: "CM8 aanspelen die ongemerkt doorbreekt — third man run", score: 3, explanation: "Excellent! Dit is precies de bedoeling van de third man run. CM8 is vrij." },
      { text: "Zelf een schot wagen", score: 1, explanation: "Mogelijk, maar CM8 staat in een betere positie." },
      { text: "Terug naar de verdediging voor herstart", score: 0, explanation: "Je verliest de kans — CM8 verliest zijn vrijstaande positie." },
    ],
  },
  {
    id: 8,
    phase: "Aanval",
    title: "De beslissende actie",
    description: "Jij staat vrij op de rand van de zestien als rechtsbuiten. ST9 staat vrijstaand bij de tweede paal. Keeper staat ver voor zijn doel.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.78, y: 0.68, number: 2  },
      { id: 3,  team: "blue", x: 0.44, y: 0.82, number: 3  },
      { id: 4,  team: "blue", x: 0.56, y: 0.82, number: 4  },
      { id: 5,  team: "blue", x: 0.22, y: 0.68, number: 5  },
      { id: 6,  team: "blue", x: 0.4,  y: 0.52, number: 6  },
      { id: 7,  team: "blue", x: 0.12, y: 0.22, number: 7  },
      { id: 8,  team: "blue", x: 0.6,  y: 0.52, number: 8  },
      { id: 9,  team: "blue", x: 0.35, y: 0.12, number: 9,  highlighted: true },
      { id: 10, team: "blue", x: 0.5,  y: 0.32, number: 10 },
      { id: 11, team: "blue", x: 0.82, y: 0.28, number: 11, highlighted: true },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1,  highlighted: true },
      { id: 13, team: "red",  x: 0.8,  y: 0.18, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.2,  number: 3  },
      { id: 15, team: "red",  x: 0.58, y: 0.2,  number: 4  },
      { id: 16, team: "red",  x: 0.2,  y: 0.18, number: 5  },
      { id: 17, team: "red",  x: 0.4,  y: 0.42, number: 6  },
      { id: 18, team: "red",  x: 0.18, y: 0.55, number: 7  },
      { id: 19, team: "red",  x: 0.6,  y: 0.42, number: 8  },
      { id: 20, team: "red",  x: 0.5,  y: 0.62, number: 9  },
      { id: 21, team: "red",  x: 0.5,  y: 0.5,  number: 10 },
      { id: 22, team: "red",  x: 0.82, y: 0.55, number: 11 },
    ],
    ball: { x: 0.82, y: 0.28 },
    question: "Jij bent RW11. ST9 staat vrijstaand bij de tweede paal. Keeper staat voor zijn doel. Wat is de beste actie?",
    options: [
      { text: "Zelf schieten op de keeper", score: 1, explanation: "Je staat goed, maar ST9 heeft een nog betere kans." },
      { text: "Lage voorzet naar ST9 bij de tweede paal", score: 3, explanation: "Perfect! ST9 staat vrijstaand — een lage voorzet geeft hem een eenvoudige intikker." },
      { text: "Terug naar CM voor herstart", score: 0, explanation: "Je verliest een uitstekende scoringskans." },
      { text: "Hoge cross op hoofd spits", score: 1, explanation: "Minder effectief — een lage voorzet is kansrijker." },
    ],
  },
]

function getPhaseColor(phase: string): string {
  switch (phase) {
    case "Aanval": return "#22c55e"
    case "Verdediging": return "#ef4444"
    case "Opbouw": return "#3b82f6"
    case "Transitie": return "#f59e0b"
    case "Standaard situatie": return "#a855f7"
    default: return "#6b7280"
  }
}

function getIntelligenceLabel(score: number): { label: string; color: string } {
  if (score >= 22) return { label: "Tactisch Genie", color: "#FBBF24" }
  if (score >= 18) return { label: "Elite IQ", color: "#4FA9E6" }
  if (score >= 14) return { label: "Hoog Voetbal IQ", color: "#34D399" }
  if (score >= 10) return { label: "Gemiddeld IQ", color: "#93C5FD" }
  if (score >= 6)  return { label: "Ontwikkelend IQ", color: "#FB923C" }
  return { label: "Beginner IQ", color: "#F87171" }
}

function PitchSVG({
  players,
  ball,
}: {
  players: PlayerPos[]
  ball: BallPos
}) {
  return (
    <div style={{ perspective: "1000px", perspectiveOrigin: "50% 5%", marginBottom: "8px" }}>
      <div
        style={{
          transform: "rotateX(48deg)",
          transformOrigin: "50% 100%",
          filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.8))",
        }}
      >
        <svg viewBox="0 0 700 480" width="100%" style={{ display: "block" }}>
          {/* Field base */}
          <rect x={20} y={10} width={660} height={460} rx={3} fill="#1B5E2A" />

          {/* Grass stripes */}
          {Array.from({ length: 11 }).map((_, i) => (
            <rect
              key={i}
              x={20}
              y={10 + i * 42}
              width={660}
              height={42}
              fill={i % 2 === 0 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.03)"}
            />
          ))}

          {/* Field border */}
          <rect x={20} y={10} width={660} height={460} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />

          {/* Center line */}
          <line x1={20} y1={230} x2={680} y2={230} stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />

          {/* Center circle */}
          <circle cx={350} cy={230} r={52} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />

          {/* Center dot */}
          <circle cx={350} cy={230} r={3.5} fill="rgba(255,255,255,0.8)" />

          {/* Top penalty area */}
          <rect x={178} y={10} width={344} height={98} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />

          {/* Bottom penalty area */}
          <rect x={178} y={372} width={344} height={98} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />

          {/* Top 6-yard box */}
          <rect x={255} y={10} width={190} height={42} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />

          {/* Bottom 6-yard box */}
          <rect x={255} y={428} width={190} height={42} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />

          {/* Top goal */}
          <rect x={308} y={0} width={84} height={14} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />

          {/* Bottom goal */}
          <rect x={308} y={466} width={84} height={14} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />

          {/* Top penalty spot */}
          <circle cx={350} cy={80} r={3} fill="rgba(255,255,255,0.7)" />

          {/* Bottom penalty spot */}
          <circle cx={350} cy={400} r={3} fill="rgba(255,255,255,0.7)" />

          {/* Top arc */}
          <path d="M 178 108 A 55 55 0 0 0 522 108" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />

          {/* Bottom arc */}
          <path d="M 178 372 A 55 55 0 0 1 522 372" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />

          {/* Players */}
          {players.map((player) => {
            const cx = player.x * 660 + 20
            const cy = player.y * 460 + 10
            return (
              <g key={player.id} transform={`translate(${cx},${cy})`} style={{ transition: "transform 0.8s ease" }}>
                {player.highlighted && (
                  <circle cx={0} cy={0} r={19} fill="none" stroke="#FBBF24" strokeWidth={2.5} opacity={0.8} />
                )}
                <circle
                  cx={0}
                  cy={0}
                  r={14}
                  fill={player.team === "blue" ? "#1D4ED8" : "#B91C1C"}
                  stroke="white"
                  strokeWidth={1.5}
                />
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                >
                  {player.number}
                </text>
              </g>
            )
          })}

          {/* Ball */}
          {(() => {
            const bcx = ball.x * 660 + 20
            const bcy = ball.y * 460 + 10
            return (
              <g transform={`translate(${bcx},${bcy})`} style={{ transition: "transform 0.8s ease" }}>
                <circle cx={0} cy={0} r={7} fill="white" stroke="#DDD" strokeWidth={1} />
              </g>
            )
          })()}
        </svg>
      </div>
    </div>
  )
}

export default function TacticalGamePage() {
  const [gamePhase, setGamePhase] = useState<GamePhase>("intro")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [currentPlayers, setCurrentPlayers] = useState<PlayerPos[]>([...defaultPlayers])
  const [currentBall, setCurrentBall] = useState<BallPos>({ x: 0.5, y: 0.5 })
  const [dots, setDots] = useState(0)

  const scenario = scenarios[currentIndex]
  const totalScore = scores.reduce((a, b) => a + b, 0)

  // Loading dots animation
  useEffect(() => {
    if (gamePhase !== "watching") return
    const interval = setInterval(() => {
      setDots((d) => (d + 1) % 4)
    }, 400)
    return () => clearInterval(interval)
  }, [gamePhase])

  // watching → question auto-advance
  useEffect(() => {
    if (gamePhase !== "watching") return
    const timer = setTimeout(() => {
      setGamePhase("question")
    }, 1800)
    return () => clearTimeout(timer)
  }, [gamePhase, currentIndex])

  // feedback → next scenario or results
  useEffect(() => {
    if (gamePhase !== "feedback") return
    const timer = setTimeout(() => {
      if (currentIndex + 1 >= scenarios.length) {
        setGamePhase("results")
      } else {
        setCurrentIndex((i) => i + 1)
        setSelectedOption(null)
        setGamePhase("watching")
      }
    }, 2200)
    return () => clearTimeout(timer)
  }, [gamePhase, currentIndex])

  // Load scenario players/ball when index changes (and we enter watching)
  useEffect(() => {
    if (gamePhase !== "watching") return
    setCurrentPlayers(scenarios[currentIndex].players)
    setCurrentBall(scenarios[currentIndex].ball)
  }, [gamePhase, currentIndex])

  const handleStart = useCallback(() => {
    setCurrentIndex(0)
    setScores([])
    setSelectedOption(null)
    setCurrentPlayers(scenarios[0].players)
    setCurrentBall(scenarios[0].ball)
    setGamePhase("watching")
  }, [])

  const handleOptionSelect = useCallback(
    (optionIndex: number) => {
      if (gamePhase !== "question") return
      const score = scenario.options[optionIndex].score
      setScores((s) => [...s, score])
      setSelectedOption(optionIndex)
      setGamePhase("feedback")
    },
    [gamePhase, scenario]
  )

  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setScores([])
    setSelectedOption(null)
    setCurrentPlayers([...defaultPlayers])
    setCurrentBall({ x: 0.5, y: 0.5 })
    setGamePhase("intro")
  }, [])

  const getBestOptionIndex = (options: Option[]): number => {
    let best = 0
    options.forEach((o, i) => {
      if (o.score > options[best].score) best = i
    })
    return best
  }

  // ─── INTRO ───────────────────────────────────────────────────────────────────
  if (gamePhase === "intro") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0e1a2b",
          padding: "32px 16px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Back link */}
          <Link
            href="/dashboard/player/card"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              fontSize: "14px",
              marginBottom: "32px",
            }}
          >
            ← Terug naar profiel
          </Link>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1D4ED8, #4FA9E6)",
                marginBottom: "20px",
                boxShadow: "0 0 40px rgba(79,169,230,0.3)",
              }}
            >
              <Brain size={36} color="white" />
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 800,
                color: "white",
                margin: "0 0 12px",
                letterSpacing: "-0.5px",
              }}
            >
              Tactisch IQ Spel
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", maxWidth: "480px", margin: "0 auto 8px" }}>
              8 realistische 11v11 voetbalscenario's. Analyseer de situatie en maak de juiste tactische keuze.
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
              Maximale score: 24 punten
            </p>
          </div>

          {/* Pitch preview */}
          <div style={{ maxWidth: "600px", margin: "0 auto 40px", opacity: 0.7 }}>
            <PitchSVG players={defaultPlayers} ball={{ x: 0.5, y: 0.5 }} />
          </div>

          {/* Info cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "36px",
            }}
          >
            {[
              { icon: "⚽", label: "8 Scenario's", sub: "Alle fases van het spel" },
              { icon: "🧠", label: "Tactische keuzes", sub: "4 opties per situatie" },
              { icon: "🏆", label: "IQ Rating", sub: "Van Beginner tot Genie" },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{card.icon}</div>
                <div style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>{card.label}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "4px" }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Start button */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleStart}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "linear-gradient(135deg, #1D4ED8, #4FA9E6)",
                color: "white",
                border: "none",
                borderRadius: "14px",
                padding: "16px 40px",
                fontSize: "18px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(79,169,230,0.35)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(79,169,230,0.5)"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(79,169,230,0.35)"
              }}
            >
              Start spel
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── RESULTS ─────────────────────────────────────────────────────────────────
  if (gamePhase === "results") {
    const { label, color } = getIntelligenceLabel(totalScore)
    const pct = (totalScore / 24) * 100

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0e1a2b",
          padding: "32px 16px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {/* Trophy */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `rgba(251,191,36,0.15)`,
                border: "2px solid rgba(251,191,36,0.3)",
                marginBottom: "20px",
              }}
            >
              <Trophy size={40} color="#FBBF24" />
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "8px" }}>
              Jouw Voetbal IQ:
            </div>
            <div
              style={{
                fontSize: "clamp(28px, 6vw, 48px)",
                fontWeight: 800,
                color,
                marginBottom: "4px",
                textShadow: `0 0 30px ${color}66`,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: "clamp(40px, 8vw, 64px)",
                fontWeight: 900,
                color: "white",
                lineHeight: 1,
                marginBottom: "8px",
              }}
            >
              {totalScore}
              <span style={{ fontSize: "0.45em", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>/24</span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "8px",
              height: "12px",
              marginBottom: "32px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: "8px",
                background:
                  totalScore >= 18
                    ? "linear-gradient(90deg, #FBBF24, #F59E0B)"
                    : totalScore >= 14
                    ? "linear-gradient(90deg, #34D399, #10B981)"
                    : totalScore >= 10
                    ? "linear-gradient(90deg, #4FA9E6, #3B82F6)"
                    : "linear-gradient(90deg, #FB923C, #F97316)",
                transition: "width 1s ease",
              }}
            />
          </div>

          {/* Breakdown */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Scenario overzicht
            </div>
            {scenarios.map((s, i) => {
              const sc = scores[i] ?? 0
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: i < scenarios.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "white",
                        background: getPhaseColor(s.phase) + "33",
                        border: `1px solid ${getPhaseColor(s.phase)}55`,
                        borderRadius: "4px",
                        padding: "2px 6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.phase}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>{s.title}</span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: dot < sc ? "#FBBF24" : "rgba(255,255,255,0.15)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={handleRestart}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                borderRadius: "12px",
                padding: "14px 20px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                minWidth: "140px",
              }}
            >
              <RotateCcw size={16} />
              Opnieuw spelen
            </button>
            <Link
              href="/dashboard/player/card"
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #1D4ED8, #4FA9E6)",
                color: "white",
                borderRadius: "12px",
                padding: "14px 20px",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
                minWidth: "140px",
              }}
            >
              Terug naar profiel
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── PLAYING (watching / question / feedback) ────────────────────────────────
  const bestOptionIndex = getBestOptionIndex(scenario.options)
  const currentScoreInProgress = scores.reduce((a, b) => a + b, 0)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e1a2b",
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "800px",
          margin: "0 auto 16px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "15px" }}>
            Scenario {currentIndex + 1}/8
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "white",
              background: getPhaseColor(scenario.phase) + "33",
              border: `1px solid ${getPhaseColor(scenario.phase)}66`,
              borderRadius: "20px",
              padding: "3px 10px",
              fontWeight: 600,
            }}
          >
            {scenario.phase}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#FBBF24",
            fontWeight: 700,
            fontSize: "15px",
          }}
        >
          <Trophy size={16} />
          Score: {currentScoreInProgress}/
          {currentIndex * 3}
        </div>
      </div>

      {/* Pitch */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <PitchSVG players={currentPlayers} ball={currentBall} />

        {/* Scenario description */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {scenario.title}
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
            {scenario.description}
          </p>
        </div>
      </div>

      {/* Question panel */}
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {gamePhase === "watching" && (
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", fontWeight: 500 }}>
              Analyseer de situatie{"·".repeat(dots)}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "16px" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: dots > i ? "#4FA9E6" : "rgba(255,255,255,0.15)",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {(gamePhase === "question" || gamePhase === "feedback") && (
          <div>
            <p
              style={{
                color: "white",
                fontSize: "clamp(14px,2.5vw,17px)",
                fontWeight: 700,
                marginBottom: "16px",
                lineHeight: 1.4,
              }}
            >
              {scenario.question}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {scenario.options.map((option, i) => {
                let bg = "rgba(255,255,255,0.05)"
                let border = "rgba(255,255,255,0.1)"
                let textColor = "rgba(255,255,255,0.8)"

                if (gamePhase === "feedback") {
                  if (i === selectedOption) {
                    if (option.score >= 2) {
                      bg = "rgba(34,197,94,0.15)"
                      border = "#22c55e"
                      textColor = "#86efac"
                    } else {
                      bg = "rgba(239,68,68,0.15)"
                      border = "#ef4444"
                      textColor = "#fca5a5"
                    }
                  } else if (i === bestOptionIndex && i !== selectedOption) {
                    bg = "rgba(251,191,36,0.08)"
                    border = "#FBBF24"
                    textColor = "#fde68a"
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(i)}
                    disabled={gamePhase === "feedback"}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: `1px solid ${border}`,
                      background: bg,
                      color: textColor,
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: gamePhase === "feedback" ? "default" : "pointer",
                      transition: "all 0.15s",
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) => {
                      if (gamePhase !== "question") return
                      ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(79,169,230,0.1)"
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,169,230,0.3)"
                    }}
                    onMouseLeave={(e) => {
                      if (gamePhase !== "question") return
                      ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.3)", marginRight: "10px", fontWeight: 400 }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {option.text}
                  </button>
                )
              })}
            </div>

            {/* Feedback explanation */}
            {gamePhase === "feedback" && selectedOption !== null && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background:
                    scenario.options[selectedOption].score >= 2
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(239,68,68,0.1)",
                  border: `1px solid ${scenario.options[selectedOption].score >= 2 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    color:
                      scenario.options[selectedOption].score >= 2
                        ? "#86efac"
                        : "#fca5a5",
                    fontSize: "14px",
                    margin: 0,
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {scenario.options[selectedOption].explanation}
                </p>
                <span
                  style={{
                    color: "#FBBF24",
                    fontWeight: 800,
                    fontSize: "16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  +{scenario.options[selectedOption].score} {scenario.options[selectedOption].score === 1 ? "punt" : "punten"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
