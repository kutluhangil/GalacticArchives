// Guided tour definitions. Kept out of the player component so the module
// only exports data (and so fast refresh stays happy).

import tourData from '../data/tours.json'

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
