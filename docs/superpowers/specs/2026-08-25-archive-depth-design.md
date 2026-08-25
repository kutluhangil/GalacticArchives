# Archive Depth Design

**Status:** Implemented; validation complete  
**Date:** 2026-08-25

## Goal

Deepen Galactic Archives without inventing lore or adding remote runtime
dependencies. The archive will make its existing sourced relationships
discoverable, turn them into guided story routes, support additional station
forms, expose explicit WebGL compatibility information, and let visitors keep
small local collections.

## Scope and order

1. Release and content-truthfulness gate.
2. Character–world–event relationship graph.
3. Sourced story routes built on that graph.
4. Data-driven megastructure renderer extension.
5. WebGL compatibility state and local collections.

Apple signing/notarization remains outside this scope because it requires the
owner's certificate, app-specific password, and Team ID. A missing canonical
article or Galactic Grid coordinate is never filled with a guess.

## 1. Release and content-truthfulness gate

The validation report remains the authoritative source for unsupported POIs and
unplaceable lane stops. The UI will surface an explicit `unverified` or
`not-stated-in-canon` state at the record where that absence matters, rather
than presenting a quiet omission as complete information. The pipeline keeps
warnings non-fatal when the source genuinely states no value; it must fail on a
malformed citation, an invented coordinate, or an unsupported state.

Acceptance criteria:

- A visitor can distinguish sourced, authored-summary, and canon-unstated
  facts.
- Every newly authored graph edge and story stop names the record that supports
  it.
- The release checklist runs typecheck, lint, lore/assets validation, unit,
  build, budget, E2E, and Tauri check separately with their exact outcomes.

## 2. ArchiveGraph module

`src/lib/archive-graph.ts` is the sole seam between lore data and visual
surfaces. Its interface receives loaded bodies, characters, timeline events,
and authored story records, and returns an immutable graph:

- nodes: `body`, `character`, `event`, `story`;
- edges: `homeworld`, `appears-on`, `participates-in`, `related-character`,
  `story-stop`;
- every edge carries a typed evidence record from existing IDs, never prose
  inference.

The implementation deduplicates edges, rejects dangling IDs, sorts output
deterministically, and keeps data loading outside the module. Callers get one
small interface and do not need to know the joining rules. The first adapter is
an accessible SVG/DOM relationship explorer on the Holocron character and
planet detail pages; it can be swapped for a canvas renderer later without
changing the graph interface.

Acceptance criteria:

- A character detail shows its homeworld, related figures, connected worlds,
  and known events only where dataset IDs support them.
- A world detail shows its linked characters and events.
- Keyboard navigation, text equivalent, and reduced-motion mode remain usable.
- Unit tests cover duplicate, missing, cyclic, and deterministic graph data.

## 3. Story routes

`src/data/stories.json` holds a small, sourced set of authored routes. Each
story has bilingual names/blurbs, ordered stops, edge evidence, and an optional
era. `src/lib/stories.ts` validates and adapts it to the existing TourPlayer
interface; TourPlayer remains the only route-execution owner.

The first routes are limited to relationships already represented by body,
character, appearance, and timeline IDs. A story whose next stop cannot load
fails explicitly in development and renders a clear unavailable state in the
UI rather than skipping ahead.

Acceptance criteria:

- A graph selection can start a relevant story route.
- Stories remain URL-addressable and respect the existing simulated era.
- Existing authored and hyperlane tours have no behavioural regression.

## 4. Megastructure renderer

Extend `renderRecipe.stationVisual` through a single dispatcher instead of
branching in every engine. Existing `death-star` and `ringworld` are preserved;
new visual types are added only with a typed recipe, a builder, deterministic
geometry/materials, and renderer selection tests. Initial candidates are an
orbital shipyard and a mining station, but no lore record is authored until its
source and visual brief are approved.

Acceptance criteria:

- Planet and System engines use the same dispatcher.
- Existing station routes remain visually and interactively stable.
- New station forms add no third-party renderer dependency and respect quality
  settings/reduced motion.

## 5. Compatibility and collections

`src/lib/render-compatibility.ts` performs a small, explicit browser capability
check before a Three.js engine mounts. It reports WebGL availability and a
recommended quality tier; it does not silently disguise a renderer failure.
The route UI provides an explanatory non-WebGL reading surface and a retry
action.

`src/lib/collections.ts` expands only to explicit local records: saved stories
and saved bodies. Storage stays browser-local, SSR-safe, versioned, and
recoverable from malformed data. There is no account, sync, analytics, or
remote database in this phase.

Acceptance criteria:

- A no-WebGL browser can still read the selected archive record and return to
  the galaxy.
- Saved stories persist after reload and can be removed accessibly.
- Storage errors are visible and do not erase valid existing records.

## Testing and verification

- Pure Vitest coverage for graph joins, story validation, compatibility result
  mapping, collections migration, and station dispatch.
- Component tests for graph explorer, unavailable renderer state, and saved
  stories.
- Playwright checks for character-to-world traversal, story playback, fallback
  reading state, and station routes.
- Build/budget checks must continue to prove Three.js stays off first paint.
- E2E and Tauri GUI checks run in an environment permitted to bind the preview
  port; their output is reported separately from unit/build evidence.

## Non-goals

- No unsourced canon claims, generated lore, accounts, cloud sync, telemetry,
  third-party graph library, or browser-only data access during SSR.
- No Apple credential handling or notarization configuration without owner
  supplied credentials.
