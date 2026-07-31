// Guided tours point at bodies by id; a renamed or removed world would only
// surface as a dead stop mid-tour at runtime.

import { describe, expect, it } from 'vitest'
import { tourById, tours } from '../../src/lib/tours'
import { loadBody } from '../../src/lib/lore'

describe('tours', () => {
  it('ships at least one tour, each with stops', () => {
    expect(tours.length).toBeGreaterThan(0)
    for (const tour of tours) {
      expect(tour.stops.length, `${tour.id} stops`).toBeGreaterThan(0)
    }
  })

  it('has unique ids', () => {
    expect(new Set(tours.map((t) => t.id)).size).toBe(tours.length)
  })

  it('is bilingual in name, blurb and every narration', () => {
    for (const tour of tours) {
      expect(tour.names.en.trim(), `${tour.id} name en`).not.toBe('')
      expect(tour.names.tr.trim(), `${tour.id} name tr`).not.toBe('')
      expect(tour.blurb.en.trim(), `${tour.id} blurb en`).not.toBe('')
      expect(tour.blurb.tr.trim(), `${tour.id} blurb tr`).not.toBe('')
      for (const stop of tour.stops) {
        expect(stop.narration.en.trim(), `${tour.id}/${stop.bodyId} en`).not.toBe('')
        expect(stop.narration.tr.trim(), `${tour.id}/${stop.bodyId} tr`).not.toBe('')
      }
    }
  })

  it('resolves every stop to a real body', async () => {
    for (const tour of tours) {
      for (const stop of tour.stops) {
        const body = await loadBody(stop.bodyId)
        expect(body.id, `${tour.id} stop`).toBe(stop.bodyId)
      }
    }
  })
})

describe('tourById', () => {
  it('finds a known tour and returns undefined for the rest', () => {
    expect(tourById(tours[0].id)?.id).toBe(tours[0].id)
    expect(tourById('grand-tour-of-nothing')).toBeUndefined()
  })
})
