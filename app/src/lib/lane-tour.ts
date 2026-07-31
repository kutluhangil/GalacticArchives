// A hyperlane, flown. The archive's other tours are written by hand; this one
// is generated, so every sentence it speaks has to come from something already
// sourced: the world's own description, and the lane's own stop order and grid
// coordinates. Nothing here invents lore.
//
// Stops the archive holds no record for are dropped — there is no page to fly
// to — but they are counted, and the player says how many were passed. A
// thinned lane presented as the whole lane would be the dishonest version.

import type { CelestialBody, HyperspaceRoute, Localized, RouteStop } from '../types/lore'
import { parsecsBetween } from './galaxy-grid'
import { loadBody, type Lang } from './lore'
import { routes, stopLabel } from './routes'
import { tf } from './ui-strings'

/** below this a lane is a stop or two, not a journey; it gets no tour */
export const MIN_TOUR_STOPS = 2

const LANGS: Lang[] = ['en', 'tr']

/** what TourPlayer plays, whichever kind of tour it came from */
export interface PlayableTour {
  id: string
  names: Localized
  blurb: Localized
  stops: { bodyId: string; narration: Localized }[]
  /** charted stops passed without a record in the archive */
  skipped: number
}

/** total charted length of a lane, in parsecs */
export function laneLengthParsecs(route: HyperspaceRoute): number {
  let total = 0
  for (let i = 1; i < route.stops.length; i++) {
    total += parsecsBetween(route.stops[i - 1].coordinates, route.stops[i].coordinates)
  }
  return total
}

/** the lane's stops this archive holds a record for, in travel order */
export function laneArchiveStops(route: HyperspaceRoute): RouteStop[] {
  return route.stops.filter((stop) => stop.bodyId)
}

function routeOrThrow(routeId: string): HyperspaceRoute {
  const route = routes.find((r) => r.id === routeId)
  if (!route) throw new Error(`laneTour: no charted lane with id "${routeId}"`)
  return route
}

/**
 * Build the tour for a lane from bodies the caller has already loaded.
 * Pure, so the generation is testable without touching the loader.
 */
export function laneTour(routeId: string, bodies: CelestialBody[]): PlayableTour {
  const route = routeOrThrow(routeId)
  const byId = new Map(bodies.map((body) => [body.id, body]))
  const kept = laneArchiveStops(route)

  const stops = kept.map((stop, i) => {
    const bodyId = stop.bodyId!
    const body = byId.get(bodyId)
    if (!body) {
      throw new Error(
        `laneTour: lane "${routeId}" calls at "${bodyId}", which is not among the bodies given`,
      )
    }
    // the previous *kept* stop: the leg quoted is the flight actually made,
    // skipped stops and all
    const previous = i > 0 ? kept[i - 1] : null
    const parsecs = previous ? Math.round(parsecsBetween(previous.coordinates, stop.coordinates)) : 0

    const narration = { en: '', tr: '' }
    for (const lang of LANGS) {
      const place = tf('laneStopOf', lang, {
        n: i + 1,
        total: kept.length,
        lane: route.names[lang],
      })
      const leg = previous
        ? tf('laneLegFrom', lang, { parsecs, from: stopLabel(previous) })
        : tf('laneDeparture', lang, {})
      narration[lang] = `${body.desc[lang]} ${place} — ${leg}`
    }

    return { bodyId, narration }
  })

  return {
    id: route.id,
    names: route.names,
    blurb: route.blurb,
    stops,
    skipped: route.stops.length - kept.length,
  }
}

/** load exactly the bodies a lane calls at, then build its tour */
export async function loadLaneTour(routeId: string): Promise<PlayableTour> {
  const route = routeOrThrow(routeId)
  const bodies = await Promise.all(laneArchiveStops(route).map((stop) => loadBody(stop.bodyId!)))
  return laneTour(routeId, bodies)
}
