// The hyperlane network. The lanes are drawn on the map and flown by the course
// plotter, so what is guarded here is that the data can bear both: stops sit
// where canon puts them, the lanes join into one network, and a plotted course
// is a real walk along it.

import { describe, expect, it } from 'vitest'
import { PARSECS_PER_GRID_CELL, gridCell, parsecsBetween } from '../../src/lib/galaxy-grid'
import {
  hyperlaneNetwork,
  laneNodeForBody,
  laneNodes,
  networkComponents,
  planCourse,
  routes,
  stopSource,
} from '../../src/lib/routes'
import { loadBody } from '../../src/lib/lore'

const GRID = /^[A-V]-([1-9]|1\d|2[01])$/

describe('lane data', () => {
  it('charts more than a token handful of lanes', () => {
    expect(routes.length).toBeGreaterThanOrEqual(20)
    expect(routes.flatMap((r) => r.stops).length).toBeGreaterThanOrEqual(250)
  })

  it('gives every lane a bilingual name and blurb', () => {
    for (const route of routes) {
      expect(route.names.en.trim(), route.id).not.toBe('')
      expect(route.names.tr.trim(), route.id).not.toBe('')
      expect(route.blurb.en.trim(), route.id).not.toBe('')
      expect(route.blurb.tr.trim(), route.id).not.toBe('')
      // an English string standing in for a translation is the failure this
      // catches: the two must actually differ
      expect(route.blurb.tr, route.id).not.toBe(route.blurb.en)
    }
  })

  it('cites the article each lane came from', () => {
    for (const route of routes) {
      expect(route.source, route.id).toMatch(/^wookieepedia:.+/)
    }
  })

  it('places every stop on a Standard Galactic Grid cell', () => {
    for (const route of routes) {
      expect(route.stops.length, route.id).toBeGreaterThanOrEqual(2)
      for (const stop of route.stops) {
        expect(stop.coordinates, `${route.id}/${stop.article}`).toMatch(GRID)
      }
    }
  })

  it('cites every stop by its own article', () => {
    for (const route of routes) {
      for (const stop of route.stops) {
        expect(stopSource(stop)).toBe(`wookieepedia:${stop.article}`)
      }
    }
  })

  it('agrees with the world files it binds to', async () => {
    for (const route of routes) {
      for (const stop of route.stops) {
        if (!stop.bodyId) continue
        const body = await loadBody(stop.bodyId)
        if (body.coordinates) {
          expect(body.coordinates, `${route.id}/${stop.article}`).toBe(stop.coordinates)
        }
      }
    }
  })

  it('puts a stop in one place, however many lanes call there', () => {
    const cells = new Map<string, string>()
    for (const route of routes) {
      for (const stop of route.stops) {
        const known = cells.get(stop.article)
        if (known) expect(known, stop.article).toBe(stop.coordinates)
        cells.set(stop.article, stop.coordinates)
      }
    }
  })
})

describe('the network', () => {
  it('joins into a single connected piece', () => {
    // a lane that touches nothing else is a line no course can ever use
    const components = networkComponents()
    expect(components.length, components.map((c) => c.length).join('/')).toBe(1)
  })

  it('merges a stop shared by two lanes into one junction', () => {
    const coruscant = hyperlaneNetwork().nodes.get('Coruscant')
    expect(coruscant).toBeTruthy()
    expect(coruscant!.routeIds.length).toBeGreaterThan(1)
    expect(coruscant!.routeIds).toContain('corellian-run')
    expect(coruscant!.routeIds).toContain('perlemian-trade-route')
  })

  it('reaches worlds this archive ships', () => {
    const onLanes = laneNodes().filter((n) => n.bodyId)
    expect(onLanes.length).toBeGreaterThanOrEqual(15)
    expect(laneNodeForBody('tatooine')?.article).toBe('Tatooine')
    expect(laneNodeForBody('coruscant')?.coordinates).toBe('L-9')
  })

  it('lists every stop once, sorted', () => {
    const nodes = laneNodes()
    expect(new Set(nodes.map((n) => n.article)).size).toBe(nodes.length)
    const labels = nodes.map((n) => n.label)
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'en')))
  })
})

describe('plotting a course', () => {
  it('walks the lane between two stops on it', () => {
    // the Corellian Run calls at Coruscant, Ixtlar and then Corellia
    const course = planCourse('Coruscant', 'Corellia')
    expect(course).toBeTruthy()
    expect(course!.jumps).toBe(2)
    expect(course!.laneChanges).toBe(0)
    expect(course!.legs.map((l) => l.to.article)).toEqual(['Ixtlar system', 'Corellia'])
    expect(course!.legs.every((l) => l.routeId === 'corellian-run')).toBe(true)
  })

  it('hands back a continuous walk, not a set of hops', () => {
    const course = planCourse('Tatooine', 'Nevarro')!
    expect(course.jumps).toBeGreaterThan(1)
    for (let i = 1; i < course.legs.length; i++) {
      expect(course.legs[i].from.article).toBe(course.legs[i - 1].to.article)
    }
    expect(course.legs[0].from.article).toBe('Tatooine')
    expect(course.legs[course.legs.length - 1].to.article).toBe('Nevarro')
  })

  it('adds its legs up to the course length', () => {
    const course = planCourse('Ryloth', 'Eriadu')!
    const summed = course.legs.reduce((n, leg) => n + leg.parsecs, 0)
    expect(course.parsecs).toBeCloseTo(summed, 9)
    expect(course.jumps).toBe(course.legs.length)
  })

  it('counts a lane change only where the course leaves one lane for another', () => {
    const course = planCourse('Coruscant', 'Ryloth')!
    const laneIds = course.legs.map((l) => l.routeId)
    const changes = laneIds.filter((id, i) => i > 0 && laneIds[i - 1] !== id).length
    expect(course.laneChanges).toBe(changes)
  })

  it('finds no shorter way than the one it returns', () => {
    // the plotter is only useful if it is actually shortest: no single detour
    // through a third stop may beat it
    const course = planCourse('Coruscant', 'Ryloth')!
    for (const via of ['Denon', 'Corellia', 'Christophsis']) {
      const first = planCourse('Coruscant', via)
      const second = planCourse(via, 'Ryloth')
      if (!first || !second) continue
      expect(course.parsecs).toBeLessThanOrEqual(first.parsecs + second.parsecs + 1e-9)
    }
  })

  it('is symmetric', () => {
    const there = planCourse('Kessel', 'Coruscant')!
    const back = planCourse('Coruscant', 'Kessel')!
    expect(there.parsecs).toBeCloseTo(back.parsecs, 9)
    expect(there.jumps).toBe(back.jumps)
  })

  it('returns an empty course for a stop to itself', () => {
    const course = planCourse('Tatooine', 'Tatooine')!
    expect(course.legs).toEqual([])
    expect(course.parsecs).toBe(0)
  })

  it('returns null for a stop that is not on the network', () => {
    expect(planCourse('Tatooine', 'Sullust Prime Imaginary')).toBeNull()
    expect(planCourse('Nowhere At All', 'Tatooine')).toBeNull()
  })
})

describe('canon distance scale', () => {
  it('measures one grid square as 15 parsecs', () => {
    expect(PARSECS_PER_GRID_CELL).toBe(15)
    expect(parsecsBetween('L-9', 'M-9')).toBe(15)
    expect(parsecsBetween('L-9', 'L-10')).toBe(15)
    expect(parsecsBetween('L-9', 'L-9')).toBe(0)
  })

  it('reads a grid cell as column and row', () => {
    expect(gridCell('A-1')).toEqual({ col: 0, row: 0 })
    expect(gridCell('R-16')).toEqual({ col: 17, row: 15 })
  })

  it('measures the Kessel Run at the scale canon quotes it in', () => {
    // Kessel and Oba Diah share grid T-10, so the run is a within-cell hop —
    // well under the twenty parsecs canon gives the route, and under the twelve
    // Solo claimed. The grid is too coarse to say more than that.
    const course = planCourse('Kessel', 'Oba Diah')!
    expect(course.jumps).toBe(1)
    expect(course.parsecs).toBeLessThan(20)
  })
})

describe('lane stops as tour destinations', () => {
  it('resolves every stop that claims a record to a real body', async () => {
    for (const route of routes) {
      for (const stop of route.stops) {
        if (!stop.bodyId) continue
        const body = await loadBody(stop.bodyId)
        expect(body.id, `${route.id} -> ${stop.article}`).toBe(stop.bodyId)
      }
    }
  })
})
