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
type GameMode = "classic" | "infinite"

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
  {
    id: 9,
    phase: "Verdediging",
    title: "Gecoördineerd Pressing",
    description: "De tegenstander probeert vanuit de opbouw door jullie pressing heen te spelen. Jouw team staat georganiseerd en wacht op het pressing-signaal van de voorste linie.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.78, y: 0.62, number: 2  },
      { id: 3,  team: "blue", x: 0.42, y: 0.68, number: 3  },
      { id: 4,  team: "blue", x: 0.58, y: 0.68, number: 4  },
      { id: 5,  team: "blue", x: 0.22, y: 0.62, number: 5  },
      { id: 6,  team: "blue", x: 0.75, y: 0.48, number: 6,  highlighted: true },
      { id: 7,  team: "blue", x: 0.42, y: 0.45, number: 7,  highlighted: true },
      { id: 8,  team: "blue", x: 0.58, y: 0.45, number: 8,  highlighted: true },
      { id: 9,  team: "blue", x: 0.25, y: 0.48, number: 9,  highlighted: true },
      { id: 10, team: "blue", x: 0.42, y: 0.32, number: 10 },
      { id: 11, team: "blue", x: 0.58, y: 0.32, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.78, y: 0.18, number: 2  },
      { id: 14, team: "red",  x: 0.38, y: 0.12, number: 3,  highlighted: true },
      { id: 15, team: "red",  x: 0.62, y: 0.18, number: 4  },
      { id: 16, team: "red",  x: 0.22, y: 0.18, number: 5  },
      { id: 17, team: "red",  x: 0.5,  y: 0.32, number: 6  },
      { id: 18, team: "red",  x: 0.15, y: 0.42, number: 7  },
      { id: 19, team: "red",  x: 0.85, y: 0.42, number: 8  },
      { id: 20, team: "red",  x: 0.5,  y: 0.42, number: 9  },
      { id: 21, team: "red",  x: 0.42, y: 0.55, number: 10 },
      { id: 22, team: "red",  x: 0.62, y: 0.55, number: 11 },
    ],
    ball: { x: 0.38, y: 0.12 },
    question: "Rode CB3 heeft de bal en staat vaststaand. Wanneer zet jij als blauwe middenvelder de pressing in?",
    options: [
      { text: "Meteen zodra CB3 de bal ontvangt", score: 1, explanation: "Te vroeg — je geeft je positie prijs voordat de bal vast ligt." },
      { text: "Wacht tot CB3 de bal ontvangt en vaststaand staat — dan snel indrukken", score: 3, explanation: "Correct! Dit is het pressing-signaal. CB3 staat vast en heeft beperkte opties." },
      { text: "Pas drukken als de tegenstander de middenlijn oversteekt", score: 0, explanation: "Veel te laat — de pressing heeft dan geen effect meer." },
      { text: "Drukken zodra de keeper de bal weggooit", score: 1, explanation: "Iets te vroeg — je kunt je positie niet vasthouden over die afstand." },
    ],
  },
  {
    id: 10,
    phase: "Aanval",
    title: "Overschakelen van Flank",
    description: "Jullie hebben balbezit op links maar de tegenstander is samengetrokken op de linkerflank. De rechterflank staat compleet vrij.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.82, y: 0.68, number: 2,  highlighted: true },
      { id: 3,  team: "blue", x: 0.4,  y: 0.82, number: 3  },
      { id: 4,  team: "blue", x: 0.6,  y: 0.82, number: 4  },
      { id: 5,  team: "blue", x: 0.15, y: 0.58, number: 5  },
      { id: 6,  team: "blue", x: 0.5,  y: 0.65, number: 6  },
      { id: 7,  team: "blue", x: 0.22, y: 0.42, number: 7  },
      { id: 8,  team: "blue", x: 0.38, y: 0.5,  number: 8,  highlighted: true },
      { id: 9,  team: "blue", x: 0.08, y: 0.32, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.42, number: 10 },
      { id: 11, team: "blue", x: 0.88, y: 0.28, number: 11, highlighted: true },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.18, y: 0.22, number: 2  },
      { id: 14, team: "red",  x: 0.4,  y: 0.18, number: 3  },
      { id: 15, team: "red",  x: 0.55, y: 0.18, number: 4  },
      { id: 16, team: "red",  x: 0.12, y: 0.35, number: 5  },
      { id: 17, team: "red",  x: 0.32, y: 0.35, number: 6  },
      { id: 18, team: "red",  x: 0.12, y: 0.52, number: 7  },
      { id: 19, team: "red",  x: 0.62, y: 0.42, number: 8  },
      { id: 20, team: "red",  x: 0.28, y: 0.45, number: 9  },
      { id: 21, team: "red",  x: 0.32, y: 0.52, number: 10 },
      { id: 22, team: "red",  x: 0.65, y: 0.55, number: 11 },
    ],
    ball: { x: 0.38, y: 0.5 },
    question: "Jij bent CM8 (blauw) met de bal. De tegenstander is samengetrokken links. RB2 en RW11 staan vrij rechts. Wat doe je?",
    options: [
      { text: "Doorspelen langs de linkerflank waar de druk staat", score: 0, explanation: "Je speelt in de druk — dit biedt geen ruimte meer." },
      { text: "Diagonale bal naar RW11 of RB2 om van flank te wisselen", score: 3, explanation: "Uitstekend! Door te wisselen van flank benut je de open ruimte rechts." },
      { text: "Terugspelen naar de centrale verdediger voor herstart", score: 1, explanation: "Veilig, maar je benut de open rechterflank niet." },
      { text: "Zelf dribbelen door het midden", score: 1, explanation: "Moeilijk — de tegenstander staat compact in het midden." },
    ],
  },
  {
    id: 11,
    phase: "Opbouw",
    title: "Doeltrap Verdeling",
    description: "Keeper (blauw 1) neemt een doeltrap. De tegenstander loopt hoog druk met drie aanvallers. De centrale middenvelders hebben zich vrijgespeeld.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1,  highlighted: true },
      { id: 2,  team: "blue", x: 0.75, y: 0.82, number: 2  },
      { id: 3,  team: "blue", x: 0.38, y: 0.88, number: 3  },
      { id: 4,  team: "blue", x: 0.62, y: 0.88, number: 4  },
      { id: 5,  team: "blue", x: 0.25, y: 0.82, number: 5  },
      { id: 6,  team: "blue", x: 0.5,  y: 0.72, number: 6,  highlighted: true },
      { id: 7,  team: "blue", x: 0.32, y: 0.58, number: 7  },
      { id: 8,  team: "blue", x: 0.65, y: 0.58, number: 8,  highlighted: true },
      { id: 9,  team: "blue", x: 0.12, y: 0.35, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.42, number: 10 },
      { id: 11, team: "blue", x: 0.85, y: 0.42, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.78, y: 0.22, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.15, number: 3  },
      { id: 15, team: "red",  x: 0.58, y: 0.15, number: 4  },
      { id: 16, team: "red",  x: 0.22, y: 0.22, number: 5  },
      { id: 17, team: "red",  x: 0.5,  y: 0.35, number: 6  },
      { id: 18, team: "red",  x: 0.18, y: 0.55, number: 7,  highlighted: true },
      { id: 19, team: "red",  x: 0.82, y: 0.55, number: 8  },
      { id: 20, team: "red",  x: 0.45, y: 0.78, number: 9,  highlighted: true },
      { id: 21, team: "red",  x: 0.55, y: 0.78, number: 10, highlighted: true },
      { id: 22, team: "red",  x: 0.62, y: 0.45, number: 11 },
    ],
    ball: { x: 0.5, y: 0.97 },
    question: "Keeper (blauw 1) neemt een doeltrap. Rode aanvallers drukken hoog. CDM6 staat vrij op 30 meter. Wat is de beste keuze?",
    options: [
      { text: "Lange bal op de spits gooien", score: 1, explanation: "Riskant — verlies van balbezit is groot, maar kan de druk verlichten." },
      { text: "Korte bal naar de CB die onder druk staat", score: 0, explanation: "Gevaarlijk! CB staat onder directe druk — grote kans op balverlies vlak voor doel." },
      { text: "Speel CDM6 in die vrijstaat op 30 meter via het midden", score: 3, explanation: "Perfect! CDM6 staat vrij en kan het spel openen vanuit een drukvrije zone." },
      { text: "Bal lang langs de zijlijn — speel RB2 in", score: 2, explanation: "Acceptabel, maar CDM6 biedt een betere opbouwpositie vanuit het midden." },
    ],
  },
  {
    id: 12,
    phase: "Aanval",
    title: "Late Run in de Zestien",
    description: "CAM10 heeft de bal op de rand van de zestien. CM8 maakt een late, ongemarkeerde run de zestien in vanuit diep.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.78, y: 0.72, number: 2  },
      { id: 3,  team: "blue", x: 0.42, y: 0.82, number: 3  },
      { id: 4,  team: "blue", x: 0.58, y: 0.82, number: 4  },
      { id: 5,  team: "blue", x: 0.22, y: 0.72, number: 5  },
      { id: 6,  team: "blue", x: 0.5,  y: 0.62, number: 6  },
      { id: 7,  team: "blue", x: 0.18, y: 0.45, number: 7  },
      { id: 8,  team: "blue", x: 0.55, y: 0.22, number: 8,  highlighted: true },
      { id: 9,  team: "blue", x: 0.18, y: 0.18, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.35, number: 10, highlighted: true },
      { id: 11, team: "blue", x: 0.82, y: 0.25, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1,  highlighted: true },
      { id: 13, team: "red",  x: 0.8,  y: 0.18, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.14, number: 3,  highlighted: true },
      { id: 15, team: "red",  x: 0.58, y: 0.14, number: 4  },
      { id: 16, team: "red",  x: 0.2,  y: 0.18, number: 5  },
      { id: 17, team: "red",  x: 0.5,  y: 0.28, number: 6,  highlighted: true },
      { id: 18, team: "red",  x: 0.18, y: 0.45, number: 7  },
      { id: 19, team: "red",  x: 0.75, y: 0.38, number: 8  },
      { id: 20, team: "red",  x: 0.5,  y: 0.58, number: 9  },
      { id: 21, team: "red",  x: 0.42, y: 0.52, number: 10 },
      { id: 22, team: "red",  x: 0.65, y: 0.52, number: 11 },
    ],
    ball: { x: 0.5, y: 0.35 },
    question: "Jij bent CAM10 (blauw) met de bal. CM8 maakt een late ongemarkeerde run de zestien in. Rode DM6 staat op jou. Wat doe je?",
    options: [
      { text: "Zelf schieten op de keeper", score: 1, explanation: "Mogelijk, maar CM8 staat ongemarkeerd in een betere positie." },
      { text: "Wachten tot een betere kans zich voordoet", score: 0, explanation: "De late run van CM8 is tijdelijk — wacht je te lang dan is hij gedekt." },
      { text: "Pass spelen op CM8 die de zestien inloopt", score: 3, explanation: "Briljant! Timing is alles — CM8 is ongemarkeerd en loopt perfect de zestien in." },
      { text: "Terugspelen naar CDM6 voor herstart", score: 0, explanation: "Je verliest de kans volledig — CM8 loopt voor niets." },
    ],
  },
  {
    id: 13,
    phase: "Verdediging",
    title: "Voorzet Verdedigen",
    description: "Rode rechtervleugel (RM11) staat op het punt een voorzet te geven. Drie rode aanvallers positioneren zich in de zestien.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.95, number: 1,  highlighted: true },
      { id: 2,  team: "blue", x: 0.72, y: 0.75, number: 2,  highlighted: true },
      { id: 3,  team: "blue", x: 0.42, y: 0.84, number: 3,  highlighted: true },
      { id: 4,  team: "blue", x: 0.58, y: 0.84, number: 4,  highlighted: true },
      { id: 5,  team: "blue", x: 0.28, y: 0.75, number: 5  },
      { id: 6,  team: "blue", x: 0.42, y: 0.72, number: 6  },
      { id: 7,  team: "blue", x: 0.22, y: 0.58, number: 7  },
      { id: 8,  team: "blue", x: 0.62, y: 0.72, number: 8  },
      { id: 9,  team: "blue", x: 0.15, y: 0.45, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.58, number: 10 },
      { id: 11, team: "blue", x: 0.85, y: 0.55, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.8,  y: 0.22, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.18, number: 3  },
      { id: 15, team: "red",  x: 0.58, y: 0.18, number: 4  },
      { id: 16, team: "red",  x: 0.2,  y: 0.22, number: 5  },
      { id: 17, team: "red",  x: 0.5,  y: 0.35, number: 6  },
      { id: 18, team: "red",  x: 0.15, y: 0.45, number: 7  },
      { id: 19, team: "red",  x: 0.88, y: 0.55, number: 11, highlighted: true },
      { id: 20, team: "red",  x: 0.42, y: 0.72, number: 8,  highlighted: true },
      { id: 21, team: "red",  x: 0.5,  y: 0.78, number: 9,  highlighted: true },
      { id: 22, team: "red",  x: 0.35, y: 0.82, number: 10, highlighted: true },
    ],
    ball: { x: 0.88, y: 0.55 },
    question: "Rode RM11 staat op het punt een voorzet te geven. Jij bent CB4. Drie aanvallers staan klaar. Wat is jouw prioriteit?",
    options: [
      { text: "Uitlopen om de voorzet te onderscheppen", score: 1, explanation: "Riskant — als je de bal mist sta je compleet bloot." },
      { text: "Man-op-man de gevaarlijkste aanvaller dekken bij de eerste paal", score: 2, explanation: "Goed, maar vergeet de ruimte op de tweede paal niet." },
      { text: "Positie houden op de 5-meterslijn en de ruimte dekken", score: 3, explanation: "Excellent! Ruimtedekking op de 5-meterslijn geeft je de beste positie voor elke voorzet." },
      { text: "Naar de baldrager lopen om de voorzet te blokkeren", score: 1, explanation: "Dat is de taak van RB2 — jij moet in de zestien blijven." },
    ],
  },
  {
    id: 14,
    phase: "Standaard situatie",
    title: "Vrije Trap Verdedigen",
    description: "De tegenstander heeft een gevaarlijke vrije trap op 22 meter van het doel. Jij bent captain en organiseert de verdediging.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1,  highlighted: true },
      { id: 2,  team: "blue", x: 0.72, y: 0.82, number: 2  },
      { id: 3,  team: "blue", x: 0.42, y: 0.88, number: 3,  highlighted: true },
      { id: 4,  team: "blue", x: 0.52, y: 0.88, number: 4,  highlighted: true },
      { id: 5,  team: "blue", x: 0.32, y: 0.82, number: 5  },
      { id: 6,  team: "blue", x: 0.62, y: 0.88, number: 6,  highlighted: true },
      { id: 7,  team: "blue", x: 0.28, y: 0.75, number: 7  },
      { id: 8,  team: "blue", x: 0.68, y: 0.75, number: 8  },
      { id: 9,  team: "blue", x: 0.35, y: 0.72, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.72, number: 10 },
      { id: 11, team: "blue", x: 0.72, y: 0.72, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.78, y: 0.22, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.18, number: 3  },
      { id: 15, team: "red",  x: 0.58, y: 0.18, number: 4  },
      { id: 16, team: "red",  x: 0.22, y: 0.22, number: 5  },
      { id: 17, team: "red",  x: 0.5,  y: 0.35, number: 6  },
      { id: 18, team: "red",  x: 0.15, y: 0.48, number: 7  },
      { id: 19, team: "red",  x: 0.85, y: 0.48, number: 8  },
      { id: 20, team: "red",  x: 0.52, y: 0.68, number: 9,  highlighted: true },
      { id: 21, team: "red",  x: 0.38, y: 0.78, number: 10, highlighted: true },
      { id: 22, team: "red",  x: 0.65, y: 0.78, number: 11, highlighted: true },
    ],
    ball: { x: 0.52, y: 0.68 },
    question: "Vrije trap op 22 meter. Hoe organiseer jij de muur en verdediging in de zestien?",
    options: [
      { text: "Volle muur van 5 man, rest man-op-man", score: 2, explanation: "Goed maar de lange hoek is kwetsbaar als de muur te groot is." },
      { text: "3-mans muur + zonedekking in de zestien — keeper dekt lange hoek", score: 3, explanation: "Professioneel! De keeper dekt de lange hoek, muur de korte, zone covert de loopacties." },
      { text: "Iedereen in de muur — 7-mans muur", score: 0, explanation: "Dan sta je volledig ongedekt voor de rebound en loopacties." },
      { text: "Geen muur — iedereen man-op-man in de zestien", score: 1, explanation: "Risicovol bij een directe schietkans — je hebt geen muurbescherming." },
    ],
  },
  {
    id: 15,
    phase: "Aanval",
    title: "Spelen onder Druk",
    description: "Jij (blauw 10) ontvangt de bal met je rug naar het doel. Een rode speler drukt direct op je in. Meerdere ploeggenoten staan vrij.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.78, y: 0.72, number: 2  },
      { id: 3,  team: "blue", x: 0.42, y: 0.82, number: 3  },
      { id: 4,  team: "blue", x: 0.58, y: 0.82, number: 4  },
      { id: 5,  team: "blue", x: 0.22, y: 0.72, number: 5  },
      { id: 6,  team: "blue", x: 0.5,  y: 0.65, number: 6,  highlighted: true },
      { id: 7,  team: "blue", x: 0.25, y: 0.45, number: 7  },
      { id: 8,  team: "blue", x: 0.62, y: 0.48, number: 8,  highlighted: true },
      { id: 9,  team: "blue", x: 0.22, y: 0.28, number: 9,  highlighted: true },
      { id: 10, team: "blue", x: 0.5,  y: 0.52, number: 10, highlighted: true },
      { id: 11, team: "blue", x: 0.82, y: 0.32, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.78, y: 0.22, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.18, number: 3  },
      { id: 15, team: "red",  x: 0.58, y: 0.18, number: 4  },
      { id: 16, team: "red",  x: 0.22, y: 0.22, number: 5  },
      { id: 17, team: "red",  x: 0.5,  y: 0.32, number: 6  },
      { id: 18, team: "red",  x: 0.18, y: 0.45, number: 7  },
      { id: 19, team: "red",  x: 0.62, y: 0.42, number: 8  },
      { id: 20, team: "red",  x: 0.55, y: 0.48, number: 9,  highlighted: true },
      { id: 21, team: "red",  x: 0.42, y: 0.58, number: 10 },
      { id: 22, team: "red",  x: 0.65, y: 0.58, number: 11 },
    ],
    ball: { x: 0.5, y: 0.52 },
    question: "Jij bent CAM10 en ontvangt de bal met je rug naar het doel. Rode speler 9 drukt direct op je in. Wat is de slimste actie?",
    options: [
      { text: "Direct draaien en dribble langs de verdediger", score: 1, explanation: "Riskant — als je de bal verliest ben je in een gevaarlijke positie." },
      { text: "Bal afschermen en wachten", score: 0, explanation: "Passief spelen — je team kan zich niet vrijspelen." },
      { text: "Korte lay-off naar CDM6 en daarna vrijlopen", score: 3, explanation: "Excellent! Door terug te leggen en direct te bewegen creëer je ruimte en behoud je balbezit." },
      { text: "Lange dieptebal sturen op LW9", score: 2, explanation: "Kan werken als LW9 klaarstaat, maar de lay-off is veiliger en bouwt beter op." },
    ],
  },
  {
    id: 16,
    phase: "Verdediging",
    title: "Buitenspelval",
    description: "Rode DM6 staat op het punt een dieptebal te spelen op ST9 die een diepteloop maakt. Jouw verdedigingslinie staat op 35 meter.",
    players: [
      { id: 1,  team: "blue", x: 0.5,  y: 0.97, number: 1  },
      { id: 2,  team: "blue", x: 0.75, y: 0.62, number: 2,  highlighted: true },
      { id: 3,  team: "blue", x: 0.42, y: 0.65, number: 3,  highlighted: true },
      { id: 4,  team: "blue", x: 0.58, y: 0.65, number: 4,  highlighted: true },
      { id: 5,  team: "blue", x: 0.25, y: 0.62, number: 5,  highlighted: true },
      { id: 6,  team: "blue", x: 0.5,  y: 0.52, number: 6  },
      { id: 7,  team: "blue", x: 0.32, y: 0.42, number: 7  },
      { id: 8,  team: "blue", x: 0.65, y: 0.42, number: 8  },
      { id: 9,  team: "blue", x: 0.18, y: 0.25, number: 9  },
      { id: 10, team: "blue", x: 0.5,  y: 0.32, number: 10 },
      { id: 11, team: "blue", x: 0.82, y: 0.25, number: 11 },
      { id: 12, team: "red",  x: 0.5,  y: 0.03, number: 1  },
      { id: 13, team: "red",  x: 0.78, y: 0.22, number: 2  },
      { id: 14, team: "red",  x: 0.42, y: 0.18, number: 3  },
      { id: 15, team: "red",  x: 0.58, y: 0.18, number: 4  },
      { id: 16, team: "red",  x: 0.22, y: 0.22, number: 5  },
      { id: 17, team: "red",  x: 0.5,  y: 0.38, number: 6,  highlighted: true },
      { id: 18, team: "red",  x: 0.18, y: 0.45, number: 7  },
      { id: 19, team: "red",  x: 0.82, y: 0.45, number: 8  },
      { id: 20, team: "red",  x: 0.5,  y: 0.55, number: 9,  highlighted: true },
      { id: 21, team: "red",  x: 0.38, y: 0.52, number: 10 },
      { id: 22, team: "red",  x: 0.65, y: 0.52, number: 11 },
    ],
    ball: { x: 0.5, y: 0.38 },
    question: "Rode DM6 staat op het punt een dieptebal te spelen op ST9. Jij bent CB3. Wat doe je?",
    options: [
      { text: "Iedereen laten zakken richting doel", score: 1, explanation: "Geeft de spits ruimte voor de verdediging — risicovol." },
      { text: "Buitenspelval: coördineer de linie om samen op te tikken voor de bal gespeeld wordt", score: 3, explanation: "Perfect! Als je optikt voor de bal gespeeld wordt, zet je de spits buitenspel. Coördinatie is key." },
      { text: "Solo uitlopen op de spits en de linie negeren", score: 0, explanation: "Gevaarlijk! Solo uitlopen zonder de linie te coördineren is de slechtste optie." },
      { text: "De linie vasthouden — niet optrekken, niet zakken", score: 2, explanation: "Veilig maar je benut de buitenspelval niet — de spits kan toch doorrennen." },
    ],
  },
]

function getPhaseColor(phase: string): string {
  switch (phase) {
    case "Aanval": return "#F97316"
    case "Verdediging": return "#ef4444"
    case "Opbouw": return "#3b82f6"
    case "Transitie": return "#f59e0b"
    case "Standaard situatie": return "#a855f7"
    default: return "#6b7280"
  }
}

function getIntelligenceLabel(score: number): { label: string; color: string } {
  // Score out of 48 (16 scenarios × 3 pts each)
  if (score >= 44) return { label: "Tactisch Genie", color: "#FBBF24" }
  if (score >= 36) return { label: "Elite IQ", color: "#4FA9E6" }
  if (score >= 28) return { label: "Hoog Voetbal IQ", color: "#34D399" }
  if (score >= 20) return { label: "Gemiddeld IQ", color: "#93C5FD" }
  if (score >= 12) return { label: "Ontwikkelend IQ", color: "#FB923C" }
  return { label: "Beginner IQ", color: "#F87171" }
}

function shuffleArray(arr: number[]): number[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Football (soccer ball) SVG at (0,0), radius R ──────────── */
function FootballIcon({ r, rotation }: { r: number; rotation: number }) {
  // Classic pentagon/hexagon ball pattern
  const pts = (n: number, rad: number, offset = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((i / n) * Math.PI * 2) + offset - Math.PI / 2
      return `${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`
    }).join(" ")

  return (
    <g transform={`rotate(${rotation})`}>
      {/* Shadow */}
      <ellipse cx={0} cy={r * 0.5} rx={r * 0.85} ry={r * 0.22} fill="rgba(0,0,0,0.25)" />
      {/* Ball base */}
      <circle r={r} fill="white" stroke="#D0D0D0" strokeWidth={0.5} />
      {/* Black center pentagon */}
      <polygon points={pts(5, r * 0.42)} fill="#111" opacity={0.92} />
      {/* 5 outer edge pentagons */}
      {[0, 72, 144, 216, 288].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const ex = Math.cos(rad - Math.PI / 2) * r * 0.72
        const ey = Math.sin(rad - Math.PI / 2) * r * 0.72
        return (
          <polygon
            key={deg}
            points={pts(5, r * 0.26, (deg * Math.PI) / 180)}
            transform={`translate(${ex.toFixed(2)},${ey.toFixed(2)})`}
            fill="#111"
            opacity={0.88}
          />
        )
      })}
      {/* Shine */}
      <circle cx={-r * 0.28} cy={-r * 0.3} r={r * 0.2} fill="rgba(255,255,255,0.55)" />
    </g>
  )
}

function PitchSVG({
  players,
  ball,
  tick,
}: {
  players: PlayerPos[]
  ball: BallPos
  tick: number
}) {
  const W = 700, H = 480
  const FX = 20, FY = 10, FW = 660, FH = 460  // field rect
  const lineColor = "rgba(255,255,255,0.65)"
  const lineW = 1.8

  // Ball animation: gentle idle float + rotation
  const ballIdleX = Math.cos(tick * 0.06) * 1.8
  const ballIdleY = Math.sin(tick * 0.09) * 1.2
  const ballRotation = (tick * 2.5) % 360

  const bcxBase = ball.x * FW + FX
  const bcyBase = ball.y * FH + FY

  return (
    <div style={{ perspective: "1100px", perspectiveOrigin: "50% 8%", marginBottom: "4px" }}>
      <div style={{
        transform: "rotateX(46deg)",
        transformOrigin: "50% 100%",
        filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.9)) drop-shadow(0 10px 20px rgba(0,0,0,0.6))",
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", borderRadius: "4px" }}>
          <defs>
            {/* Grass gradient — darker at edges */}
            <radialGradient id="grassGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%"  stopColor="#1e7a30" />
              <stop offset="100%" stopColor="#145220" />
            </radialGradient>
            {/* Goal net texture */}
            <pattern id="netPat" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 6 6 M 6 0 L 0 6" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="none"/>
            </pattern>
          </defs>

          {/* ── Grass base ── */}
          <rect x={FX} y={FY} width={FW} height={FH} fill="url(#grassGrad)" />

          {/* ── Grass stripes (alternating light/dark bands) ── */}
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x={FX} y={FY + i * (FH / 12)} width={FW} height={FH / 12}
              fill={i % 2 === 0 ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.04)"}
            />
          ))}

          {/* ── Field outer border ── */}
          <rect x={FX} y={FY} width={FW} height={FH} fill="none"
            stroke={lineColor} strokeWidth={lineW} />

          {/* ── Halfway line ── */}
          <line x1={FX} y1={FY + FH / 2} x2={FX + FW} y2={FY + FH / 2}
            stroke={lineColor} strokeWidth={lineW} />

          {/* ── Center circle + dot ── */}
          <circle cx={FX + FW / 2} cy={FY + FH / 2} r={58}
            fill="rgba(255,255,255,0.03)" stroke={lineColor} strokeWidth={lineW} />
          <circle cx={FX + FW / 2} cy={FY + FH / 2} r={4} fill={lineColor} />

          {/* ── Corner arcs (quarter circles, r=18 at each corner) ── */}
          {[
            { x: FX,      y: FY,       d: `M ${FX+18} ${FY} A 18 18 0 0 0 ${FX} ${FY+18}` },
            { x: FX+FW,   y: FY,       d: `M ${FX+FW-18} ${FY} A 18 18 0 0 1 ${FX+FW} ${FY+18}` },
            { x: FX,      y: FY+FH,    d: `M ${FX} ${FY+FH-18} A 18 18 0 0 0 ${FX+18} ${FY+FH}` },
            { x: FX+FW,   y: FY+FH,    d: `M ${FX+FW} ${FY+FH-18} A 18 18 0 0 1 ${FX+FW-18} ${FY+FH}` },
          ].map((c, i) => (
            <path key={i} d={c.d} fill="none" stroke={lineColor} strokeWidth={lineW} />
          ))}

          {/* ── TOP: Penalty area ── */}
          <rect x={FX + 158} y={FY} width={FW - 316} height={110}
            fill="rgba(255,255,255,0.03)" stroke={lineColor} strokeWidth={lineW} />
          {/* TOP: 6-yard box */}
          <rect x={FX + 235} y={FY} width={FW - 470} height={48}
            fill="rgba(255,255,255,0.02)" stroke={lineColor} strokeWidth={1.2} />
          {/* TOP: Penalty spot */}
          <circle cx={FX + FW / 2} cy={FY + 82} r={4} fill={lineColor} />
          {/* TOP: Penalty arc (outside pen area, centered on spot) */}
          <path d={`M ${FX+302} ${FY+110} A 58 58 0 0 1 ${FX+358} ${FY+110}`}
            fill="none" stroke={lineColor} strokeWidth={lineW} />
          {/* TOP: Goal (with net) */}
          <rect x={FX + FW/2 - 50} y={FY - 18} width={100} height={18}
            fill="url(#netPat)" stroke={lineColor} strokeWidth={1.5} />

          {/* ── BOTTOM: Penalty area ── */}
          <rect x={FX + 158} y={FY + FH - 110} width={FW - 316} height={110}
            fill="rgba(255,255,255,0.03)" stroke={lineColor} strokeWidth={lineW} />
          {/* BOTTOM: 6-yard box */}
          <rect x={FX + 235} y={FY + FH - 48} width={FW - 470} height={48}
            fill="rgba(255,255,255,0.02)" stroke={lineColor} strokeWidth={1.2} />
          {/* BOTTOM: Penalty spot */}
          <circle cx={FX + FW / 2} cy={FY + FH - 82} r={4} fill={lineColor} />
          {/* BOTTOM: Penalty arc */}
          <path d={`M ${FX+302} ${FY+FH-110} A 58 58 0 0 0 ${FX+358} ${FY+FH-110}`}
            fill="none" stroke={lineColor} strokeWidth={lineW} />
          {/* BOTTOM: Goal (with net) */}
          <rect x={FX + FW/2 - 50} y={FY + FH} width={100} height={18}
            fill="url(#netPat)" stroke={lineColor} strokeWidth={1.5} />

          {/* ── Team direction arrows (subtle) ── */}
          <text x={FX + 8} y={FY + FH/2 - 12} fill="rgba(100,160,255,0.35)"
            fontSize={9} fontWeight="bold" textAnchor="start">▼ BLAUW</text>
          <text x={FX + 8} y={FY + FH/2 + 20} fill="rgba(255,100,100,0.35)"
            fontSize={9} fontWeight="bold" textAnchor="start">▲ ROOD</text>

          {/* ── Pass lines between highlighted teammates ── */}
          {(() => {
            const hl = players.filter(p => p.highlighted && p.team === "blue")
            if (hl.length < 2) return null
            return hl.slice(0, -1).map((a, i) => {
              const b = hl[i + 1]
              const ax = a.x * FW + FX, ay = a.y * FH + FY
              const bx = b.x * FW + FX, by = b.y * FH + FY
              const progress = (Math.sin(tick * 0.07) + 1) / 2  // 0..1 oscillating
              const dashOffset = -tick * 2
              return (
                <line key={`pass-${a.id}-${b.id}`}
                  x1={ax} y1={ay} x2={bx} y2={by}
                  stroke="rgba(255,220,50,0.35)" strokeWidth={1.5}
                  strokeDasharray="8 5"
                  strokeDashoffset={dashOffset}
                  opacity={0.4 + progress * 0.4}
                />
              )
            })
          })()}

          {/* ── Players ── */}
          {players.map((player) => {
            const baseX = player.x * FW + FX
            const baseY = player.y * FH + FY
            const isBlue = player.team === "blue"
            const fill = isBlue ? "#1a56db" : "#c81e1e"
            const shadowColor = isBlue ? "rgba(26,86,219,0.6)" : "rgba(200,30,30,0.6)"

            // Each player has a unique phase so they never all move together
            const phase = player.id * 2.39   // golden-ratio spread of phases
            const phaseY = player.id * 1.61

            // Highlighted key players move much more (they're making runs)
            const amp = player.highlighted ? 13 : 2.5
            const speed = player.highlighted ? 0.09 : 0.035
            const driftX = Math.sin(tick * speed + phase) * amp
            const driftY = Math.cos(tick * speed * 0.8 + phaseY) * (amp * 0.65)

            return (
              // Outer g: CSS-transitioned scenario position
              <g key={player.id}
                transform={`translate(${baseX},${baseY})`}
                style={{ transition: "transform 0.75s cubic-bezier(0.4,0,0.2,1)" }}>

                {/* Inner g: continuous drift — no CSS transition here */}
                <g transform={`translate(${driftX.toFixed(2)},${driftY.toFixed(2)})`}>

                  {/* Shadow (stays at feet level) */}
                  <ellipse cx={0} cy={14} rx={10} ry={3.5}
                    fill={shadowColor} opacity={0.45} />

                  {/* Highlight ring — pulsing glow for key players */}
                  {player.highlighted && (
                    <>
                      <circle cx={0} cy={0} r={21}
                        fill="none" stroke="#FBBF24" strokeWidth={2.5}
                        opacity={0.45 + Math.sin(tick * 0.2) * 0.38} />
                      <circle cx={0} cy={0} r={28}
                        fill="none" stroke="#FBBF24" strokeWidth={1}
                        opacity={0.15 + Math.sin(tick * 0.15 + 1.5) * 0.12} />
                    </>
                  )}

                  {/* Player body */}
                  <circle cx={0} cy={0} r={15} fill={fill} stroke="white" strokeWidth={2}
                    style={{ filter: player.highlighted ? `drop-shadow(0 0 7px ${shadowColor})` : undefined }}
                  />

                  {/* Kit shine */}
                  <ellipse cx={-4} cy={-5} rx={5} ry={4} fill="rgba(255,255,255,0.2)" />

                  {/* Number */}
                  <text x={0} y={1} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize={10} fontWeight="800"
                    style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.5px" }}>
                    {player.number}
                  </text>

                  {/* Arrow tip for highlighted players showing run direction */}
                  {player.highlighted && (
                    <polygon
                      points={`${(driftX > 0 ? 18 : -18).toFixed(1)},0 ${(driftX > 0 ? 12 : -12).toFixed(1)},-5 ${(driftX > 0 ? 12 : -12).toFixed(1)},5`}
                      fill="#FBBF24" opacity={0.55 + Math.sin(tick * 0.2) * 0.3}
                    />
                  )}
                </g>
              </g>
            )
          })}

          {/* ── Ball (animated) ── */}
          <g transform={`translate(${bcxBase},${bcyBase})`}
            style={{ transition: "transform 0.75s cubic-bezier(0.4,0,0.2,1)" }}>
            {/* Continuous float + bigger arc movement */}
            <g transform={`translate(${(Math.sin(tick * 0.07) * 6).toFixed(2)},${(Math.cos(tick * 0.055) * 4).toFixed(2)})`}>
              <FootballIcon r={9} rotation={ballRotation} />
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}

export default function TacticalGamePage() {
  const [gamePhase, setGamePhase] = useState<GamePhase>("intro")
  const [gameMode, setGameMode] = useState<GameMode>("classic")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [currentPlayers, setCurrentPlayers] = useState<PlayerPos[]>([...defaultPlayers])
  const [currentBall, setCurrentBall] = useState<BallPos>({ x: 0.5, y: 0.5 })
  const [shuffledQueue, setShuffledQueue] = useState<number[]>([])
  const [questionNum, setQuestionNum] = useState(1)
  const [dots, setDots] = useState(0)
  const [tick, setTick] = useState(0)

  // Continuous animation tick (20fps) — drives ball rotation, idle float, highlight pulse
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 50)
    return () => clearInterval(id)
  }, [])

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

  // Save IQ score to localStorage when results are shown
  useEffect(() => {
    if (gamePhase !== "results") return
    const total = scores.reduce((a, b) => a + b, 0)
    const maxPossible = gameMode === "classic" ? 48 : scores.length * 3
    // Normalize to /24 scale for the player card display
    const normalized24 = maxPossible > 0 ? Math.round((total / maxPossible) * 24) : 0
    const { label, color } = getIntelligenceLabel(Math.round((total / maxPossible) * 48))
    try {
      localStorage.setItem("tacticalIQ", JSON.stringify({
        score: normalized24,
        label,
        color,
        date: new Date().toISOString(),
      }))
    } catch { /* ignore */ }
  }, [gamePhase, scores, gameMode])

  // feedback → next scenario or results
  useEffect(() => {
    if (gamePhase !== "feedback") return
    const timer = setTimeout(() => {
      if (gameMode === "classic") {
        // Classic: go through scenarios 0..15 in order, then results
        const nextClassicIdx = scores.length  // scores.length is already incremented after answer
        if (nextClassicIdx >= scenarios.length) {
          setGamePhase("results")
        } else {
          setCurrentIndex(nextClassicIdx)
          setSelectedOption(null)
          setGamePhase("watching")
        }
      } else {
        // Infinite: pick next from shuffled queue (refill when empty)
        const queue = shuffledQueue.length > 0
          ? shuffledQueue
          : shuffleArray(scenarios.map((_, i) => i))
        const nextIdx = queue[0]
        setShuffledQueue(queue.slice(1))
        setCurrentIndex(nextIdx)
        setSelectedOption(null)
        setGamePhase("watching")
      }
    }, 2200)
    return () => clearTimeout(timer)
  }, [gamePhase, scores, gameMode, shuffledQueue])

  // Load scenario players/ball when index changes (and we enter watching)
  useEffect(() => {
    if (gamePhase !== "watching") return
    setCurrentPlayers(scenarios[currentIndex].players)
    setCurrentBall(scenarios[currentIndex].ball)
  }, [gamePhase, currentIndex])

  const handleStart = useCallback((mode: GameMode) => {
    setGameMode(mode)
    setScores([])
    setSelectedOption(null)
    setQuestionNum(1)
    if (mode === "classic") {
      setCurrentIndex(0)
      setCurrentPlayers(scenarios[0].players)
      setCurrentBall(scenarios[0].ball)
      setShuffledQueue([])
    } else {
      const queue = shuffleArray(scenarios.map((_, i) => i))
      const firstIdx = queue[0]
      setShuffledQueue(queue.slice(1))
      setCurrentIndex(firstIdx)
      setCurrentPlayers(scenarios[firstIdx].players)
      setCurrentBall(scenarios[firstIdx].ball)
    }
    setGamePhase("watching")
  }, [])

  const handleStop = useCallback(() => {
    setGamePhase("results")
  }, [])

  const handleOptionSelect = useCallback(
    (optionIndex: number) => {
      if (gamePhase !== "question") return
      const score = scenario.options[optionIndex].score
      setScores((s) => [...s, score])
      setSelectedOption(optionIndex)
      setQuestionNum((n) => n + 1)
      setGamePhase("feedback")
    },
    [gamePhase, scenario]
  )

  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setScores([])
    setSelectedOption(null)
    setQuestionNum(1)
    setShuffledQueue([])
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
              16 realistische 11v11 voetbalscenario's. Analyseer de situatie en maak de juiste tactische keuze.
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
              Klassiek: 16 scenario's · Max 48 punten &nbsp;|&nbsp; Oneindig: nooit stoppend
            </p>
          </div>

          {/* Pitch preview */}
          <div style={{ maxWidth: "600px", margin: "0 auto 40px", opacity: 0.7 }}>
            <PitchSVG players={defaultPlayers} ball={{ x: 0.5, y: 0.5 }} tick={tick} />
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
              { icon: "⚽", label: "16 Scenario's", sub: "Alle fases van het spel" },
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

          {/* Mode buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => handleStart("classic")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                background: "linear-gradient(135deg, #1D4ED8, #4FA9E6)",
                color: "white", border: "none", borderRadius: "14px",
                padding: "16px 32px", fontSize: "17px", fontWeight: 700,
                cursor: "pointer", boxShadow: "0 8px 32px rgba(79,169,230,0.35)",
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
              🎯 Klassiek — 16 vragen
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => handleStart("infinite")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "white", border: "none", borderRadius: "14px",
                padding: "16px 32px", fontSize: "17px", fontWeight: 700,
                cursor: "pointer", boxShadow: "0 8px 32px rgba(168,85,247,0.3)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(168,85,247,0.5)"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(168,85,247,0.3)"
              }}
            >
              ∞ Oneindig modus
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── RESULTS ─────────────────────────────────────────────────────────────────
  if (gamePhase === "results") {
    const answeredCount = scores.length
    const maxPossible = gameMode === "classic" ? 48 : answeredCount * 3
    const normalizedScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 48) : 0
    const { label, color } = getIntelligenceLabel(normalizedScore)
    const pct = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0

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
              <span style={{ fontSize: "0.45em", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>/{maxPossible}</span>
              {gameMode === "infinite" && (
                <div style={{ fontSize: "0.3em", color: "rgba(255,255,255,0.35)", fontWeight: 400, marginTop: "4px" }}>
                  in {answeredCount} situaties
                </div>
              )}
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
                    ? "linear-gradient(90deg, #34D399, #4FA9E6)"
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
              {gameMode === "infinite" ? `Overzicht (${answeredCount} gespeeld)` : "Scenario overzicht"}
            </div>
            {(gameMode === "classic" ? scenarios : scenarios.slice(0, answeredCount)).map((s, i) => {
              const sc = scores[i] ?? 0
              return (
                <div
                  key={`${s.id}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: i < answeredCount - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
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
            {gameMode === "classic"
              ? `Scenario ${scores.length + (gamePhase === "feedback" ? 0 : 1)}/16`
              : `Situatie ${questionNum - (gamePhase === "feedback" ? 1 : 0)}`}
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
          {gameMode === "infinite" && (
            <span style={{
              fontSize: "10px", color: "#a855f7", background: "rgba(168,85,247,0.15)",
              border: "1px solid rgba(168,85,247,0.3)", borderRadius: "20px",
              padding: "2px 8px", fontWeight: 700,
            }}>∞ Oneindig</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#FBBF24", fontWeight: 700, fontSize: "15px" }}>
            <Trophy size={16} />
            {currentScoreInProgress} pts
          </div>
          {gameMode === "infinite" && (
            <button
              onClick={handleStop}
              style={{
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171", borderRadius: "8px", padding: "5px 12px",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Pitch */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <PitchSVG players={currentPlayers} ball={currentBall} tick={tick} />

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
                      border = "#F97316"
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
