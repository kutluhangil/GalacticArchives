// Lore access layer: era gating, station visibility, lazy body loading.

import { describe, expect, it } from 'vitest'
import type { CelestialBody, EraId } from '../../src/types/lore'
import {
  ERA_ORDER,
  L,
  LL,
  destroyedInEra,
  eras,
  factionById,
  loadAllPlanets,
  loadBody,
  loadCharacters,
  mediaById,
  planetIds,
  rendersAsRubble,
  stationsForHost,
} from '../../src/lib/lore'

describe('ERA_ORDER', () => {
  it('matches eras.json order exactly', () => {
    // the timeline reads its eras from the JSON while every era comparison in
    // the engines walks ERA_ORDER — a drift between the two silently reorders
    // destruction and affiliation logic
    expect(ERA_ORDER).toEqual(eras.map((e) => e.id))
  })
})

describe('destroyedInEra', () => {
  it('is false for a body with no destruction record', async () => {
    const tatooine = await loadBody('tatooine')
    for (const era of ERA_ORDER) expect(destroyedInEra(tatooine, era)).toBe(false)
  })

  it('turns true at the destruction era and stays true after it', async () => {
    const alderaan = await loadBody('alderaan')
    expect(alderaan.destruction?.destroyedFromEra).toBe('empire')
    expect(destroyedInEra(alderaan, 'old-republic')).toBe(false)
    expect(destroyedInEra(alderaan, 'clone-wars')).toBe(false)
    expect(destroyedInEra(alderaan, 'empire')).toBe(true)
    expect(destroyedInEra(alderaan, 'new-republic')).toBe(true)
  })
})

describe('rendersAsRubble', () => {
  it('renders rubble once a world is destroyed', async () => {
    const alderaan = await loadBody('alderaan')
    expect(rendersAsRubble(alderaan, 'empire')).toBe(true)
  })

  it('lets an era render variant win over destruction (Ilum / Starkiller Base)', async () => {
    const ilum = await loadBody('ilum')
    expect(ilum.renderRecipe.variantsByEra?.['new-republic']).toBeTruthy()
    // destroyed in that era, but the weapon state is the truer picture of it
    expect(destroyedInEra(ilum, 'new-republic')).toBe(true)
    expect(rendersAsRubble(ilum, 'new-republic')).toBe(false)
  })
})

describe('stationsForHost', () => {
  it('returns a station only in the eras it exists in', () => {
    expect(stationsForHost('yavin', 'empire').map((s) => s.id)).toEqual(['death-star'])
    expect(stationsForHost('yavin', 'new-republic')).toEqual([])
    expect(stationsForHost('endor', 'empire').map((s) => s.id)).toEqual(['death-star-2'])
  })

  it('returns nothing for a host with no stations', () => {
    expect(stationsForHost('tatooine', 'empire')).toEqual([])
  })
})

describe('localization helpers', () => {
  it('picks the requested language', () => {
    expect(L({ en: 'Desert', tr: 'Çöl' }, 'tr')).toBe('Çöl')
    expect(LL({ en: ['a'], tr: ['b'] }, 'en')).toEqual(['a'])
  })

  it('degrades to empty rather than throwing on absent fields', () => {
    expect(L(undefined, 'en')).toBe('')
    expect(LL(undefined, 'en')).toEqual([])
  })
})

describe('planetIds', () => {
  it('is sorted and free of duplicates', () => {
    expect(planetIds).toEqual([...planetIds].sort())
    expect(new Set(planetIds).size).toBe(planetIds.length)
  })

  it('covers every authored planet file', () => {
    expect(planetIds.length).toBe(81)
    expect(planetIds).toContain('tatooine')
  })
})

describe('loadBody', () => {
  it('loads a planet and caches it by identity', async () => {
    const first = await loadBody('coruscant')
    const second = await loadBody('coruscant')
    expect(first.id).toBe('coruscant')
    expect(second).toBe(first)
  })

  it('resolves a station id straight from the seeded cache', async () => {
    const deathStar = await loadBody('death-star')
    expect(deathStar.kind).toBe('station')
    expect(deathStar.orbitHost).toBe('yavin')
  })

  it('resolves a moon id by scanning parents lazily', async () => {
    const moon = await loadBody('yavin-4')
    expect(moon.id).toBe('yavin-4')
  })

  it('throws an actionable error for an unknown id', async () => {
    await expect(loadBody('alderaan-2')).rejects.toThrow(
      'Unknown body id "alderaan-2" (no planet file, moon or station matches)',
    )
  })
})

describe('loadAllPlanets', () => {
  it('returns every planet once and caches the array', async () => {
    const all = await loadAllPlanets()
    expect(all.length).toBe(planetIds.length)
    expect(new Set(all.map((b) => b.id)).size).toBe(all.length)
    expect(await loadAllPlanets()).toBe(all)
  })

  it('gives every body a render recipe the engines can consume', async () => {
    const all = await loadAllPlanets()
    for (const body of all) {
      expect(body.renderRecipe?.archetype, `${body.id} archetype`).toBeTruthy()
      expect(body.renderRecipe?.palette?.primary, `${body.id} palette`).toBeTruthy()
    }
  })

  it('only exposes era render variants for known eras', async () => {
    const all = await loadAllPlanets()
    const known = new Set<string>(ERA_ORDER)
    for (const body of all) {
      for (const era of Object.keys(body.renderRecipe.variantsByEra ?? {})) {
        expect(known.has(era), `${body.id} variant era "${era}"`).toBe(true)
      }
    }
  })
})

describe('lookup helpers', () => {
  it('returns undefined instead of guessing on unknown ids', () => {
    expect(factionById(undefined)).toBeUndefined()
    expect(factionById('galactic-plumbers-guild')).toBeUndefined()
    expect(mediaById('episode-x')).toBeUndefined()
  })

  it('finds a real faction and media entry', () => {
    expect(factionById('empire')?.id).toBe('empire')
    expect(mediaById('anh')?.type).toBe('film')
  })
})

describe('loadCharacters', () => {
  it('loads once and reuses the cache', async () => {
    const first = await loadCharacters()
    expect(first.length).toBeGreaterThan(0)
    expect(await loadCharacters()).toBe(first)
  })

  it('points every homeworldId at a loadable body', async () => {
    const characters = await loadCharacters()
    const withHome = characters.filter((c) => c.homeworldId)
    expect(withHome.length).toBeGreaterThan(0)
    for (const character of withHome) {
      const body: CelestialBody = await loadBody(character.homeworldId!)
      expect(body.id).toBe(character.homeworldId)
    }
  })
})

describe('era affiliations', () => {
  it('never references an era outside ERA_ORDER', async () => {
    const all = await loadAllPlanets()
    const known = new Set<EraId>(ERA_ORDER)
    for (const body of all) {
      for (const era of Object.keys(body.affiliationsByEra ?? {}) as EraId[]) {
        expect(known.has(era), `${body.id} affiliation era "${era}"`).toBe(true)
      }
    }
  })
})
