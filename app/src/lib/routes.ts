// The hyperlane network: canon trade routes as a graph, and the shortest
// course between two of its stops.
//
// A lane is an ordered list of stops; consecutive stops are one jump apart. A
// stop named by two lanes is one junction, which is what makes the lanes a
// network rather than a bundle of separate lines — the merge key is the stop's
// article title (see RouteStop.article).
//
// Distances are canon-scaled: one Standard Galactic Grid square is 15 parsecs
// (see galaxy-grid.ts), so a course length is measured, not invented.

import routesJson from '../data/routes.json'
import type { HyperspaceRoute, RouteStop } from '../types/lore'
import { parsecsBetween } from './galaxy-grid'

interface RoutesFile {
  generatedAt: string
  method: string
  routes: HyperspaceRoute[]
}

const file = routesJson as unknown as RoutesFile

export const routes = file.routes
export const routesGeneratedAt = file.generatedAt

/** the name to print for a stop: the lane's own wording when it differs */
export const stopLabel = (stop: RouteStop): string => stop.label ?? stop.article

/** "wookieepedia:<article>" for a stop, whose article title is its citation */
export const stopSource = (stop: RouteStop): string => `wookieepedia:${stop.article}`

/** A stop, merged across every lane that calls at it. */
export interface LaneNode {
  article: string
  label: string
  coordinates: string
  /** set when the stop is a world this archive ships a record for */
  bodyId?: string
  /** lanes calling here; more than one makes this a junction */
  routeIds: string[]
}

interface Edge {
  to: string
  routeId: string
  parsecs: number
}

interface Network {
  nodes: Map<string, LaneNode>
  edges: Map<string, Edge[]>
}

let network: Network | null = null

/** Built once: the lane data is static, and every consumer wants the same graph. */
export function hyperlaneNetwork(): Network {
  if (network) return network
  const nodes = new Map<string, LaneNode>()
  const edges = new Map<string, Edge[]>()

  for (const route of routes) {
    for (const stop of route.stops) {
      const existing = nodes.get(stop.article)
      if (existing) {
        if (!existing.routeIds.includes(route.id)) existing.routeIds.push(route.id)
        continue
      }
      nodes.set(stop.article, {
        article: stop.article,
        label: stopLabel(stop),
        coordinates: stop.coordinates,
        bodyId: stop.bodyId,
        routeIds: [route.id],
      })
    }
    for (let i = 1; i < route.stops.length; i++) {
      const a = route.stops[i - 1]
      const b = route.stops[i]
      const parsecs = parsecsBetween(a.coordinates, b.coordinates)
      for (const [from, to] of [
        [a.article, b.article],
        [b.article, a.article],
      ]) {
        const list = edges.get(from) ?? []
        list.push({ to, routeId: route.id, parsecs })
        edges.set(from, list)
      }
    }
  }

  network = { nodes, edges }
  return network
}

/** every stop, sorted by name — the planner's pick lists */
export function laneNodes(): LaneNode[] {
  return [...hyperlaneNetwork().nodes.values()].sort((a, b) => a.label.localeCompare(b.label, 'en'))
}

export function laneNodeForBody(bodyId: string): LaneNode | undefined {
  return [...hyperlaneNetwork().nodes.values()].find((n) => n.bodyId === bodyId)
}

/** one jump along one lane */
export interface Leg {
  from: LaneNode
  to: LaneNode
  routeId: string
  parsecs: number
}

export interface Course {
  legs: Leg[]
  /** total course length in parsecs */
  parsecs: number
  /** jumps flown; one per leg */
  jumps: number
  /** how many times the course leaves one lane for another */
  laneChanges: number
}

/**
 * Shortest course between two stops, by distance flown. Dijkstra over the lane
 * graph; ties break on the article title so the same pair always plans the same
 * course. Returns null when no lane connects them.
 */
export function planCourse(fromArticle: string, toArticle: string): Course | null {
  const { nodes, edges } = hyperlaneNetwork()
  if (!nodes.has(fromArticle) || !nodes.has(toArticle)) return null
  if (fromArticle === toArticle) return { legs: [], parsecs: 0, jumps: 0, laneChanges: 0 }

  const dist = new Map<string, number>([[fromArticle, 0]])
  const cameFrom = new Map<string, { article: string; routeId: string; parsecs: number }>()
  const settled = new Set<string>()
  // the network is a few hundred stops, so a linear scan for the next node is
  // cheaper to read than a heap and fast enough to run on every pick
  const frontier = new Set<string>([fromArticle])

  while (frontier.size) {
    let current: string | null = null
    let best = Infinity
    for (const article of [...frontier].sort()) {
      const d = dist.get(article) ?? Infinity
      if (d < best) {
        best = d
        current = article
      }
    }
    if (current === null) break
    frontier.delete(current)
    settled.add(current)
    if (current === toArticle) break

    for (const edge of edges.get(current) ?? []) {
      if (settled.has(edge.to)) continue
      const candidate = best + edge.parsecs
      if (candidate < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, candidate)
        cameFrom.set(edge.to, { article: current, routeId: edge.routeId, parsecs: edge.parsecs })
        frontier.add(edge.to)
      }
    }
  }

  if (!cameFrom.has(toArticle)) return null

  const legs: Leg[] = []
  for (let at = toArticle; at !== fromArticle; ) {
    const step = cameFrom.get(at)!
    legs.unshift({
      from: nodes.get(step.article)!,
      to: nodes.get(at)!,
      routeId: step.routeId,
      parsecs: step.parsecs,
    })
    at = step.article
  }

  return {
    legs,
    parsecs: legs.reduce((sum, leg) => sum + leg.parsecs, 0),
    jumps: legs.length,
    laneChanges: legs.filter((leg, i) => i > 0 && legs[i - 1].routeId !== leg.routeId).length,
  }
}

/** stop articles grouped into connected components; one group = one network */
export function networkComponents(): string[][] {
  const { nodes, edges } = hyperlaneNetwork()
  const seen = new Set<string>()
  const groups: string[][] = []
  for (const article of nodes.keys()) {
    if (seen.has(article)) continue
    const group: string[] = []
    const queue = [article]
    seen.add(article)
    while (queue.length) {
      const at = queue.shift()!
      group.push(at)
      for (const edge of edges.get(at) ?? []) {
        if (seen.has(edge.to)) continue
        seen.add(edge.to)
        queue.push(edge.to)
      }
    }
    groups.push(group.sort())
  }
  return groups.sort((a, b) => b.length - a.length)
}
