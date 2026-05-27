import { PatternPoint } from './store'

// Extract point names referenced in a formula string
// e.g. "A.x + shoulder" → ['A']
// e.g. "midpoint(B, C).x" → ['B', 'C']
export function extractPointRefs(formula: string, pointNames: Set<string>): string[] {
  const refs = new Set<string>()
  // Match word tokens that are known point names
  const tokens = formula.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []
  for (const tok of tokens) {
    if (pointNames.has(tok)) refs.add(tok)
  }
  return [...refs]
}

// Returns evaluation order as an array of point ids (topological sort)
// Throws if a circular dependency is detected
export function topologicalSort(
  points: Record<string, PatternPoint>
): string[] {
  const nameToId: Record<string, string> = {}
  for (const [id, pt] of Object.entries(points)) {
    nameToId[pt.name] = id
  }
  const pointNames = new Set(Object.values(points).map(p => p.name))

  // Build adjacency: id → set of ids that THIS point depends on
  const deps: Record<string, Set<string>> = {}
  for (const [id, pt] of Object.entries(points)) {
    const xRefs = extractPointRefs(pt.xFormula, pointNames)
    const yRefs = extractPointRefs(pt.yFormula, pointNames)
    const allRefs = new Set([...xRefs, ...yRefs])
    deps[id] = new Set(
      [...allRefs].map(name => nameToId[name]).filter(Boolean)
    )
  }

  // Kahn's algorithm
  const inDegree: Record<string, number> = {}
  const dependents: Record<string, string[]> = {} // id → list of ids that depend on id

  for (const id of Object.keys(points)) {
    inDegree[id] = 0
    dependents[id] = []
  }

  for (const [id, depSet] of Object.entries(deps)) {
    for (const dep of depSet) {
      dependents[dep].push(id)
      inDegree[id] = (inDegree[id] ?? 0) + 1
    }
  }

  const queue = Object.keys(points).filter(id => inDegree[id] === 0)
  const order: string[] = []

  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)
    for (const dependent of dependents[id]) {
      inDegree[dependent]--
      if (inDegree[dependent] === 0) queue.push(dependent)
    }
  }

  if (order.length !== Object.keys(points).length) {
    throw new Error('Circular dependency detected in points')
  }

  return order
}
