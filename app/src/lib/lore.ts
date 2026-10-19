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
  SunSpec,
  TimelineEvent,
  Transmission,
  Species,
  Droid,
  ArsenalItem,
  TerritoryZone,
  BestiaryCreature,
  Organization,
} from '../types/lore'
import erasJson from '../data/meta/eras.json'
import regionsJson from '../data/meta/regions.json'
import factionsJson from '../data/meta/factions.json'
import mediaJson from '../data/meta/media.json'
import stationsJson from '../data/stations.json'
import territoriesJson from '../data/territories.json'

export const territories = territoriesJson as TerritoryZone[]


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

/** What a star system holds, read off the primary body's own record: the suns
 *  it turns around, the moon figure canon states, the moons the archive can
 *  name, and the stations standing in this era. Nothing is inferred — a world
 *  whose article gives no moon count reports none rather than a guess. */
export interface SystemFacts {
  /** the system's name as the body's record gives it, e.g. "Tatoo system" */
  name: string
  suns: SunSpec[]
  /** the canon figure, when the record carries one */
  moonCount?: number
  /** moons the archive can name: renderable companions first, then the minors
   *  the record only lists by name */
  namedMoons: string[]
  /** era-gated: the Death Stars come and go with the era */
  stations: CelestialBody[]
}

export function systemFacts(body: CelestialBody, era: EraId, lang: Lang): SystemFacts {
  const named: string[] = []
  for (const name of [
    ...(body.moonsDetail ?? []).map((moon) => moon.names[lang]),
    ...(body.moons ?? []),
  ]) {
    // a renderable companion is often listed among the minors too (Concordia)
    if (!named.some((seen) => seen.toLowerCase() === name.toLowerCase())) named.push(name)
  }

  return {
    name: body.system,
    suns: body.suns ?? [],
    moonCount: body.stats?.moonCount,
    namedMoons: named,
    stations: stationsForHost(body.id, era),
  }
}

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

export class UnknownBodyError extends Error {
  constructor(id: string) {
    super(`Unknown body id "${id}" (no planet file, moon or station matches)`)
    this.name = 'UnknownBodyError'
  }
}

export function isUnknownBodyError(error: unknown): error is UnknownBodyError {
  return error instanceof UnknownBodyError
}

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
    throw new UnknownBodyError(id)
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

/** The sectors that name worlds in the archive, alphabetical, with how many
 *  worlds each holds. Canon draws no sector borders this map could trace — 60
 *  sectors across 74 worlds, most of them holding a single one — so a sector is
 *  an axis to search and filter along, never a polygon on the map. A world
 *  whose sector canon leaves unstated simply omits the field. */
export function sectorsIn(bodies: CelestialBody[]): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const body of bodies) {
    if (!body.sector) continue
    counts.set(body.sector, (counts.get(body.sector) ?? 0) + 1)
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** "Arkanis sector" reads as "Arkanis" where the column already says sector. */
export function sectorShort(name: string): string {
  return name.replace(/\s+sector$/i, '')
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

let timelineCache: TimelineEvent[] | null = null
export async function loadTimelineEvents(): Promise<TimelineEvent[]> {
  if (!timelineCache) {
    const mod = await import('../data/timeline.json')
    timelineCache = mod.default as TimelineEvent[]
  }
  return timelineCache
}

let transmissionsCache: Transmission[] | null = null
export async function loadTransmissions(): Promise<Transmission[]> {
  if (!transmissionsCache) {
    const mod = await import('../data/transmissions.json')
    transmissionsCache = mod.default as Transmission[]
  }
  return transmissionsCache
}

let speciesCache: Species[] | null = null
export async function loadSpecies(): Promise<Species[]> {
  if (!speciesCache) {
    const mod = await import('../data/species.json')
    speciesCache = mod.default as Species[]
  }
  return speciesCache
}

let droidsCache: Droid[] | null = null
export async function loadDroids(): Promise<Droid[]> {
  if (!droidsCache) {
    const mod = await import('../data/droids.json')
    droidsCache = mod.default as Droid[]
  }
  return droidsCache
}

let arsenalCache: ArsenalItem[] | null = null
export async function loadArsenal(): Promise<ArsenalItem[]> {
  if (!arsenalCache) {
    const mod = await import('../data/arsenal.json')
    arsenalCache = mod.default as ArsenalItem[]
  }
  return arsenalCache
}

let bestiaryCache: BestiaryCreature[] | null = null
export async function loadBestiary(): Promise<BestiaryCreature[]> {
  if (!bestiaryCache) {
    const mod = await import('../data/bestiary.json')
    bestiaryCache = mod.default as BestiaryCreature[]
  }
  return bestiaryCache
}

let organizationsCache: Organization[] | null = null
export async function loadOrganizations(): Promise<Organization[]> {
  if (!organizationsCache) {
    const mod = await import('../data/organizations.json')
    organizationsCache = mod.default as Organization[]
  }
  return organizationsCache
}





