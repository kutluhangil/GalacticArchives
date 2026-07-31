// Points of interest. The placement on the globe is this archive's invention;
// the place itself is not, so each one cites the article it came from.

import { describe, expect, it } from 'vitest'
import { articleUrl } from '../../src/lib/sources'
import { loadAllPlanets, stations } from '../../src/lib/lore'
import type { CelestialBody } from '../../src/types/lore'

async function allBodies(): Promise<CelestialBody[]> {
  const planets = await loadAllPlanets()
  return [...planets, ...planets.flatMap((p) => p.moonsDetail ?? []), ...stations]
}

describe('coverage', () => {
  it('reaches most of the archive rather than a handful of hero worlds', async () => {
    const bodies = await allBodies()
    const withPoi = bodies.filter((b) => (b.poi ?? []).length)
    expect(withPoi.length).toBeGreaterThanOrEqual(75)
    expect(bodies.flatMap((b) => b.poi ?? []).length).toBeGreaterThanOrEqual(150)
  })

  it('cites a source for the overwhelming majority of them', async () => {
    const pois = (await allBodies()).flatMap((b) => b.poi ?? [])
    const cited = pois.filter((p) => p.source)
    // the uncited remainder are descriptive places with no article of their own
    // (Nevarro's lava flats, Scarif's landing beaches); validate-lore lists them
    expect(cited.length / pois.length).toBeGreaterThan(0.85)
  })
})

describe('shape', () => {
  it('keeps ids unique within a body', async () => {
    for (const body of await allBodies()) {
      const ids = (body.poi ?? []).map((p) => p.id)
      expect(new Set(ids).size, `${body.id}`).toBe(ids.length)
    }
  })

  it('places every marker on the globe', async () => {
    for (const body of await allBodies()) {
      for (const poi of body.poi ?? []) {
        expect(poi.lat, `${body.id}/${poi.id} lat`).toBeGreaterThanOrEqual(-90)
        expect(poi.lat, `${body.id}/${poi.id} lat`).toBeLessThanOrEqual(90)
        expect(poi.lon, `${body.id}/${poi.id} lon`).toBeGreaterThanOrEqual(-180)
        expect(poi.lon, `${body.id}/${poi.id} lon`).toBeLessThanOrEqual(180)
      }
    }
  })

  it('is bilingual in name and blurb', async () => {
    for (const body of await allBodies()) {
      for (const poi of body.poi ?? []) {
        expect(poi.names.en.trim(), `${body.id}/${poi.id}`).not.toBe('')
        expect(poi.names.tr.trim(), `${body.id}/${poi.id}`).not.toBe('')
        expect(poi.blurb.en.trim(), `${body.id}/${poi.id}`).not.toBe('')
        expect(poi.blurb.tr.trim(), `${body.id}/${poi.id}`).not.toBe('')
      }
    }
  })

  it('writes every citation in the one supported form', async () => {
    for (const body of await allBodies()) {
      for (const poi of body.poi ?? []) {
        if (poi.source === undefined) continue
        expect(poi.source, `${body.id}/${poi.id}`).toMatch(/^wookieepedia:.+/)
      }
    }
  })
})

describe('articleUrl', () => {
  it('turns a citation into its article address', () => {
    expect(articleUrl('wookieepedia:Mos Eisley')).toBe('https://starwars.fandom.com/wiki/Mos_Eisley')
  })

  it('keeps the Legends suffix, which points at a different article', () => {
    expect(articleUrl('wookieepedia:Valley of the Dark Lords/Legends')).toBe(
      'https://starwars.fandom.com/wiki/Valley_of_the_Dark_Lords/Legends',
    )
  })

  it('resolves every shipped citation to a wiki url', async () => {
    for (const body of await allBodies()) {
      for (const poi of body.poi ?? []) {
        if (!poi.source) continue
        expect(articleUrl(poi.source), `${body.id}/${poi.id}`).toMatch(
          /^https:\/\/starwars\.fandom\.com\/wiki\/\S+$/,
        )
      }
    }
  })
})
