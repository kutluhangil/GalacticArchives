// A flat sketch of a star system: the sun(s), one orbit, the primary body on
// it, its moons and any station standing this era.
//
// Deliberately SVG rather than a SystemEngine scene. Compare shows up to four
// columns at once, and four live star systems would cost four WebGL contexts
// for a picture whose whole job is to be read at a glance. Every figure it
// draws is also written out in the table below it, so the sketch itself is
// decorative and stays out of the accessibility tree.

import type { SunSpec } from '../types/lore'

const VIEW = { w: 240, h: 110 }
const SUN = { x: 34, y: 55 }
const PRIMARY = { x: 196, y: 55 }
/** the orbit runs from the sun cluster out to the primary */
const ORBIT_RX = PRIMARY.x - SUN.x
const ORBIT_RY = 46

/** suns drawn side by side shrink so a trinary still fits the cluster */
const SUN_RADII: Record<number, number> = { 1: 14, 2: 10, 3: 8 }

/** where each sun sits within the cluster, by how many there are */
const SUN_OFFSETS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-7, -7],
    [7, 7],
  ],
  3: [
    [-9, -6],
    [7, -8],
    [1, 9],
  ],
}

/** moon dots, capped: past four they stop being tellable apart at this size */
const MAX_MOON_DOTS = 4
const MOON_ANGLES = [-125, -35, 45, 135]

export default function SystemSchematic({
  suns,
  moonDots,
  hasStation,
  fraction,
  primaryColor,
}: {
  suns: SunSpec[]
  /** how many moons to draw; the exact count lives in the table */
  moonDots: number
  hasStation: boolean
  /** the primary's diameter against the largest in the comparison, 0..1 */
  fraction: number
  /** the world's own palette colour, so the disc reads as that world */
  primaryColor: string
}) {
  const drawnSuns = suns.length ? suns.slice(0, 3) : [{ name: '', color: '#FFEFD0' }]
  const sunRadius = SUN_RADII[drawnSuns.length] ?? 8
  const offsets = SUN_OFFSETS[drawnSuns.length] ?? SUN_OFFSETS[1]
  const primaryRadius = 9 + Math.min(Math.max(fraction, 0), 1) * 15
  const dots = Math.min(moonDots, MAX_MOON_DOTS)

  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className="h-full w-full"
      data-system-schematic
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        cx={SUN.x}
        cy={SUN.y}
        rx={ORBIT_RX}
        ry={ORBIT_RY}
        fill="none"
        stroke="#66D9FF"
        strokeOpacity={0.25}
        strokeDasharray="3 5"
        strokeWidth={1}
      />

      {drawnSuns.map((sun, i) => (
        <circle
          key={`${sun.name}-${i}`}
          cx={SUN.x + offsets[i][0]}
          cy={SUN.y + offsets[i][1]}
          r={sunRadius}
          fill={sun.color}
          opacity={0.9}
        />
      ))}

      <circle
        cx={PRIMARY.x}
        cy={PRIMARY.y}
        r={primaryRadius}
        fill={primaryColor}
        stroke="#0b1018"
        strokeWidth={1}
      />
      <circle
        cx={PRIMARY.x - primaryRadius * 0.3}
        cy={PRIMARY.y - primaryRadius * 0.3}
        r={primaryRadius * 0.55}
        fill="#ffffff"
        opacity={0.14}
      />

      {Array.from({ length: dots }, (_, i) => {
        const angle = (MOON_ANGLES[i] * Math.PI) / 180
        const distance = primaryRadius + 9
        return (
          <circle
            key={i}
            cx={PRIMARY.x + Math.cos(angle) * distance}
            cy={PRIMARY.y + Math.sin(angle) * distance}
            r={2.5}
            fill="#CBD5E1"
            opacity={0.8}
          />
        )
      })}

      {hasStation && (
        <g transform={`translate(${PRIMARY.x - primaryRadius - 22} ${PRIMARY.y - 26})`}>
          <circle r={5} fill="none" stroke="#FFE81F" strokeWidth={1.5} />
          <circle r={1.6} fill="#FFE81F" />
        </g>
      )}
    </svg>
  )
}
