# ⚽ Schoonhoven Sports Performance Hub

Een professioneel voetbalanalyse- en scoutingplatform geïnspireerd op SciSports, FIFA Career Mode en elite academy systems.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS** (custom dark premium theme)
- **Recharts** (radar, line, bar charts)
- **Supabase** (auth + database + RLS)
- **Claude AI** (AI scouting engine)

## Features

### 🧬 Player DNA System
- **Archetypes** per positie (30+ archetypes: Complete Forward, Classic 10, Sweeper Keeper, etc.)
- **Sociotypes** (De Leider, De Strijder, De Denker, De Kunstenaar, etc.)
- **Kernwaarden**: Noodzaak · Creativiteit · Vertrouwen

### 🤖 AI Scouting Engine
- Rule-based analyse (werkt zonder API key)
- Claude AI integratie voor diepere analyse
- Automatische archetype + sociotype bepaling
- Fit score berekening (0-100)

### 🎴 FIFA-style Player Cards
- Overall rating (40-99 schaal)
- Archetype + sociotype badges
- Core value bars
- Stat grid (Techniek, Fysiek, Tactiek, Mentaal, Teamplay)
- Badge system (Elite, Talent, Prospect, Rising Star, Veteran)

### 📊 Dashboards
- **Coach**: spelers beheren, evaluaties maken, AI analyse, vergelijkingstool
- **Speler**: eigen player card, progressie, challenges
- **Admin**: gebruikersbeheer, platform instellingen

### 🧪 Evaluatiesysteem
- 5 categorieën (1-10 score)
- Automatische rating berekening
- Trend tracking (↑↓ →)
- AI analyse trigger

### 🏆 Challenges
- Status tracking (Open / Bezig / Voltooid)
- Progress bars
- Deadline management

## Setup

### 1. Installeer dependencies

```bash
cd performance-hub
npm install
```

### 2. Environment variabelen

```bash
cp .env.local.example .env.local
```

Vul in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key
ANTHROPIC_API_KEY=jouw-claude-api-key  # optioneel
```

### 3. Supabase setup

1. Maak een nieuw Supabase project aan
2. Kopieer de URL en anon key naar `.env.local`
3. Voer het schema uit in de SQL editor:
   ```sql
   -- Plak inhoud van: supabase/schema.sql
   ```
4. Voer seed data in:
   ```sql
   -- Plak inhoud van: supabase/seed.sql
   ```

### 4. Demo accounts aanmaken

In Supabase Authentication > Users, maak aan:
- `admin@demo.hub` / `demo1234` 
- `coach@demo.hub` / `demo1234`
- `player@demo.hub` / `demo1234`

Of via Supabase CLI:
```bash
supabase auth admin create-user --email coach@demo.hub --password demo1234
```

### 5. Start de dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Mode

Zonder Supabase configuratie werkt de app in **demo mode** met mock data. Je kunt alle features bekijken zonder database.

## Deploy op Vercel

```bash
vercel deploy
```

Voeg environment variabelen toe in Vercel dashboard.

## Architectuur

```
performance-hub/
├── app/
│   ├── (auth)/          # Login + Register
│   ├── (dashboard)/
│   │   ├── layout.tsx   # Sidebar + auth wrapper
│   │   ├── coach/       # Coach dashboard + spelers + evaluaties + AI
│   │   ├── player/      # Player dashboard + challenges
│   │   └── admin/       # Admin panel
│   └── api/ai/analyze/  # AI analyse API route
├── components/
│   ├── PlayerCard.tsx   # FIFA-style player card
│   ├── layout/Sidebar   # Dashboard navigatie
│   └── charts/          # Radar + Line + Bar charts
├── lib/
│   ├── types.ts         # Alle TypeScript types + constants
│   ├── utils.ts         # Helper functies
│   ├── mock-data.ts     # Demo data
│   ├── ai-engine.ts     # AI analyse engine
│   └── supabase/        # Supabase client + server
└── supabase/
    ├── schema.sql       # Database schema + RLS
    └── seed.sql         # Demo data
```

## AI Engine

De AI engine werkt op twee niveaus:

1. **Rule-based** (lokaal, geen API key nodig): gebruikt score patronen om archetypes, sociotypes en kernwaarden te bepalen
2. **Claude AI** (optioneel): stuurt een gestructureerde prompt naar Claude claude-sonnet-4-6 voor diepere analyse

### Output formaat:
```json
{
  "archetype": "complete_forward",
  "secondary_archetype": "poacher",
  "primary_sociotype": "killer",
  "secondary_sociotype": "strijder",
  "core_values": {
    "noodzaak": 75,
    "creativiteit": 60,
    "vertrouwen": 82
  },
  "fit_score": 88,
  "summary": "..."
}
```

## RLS Security

Alle tabellen hebben Row Level Security:
- Coaches zien alleen hun eigen spelers
- Spelers zien alleen eigen data
- Admins hebben volledige toegang

## Roadmap

- [ ] PDF export van player cards
- [ ] Bulk evaluaties
- [ ] Notificaties (deadline alerts)
- [ ] Video upload integratie
- [ ] Vergelijkingstool uitbreiden
- [ ] Mobile app (React Native)
