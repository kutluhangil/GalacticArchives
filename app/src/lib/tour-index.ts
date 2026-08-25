import { tours, type Tour } from './tours'

/** Shipped guided routes that explicitly include a body. This is an exact data
 * lookup, never a thematic or canon inference. */
export function toursForBody(bodyId: string): Tour[] {
  return tours.filter((tour) => tour.stops.some((stop) => stop.bodyId === bodyId))
}
