# TailorMate — React Native App Build Guide
> Paste this entire document into a new Claude Code session to start building.

---

## 1. What We're Building

A mobile app for a tailor. The tailor picks a garment template (blouse, shirt, salwar, etc.), picks a neckline variant (round, V-neck, deep neck, etc.), enters the client's body measurements, and the app instantly generates a scaled sewing pattern that can be exported as SVG or PDF.

**No backend. No login. Everything lives on the tailor's phone.**

---

## 2. Architecture Decisions

| Concern | Decision | Why |
|---|---|---|
| Template storage | GitHub repo + jsDelivr CDN | Free, static, no server |
| Customer profiles | Zustand + AsyncStorage | Local, persists across app restarts |
| Pattern history | AsyncStorage | Local only |
| Auth | None — MVP | Tailor's own phone |
| Formula engine | Copy from existing web app | Already works, mathjs runs in RN |
| Canvas | React Native Skia | Best drawing lib for RN, GPU-accelerated |

---

## 3. Stack

```
Framework:     Expo SDK 52 + TypeScript
Styling:       NativeWind v5 (Tailwind CSS for React Native)
State:         Zustand + @react-native-async-storage/async-storage
Canvas:        @shopify/react-native-skia
Math/Formulas: mathjs (same as web app — copy directly)
Navigation:    Expo Router (file-based)
Templates:     Fetched from jsDelivr CDN at runtime
Export:        expo-sharing + expo-file-system (SVG/PDF share sheet)
```

---

## 4. Template Hosting Setup (Do This First — Outside the App)

### Step 1 — Create a GitHub repo
Name it something like `tailor-templates` (can be public or private).

### Step 2 — Folder structure inside the repo
```
index.json                          ← catalog of all templates
templates/
  blouse/
    round-neck-front.json
    v-neck-front.json
    deep-neck-front.json
  shirt/
    collar-front.json
    band-collar-front.json
  salwar/
    ...
```

### Step 3 — index.json format
```json
[
  {
    "id": "blouse-round-neck",
    "category": "Blouse",
    "variant": "Round Neck",
    "description": "Classic round neck blouse front",
    "previewPoints": 12,
    "url": "templates/blouse/round-neck-front.json",
    "measurements": ["neck_round", "shoulder", "bust_round", "bust_width", "bust_height_nbp"]
  },
  {
    "id": "blouse-v-neck",
    "category": "Blouse",
    "variant": "V Neck",
    "description": "V neck blouse front",
    "url": "templates/blouse/v-neck-front.json",
    "measurements": ["neck_round", "shoulder", "bust_round", "bust_width", "bust_height_nbp"]
  }
]
```

### Step 4 — jsDelivr URL pattern
```
https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/tailor-templates@main/index.json
https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/tailor-templates@main/templates/blouse/round-neck-front.json
```

The template JSON format is exactly the same as the existing web app format (see example at bottom of this doc).

---

## 5. App Screen Flow

```
Home (Template Browser)
  ├── Categories: [Blouse] [Shirt] [Salwar] [Skirt] ...
  └── Variants: [Round Neck] [V Neck] [Deep Neck] ...
           ↓ tap a variant
Measurement Input Screen
  ├── Select existing customer (from saved profiles) OR
  └── Enter measurements manually
           ↓ tap Generate
Pattern Canvas Screen
  ├── Skia canvas renders the pattern
  ├── Pinch to zoom, pan
  ├── Toggle construction lines
  └── Export button → SVG / Share sheet
           ↓ optionally
Save to History
  └── Saved with customer name + date + template name

─────────────────────
Bottom Tab Navigation
  [Templates] [Customers] [History]
─────────────────────

Customers Tab
  ├── List of saved customer profiles
  ├── Tap → view/edit measurements
  └── + button → add new customer

History Tab
  └── Past patterns (customer, template, date, thumbnail)
```

---

## 6. Formula Engine (Copy From Web App)

These three files from the existing web app work in React Native **unchanged**. Copy them into `lib/` in the new RN project:

- `lib/formula-engine.ts` — mathjs-based evaluator
- `lib/dependency-graph.ts` — topological sort
- `lib/constraint-helpers.ts` — drag constraint helpers (optional for MVP)

The `evaluateFormulas(measurements, points)` function is the core. It takes the template's measurements + point definitions and returns computed (x, y) coordinates for every point. That's all we need to render the pattern.

---

## 7. Data Models

```typescript
// Customer saved in AsyncStorage
interface Customer {
  id: string
  name: string
  phone?: string
  measurements: Record<string, number>  // { bust_round: 89, waist: 70, ... }
  createdAt: string
  updatedAt: string
}

// Pattern in history
interface PatternRecord {
  id: string
  customerId?: string
  customerName: string
  templateId: string
  templateName: string
  measurements: Record<string, number>
  createdAt: string
  svgSnapshot?: string  // optional lightweight SVG string
}

// Template loaded from CDN
interface TemplateMeta {
  id: string
  category: string
  variant: string
  description: string
  url: string
  measurements: string[]  // required measurement keys
}

interface TemplateData {
  __patternCAD: boolean
  version: string
  projectName: string
  measurements: Record<string, number>  // defaults
  points: TemplatePoint[]
  lines: TemplateLine[]
  constraints: any[]
  geoConstraints: any[]
}
```

---

## 8. Zustand Stores

### Customer Store
```typescript
// stores/customerStore.ts
interface CustomerStore {
  customers: Customer[]
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
}
// Persist with AsyncStorage
```

### Pattern History Store
```typescript
// stores/historyStore.ts
interface HistoryStore {
  records: PatternRecord[]
  addRecord: (r: Omit<PatternRecord, 'id' | 'createdAt'>) => void
  deleteRecord: (id: string) => void
}
// Persist with AsyncStorage
```

### Template Cache Store
```typescript
// stores/templateStore.ts
interface TemplateStore {
  catalog: TemplateMeta[]           // index.json cached locally
  loadedTemplates: Record<string, TemplateData>  // keyed by template id
  fetchCatalog: () => Promise<void>
  fetchTemplate: (meta: TemplateMeta) => Promise<TemplateData>
  isLoading: boolean
  error: string | null
}
// Do NOT persist — always fetch fresh (CDN is fast)
```

---

## 9. Build Order (Feature by Feature)

Follow the **Practical Vibe Coding** workflow from the video. One feature per prompt. Verify before moving on.

```
Step 1 — Project setup
  mpx create-expo-app@latest . (TypeScript template)
  Create agents.md (see Section 10)
  Install NativeWind v5

Step 2 — Design system
  globals.css with color tokens
  Font setup (use system font for MVP)

Step 3 — Bottom tab navigation
  3 tabs: Templates, Customers, History
  Placeholder screens

Step 4 — Template browser (Templates tab)
  Fetch index.json from jsDelivr on mount
  Category row (horizontal scroll)
  Variant grid cards
  Loading + error states

Step 5 — Measurement input screen
  Screen opens after tapping a template variant
  Shows required measurements for that template
  "Select customer" button → opens customer picker
  Manual input fallback
  "Generate Pattern" button

Step 6 — Pattern canvas screen (the hard one)
  Copy lib/formula-engine.ts, dependency-graph.ts from web app
  Fetch template JSON from CDN
  evaluateFormulas() → get point coordinates
  Render with React Native Skia (lines, points, labels)
  Pinch-to-zoom + pan gesture
  Toggle construction lines button

Step 7 — Export
  Build SVG string (same logic as web app's lib/export.ts buildSVG())
  expo-sharing to share the SVG file
  Optional: expo-print for PDF

Step 8 — Customers tab
  Customer list screen
  Add/Edit customer form
  Measurement input per customer
  Select customer flow (called from measurement input screen)

Step 9 — History tab
  Save pattern to history after generation
  List view of past patterns
  Tap to re-open the pattern canvas

Step 10 — Polish
  Offline handling (cache last fetched catalog)
  Empty states
  Error states
  App icon + splash screen
```

---

## 10. agents.md (Paste This Into Root of New Project)

```markdown
# AGENTS.md

## Role
You are an expert React Native + Expo engineer building a tailor pattern-making app.
Write clean, simple, typed TypeScript. Prioritize clarity over abstraction.
Think like a senior mobile developer. Keep implementations minimal and easy to extend.

## App Overview
TailorMate is a mobile app for a professional tailor. The tailor selects a garment template
(blouse, shirt, salwar, etc.), selects a variant (round neck, V neck, etc.), enters client
body measurements, and the app renders a scaled sewing pattern that can be exported as SVG.
All data is local. No backend. No authentication. Single-user app on the tailor's own phone.

## Stack
- Framework: Expo SDK 52 + TypeScript + Expo Router (file-based navigation)
- Styling: NativeWind v5 — use Tailwind class names for all components
- State: Zustand + @react-native-async-storage/async-storage (persisted stores)
- Canvas: @shopify/react-native-skia (pattern rendering)
- Math: mathjs (formula evaluation — already in lib/formula-engine.ts)
- Templates: Fetched from jsDelivr CDN as JSON at runtime
- Export: expo-sharing + expo-file-system

## Architecture
- Templates are static JSON files hosted on GitHub + served via jsDelivr CDN
- No Firebase, no Supabase, no backend of any kind
- Customer profiles live in AsyncStorage (Zustand persist)
- Pattern history lives in AsyncStorage (Zustand persist)
- Formula engine (lib/formula-engine.ts) evaluates point positions from measurement variables

## Folder Structure
app/
  (tabs)/
    index.tsx          — Templates tab (template browser)
    customers.tsx      — Customers tab
    history.tsx        — History tab
  template/
    [id].tsx           — Measurement input screen
  canvas/
    [id].tsx           — Pattern canvas screen
lib/
  formula-engine.ts    — mathjs evaluator (DO NOT MODIFY)
  dependency-graph.ts  — topological sort (DO NOT MODIFY)
  load-template.ts     — fetch + parse template from CDN
stores/
  customerStore.ts     — Zustand + AsyncStorage
  historyStore.ts      — Zustand + AsyncStorage
  templateStore.ts     — Zustand (no persist, CDN is source of truth)
constants/
  cdn.ts               — jsDelivr base URL constant
types/
  index.ts             — shared TypeScript interfaces

## Styling Rules
- Use NativeWind class names (className prop) for ALL components
- EXCEPTION: SafeAreaView must use StyleSheet — NativeWind class names do not work on SafeAreaView
- EXCEPTION: Use StyleSheet for Skia canvas container sizing
- Color palette: dark theme, gray-950 background, gray-900 panels, blue-500 accent
- Never use inline styles unless NativeWind cannot handle the specific case

## Key Patterns
- Formula engine: call evaluateFormulas(measurements, points) → returns Record<name, {x,y}>
- Template fetch: GET https://cdn.jsdelivr.net/gh/USERNAME/tailor-templates@main/{url}
- Zustand persist: use zustand/middleware persist with AsyncStorage as storage
- Always handle loading and error states for any network fetch
- If a library would simplify implementation, suggest it and ask before installing

## Decision Rules
- If something is unclear, ask before implementing
- Do not install new libraries without user approval
- Build the smallest working version first, no over-engineering
- One feature per prompt — never combine multiple features in one implementation
```

---

## 11. Prompt Structure (From the Video — Use Every Time)

Every prompt you write must have these 4 parts in order:

```
1. Read the AGENTS.md first and follow it strictly without exceptions.

2. [ONE TASK — describe exactly what to build, one screen or one feature]

3. [CONSTRAINTS — what not to break]
   - Do not modify lib/formula-engine.ts or lib/dependency-graph.ts
   - Preserve existing navigation structure
   - Keep existing screen designs unchanged
   - Do not expose any API keys in the app

4. [DESIGN REFERENCE — attach a screenshot or describe layout]
```

**Rules from the video:**
- Start a **new chat session** for each new feature
- Stay in the **same chat** only for direct follow-up fixes to the current feature
- When something breaks: "State the problem. State the correct behavior. Add one constraint." — nothing more
- Paste the latest library docs at the end of the prompt if AI might use outdated API
- Install agent skills for Expo before starting: `npx skills add` → select Expo skills

---

## 12. CDN Constant (Add to Project Early)

```typescript
// constants/cdn.ts
const GITHUB_USER = 'YOUR_GITHUB_USERNAME'
const GITHUB_REPO = 'tailor-templates'
const BRANCH = 'main'

export const CDN_BASE = `https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${BRANCH}`
export const CATALOG_URL = `${CDN_BASE}/index.json`
export function templateUrl(path: string) {
  return `${CDN_BASE}/${path}`
}
```

---

## 13. Pattern Canvas — How It Works

This is the core of the app. Here's the data flow so AI understands what to build:

```
1. User selects template variant → app fetches template JSON from CDN
2. User enters measurements → stored as Record<string, number>
3. evaluateFormulas(userMeasurements, template.points) → computed {x, y} per point
4. Points are in cm (world space). Scale to screen pixels: 1cm = 40px (adjustable)
5. Render with Skia:
   - Lines: template.lines → each has fromId, toId → look up computed point coords
   - Points: small circles at each computed point
   - Labels: point names near each point
   - Construction lines: dashed, gray
   - Pattern lines: solid, white/light
6. Gestures: GestureDetector (pinch = zoom, pan = offset)
7. Export: rebuild SVG string from computed points (same logic as web app buildSVG())
```

The world coordinate system:
- Origin (0,0) is top-left of pattern
- Y increases downward (same as screen)
- The web app uses Y-up (flipped) — for mobile, use Y-down to keep it simple

---

## 14. Example Template JSON (Already Working)

This is the format of templates. The web app already has `templates/indian_blouse_front.json`.
Copy it to your GitHub templates repo to get started immediately:

```json
{
  "__patternCAD": true,
  "version": "1.1",
  "projectName": "Indian Blouse Front",
  "measurements": {
    "neck_round": 39,
    "shoulder": 11.5,
    "bust_round": 89,
    "bust_width": 19,
    "bust_height_nbp": 24
  },
  "points": [
    { "name": "A", "x": "0", "y": "0" },
    { "name": "B", "x": "0", "y": "10" },
    ...
  ],
  "lines": [
    { "from": "B", "to": "C" },
    ...
  ],
  "constraints": [],
  "geoConstraints": []
}
```

The measurement keys listed in `index.json` for each template tell the app which input fields to show the tailor.

---

## 15. First 3 Prompts to Write in the New Session

### Prompt 1 — Project Setup + NativeWind
```
Read the AGENTS.md first and follow it strictly.

Set up a new Expo project with TypeScript using `npx create-expo-app@latest`.
Then set up NativeWind v5. Follow the NativeWind v5 docs exactly.
Apply the required config: globals.css, babel, metro, typescript types, and app entry imports.
Do not add any screens yet.

[Paste NativeWind v5 docs here]
```

### Prompt 2 — Design System + Bottom Tabs
```
Read the AGENTS.md first and follow it strictly.

Set up the bottom tab navigation with 3 tabs: Templates, Customers, History.
Use Expo Router file-based routing with (tabs) layout.
Use placeholder screens for all 3 tabs — just a centered label for now.
Apply the dark theme from globals.css: bg-gray-950 background, gray-900 tab bar.
Active tab icon: blue-500. Inactive: gray-500.
Do not implement any tab content yet.
```

### Prompt 3 — Template Browser
```
Read the AGENTS.md first and follow it strictly.

Implement the Templates tab screen. It should:
1. On mount, fetch the catalog from CATALOG_URL (constants/cdn.ts)
2. Show a horizontal scrollable row of category chips (Blouse, Shirt, Salwar...)
3. Below that, show a grid of variant cards for the selected category
4. Each card shows: variant name, description, number of measurement fields required
5. Tapping a card navigates to app/template/[id].tsx (measurement input screen — placeholder for now)
6. Show a loading spinner while fetching and an error message with retry if fetch fails.

Do not implement the measurement input screen yet.
Preserve the tab navigation structure exactly.
```

---

## 16. Key Insights From the Video

1. **agents.md is everything.** Without it, AI picks different libraries and patterns every session. With it, every prompt starts from the same foundation.

2. **One thing per prompt.** "Set up NativeWind + build onboarding + add auth" is 3 prompts. Merge them and when something breaks you can't tell which caused it.

3. **Constraints protect working code.** Add "preserve existing UI exactly" and "do not modify formula-engine.ts" to every prompt. AI doesn't know what's already working unless you tell it.

4. **New session per feature.** Stale context leaks into prompts and confuses the AI. Fresh session = fresh context. Only stay in the same chat for immediate follow-up fixes.

5. **Paste docs for fast-moving libraries.** NativeWind v5, Skia, Expo Router — AI training data is months behind. Copy the current docs page and paste at the end of the prompt.

6. **Fix bugs with one targeted prompt.** State the problem in one sentence. State the correct behavior. One constraint if needed. Never re-explain the full feature.

7. **Add rules to agents.md as they come up.** When NativeWind doesn't work on SafeAreaView, add it to agents.md. You solve it once, never repeat it.

8. **Review code before moving on.** After each feature, read the key files. Ask AI to explain anything unclear. Catch inconsistencies early.

---

## 17. Saving This Context — Memory Note for the Build Session

When you start the new session, tell Claude:

> "I'm building a React Native tailor pattern-making app with Expo. I have a full PRD and build guide. I'll be following the Practical Vibe Coding workflow — one feature per prompt, agents.md at the root, new chat session per feature. The formula engine is already written (mathjs-based, copied from a working web app). Templates are hosted on jsDelivr CDN. No backend, no auth, everything is local AsyncStorage."

Then paste this entire document.
