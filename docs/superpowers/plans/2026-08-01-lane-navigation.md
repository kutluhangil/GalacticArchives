# Hyperlane Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the charted hyperlanes selectable on the galaxy map and flyable end to end as generated guided tours.

**Architecture:** The selected lane lives in the URL (`/galaxy?lane=<routeId>`), so it is shareable and survives the back button. A new pure module, `src/lib/lane-tour.ts`, turns a lane into the same `PlayableTour` shape the existing hand-written tours already play, generating each stop's narration from the world's own `desc` plus its position on the lane. `TourState` gains a discriminated source so one `TourPlayer` drives both kinds. The engine gains invisible tube hit-targets per lane and a selected-lane dim.

**Tech Stack:** React 19, react-router 7, zustand, three.js 0.185, Tailwind, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-01-lane-navigation-design.md`

## Global Constraints

- Code, comments, identifiers and commit messages in English. UI copy is bilingual (`en` + `tr`) by construction — `ui-strings.ts` rejects a key that carries only one language.
- Raise errors explicitly. No silent fallbacks, no catch-all recovery. Error messages name the failing input.
- Keep changes tightly scoped. No drive-by refactors of files you are not otherwise touching.
- Never add Claude as author or co-author to any commit.
- `npm run verify` (in `app/`) is the gate: `tsc -b && lint && validate && test && build && budget && e2e`.
- Bundle budgets are tight: `first paint total` 376,073 / 400,000 bytes and `routes chunk` 24,000 / 26,000 bytes as of the previous commit. `npm run budget` fails the build when exceeded.
- All paths below are relative to `app/`.

---

### Task 1: Placeholder-filling copy (`tf`)

The lane tour narrates sentences with numbers in them ("stop 3 of 11"). `t()` is a flat lookup and cannot do that. Add a sibling that fills `{name}` holes and throws when a hole has no value — a missing substitution is a bug, not a blank to render.

**Files:**
- Modify: `src/lib/ui-strings.ts` (append after the `t` export, around line 190)
- Test: `test/unit/ui-strings.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export type FormatKey`, `export function tf(key: FormatKey, lang: Lang, vars: Record<string, string | number>): string`, and the copy keys `laneStopOf`, `laneLegFrom`, `laneDeparture`, `laneSkipped`.

- [ ] **Step 1: Write the failing test**

Append to `test/unit/ui-strings.test.ts`:

```ts
describe('tf', () => {
  it('fills every placeholder in both languages', () => {
    expect(tf('laneStopOf', 'en', { n: 3, total: 11, lane: 'the Perlemian Trade Route' })).toBe(
      'Stop 3 of 11 on the Perlemian Trade Route',
    )
    expect(tf('laneStopOf', 'tr', { n: 3, total: 11, lane: 'Perlemian Ticaret Yolu' })).toBe(
      'Perlemian Ticaret Yolu üzerinde 11 durağın 3.',
    )
  })

  it('throws when a placeholder has no value, rather than rendering a hole', () => {
    expect(() => tf('laneStopOf', 'en', { n: 3 })).toThrow(/laneStopOf.*total/)
  })
})
```

Add `tf` to the existing import at the top of the file:

```ts
import { ERA_SHORT, t, tf, type UiKey } from '../../src/lib/ui-strings'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ui-strings`
Expected: FAIL — TypeScript/Vitest reports `tf` is not exported from `../../src/lib/ui-strings`.

- [ ] **Step 3: Write the implementation**

In `src/lib/ui-strings.ts`, append after `export const t = ...`:

```ts
/** Copy with holes in it. Kept apart from STRINGS because these are not
 *  lookups: every one of them is meaningless until its values are filled, and
 *  the two languages put the numbers in different places. */
const FORMATS = {
  laneStopOf: {
    en: 'Stop {n} of {total} on the {lane}',
    tr: '{lane} üzerinde {total} durağın {n}.',
  },
  laneLegFrom: {
    en: '{parsecs} parsecs out from {from}.',
    tr: '{from} çıkışından {parsecs} parsek.',
  },
  laneDeparture: {
    en: 'The core-ward end of the lane, where the run begins.',
    tr: 'Hattın çekirdeğe bakan ucu; koşu burada başlar.',
  },
  laneSkipped: {
    en: '{n} charted stops on this lane have no record in the archive and were passed.',
    tr: 'Bu hattaki {n} çizili durağın arşivde kaydı yok; geçildiler.',
  },
} as const

export type FormatKey = keyof typeof FORMATS

/**
 * Fill `{name}` holes in a bilingual template. Throws on a hole with no value:
 * a sentence shipped with `{total}` still in it is a bug that should stop the
 * test run, not copy a visitor gets to read.
 */
export const tf = (
  key: FormatKey,
  lang: Lang,
  vars: Record<string, string | number>,
): string =>
  FORMATS[key][lang].replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in vars)) {
      throw new Error(`ui-strings: "${key}" (${lang}) has no value for {${name}}`)
    }
    return String(vars[name])
  })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ui-strings`
Expected: PASS, including the two existing `t` / `ERA_SHORT` describe blocks.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui-strings.ts test/unit/ui-strings.test.ts
git commit -m "feat(ui): add tf(), copy with holes the caller must fill"
```

---

### Task 2: Turn a lane into a playable tour

**Files:**
- Create: `src/lib/lane-tour.ts`
- Test: `test/unit/lane-tour.test.ts`

**Interfaces:**
- Consumes: `tf` and the four copy keys from Task 1. `routes`, `stopLabel` from `src/lib/routes.ts`. `parsecsBetween` from `src/lib/galaxy-grid.ts`. `loadBody` from `src/lib/lore.ts`.
- Produces:
  - `export interface PlayableTour { id: string; names: Localized; blurb: Localized; stops: { bodyId: string; narration: Localized }[]; skipped: number }`
  - `export function laneLengthParsecs(route: HyperspaceRoute): number`
  - `export function laneArchiveStops(route: HyperspaceRoute): RouteStop[]`
  - `export function laneTour(routeId: string, bodies: CelestialBody[]): PlayableTour`
  - `export async function loadLaneTour(routeId: string): Promise<PlayableTour>`
  - `export const MIN_TOUR_STOPS = 2`

- [ ] **Step 1: Write the failing test**

Create `test/unit/lane-tour.test.ts`:

```ts
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

/** lanes too thin to fly, named so a lane silently dropping below the
 *  threshold fails this test instead of quietly losing its tour */
const TOO_THIN: string[] = []

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
  it('flies every lane that has records, and names the ones that do not', async () => {
    const thin: string[] = []
    for (const route of routes) {
      const stops = laneArchiveStops(route)
      if (stops.length < MIN_TOUR_STOPS) {
        thin.push(route.id)
        continue
      }
      const tour = await loadLaneTour(route.id)
      expect(tour.stops.length, route.id).toBe(stops.length)
    }
    expect(thin.sort()).toEqual([...TOO_THIN].sort())
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lane-tour`
Expected: FAIL — cannot resolve `../../src/lib/lane-tour`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/lane-tour.ts`:

```ts
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
    const parsecs = previous
      ? Math.round(parsecsBetween(previous.coordinates, stop.coordinates))
      : 0

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
  const bodies = await Promise.all(
    laneArchiveStops(route).map((stop) => loadBody(stop.bodyId!)),
  )
  return laneTour(routeId, bodies)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lane-tour`
Expected: PASS. If the first test fails with a non-empty `thin` array, that is real data — put those lane ids into `TOO_THIN` in the test and rerun, so the exclusion is recorded rather than hidden.

- [ ] **Step 5: Typecheck**

Run: `npx tsc -b`
Expected: no output (success). `Lang` is re-exported from `src/lib/lore.ts`; if it is not, import it from `../state/app` instead and rerun.

- [ ] **Step 6: Commit**

```bash
git add src/lib/lane-tour.ts test/unit/lane-tour.test.ts
git commit -m "feat(routes): generate a guided tour from a hyperlane"
```

---

### Task 3: One player, two kinds of tour

`TourState` names a hand-written tour by bare id. Give it a discriminated source so a lane tour can ride the same player, progress bar and auto-advance.

**Files:**
- Modify: `src/state/app.ts:12-17` (`TourState`), `:37` (`startTour` signature), `:92` (`startTour` body)
- Modify: `src/lib/tours.ts` (add `authoredTour`)
- Modify: `src/components/TourPlayer.tsx` (resolve either source; show `skipped`)
- Modify: `src/components/hud/TopBar.tsx:121` (pass a source)
- Modify: `src/lib/ui-strings.ts` (one new key, `tourSkipped` is `laneSkipped` from Task 1 — no new key needed here)
- Test: `test/unit/app-state.test.ts:90-110`

**Interfaces:**
- Consumes: `PlayableTour`, `loadLaneTour` from Task 2; `laneSkipped` copy from Task 1.
- Produces: `export type TourSource = { kind: 'authored'; id: string } | { kind: 'lane'; id: string }`; `TourState { source: TourSource; step: number; playing: boolean }`; `startTour(source: TourSource)`; `export function authoredTour(id: string): PlayableTour | undefined`.

- [ ] **Step 1: Write the failing test**

Replace the `describe('tour state', ...)` block in `test/unit/app-state.test.ts` (starts line 90) with:

```ts
describe('tour state', () => {
  it('starts, steps, pauses and ends an authored tour', () => {
    useApp.getState().startTour({ kind: 'authored', id: 'skywalker' })
    expect(useApp.getState().tour).toEqual({
      source: { kind: 'authored', id: 'skywalker' },
      step: 0,
      playing: true,
    })
    useApp.getState().setTourStep(3)
    expect(useApp.getState().tour?.step).toBe(3)
    useApp.getState().toggleTourPlaying()
    expect(useApp.getState().tour?.playing).toBe(false)
    useApp.getState().endTour()
    expect(useApp.getState().tour).toBeNull()
  })

  it('carries a lane source through untouched', () => {
    useApp.getState().startTour({ kind: 'lane', id: 'perlemian-trade-route' })
    expect(useApp.getState().tour?.source).toEqual({
      kind: 'lane',
      id: 'perlemian-trade-route',
    })
    useApp.getState().endTour()
  })

  it('ignores step and play changes with no tour running', () => {
    useApp.getState().endTour()
    useApp.getState().setTourStep(2)
    useApp.getState().toggleTourPlaying()
    expect(useApp.getState().tour).toBeNull()
  })
})
```

Add to `test/unit/lane-tour.test.ts`:

```ts
describe('authoredTour', () => {
  it('returns a hand-written tour in the same shape, skipping nothing', async () => {
    const { authoredTour } = await import('../../src/lib/tours')
    const { tours } = await import('../../src/lib/tours')
    const tour = authoredTour(tours[0].id)!
    expect(tour.stops.length).toBe(tours[0].stops.length)
    expect(tour.skipped).toBe(0)
    expect(authoredTour('grand-tour-of-nothing')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- app-state lane-tour`
Expected: FAIL — `startTour` rejects an object argument (type error) and `authoredTour` is not exported.

- [ ] **Step 3: Widen the state**

In `src/state/app.ts`, replace lines 12-17:

```ts
/** where an active tour came from: a hand-written itinerary, or a hyperlane
 *  flown end to end. Both play through the same player. */
export type TourSource = { kind: 'authored'; id: string } | { kind: 'lane'; id: string }

/** an active guided tour: which one, and how far along */
export interface TourState {
  source: TourSource
  step: number
  playing: boolean
}
```

Replace the `startTour` declaration (line 37):

```ts
  startTour: (source: TourSource) => void
```

Replace the `startTour` implementation (line 92):

```ts
  startTour: (source) => set({ tour: { source, step: 0, playing: true } }),
```

- [ ] **Step 4: Give the authored tours the playable shape**

Append to `src/lib/tours.ts`:

```ts
import type { PlayableTour } from './lane-tour'

/** a hand-written tour in the shape the player takes; it skips nothing, since
 *  every stop was chosen by hand from worlds the archive holds */
export function authoredTour(id: string): PlayableTour | undefined {
  const tour = tourById(id)
  if (!tour) return undefined
  return { id: tour.id, names: tour.names, blurb: tour.blurb, stops: tour.stops, skipped: 0 }
}
```

- [ ] **Step 5: Resolve either source in the player**

In `src/components/TourPlayer.tsx`, replace the imports and the resolution block (lines 5-31) with:

```ts
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { L } from '../lib/lore'
import { loadLaneTour, type PlayableTour } from '../lib/lane-tour'
import { authoredTour } from '../lib/tours'
import { t, tf } from '../lib/ui-strings'
import { useApp } from '../state/app'

/** how long a stop holds before the tour moves on */
const STOP_MS = 12000

export default function TourPlayer() {
  const lang = useApp((s) => s.lang)
  const tour = useApp((s) => s.tour)
  const setTourStep = useApp((s) => s.setTourStep)
  const toggleTourPlaying = useApp((s) => s.toggleTourPlaying)
  const endTour = useApp((s) => s.endTour)
  const navigate = useNavigate()
  const location = useLocation()

  // a lane tour has to load the worlds it narrates, so it resolves in an
  // effect; an authored one is already in memory
  const [laneTour, setLaneTour] = useState<PlayableTour | null>(null)
  const source = tour?.source
  useEffect(() => {
    if (source?.kind !== 'lane') {
      setLaneTour(null)
      return
    }
    let live = true
    void loadLaneTour(source.id).then((resolved) => {
      if (live) setLaneTour(resolved)
    })
    return () => {
      live = false
    }
  }, [source?.kind, source?.id])

  const definition =
    source?.kind === 'authored' ? authoredTour(source.id) : source?.kind === 'lane' ? laneTour : undefined
  const stop = definition?.stops[tour?.step ?? 0]
  const target = stop ? `/planet/${stop.bodyId}` : null
```

Leave the two effects below it (`navigate` on target, and the auto-advance timer) unchanged.

- [ ] **Step 6: Say what the tour passed over**

In the same file, insert directly after the narration paragraph (`<p className="mb-3 …">{L(stop.narration, lang)}</p>`):

```tsx
      {definition.skipped > 0 && (
        <p className="mb-3 text-[11px] leading-snug text-slate-500">
          {tf('laneSkipped', lang, { n: definition.skipped })}
        </p>
      )}
```

- [ ] **Step 7: Update the caller**

In `src/components/hud/TopBar.tsx`, line 121, replace:

```tsx
                startTour(tour.id)
```

with:

```tsx
                startTour({ kind: 'authored', id: tour.id })
```

- [ ] **Step 8: Run tests and typecheck**

Run: `npm test -- app-state lane-tour tours && npx tsc -b`
Expected: PASS, and no typecheck output. `t` may now be unused in `TourPlayer.tsx` — it is not; the button labels still use it.

- [ ] **Step 9: Commit**

```bash
git add src/state/app.ts src/lib/tours.ts src/components/TourPlayer.tsx src/components/hud/TopBar.tsx test/unit/app-state.test.ts test/unit/lane-tour.test.ts
git commit -m "feat(tours): let one player fly both written and generated tours"
```

---

### Task 4: Pick a lane on the map

**Files:**
- Modify: `src/lib/engine/galaxy-engine.ts` — `GalaxyCallbacks` (line 43), engine fields (around line 211), `setLanes` (line 281), `applyDiskFade` (line 402), `onPointerMove` (line 792), `onPointerDown` (line 806)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `GalaxyCallbacks.onLaneSelect?: (routeId: string) => void`; `GalaxyEngine.setSelectedLane(routeId: string | null): void`.

There is no unit test here: the picking is WebGL raycasting, which jsdom cannot run and which a Playwright canvas click can only exercise flakily. It is verified by build, by the deep-link and keyboard paths in Task 6, and by opening the map. Say so in the commit rather than implying test coverage that does not exist.

- [ ] **Step 1: Add the callback**

In `src/lib/engine/galaxy-engine.ts`, add to `GalaxyCallbacks` (after `onSelect`, line 44):

```ts
  /** a click that landed on a lane rather than on a world */
  onLaneSelect?: (routeId: string) => void
```

- [ ] **Step 2: Add the fields**

Next to `private laneMats: THREE.Material[] = []` (line 213):

```ts
  /** invisible tubes along each lane: a line is too thin to hit, especially
   *  under a finger, so the pickable lane is a volume around the drawn one */
  private laneHits: THREE.Mesh[] = []
  private selectedLane: string | null = null
```

And next to `this.regionCb = cb.onRegionHover` in the constructor (line 229):

```ts
    this.laneCb = cb.onLaneSelect
```

with the field declared next to `private regionCb` (line 195):

```ts
  private laneCb?: GalaxyCallbacks['onLaneSelect']
```

- [ ] **Step 3: Build the hit tubes and tag the materials**

In `setLanes` (line 281), after `this.laneMats = []` add:

```ts
    this.laneHits = []
```

Then tag both materials with their lane, so the dim can tell them apart. After `mat.userData.baseOpacity = mat.opacity` add:

```ts
      mat.userData.routeId = lane.id
```

and after `tickMat.userData.baseOpacity = tickMat.opacity` add:

```ts
      tickMat.userData.routeId = lane.id
```

Finally, before the closing brace of the `for (const lane of lanes)` loop, add the hit volume:

```ts
      // the same curve the line follows, given a radius. Radial segments are
      // as low as a tube goes: it is never drawn, only hit.
      const hitGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(this.laneCurve(lane.points, LANE_Y)),
        lane.points.length * LANE_SAMPLES,
        0.45,
        4,
        false,
      )
      const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }))
      hitMesh.userData.routeId = lane.id
      this.laneGroup.add(hitMesh)
      this.laneHits.push(hitMesh)
```

- [ ] **Step 4: Dim the lanes that are not selected**

Replace the lane loop in `applyDiskFade` (line 402):

```ts
    for (const mat of this.laneMats) {
      const off =
        this.selectedLane && mat.userData.routeId !== this.selectedLane ? SELECTED_LANE_DIM : 1
      mat.opacity = (mat.userData.baseOpacity as number) * this.diskFade * this.courseDim * off
    }
```

and add the constant next to `COURSE_COLOR` (line 23):

```ts
/** how far the rest of the network steps back while one lane is selected */
const SELECTED_LANE_DIM = 0.15
```

- [ ] **Step 5: Add the selection entry point**

After `setLanesVisible` (line 320):

```ts
  /** Bring one lane forward and step the rest back. Passing null clears it. */
  setSelectedLane(routeId: string | null) {
    this.selectedLane = routeId
    this.applyDiskFade()
  }
```

- [ ] **Step 6: Pick lanes, but never over a world**

Replace `onPointerMove` and `onPointerDown` (lines 792-813):

```ts
  /** the lane under the pointer, or null. Lanes switched off are not there to
   *  be hit, and a world sitting on its lane always wins the click. */
  private laneUnderPointer(): string | null {
    if (!this.laneGroup.visible) return null
    const hit = this.raycaster.intersectObjects(this.laneHits, false)
    return (hit[0]?.object.userData.routeId as string | undefined) ?? null
  }

  private onPointerMove = (e: PointerEvent) => {
    this.setPointer(e)
    const hit = this.raycaster.intersectObjects(this.hitTargets, false)
    this.canvas.style.cursor = hit.length || this.laneUnderPointer() ? 'pointer' : 'grab'
    if (this.regionCb) {
      const target = new THREE.Vector3()
      const on = this.raycaster.ray.intersectPlane(this.plane, target)
      const region = on ? this.regionAt(target.x, target.z) : null
      if (region !== this.lastRegion) {
        this.lastRegion = region
        this.regionCb(region)
      }
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    this.setPointer(e)
    const hit = this.raycaster.intersectObjects(this.hitTargets, false)
    const id = hit[0]?.object.userData.bodyId as string | undefined
    if (id) {
      this.selectCb?.(id)
      return
    }
    const routeId = this.laneUnderPointer()
    if (routeId) this.laneCb?.(routeId)
  }
```

- [ ] **Step 7: Typecheck and build**

Run: `npx tsc -b && npm run build && npm run budget`
Expected: typecheck silent, build succeeds, budget prints `ERRORS: 0`. The tubes are runtime geometry, so no chunk should move; if `first paint total` grew, something was imported that should not have been.

- [ ] **Step 8: Commit**

```bash
git add src/lib/engine/galaxy-engine.ts
git commit -m "feat(galaxy): make the lanes pickable, and dim the rest around one

Raycasting a line is unreliable at any zoom, so each lane gets an invisible
tube along the curve it already draws. A world sitting on its lane wins the
click, and lanes switched off are not hit at all.

Verified by build; the picking itself has no unit test, since jsdom cannot
raycast and a canvas click at computed pixels is a flaky e2e."
```

---

### Task 5: The lane panel, and the URL that opens it

**Files:**
- Create: `src/components/hud/LanePanel.tsx`
- Modify: `src/pages/GalaxyView.tsx` (imports, engine callback, `?lane=` wiring, panel + keyboard nav in the JSX)
- Modify: `src/lib/ui-strings.ts` (panel copy)
- Test: `test/unit/lane-panel.test.tsx`

**Interfaces:**
- Consumes: `laneArchiveStops`, `laneLengthParsecs`, `MIN_TOUR_STOPS` (Task 2); `startTour` with a `TourSource` (Task 3); `setSelectedLane`, `onLaneSelect` (Task 4).
- Produces: `LanePanel({ routeId, onClose }: { routeId: string; onClose: () => void })`.

- [ ] **Step 1: Add the panel copy**

In `src/lib/ui-strings.ts`, inside `STRINGS`, after the `courseScale` entry:

```ts
  laneSelected: { en: 'Hyperlane', tr: 'Hiperuzay hattı' },
  lanesNav: { en: 'Hyperlanes', tr: 'Hiperuzay hatları' },
  laneStops: { en: 'stops', tr: 'durak' },
  laneInArchive: { en: 'in this archive', tr: 'bu arşivde' },
  laneFly: { en: 'Fly this lane', tr: 'Bu hattı uç' },
  laneClose: { en: 'Close', tr: 'Kapat' },
  laneTooThin: {
    en: 'Too few of this lane’s stops have a record here to fly it end to end.',
    tr: 'Bu hattın burada kaydı olan durağı, baştan sona uçmak için yeterli değil.',
  },
  laneSource: { en: 'Lane article', tr: 'Hat makalesi' },
```

- [ ] **Step 2: Write the failing test**

Create `test/unit/lane-panel.test.tsx`:

```tsx
// The lane panel is the only place a lane is read rather than drawn, so what
// is guarded here is that it tells the truth about the lane: its stops, how
// many the archive holds, and whether it can be flown at all.

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import LanePanel from '../../src/components/hud/LanePanel'
import { laneArchiveStops, MIN_TOUR_STOPS } from '../../src/lib/lane-tour'
import { routes } from '../../src/lib/routes'

const flyable = routes.find((r) => laneArchiveStops(r).length >= MIN_TOUR_STOPS)!

function show(routeId: string) {
  render(
    <MemoryRouter>
      <LanePanel routeId={routeId} onClose={() => {}} />
    </MemoryRouter>,
  )
}

describe('LanePanel', () => {
  it('names the lane and cites the article it came from', () => {
    show(flyable.id)
    expect(screen.getByRole('heading', { name: flyable.names.tr })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Hat makalesi|Lane article/ })).toHaveAttribute(
      'href',
      expect.stringContaining('starwars.fandom.com/wiki/'),
    )
  })

  it('counts the stops it holds against the stops the lane has', () => {
    show(flyable.id)
    const kept = laneArchiveStops(flyable).length
    expect(
      screen.getByText(new RegExp(`${flyable.stops.length}\\s+(durak|stops)`)),
    ).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${kept}\\s+`))).toBeInTheDocument()
  })

  it('offers the flight when the lane can carry one', () => {
    show(flyable.id)
    expect(screen.getByRole('button', { name: /Bu hattı uç|Fly this lane/ })).toBeInTheDocument()
  })

  it('renders nothing for a lane id that is not charted', () => {
    const { container } = render(
      <MemoryRouter>
        <LanePanel routeId="the-kessel-shortcut" onClose={() => {}} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- lane-panel`
Expected: FAIL — cannot resolve `../../src/components/hud/LanePanel`.

- [ ] **Step 4: Write the panel**

Create `src/components/hud/LanePanel.tsx`:

```tsx
// One charted lane, read rather than drawn: what it is, where it calls, how
// much of it this archive actually holds — and the flight along it.

import { L } from '../../lib/lore'
import { laneArchiveStops, laneLengthParsecs, MIN_TOUR_STOPS } from '../../lib/lane-tour'
import { routes, stopLabel } from '../../lib/routes'
import { articleUrl } from '../../lib/sources'
import { t } from '../../lib/ui-strings'
import { useApp } from '../../state/app'
import { useFlyTo } from '../useFlyTo'

export interface LanePanelProps {
  routeId: string
  onClose: () => void
}

export default function LanePanel({ routeId, onClose }: LanePanelProps) {
  const lang = useApp((s) => s.lang)
  const startTour = useApp((s) => s.startTour)
  const flyTo = useFlyTo()

  // the id comes off the URL, where anyone can type anything; an unknown lane
  // is not an error, it is simply no selection
  const route = routes.find((r) => r.id === routeId)
  if (!route) return null

  const kept = laneArchiveStops(route)
  const flyable = kept.length >= MIN_TOUR_STOPS

  return (
    <section
      aria-label={t('laneSelected', lang)}
      className="pointer-events-auto absolute left-4 top-16 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-holo-cyan/20 bg-panel/95 p-3 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-hud text-[13px] uppercase tracking-[0.2em] text-holo-cyan">
          {L(route.names, lang)}
        </h2>
        <button
          onClick={onClose}
          aria-label={t('laneClose', lang)}
          className="rounded border border-white/10 px-1.5 text-[11px] text-slate-400 transition-colors hover:border-sith-red/50 hover:text-red-300"
        >
          ✕
        </button>
      </div>

      <p className="mt-1.5 text-[11.5px] leading-snug text-slate-300">{L(route.blurb, lang)}</p>

      <p className="mt-2 font-hud text-[10px] uppercase tracking-[0.2em] text-slate-500">
        {route.stops.length} {t('laneStops', lang)} · {kept.length} {t('laneInArchive', lang)} ·{' '}
        {Math.round(laneLengthParsecs(route))} {t('courseParsecs', lang)}
      </p>

      {flyable ? (
        <button
          onClick={() => startTour({ kind: 'lane', id: route.id })}
          className="mt-2 w-full rounded border border-star-gold/40 bg-star-gold/10 px-2 py-1 text-[11px] tracking-wide text-star-gold transition-colors hover:bg-star-gold/20"
        >
          ▶ {t('laneFly', lang)}
        </button>
      ) : (
        <p className="mt-2 text-[11px] leading-snug text-amber-300/80">{t('laneTooThin', lang)}</p>
      )}

      <ol className="mt-2.5 max-h-[40vh] space-y-1 overflow-y-auto border-t border-white/5 pt-2">
        {route.stops.map((stop, i) => (
          <li key={`${stop.article}-${i}`} className="text-[11px] leading-snug">
            <span className="text-slate-500">{i + 1}.</span>{' '}
            {stop.bodyId ? (
              <button
                onClick={() => flyTo(`/planet/${stop.bodyId}`)}
                className="text-holo-cyan underline-offset-2 hover:underline"
              >
                {stopLabel(stop)}
              </button>
            ) : (
              <span className="text-slate-400">{stopLabel(stop)}</span>
            )}
            <span className="pl-1.5 text-[10px] text-slate-600">{stop.coordinates}</span>
          </li>
        ))}
      </ol>

      <a
        href={articleUrl(route.source)}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block border-t border-white/5 pt-2 text-[10px] text-slate-500 transition-colors hover:text-holo-cyan"
      >
        {t('laneSource', lang)} ↗
      </a>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- lane-panel`
Expected: PASS. If `articleUrl` is not exported from `src/lib/sources.ts` under that name, check the export and use the actual one — `test/unit/poi.test.ts` imports it, so the name is fixed by that file.

- [ ] **Step 6: Wire the URL, the engine and the keyboard path**

In `src/pages/GalaxyView.tsx`, add to the imports:

```ts
import { useSearchParams } from 'react-router'
import LanePanel from '../components/hud/LanePanel'
```

After the existing `const [hoverRegion, setHoverRegion] = useState<RegionId | null>(null)`:

```ts
  // the selected lane lives in the URL, so it is shareable and the back button
  // walks the selections
  const [searchParams, setSearchParams] = useSearchParams()
  const laneParam = searchParams.get('lane')
  const selectedLane = routes.some((r) => r.id === laneParam) ? laneParam : null

  const selectLane = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id) next.set('lane', id)
          else next.delete('lane')
          return next
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  // the engine is built once per node set; routing it through a ref keeps a
  // lane selection from tearing the scene down and rebuilding it
  const selectLaneRef = useRef(selectLane)
  selectLaneRef.current = selectLane
```

Add the callback to the engine construction (inside the `new GalaxyEngine(...)` options object, after `onSelect: dive,`):

```ts
      onLaneSelect: (routeId: string) => selectLaneRef.current(routeId),
```

After the `useEffect` that calls `setLanesVisible(lanes)`:

```ts
  useEffect(() => {
    engineRef.current?.setSelectedLane(selectedLane)
  }, [selectedLane, nodes])

  // lanes switched off take their selection with them: a panel for something
  // the map is no longer drawing is a panel about nothing
  useEffect(() => {
    if (!lanes && selectedLane) selectLane(null)
  }, [lanes, selectedLane, selectLane])
```

In the JSX, after `<RoutePlanner onCourse={showCourse} />`:

```tsx
      {selectedLane && <LanePanel routeId={selectedLane} onClose={() => selectLane(null)} />}

      {/* The lane tubes cannot take focus, so this mirrors the map's lanes the
          same way the planet nav below mirrors its worlds. */}
      <nav aria-label={t('lanesNav', lang)}>
        <ul>
          {routes.map((route) => (
            <li key={route.id}>
              <button
                onClick={() => selectLane(route.id)}
                className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-28 focus:z-40 focus:rounded focus:border focus:border-holo-cyan/50 focus:bg-panel/95 focus:px-3 focus:py-1.5 focus:text-[12px] focus:tracking-[0.15em] focus:text-holo-cyan focus:outline-none focus:ring-2 focus:ring-holo-cyan/60 focus:backdrop-blur-md"
              >
                {L(route.names, lang)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
```

`useRef` must be in the React import at the top of the file — it already is.

- [ ] **Step 7: Run the full unit suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: typecheck silent; all suites PASS, including the new `lane-tour` and `lane-panel` files.

- [ ] **Step 8: Commit**

```bash
git add src/components/hud/LanePanel.tsx src/pages/GalaxyView.tsx src/lib/ui-strings.ts test/unit/lane-panel.test.tsx
git commit -m "feat(galaxy): open a lane from the map, and fly it"
```

---

### Task 6: Prove it end to end, and check the budget

**Files:**
- Modify: `e2e/atlas.spec.ts` (append)
- Modify: `test/unit/routes.test.ts` (append one integrity check)

**Interfaces:**
- Consumes: everything above. Produces nothing new.

- [ ] **Step 1: Add the integrity check**

Append to `test/unit/routes.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it**

Run: `npm test -- routes`
Expected: PASS. A failure here names a lane stop pointing at a body the archive does not ship — fix the data, not the test.

- [ ] **Step 3: Write the e2e tests**

Append to `e2e/atlas.spec.ts`:

```ts
test('a hyperlane deep-links into its own panel', async ({ page }) => {
  await page.goto('/galaxy?lane=perlemian-trade-route')

  const panel = page.getByRole('region', { name: /Hiperuzay hattı|Hyperlane/ })
  await expect(panel.getByRole('heading', { name: /Perlemian/ })).toBeVisible()
  await expect(panel.getByText(/\d+ (durak|stops) ·/)).toBeVisible()

  // an archive world on the lane opens its record
  await panel.getByRole('button', { name: 'Coruscant', exact: true }).click()
  await expect(page).toHaveURL(/\/planet\/coruscant/)
})

test('flying a lane starts a tour at its first stop', async ({ page }) => {
  await page.goto('/galaxy?lane=perlemian-trade-route')
  await page.getByRole('button', { name: /Bu hattı uç|Fly this lane/ }).click()

  // the player owns the route: it navigates to the first stop by itself
  await expect(page).toHaveURL(/\/planet\/[a-z0-9-]+/)
  const player = page.getByRole('region', { name: /Perlemian/ })
  await expect(player.getByText('1 /')).toBeVisible()

  await player.getByRole('button', { name: /İleri|Next/ }).click()
  await expect(player.getByText('2 /')).toBeVisible()
})

test('the keyboard lane list selects a lane without a pointer', async ({ page }) => {
  await page.goto('/galaxy')
  await page.getByRole('button', { name: /Corellia Koşusu|Corellian Run/ }).click()
  await expect(page).toHaveURL(/lane=corellian-run/)
  await expect(
    page.getByRole('region', { name: /Hiperuzay hattı|Hyperlane/ }),
  ).toBeVisible()
})
```

- [ ] **Step 4: Run the e2e tests**

Run: `npm run e2e -- --grep "hyperlane|lane"`
Expected: three new tests PASS alongside the existing 13. If the first stop of the Perlemian has no record and the panel button `Coruscant` is missing, read the lane's stop list in `src/data/routes.json` and use a world that is actually on it — do not weaken the assertion to a substring match.

- [ ] **Step 5: Run the whole gate**

Run: `npm run verify`
Expected: exit 0. Report the real numbers: test count, e2e count, `validate-lore` errors and warnings, and every budget line. `first paint total` had 23,927 bytes of headroom before this phase; if `LanePanel` or `lane-tour.ts` pushed a chunk over, the fix is where they are imported from, not a raised limit.

- [ ] **Step 6: Update the changelog**

Append one line to the repository root `CHANGELOG.md`:

```markdown
- Hyperlanes can now be selected on the map and flown end to end: a lane opens its own panel at `/galaxy?lane=<id>`, and its guided tour is generated from each world's own description rather than hand-written.
```

- [ ] **Step 7: Commit**

```bash
git add e2e/atlas.spec.ts test/unit/routes.test.ts ../CHANGELOG.md
git commit -m "test: cover lane selection, the lane tour and the keyboard path"
```

---

## Self-review notes

- Spec coverage: state and addressing → Task 5; `lane-tour.ts` and `tf` → Tasks 1-2; engine picking and highlight → Task 4; `LanePanel` and keyboard access → Task 5; error handling → the throws in Tasks 1-2, the `null` return in Task 5, the missing button in Task 5; testing → Tasks 2, 5, 6; budget → Task 6 step 5.
- The spec's `TourSource` and the plan's are the same shape. `PlayableTour` is defined once, in Task 2, and consumed unchanged by Tasks 3 and 5.
- `laneTour` is pure and takes bodies; `loadLaneTour` is the async wrapper. Task 3 uses only the wrapper, Task 2's tests use both.
- One risk the plan cannot settle in advance: `TOO_THIN` in Task 2 starts empty and is filled from the first real run. That is deliberate — the list is data about the lanes, and it should be discovered and then asserted rather than guessed here.
