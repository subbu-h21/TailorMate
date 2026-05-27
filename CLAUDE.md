@AGENTS.md
# TailorMate

## What This Is
React Native Expo app for tailors. Select garment template → enter measurements → renders scaled sewing pattern → export SVG. No backend. No auth. Single tailor's phone.

## Critical Rules
1. NEVER modify lib/formula-engine.ts or lib/dependency-graph.ts
2. NEVER add a backend, database, or auth — everything is local AsyncStorage
3. NEVER use StyleSheet on components that support NativeWind className (exception: SafeAreaView, Skia containers)
4. NEVER install a new library without asking first
5. One feature per prompt — stop after the file is written and linted

## Architecture
Templates → jsDelivr CDN (JSON fetch). State → Zustand + AsyncStorage persist.
Canvas → React Native Skia. Formula eval → lib/formula-engine.ts (mathjs).
See docs/DESIGN.md for full spec.

## File Structure
app/(tabs)/index.tsx  app/(tabs)/customers.tsx  app/(tabs)/history.tsx
app/template/[id].tsx  app/canvas/[id].tsx
lib/formula-engine.ts  lib/dependency-graph.ts  lib/load-template.ts
stores/customerStore.ts  stores/historyStore.ts  stores/templateStore.ts
constants/cdn.ts  types/index.ts

## Build Progress
- [ ] NativeWind + design system
- [ ] Bottom tab navigation
- [ ] Template browser (Templates tab)
- [ ] Measurement input screen
- [ ] Pattern canvas (Skia)
- [ ] Export (SVG + share sheet)
- [ ] Customers tab
- [ ] History tab
