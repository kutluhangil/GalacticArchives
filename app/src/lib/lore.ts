// Lore data access: lazy per-planet JSON imports + localization helpers.

import type { CelestialBody, Character, Era, Faction, MediaEntry, Region } from '../types/lore'
import erasJson from '../data/meta/eras.json'
import regionsJson from '../data/meta/regions.json'
import factionsJson from '../data/meta/factions.json'
import mediaJson from '../data/meta/media.json'

export const eras = erasJson as Era[]
export const regions = regionsJson as Region[]
export const factions = factionsJson as Faction[]
export const media = mediaJson as MediaEntry[]

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

export async function loadBody(id: string): Promise<CelestialBody> {
  const hit = cache.get(id)
  if (hit) return hit
  const path = `../data/planets/${id}.json`
  const loader = planetModules[path]
  if (!loader) throw new Error(`Unknown planet id "${id}" (no file at ${path})`)
  const mod = await loader()
  const body = mod.default
  cache.set(body.id, body)
  for (const moon of body.moonsDetail ?? []) cache.set(moon.id, moon)
  return body
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
