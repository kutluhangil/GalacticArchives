// Guided tour definitions. Kept out of the player component so the module
// only exports data (and so fast refresh stays happy).

import tourData from '../data/tours.json'
import type { PlayableTour } from './lane-tour'

export interface Tour {
  id: string
  names: { en: string; tr: string }
  blurb: { en: string; tr: string }
  stops: { bodyId: string; narration: { en: string; tr: string } }[]
}

export const tours = tourData as Tour[]

export function tourById(id: string): Tour | undefined {
  return tours.find((tour) => tour.id === id)
}

/** a hand-written tour in the shape the player takes; it skips nothing, since
 *  every stop was chosen by hand from worlds the archive holds */
export function authoredTour(id: string): PlayableTour | undefined {
  const tour = tourById(id)
  if (!tour) return undefined
  return { id: tour.id, names: tour.names, blurb: tour.blurb, stops: tour.stops, skipped: 0 }
}
