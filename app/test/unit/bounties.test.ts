// The Guild board links every posting to a world page and to the screen
// appearances it came from, so both references have to resolve.

import { describe, expect, it } from 'vitest'
import { eras, loadAllPlanets, loadBounties, mediaById } from '../../src/lib/lore'

describe('bounties dataset integrity', () => {
  it('every posting is bilingual, unique and points at a real world, era and title', async () => {
    const bounties = await loadBounties()
    const planetIds = new Set((await loadAllPlanets()).map((p) => p.id))
    const eraIds = new Set(eras.map((e) => e.id))

    expect(bounties.length).toBeGreaterThanOrEqual(4)
    const ids = new Set<string>()
    for (const b of bounties) {
      expect(ids.has(b.id), b.id).toBe(false)
      ids.add(b.id)
      for (const field of [b.target, b.client, b.hunters, b.desc]) {
        expect(field.en, b.id).toBeTruthy()
        expect(field.tr, b.id).toBeTruthy()
      }
      expect(planetIds.has(b.planetId), `${b.id} -> ${b.planetId}`).toBe(true)
      expect(eraIds.has(b.era), b.id).toBe(true)
      expect(['delivered', 'failed', 'abandoned']).toContain(b.status)
      for (const media of b.appearances) expect(mediaById(media), `${b.id} -> ${media}`).toBeTruthy()
    }
  })
})
