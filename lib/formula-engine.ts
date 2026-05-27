import * as math from 'mathjs'
import { PatternPoint } from './store'
import { topologicalSort } from './dependency-graph'

export interface FormulaResult {
  computed: Record<string, { x: number; y: number }>
  error: string | null
}

// Build the mathjs scope from measurements + already-computed points
function buildScope(
  measurements: Record<string, number>,
  computed: Record<string, { x: number; y: number }>
): Record<string, unknown> {
  const scope: Record<string, unknown> = { ...measurements }

  // Expose each point as an object: { x, y }
  // Also expose A_x, A_y style aliases for safety
  for (const [name, coords] of Object.entries(computed)) {
    scope[name] = { x: coords.x, y: coords.y }
  }

  // Geometry helpers — point-object versions
  scope['dist'] = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(b.x - a.x, b.y - a.y)

  scope['midpoint'] = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  })

  scope['angle'] = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)

  // Geometry helpers — scalar versions (for use in formulas with inline coordinates)
  // dist2(x1, y1, x2, y2)
  scope['dist2'] = (x1: number, y1: number, x2: number, y2: number) =>
    Math.hypot(x2 - x1, y2 - y1)

  // rotX / rotY: rotate point (px,py) about centre (cx,cy) by angle theta (radians)
  scope['rotX'] = (px: number, py: number, cx: number, cy: number, theta: number) =>
    cx + Math.cos(theta) * (px - cx) - Math.sin(theta) * (py - cy)

  scope['rotY'] = (px: number, py: number, cx: number, cy: number, theta: number) =>
    cy + Math.sin(theta) * (px - cx) + Math.cos(theta) * (py - cy)

  // dartAngle: signed angle (radians, wrapped to [-π,π]) needed to rotate
  // the ray from centre C to p1 onto the ray from C to p2
  scope['dartAngle'] = (
    p1x: number, p1y: number,
    p2x: number, p2y: number,
    cx: number,  cy: number
  ) => {
    const a1 = Math.atan2(p1y - cy, p1x - cx)
    const a2 = Math.atan2(p2y - cy, p2x - cx)
    return Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1))
  }

  // intX / intY: x and y of the intersection of line (ax,ay)-(bx,by) with line (cx,cy)-(dx,dy)
  scope['intX'] = (ax: number, ay: number, bx: number, by: number,
                   cx: number, cy: number, dx: number, dy: number) => {
    const d1x = bx - ax, d1y = by - ay
    const d2x = dx - cx, d2y = dy - cy
    const det = d2x * d1y - d1x * d2y
    if (Math.abs(det) < 1e-10) return NaN
    const t = (-(cx - ax) * d2y + d2x * (cy - ay)) / det
    return ax + t * d1x
  }
  scope['intY'] = (ax: number, ay: number, bx: number, by: number,
                   cx: number, cy: number, dx: number, dy: number) => {
    const d1x = bx - ax, d1y = by - ay
    const d2x = dx - cx, d2y = dy - cy
    const det = d2x * d1y - d1x * d2y
    if (Math.abs(det) < 1e-10) return NaN
    const t = (-(cx - ax) * d2y + d2x * (cy - ay)) / det
    return ay + t * d1y
  }

  // perpX / perpY: foot of perpendicular from P=(px,py) to line through A=(ax,ay) and B=(bx,by)
  scope['perpX'] = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax, dy = by - ay
    const len2 = dx * dx + dy * dy
    if (len2 < 1e-20) return ax
    const t = ((px - ax) * dx + (py - ay) * dy) / len2
    return ax + t * dx
  }
  scope['perpY'] = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax, dy = by - ay
    const len2 = dx * dx + dy * dy
    if (len2 < 1e-20) return ay
    const t = ((px - ax) * dx + (py - ay) * dy) / len2
    return ay + t * dy
  }

  return scope
}

export function evaluateFormulas(
  measurements: Record<string, number>,
  points: Record<string, PatternPoint>
): FormulaResult {
  const computed: Record<string, { x: number; y: number }> = {}

  let order: string[]
  try {
    order = topologicalSort(points)
  } catch (e) {
    return { computed: {}, error: (e as Error).message }
  }

  for (const id of order) {
    const pt = points[id]
    const scope = buildScope(measurements, computed)

    try {
      const xRaw = pt.xFormula.trim()
      const yRaw = pt.yFormula.trim()

      const x = xRaw === '' ? 0 : Number(math.evaluate(xRaw, scope))
      const y = yRaw === '' ? 0 : Number(math.evaluate(yRaw, scope))

      if (!isFinite(x) || !isFinite(y)) {
        return { computed, error: `Point ${pt.name}: formula produced non-finite value` }
      }

      computed[pt.name] = { x, y }
    } catch (e) {
      return {
        computed,
        error: `Point ${pt.name}: ${(e as Error).message}`,
      }
    }
  }

  return { computed, error: null }
}

// Validate a single formula string — returns error message or null
export function validateFormula(
  formula: string,
  scope: Record<string, unknown>
): string | null {
  try {
    math.evaluate(formula, scope)
    return null
  } catch (e) {
    return (e as Error).message
  }
}
