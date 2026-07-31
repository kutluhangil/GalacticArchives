// Standard Galactic Grid -> galaxy-disk placement, and the distances that
// follow from it. Kept free of three.js so the route planner and its tests can
// measure the map without pulling the engine (and its vendor chunk) in.

export const GALAXY_R = 20

/** Canon grid "R-16" -> column/row indices. Letters A..V span west->east,
 *  numbers 1..21 north->south. */
export function gridCell(grid: string): { col: number; row: number } {
  const [letter, num] = grid.split('-')
  return { col: letter.charCodeAt(0) - 65, row: parseInt(num, 10) - 1 }
}

/** Canon grid "R-16" -> disk position. Radius clamped inside the disk. */
export function gridToPos(grid: string): { x: number; z: number } {
  const { col, row } = gridCell(grid)
  let x = ((col + 0.5) / 22) * 2 - 1
  let z = ((row + 0.5) / 21) * 2 - 1
  const r = Math.hypot(x, z)
  if (r > 0.95) {
    x = (x / r) * 0.95
    z = (z / r) * 0.95
  }
  return { x: x * GALAXY_R, z: z * GALAXY_R }
}

/** worlds without verified coordinates get hand-placed canon-plausible spots */
export const MANUAL_POS: Record<string, { x: number; z: number }> = {
  kamino: { x: 0.78 * GALAXY_R, z: 0.58 * GALAXY_R }, // south-east Wild Space rim
  shakari: { x: -0.12 * GALAXY_R, z: 0.84 * GALAXY_R }, // southern Outer Rim
  peridea: { x: -0.95 * GALAXY_R, z: -0.85 * GALAXY_R }, // separate far-galaxy islet
  // Legends Sith Worlds share grid R-5 with canon Moraband; nudge the two apart
  // so the trio does not stack into a single node (MANUAL_POS wins over the grid).
  korriban: { x: 0.5 * GALAXY_R, z: -0.63 * GALAXY_R },
  'dromund-kaas': { x: 0.67 * GALAXY_R, z: -0.51 * GALAXY_R },
}

/**
 * One grid square is 15 parsecs across: "The standard coordinate grid used by
 * starship navigators to record the location of star systems was based on a
 * scale with measurements of 15 parsecs" (Wookieepedia: Parsec). Distances the
 * planner reports are therefore canon-scaled rather than invented — measured in
 * grid space, not in the clamped disk positions the renderer uses.
 */
export const PARSECS_PER_GRID_CELL = 15

/** straight-line distance between two grid cells, in parsecs */
export function parsecsBetween(gridA: string, gridB: string): number {
  const a = gridCell(gridA)
  const b = gridCell(gridB)
  return Math.hypot(a.col - b.col, a.row - b.row) * PARSECS_PER_GRID_CELL
}
