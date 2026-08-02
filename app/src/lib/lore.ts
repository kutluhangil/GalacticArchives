// Lore data access: lazy per-planet JSON imports + localization helpers.

import type {
  Battle,
  CelestialBody,
  Character,
  Era,
  EraId,
  Faction,
  MediaEntry,
  Region,
  Starship,
} from '../types/lore'
import erasJson from '../data/meta/eras.json'
import regionsJson from '../data/meta/regions.json'
import factionsJson from '../data/meta/factions.json'
import mediaJson from '../data/meta/media.json'
import stationsJson from '../data/stations.json'

export const eras = erasJson as Era[]
export const regions = regionsJson as Region[]
export const factions = factionsJson as Faction[]
export const media = mediaJson as MediaEntry[]
export const stations = stationsJson as CelestialBody[]

export const ERA_ORDER: EraId[] = ['old-republic', 'clone-wars', 'empire', 'new-republic']

/** true when `era` is at or past the body's destruction era */
export function destroyedInEra(body: CelestialBody, era: EraId): boolean {
  if (!body.destruction) return false
  return ERA_ORDER.indexOf(era) >= ERA_ORDER.indexOf(body.destruction.destroyedFromEra)
}

/** Whether the engine should render rubble instead of a globe. An era-specific
 *  render variant wins over destruction: Ilum spends most of the New Republic
 *  era as Starkiller Base and only dies at its very end (34 ABY of 4–35 ABY),
 *  so the weapon state is the truer picture of that era. The HUD still shows
 *  the destruction notice. */
export function rendersAsRubble(body: CelestialBody, era: EraId): boolean {
  if (body.renderRecipe.variantsByEra?.[era]) return false
  return destroyedInEra(body, era)
}

/** stations orbiting `hostId` that exist in `era` (Death Stars are era-gated) */
export function stationsForHost(hostId: string, era: EraId): CelestialBody[] {
  return stations.filter((s) => s.orbitHost === hostId && (s.existsInEras ?? []).includes(era))
}

export type Lang = 'en' | 'tr'

export const L = (obj: { en: string; tr: string } | undefined, lang: Lang): string =>
  obj ? obj[lang] : ''

export const LL = (obj: { en: string[]; tr: string[] } | undefined, lang: Lang): string[] =>
  obj ? obj[lang] : []

/** P1 hero planets — one per flagship archetype. */
export const HERO_IDS = ['tatooine', 'coruscant', 'mustafar', 'hoth', 'bespin'] as const
export type HeroId = (typeof HERO_IDS)[number]

const planetModules = import.meta.glob<{ default: CelestialBody }>('../data/planets/*.json')

const cache = new Map<string, CelestialBody>()
for (const station of stations) cache.set(station.id, station)

export const planetIds = Object.keys(planetModules)
  .map((path) => path.replace('../data/planets/', '').replace('.json', ''))
  .sort()

export async function loadBody(id: string): Promise<CelestialBody> {
  const hit = cache.get(id)
  if (hit) return hit
  const path = `../data/planets/${id}.json`
  const loader = planetModules[path]
  if (!loader) {
    // moon ids only enter the cache once their parent loads — resolve parents lazily
    for (const parentPath of Object.keys(planetModules)) {
      const mod = await planetModules[parentPath]()
      cache.set(mod.default.id, mod.default)
      for (const moon of mod.default.moonsDetail ?? []) cache.set(moon.id, moon)
      const found = cache.get(id)
      if (found) return found
    }
    throw new Error(`Unknown body id "${id}" (no planet file, moon or station matches)`)
  }
  const mod = await loader()
  const body = mod.default
  cache.set(body.id, body)
  for (const moon of body.moonsDetail ?? []) cache.set(moon.id, moon)
  return body
}

let allCache: CelestialBody[] | null = null
/** every top-level planet file, loaded once (galaxy map + search) */
export async function loadAllPlanets(): Promise<CelestialBody[]> {
  if (allCache) return allCache
  const bodies = await Promise.all(planetIds.map((id) => loadBody(id)))
  allCache = bodies
  return bodies
}

export function factionById(id: string | undefined): Faction | undefined {
  return factions.find((f) => f.id === id)
}

export function mediaById(id: string): MediaEntry | undefined {
  return media.find((m) => m.id === id)
}

let charactersCache: Character[] | null = null
export async function loadCharacters(): Promise<Character[]> {
  if (!charactersCache) {
    const mod = await import('../data/characters.json')
    charactersCache = mod.default as Character[]
  }
  return charactersCache
}

let starshipsCache: Starship[] | null = null
export async function loadStarships(): Promise<Starship[]> {
  if (!starshipsCache) {
    const mod = await import('../data/starships.json')
    starshipsCache = mod.default as Starship[]
  }
  return starshipsCache
}

let battlesCache: Battle[] | null = null
export async function loadBattles(): Promise<Battle[]> {
  if (!battlesCache) {
    const mod = await import('../data/battles.json')
    battlesCache = mod.default as Battle[]
  }
  return battlesCache
}

