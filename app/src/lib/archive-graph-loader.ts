import { buildArchiveGraph, type ArchiveGraph } from './archive-graph'
import { loadAllPlanets, loadCharacters, loadTimelineEvents, stations } from './lore'

let graphCache: ArchiveGraph | null = null

/**
 * Loads every shipped lore record that can participate in archive
 * relationships. The graph builder stays pure; this adapter owns loading and
 * cache lifetime for route-level consumers.
 */
export async function loadArchiveGraph(): Promise<ArchiveGraph> {
  if (graphCache) return graphCache

  const [planets, characters, events] = await Promise.all([
    loadAllPlanets(),
    loadCharacters(),
    loadTimelineEvents(),
  ])
  const moons = planets.flatMap((planet) => planet.moonsDetail ?? [])

  graphCache = buildArchiveGraph({
    bodies: [...planets, ...moons, ...stations],
    characters,
    events,
  })
  return graphCache
}
