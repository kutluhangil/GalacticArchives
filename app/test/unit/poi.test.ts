// Points of interest. The placement on the globe is this archive's invention;
// the place itself is not, so each one cites the article it came from.

import { describe, expect, it } from 'vitest'
import { articleUrl } from '../../src/lib/sources'
import { loadAllPlanets, stations } from '../../src/lib/lore'
import type { CelestialBody } from '../../src/types/lore'
import poiDigest from '../fixtures/poi-digest.json'

const articles = poiDigest.articles as Record<string, { continuity?: string; missing?: boolean }>

async function allBodies(): Promise<CelestialBody[]> {
  const planets = await loadAllPlanets()
  return [...planets, ...planets.flatMap((p) => p.moonsDetail ?? []), ...stations]
}

describe('coverage', () => {
  it('reaches most of the archive rather than a handful of hero worlds', async () => {
    const bodies = await allBodies()
    const withPoi = bodies.filter((b) => (b.poi ?? []).length)
    expect(withPoi.length).toBeGreaterThanOrEqual(85)
    expect(bodies.flatMap((b) => b.poi ?? []).length).toBeGreaterThanOrEqual(170)
  })

  it('cites a source for all but a named handful', async () => {
    const pois = (await allBodies()).flatMap((b) => b.poi ?? [])
    const cited = pois.filter((p) => p.source)
    // the uncited remainder are places canon shows but never gave an article
    // (Scarif's landing beaches, Peridea's bone ring); validate-lore lists them
    expect(cited.length / pois.length).toBeGreaterThan(0.95)
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

describe('citations, against the fetched snapshot', () => {
  it('cites only articles Wookieepedia actually has', async () => {
    for (const body of await allBodies()) {
      for (const poi of body.poi ?? []) {
        if (!poi.source) continue
        const article = poi.source.slice('wookieepedia:'.length)
        expect(articles[article], `${body.id}/${poi.id} -> ${article}`).toBeDefined()
        expect(articles[article]?.missing, `${body.id}/${poi.id} -> ${article}`).toBeUndefined()
      }
    }
  })

  it('never pins a Legends place on a canon world, or the reverse', async () => {
    for (const body of await allBodies()) {
      for (const poi of body.poi ?? []) {
        if (!poi.source) continue
        const article = poi.source.slice('wookieepedia:'.length)
        expect(articles[article]?.continuity, `${body.id}/${poi.id} -> ${article}`).toBe(
          body.continuity ?? 'canon',
        )
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
