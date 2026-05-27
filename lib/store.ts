// Type shim — lets formula-engine.ts and dependency-graph.ts
// compile without modification. The canvas screen adapts
// TemplatePoint (x/y) into this shape (xFormula/yFormula).
export interface PatternPoint {
  name: string
  xFormula: string
  yFormula: string
}
