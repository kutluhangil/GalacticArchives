// Provenance layer. The panel's honesty rests entirely on these four states
// being derived from sources.json rather than guessed.

import { describe, expect, it } from 'vitest'
import {
  isUnstatedInCanon,
  provenance,
  sourceFor,
  sourceNotes,
  sourcesGeneratedAt,
} from '../../src/lib/sources'
import { loadAllPlanets, loadCharacters, stations } from '../../src/lib/lore'

describe('sourceFor', () => {
  it('carries an article and a resolvable url for a known world', () => {
    const entry = sourceFor('tatooine')
    expect(entry?.source).toBe('wookieepedia:Tatooine')
    expect(entry?.url).toBe('https://starwars.fandom.com/wiki/Tatooine')
  })

  it('returns undefined for an unknown id rather than inventing a source', () => {
    expect(sourceFor('not-a-world')).toBeUndefined()
  })

  it('covers every shipped planet, moon, station and character', async () => {
    const planets = await loadAllPlanets()
    const moons = planets.flatMap((p) => p.moonsDetail ?? [])
    const characters = await loadCharacters()
    for (const body of [...planets, ...moons, ...stations]) {
      expect(sourceFor(body.id)?.url, `${body.id} source`).toBeTruthy()
    }
    for (const character of characters) {
      expect(sourceFor(character.id)?.url, `${character.id} source`).toBeTruthy()
    }
  })

  it('records when the provenance was last synced and what it means', () => {
    expect(Date.parse(sourcesGeneratedAt)).not.toBeNaN()
    expect(sourceNotes['global-unverified']).toContain('unverified')
  })
})

describe('isUnstatedInCanon', () => {
  it('is true for a field the article defines no value for', () => {
    // Moraband's infobox states no diameter, population or government
    expect(isUnstatedInCanon('moraband', 'diameter')).toBe(true)
    expect(isUnstatedInCanon('moraband', 'population')).toBe(true)
    expect(isUnstatedInCanon('moraband', 'government')).toBe(true)
  })

  it('is false for a field the article does define', () => {
    expect(isUnstatedInCanon('tatooine', 'diameter')).toBe(false)
    expect(isUnstatedInCanon('tatooine', 'population')).toBe(false)
  })

  it('is false for an unknown body instead of throwing', () => {
    expect(isUnstatedInCanon('not-a-world', 'diameter')).toBe(false)
  })
})

describe('provenance', () => {
  it('calls a value from the infobox sourced', () => {
    expect(provenance('tatooine', 'diameter', true)).toBe('sourced')
  })

  it('calls a value we wrote ourselves authored', () => {
    // canon states no government for Tatooine; the panel's text is our summary
    expect(provenance('tatooine', 'government', true)).toBe('authored')
  })

  it('calls an empty field canon is silent about unstated', () => {
    expect(provenance('moraband', 'diameter', false)).toBe('unstated')
  })

  it('calls an empty field canon does state a gap', () => {
    expect(provenance('tatooine', 'diameter', false)).toBe('gap')
  })

  it('reports unknown provenance for an unsourced body', () => {
    expect(provenance('not-a-world', 'diameter', true)).toBeUndefined()
  })
})

describe('shipped data honesty', () => {
  it('ships no placeholder stat values', async () => {
    const planets = await loadAllPlanets()
    const bodies = [...planets, ...planets.flatMap((p) => p.moonsDetail ?? []), ...stations]
    const placeholders = new Set(['—', '–', '-', '?', 'n/a', 'N/A', ''])
    for (const body of bodies) {
      for (const [key, value] of Object.entries(body.stats ?? {})) {
        const texts = typeof value === 'object' && value ? Object.values(value) : []
        for (const text of texts) {
          expect(placeholders.has(String(text).trim()), `${body.id}.stats.${key}`).toBe(false)
        }
      }
      expect(body.stats?.diameterKm, `${body.id}.stats.diameterKm`).not.toBe(0)
    }
  })

  it('never claims a field is unstated while shipping a value the article states', async () => {
    const planets = await loadAllPlanets()
    for (const planet of planets) {
      if (planet.stats?.diameterKm) {
        // a diameter we ship for a world whose article states one must be sourced
        const state = provenance(planet.id, 'diameter', true)
        expect(['sourced', 'authored'], `${planet.id}`).toContain(state)
      }
    }
  })
})
