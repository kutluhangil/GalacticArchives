# Phase C3 — Navigating the hyperlanes

Design for making the charted lanes selectable on the galaxy map and flyable as
guided tours. Phase C1 shipped the network (23 lanes, 308 stops, a Dijkstra
course plotter); the lanes are drawn but inert — nothing on the map can be
clicked, and the only way to reach a lane is the plotter's two dropdowns.

## Goals

1. A lane is a thing you can select, read and cite, the way a world already is.
2. A selected lane can be flown end to end as a guided tour.
3. No new lore debt: every sentence the tour narrates comes from data the
   archive already sources.

## Non-goals

- Lane state over time (which lane was open in which era). That needs canon
  research of its own and is a separate phase.
- A standalone `/lane/:id` record page. The map is the lane's home for now.
- Turning the course plotter into a tour. Only whole lanes are flyable; a
  plotted course stays an answer, not an itinerary.

## Decisions

| Question | Decision |
| --- | --- |
| What does clicking a lane do? | Selects it, dims the others, opens a lane panel |
| What does a lane tour visit? | Only stops that carry a `bodyId` — the worlds this archive holds |
| Where does narration come from? | Generated from the world's own `desc` plus its position on the lane |
| Is the selection addressable? | Yes — `/galaxy?lane=<routeId>` |

## Architecture

### State and addressing

The selected lane lives in the URL, not in the store: `/galaxy?lane=<routeId>`,
read with `useSearchParams`. One source of truth, and the back button and a
shared link both work without extra code. An unknown id simply selects nothing.

`TourState` gains a discriminated source so one player can drive two kinds of
tour:

```ts
export type TourSource =
  | { kind: 'authored'; id: string }   // tours.json, hand-written
  | { kind: 'lane'; id: string }       // generated from a hyperlane

interface TourState {
  source: TourSource
  step: number
  playing: boolean
}
```

`startTour` takes a `TourSource` instead of a bare id. `TopBar`'s tours menu
passes `{ kind: 'authored', id }`.

### Pure logic — `src/lib/lane-tour.ts`

```ts
export interface PlayableTour {
  id: string
  names: Localized
  blurb: Localized
  stops: { bodyId: string; narration: Localized }[]
  /** charted stops passed without a record, so the player can say so */
  skipped: number
}

export function laneTour(routeId: string, bodies: CelestialBody[]): PlayableTour
export function laneLengthParsecs(route: HyperspaceRoute): number
```

`laneTour` keeps the lane's stops in travel order, drops those without a
`bodyId`, and builds each stop's narration from:

- the world's own `desc` (already sourced, already bilingual), and
- its position on the tour: which stop of how many *kept* stops (not of the
  lane's full stop list, which the tour does not visit), and the parsecs flown
  from the previous kept stop — the real distance across any skipped stops in
  between, measured with `parsecsBetween` from `galaxy-grid.ts`.

Stops are kept regardless of continuity. A Legends world is hidden on the map
when the Legends layer is off, but a lane that calls at it still calls at it,
and its planet page renders either way.

`skipped` is the count of stops dropped for having no record. The panel and the
player both show it: the archive says what it is passing over rather than
presenting a thinned lane as the whole lane.

Templates carry placeholders, so `ui-strings.ts` gains a sibling to `t()`:

```ts
export function tf(key: FormatKey, lang: Lang, vars: Record<string, string | number>): string
```

`tf` fills `{n}`-style holes in a `Localized` string. It throws on a hole with
no matching var — a missing substitution is a bug, not a blank to render. The
existing `t()` is untouched.

### Engine — picking and highlight

`galaxy-engine.ts` today hit-tests only the invisible spheres that stand in for
worlds (`hitTargets`). Lanes are `THREE.Line` plus a `THREE.Points` tick per
stop, neither of which picks reliably.

`setLanes` additionally builds, per lane, one invisible `TubeGeometry` along
the same sampled curve it already draws (radius ≈ 0.45 world units — a finger's
worth on a phone), tagged `userData.routeId`, collected in `laneHitTargets` and
disposed with `laneGroup`.

Picking order in `onPointerDown`: look for a `bodyId` among the hits first, and
only then for a `routeId`. Worlds sit on their lanes, so without the ordering a
tube would steal clicks meant for a world. Lane picking is skipped entirely
while `laneGroup.visible` is false — lanes switched off means lanes not there.

`setSelectedLane(routeId | null)` raises the chosen lane's materials to full
opacity and drops the rest to 0.15. The existing `courseDim` scalar becomes
per-material: each lane material is tagged with its `routeId`, and
`applyDiskFade` multiplies base opacity by the dim factor that applies to it.

### Surface — `src/components/hud/LanePanel.tsx`

Top-left of the galaxy view. The plotter is bottom-right and the map hint is
bottom-left, so nothing overlaps at any width.

Contents:

- lane name and blurb, both from `routes.json`
- its source article, linked through `articleUrl` like every other citation
- stop count, how many carry a record, and total length in parsecs
- the stops in travel order: those with a record are buttons into
  `/planet/:id`, the rest are plain text
- **Fly this lane** — calls `startTour({ kind: 'lane', id })`
- a close control, which clears `?lane=`

Keyboard and screen-reader access mirrors the existing planet `<nav>` in
`GalaxyView`: an `sr-only` list of lanes, each entry visible as a chip when
focused, setting `?lane=` on activation. The WebGL tubes cannot take focus, so
this list is the accessible path to the same selection.

## Error handling

- `laneTour` throws on an unknown `routeId`. It is called with an id that came
  from `routes.json`; a miss is a programming error and must surface.
- `?lane=<unknown>` selects nothing and opens no panel. That value came from a
  user-editable URL, so it is not an exception.
- A lane with fewer than two stops that carry a record cannot be a tour. The
  **Fly this lane** button is not rendered, and the panel states how many stops
  have records. No empty or one-stop tour is ever produced.
- `tf` throws on an unfilled placeholder.

## Testing

`test/unit/lane-tour.test.ts`:

- every lane in `routes.json` either produces a tour with ≥2 stops or is
  explicitly listed as too thin, and the list is asserted — a lane silently
  dropping below the threshold fails the test
- stops come back in travel order, matching the lane's own stop order
- both languages are present and non-empty for every generated narration
- `skipped` equals the count of stops without a `bodyId`
- an unknown route id throws
- `laneLengthParsecs` matches the sum of the lane's legs

`test/unit/integrity.test.ts` (existing file): every `bodyId` named by a route
stop resolves to a body the archive ships.

`e2e/atlas.spec.ts`:

- `/galaxy?lane=perlemian-trade-route` opens the panel showing that lane's name
- **Fly this lane** starts the tour and lands on the first stop's planet page
- the keyboard lane list selects a lane without a pointer

## Budget

`first paint total` sits at 376,073 of 400,000 bytes and the `routes chunk` at
24,000 of 26,000 — the tightest headroom in the project. `lane-tour.ts` imports
`routes.json`, so it must land in the routes chunk rather than pulling that data
into the entry; `LanePanel` belongs to the galaxy route chunk. `npm run budget`
is the gate, and the plan measures after wiring rather than at the end.
