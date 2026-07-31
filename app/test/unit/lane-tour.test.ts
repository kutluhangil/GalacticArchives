// A lane tour is generated, not written, so what is guarded here is that the
// generation stays honest: the stops are the lane's own in its own order, the
// prose is filled in both languages, and the stops it drops are counted rather
// than quietly lost.

import { describe, expect, it } from 'vitest'
import {
  MIN_TOUR_STOPS,
  laneArchiveStops,
  laneLengthParsecs,
  laneTour,
  loadLaneTour,
} from '../../src/lib/lane-tour'
import { routes } from '../../src/lib/routes'
import { parsecsBetween } from '../../src/lib/galaxy-grid'
import { loadBody } from '../../src/lib/lore'
import { authoredTour, tours } from '../../src/lib/tours'

/**
 * The lanes that can be flown, named so the set is asserted rather than
 * counted. Most charted lanes cannot: their canon stops (Alsakan, Brentaal IV,
 * Anaxes) are worlds this archive holds no record for, and a lane needs
 * MIN_TOUR_STOPS records to be a journey. A lane leaving or joining this list
 * fails here, which is the point — it is a change in what the archive covers.
 */
const FLYABLE = [
  'corellian-run',
  'corellian-trade-spine',
  'hydian-way',
  'perlemian-trade-route',
  'rimma-trade-route',
  'triellus-trade-route',
]

describe('laneLengthParsecs', () => {
  it('sums the lane leg by leg', () => {
    const route = routes[0]
    let expected = 0
    for (let i = 1; i < route.stops.length; i++) {
      expected += parsecsBetween(route.stops[i - 1].coordinates, route.stops[i].coordinates)
    }
    expect(laneLengthParsecs(route)).toBeCloseTo(expected, 6)
  })
})

describe('laneTour', () => {
  it('flies exactly the lanes the archive has records along', async () => {
    const flyable: string[] = []
    for (const route of routes) {
      const stops = laneArchiveStops(route)
      if (stops.length < MIN_TOUR_STOPS) continue
      flyable.push(route.id)
      const tour = await loadLaneTour(route.id)
      expect(tour.stops.length, route.id).toBe(stops.length)
    }
    expect(flyable.sort()).toEqual([...FLYABLE].sort())
  })

  it('keeps the lane order and drops only the stops with no record', async () => {
    const route = routes.find((r) => laneArchiveStops(r).length >= MIN_TOUR_STOPS)!
    const tour = await loadLaneTour(route.id)
    expect(tour.stops.map((s) => s.bodyId)).toEqual(
      route.stops.filter((s) => s.bodyId).map((s) => s.bodyId),
    )
    expect(tour.skipped).toBe(route.stops.length - laneArchiveStops(route).length)
  })

  it('narrates every stop in both languages, with no unfilled holes', async () => {
    for (const route of routes) {
      if (laneArchiveStops(route).length < MIN_TOUR_STOPS) continue
      const tour = await loadLaneTour(route.id)
      for (const stop of tour.stops) {
        expect(stop.narration.en.trim(), `${route.id}/${stop.bodyId} en`).not.toBe('')
        expect(stop.narration.tr.trim(), `${route.id}/${stop.bodyId} tr`).not.toBe('')
        expect(stop.narration.en, `${route.id}/${stop.bodyId}`).not.toMatch(/[{}]/)
        expect(stop.narration.tr, `${route.id}/${stop.bodyId}`).not.toMatch(/[{}]/)
        expect(stop.narration.tr, `${route.id}/${stop.bodyId}`).not.toBe(stop.narration.en)
      }
    }
  })

  it('measures a leg across the stops it skipped, not between kept neighbours only', async () => {
    // Whatever the lane, the second stop's line must quote the distance from
    // the first kept stop — the real flight, skipped stops included.
    const route = routes.find((r) => laneArchiveStops(r).length >= MIN_TOUR_STOPS)!
    const kept = laneArchiveStops(route)
    const expected = Math.round(parsecsBetween(kept[0].coordinates, kept[1].coordinates))
    const tour = await loadLaneTour(route.id)
    expect(tour.stops[1].narration.en).toContain(`${expected} parsecs`)
  })

  it('throws on a lane that does not exist', () => {
    expect(() => laneTour('the-kessel-shortcut', [])).toThrow(/the-kessel-shortcut/)
  })

  it('throws when a stop has no body among the ones given', async () => {
    const route = routes.find((r) => laneArchiveStops(r).length >= MIN_TOUR_STOPS)!
    const only = await loadBody(laneArchiveStops(route)[0].bodyId!)
    expect(() => laneTour(route.id, [only])).toThrow(/is not among the bodies given/)
  })
})

describe('authoredTour', () => {
  it('returns a hand-written tour in the same shape, skipping nothing', () => {
    const tour = authoredTour(tours[0].id)!
    expect(tour.stops.length).toBe(tours[0].stops.length)
    expect(tour.skipped).toBe(0)
    expect(authoredTour('grand-tour-of-nothing')).toBeUndefined()
  })
})
