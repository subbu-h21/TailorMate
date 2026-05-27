# TailorMate

A mobile app for professional tailors. Pick a garment template, enter client measurements, and instantly get a scaled sewing pattern you can print or share.

**No backend. No login. Everything lives on the tailor's phone.**

---

## What It Does

1. **Browse templates** — blouses, shirts, salwars, and more, fetched from a CDN catalog
2. **Enter measurements** — per-template fields, with optional saved customer profiles
3. **Generate the pattern** — a parametric formula engine computes every point from your measurements
4. **Export** — share as SVG or print a 1:1 scale PDF straight from your phone

---

## Stack

| Concern | Library |
|---|---|
| Framework | Expo SDK 56 + TypeScript + Expo Router |
| Styling | NativeWind v4 (Tailwind CSS for React Native) |
| Canvas | React Native Skia |
| Formula engine | mathjs (parametric point evaluation) |
| State | Zustand + AsyncStorage (fully local, persisted) |
| Templates | JSON files hosted on GitHub + jsDelivr CDN |
| Export | expo-print · expo-sharing · expo-file-system |

---

## Screens

```
Bottom tabs
├── Templates   — browse garment categories and variants
├── Customers   — saved client profiles with measurements
└── History     — past generated patterns

Stack screens
├── app/template/[id].tsx  — measurement input
└── app/canvas/[id].tsx    — Skia pattern canvas + export
```

---

## How the Formula Engine Works

Templates define each pattern point as a pair of math expressions:

```json
{ "name": "O", "x": "bust_width / 2", "y": "B.y + sqrt(bust_height_nbp ^ 2 - (bust_width / 2) ^ 2)" }
```

At runtime:
1. `evaluateFormulas(measurements, points)` resolves a topological dependency order
2. Each formula is evaluated with mathjs, with measurements and previously-computed points in scope
3. The resulting `{ x, y }` coordinates (in cm) are rendered on the Skia canvas

Built-in geometry helpers: `dist`, `midpoint`, `intX/Y` (line intersection), `perpX/Y` (perpendicular foot), `rotX/Y` (rotation), `dartAngle`.

---

## Template Format

Templates are JSON files served from a GitHub repo via jsDelivr:

```json
{
  "name": "Round Neck Blouse Front",
  "measurements": { "bust_round": 89, "shoulder": 11.5 },
  "points": [
    { "name": "A", "x": "0", "y": "0" },
    { "name": "B", "x": "0", "y": "10" },
    { "name": "I", "x": "bust_width / 2", "y": "H.y" }
  ],
  "lines": [
    { "from": "B", "to": "C" }
  ]
}
```

The CDN catalog (`index.json`) lists all available templates. The app fetches it on first load and caches it locally.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

Requires [Expo Go](https://expo.dev/go) on your device, or an Android/iOS simulator.

---

## Project Structure

```
app/
  (tabs)/
    index.tsx          Template browser
    customers.tsx      Customer profiles
    history.tsx        Pattern history
  template/[id].tsx    Measurement input screen
  canvas/[id].tsx      Pattern canvas + export
lib/
  formula-engine.ts    mathjs evaluator (do not modify)
  dependency-graph.ts  Topological sort (do not modify)
  load-template.ts     CDN fetch + parse
  export.ts            SVG + print HTML builders
stores/
  customerStore.ts     Zustand + AsyncStorage
  historyStore.ts      Zustand + AsyncStorage
  templateStore.ts     Zustand (CDN is source of truth)
constants/
  cdn.ts               jsDelivr base URL
types/
  index.ts             Shared TypeScript interfaces
```

---

## PDF Export

Printed PDFs are **1:1 scale** — 1 cm in the pattern = 1 cm on paper. The export includes the pattern SVG, a 10 cm scale bar, and a measurement table. A bold warning reminds the tailor to print at 100% and not "fit to page".
