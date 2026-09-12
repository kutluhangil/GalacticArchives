import { describe, expect, it } from 'vitest'
import { loadStarships } from '../../src/lib/lore'
import { getBlueprint } from '../../src/lib/ship-blueprints'

describe('starships dataset integrity', () => {
  it('loads all starships with valid fields', async () => {
    const starships = await loadStarships()
    expect(starships.length).toBeGreaterThanOrEqual(10)

    const ids = new Set<string>()
    for (const ship of starships) {
      expect(ship.id).toBeTruthy()
      expect(ids.has(ship.id)).toBe(false)
      ids.add(ship.id)

      expect(ship.names.en).toBeTruthy()
      expect(ship.names.tr).toBeTruthy()
      expect(ship.model).toBeTruthy()
      expect(ship.manufacturer.en).toBeTruthy()
      expect(ship.starshipClass.en).toBeTruthy()
      expect(ship.desc.en).toBeTruthy()
      expect(ship.appearances.length).toBeGreaterThan(0)
    }
  })
})

// The hangar used to fall back to one generic triangle for any ship without a
// drawn schematic, captioned with hull boilerplate that described no ship in
// particular. Every ship in the data now owns its own silhouette, and this is
// what keeps a newly added ship from silently inheriting a blank panel.
describe('hangar blueprints', () => {
  it('draws a schematic for every ship in the archive', async () => {
    const starships = await loadStarships()
    for (const ship of starships) {
      expect(getBlueprint(ship.id), `${ship.id} has no blueprint`).not.toBeNull()
    }
  })

  it('labels every hotspot in both languages and puts it on the canvas', async () => {
    const starships = await loadStarships()
    for (const ship of starships) {
      const spec = getBlueprint(ship.id)
      if (!spec) continue

      expect(spec.paths.length, `${ship.id} draws nothing`).toBeGreaterThan(0)
      expect(spec.hotspots.length, `${ship.id} annotates nothing`).toBeGreaterThan(0)

      const ids = new Set<string>()
      for (const hotspot of spec.hotspots) {
        expect(ids.has(hotspot.id), `${ship.id}.${hotspot.id} is duplicated`).toBe(false)
        ids.add(hotspot.id)

        for (const lang of ['en', 'tr'] as const) {
          expect(hotspot.label[lang].trim(), `${ship.id}.${hotspot.id}.label.${lang}`).not.toBe('')
          expect(hotspot.detail[lang].trim().length, `${ship.id}.${hotspot.id}.detail.${lang}`).toBeGreaterThan(40)
        }

        // the schematic is drawn into a 200x200 viewBox
        expect(hotspot.cx, `${ship.id}.${hotspot.id}.cx`).toBeGreaterThanOrEqual(0)
        expect(hotspot.cx, `${ship.id}.${hotspot.id}.cx`).toBeLessThanOrEqual(200)
        expect(hotspot.cy, `${ship.id}.${hotspot.id}.cy`).toBeGreaterThanOrEqual(0)
        expect(hotspot.cy, `${ship.id}.${hotspot.id}.cy`).toBeLessThanOrEqual(200)
      }
    }
  })

  it('gives no schematic to a ship the archive does not hold', () => {
    expect(getBlueprint('no-such-ship')).toBeNull()
  })
})
