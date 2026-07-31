// Hyperlane pipeline, step 2: turn a route digest (scripts/fetch-routes.mjs)
// into the two files the app and CI need.
//
//   src/data/routes.json          shipped: lanes, their stops, their sources
//   test/fixtures/route-digest.json   the offline evidence validate-lore reads
//
// The stop list is data, so it is regenerated wholesale. The prose is not:
// bilingual names, blurbs and lane colors are authored here in the repo and
// carried across regenerations, the same way sync-sources.mjs preserves notes.
// A lane with no authored Turkish name comes out empty on purpose —
// validate-lore then refuses it rather than letting an English string pass as a
// translation.
//
// A stop binds to a shipped world only when the article title matches the
// world's name AND the grid cells agree. Both come from the same article, so a
// disagreement is drift, not a coincidence, and it stops the run.
//
// Usage: node scripts/sync-routes.mjs <route-digest.json>

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'src/data')
const ROUTES_OUT = join(DATA, 'routes.json')
const FIXTURE_OUT = join(ROOT, 'test/fixtures/route-digest.json')

const IN = process.argv[2]
if (!IN) {
  console.error('Usage: node scripts/sync-routes.mjs <route-digest.json>')
  process.exit(1)
}

/** lane colors, cycled for any lane the repo has not styled yet */
const PALETTE = ['#5fd0e8', '#e8c15a', '#c98bd8', '#7fe3a1', '#e8896b', '#8fa8ff']

const digest = JSON.parse(readFileSync(IN, 'utf8'))
if (!digest.routes) {
  console.error(`${IN} is not a fetch-routes digest (no routes key)`)
  process.exit(1)
}
const previous = existsSync(ROUTES_OUT) ? JSON.parse(readFileSync(ROUTES_OUT, 'utf8')) : { routes: [] }
const authored = new Map(previous.routes.map((r) => [r.id, r]))

// --- shipped worlds, by the name their article carries ---------------------
const load = (p) => JSON.parse(readFileSync(join(DATA, p), 'utf8'))
const byName = new Map()
const collect = (body) => {
  byName.set(body.names.en, body)
  for (const moon of body.moonsDetail ?? []) collect(moon)
}
for (const file of readdirSync(join(DATA, 'planets')).filter((f) => f.endsWith('.json'))) {
  collect(load(`planets/${file}`))
}

const errors = []
const routes = []
const fixture = { note: '', routes: {} }
let bound = 0

for (const [id, entry] of Object.entries(digest.routes)) {
  if (entry.missing) {
    errors.push(`${id}: article "${entry.title}" does not exist`)
    continue
  }
  const prose = authored.get(id)
  const stops = entry.stops.map((stop) => {
    const out = { article: stop.title, coordinates: stop.coordinates }
    if (stop.label !== stop.title) out.label = stop.label
    const body = byName.get(stop.title)
    if (body) {
      if (body.coordinates && body.coordinates !== stop.coordinates) {
        errors.push(
          `${id}: "${stop.title}" is grid ${stop.coordinates} on the lane but ${body.coordinates} in ${body.id}.json`,
        )
      }
      out.bodyId = body.id
      bound++
    }
    return out
  })

  routes.push({
    id,
    names: prose?.names ?? { en: entry.title, tr: '' },
    blurb: prose?.blurb ?? { en: '', tr: '' },
    source: `wookieepedia:${entry.title}`,
    color: prose?.color ?? PALETTE[routes.length % PALETTE.length],
    stops,
  })

  fixture.routes[id] = {
    title: entry.title,
    junctions: entry.junctions,
    stops: Object.fromEntries(entry.stops.map((s) => [s.title, s.coordinates])),
    unplaced: entry.unplaced.map((u) => u.label),
  }
}

if (errors.length) {
  for (const e of errors) console.error('  ✗ ' + e)
  process.exit(1)
}

writeFileSync(
  ROUTES_OUT,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      method:
        'Stops and their order come from each lane\'s {{TradeRoute}} infobox on Wookieepedia (endpoints + otherobjects, core-ward end first); every stop\'s grid cell comes from its own article. Names, blurbs and lane colors are authored in this repo. Rebuild: node scripts/fetch-routes.mjs <tmp> && node scripts/sync-routes.mjs <tmp>',
      routes,
    },
    null,
    1,
  ) + '\n',
)

fixture.note =
  'Slim snapshot of the fetched hyperlanes, used by validate-lore so CI can check src/data/routes.json against what Wookieepedia actually states without going online. Facts are not copyrightable; source Wookieepedia CC BY-SA. Rebuild with the two scripts named in routes.json.'
writeFileSync(FIXTURE_OUT, JSON.stringify(fixture, null, 1) + '\n')

const stopCount = routes.reduce((n, r) => n + r.stops.length, 0)
const junctions = new Map()
for (const route of routes) {
  for (const stop of route.stops) junctions.set(stop.article, (junctions.get(stop.article) ?? 0) + 1)
}
console.log(`routes written: ${ROUTES_OUT}`)
console.log(`fixture written: ${FIXTURE_OUT}`)
console.log(
  `lanes=${routes.length} stops=${stopCount} distinct=${junctions.size} junctions=${[...junctions.values()].filter((n) => n > 1).length} bound to a shipped world=${bound}`,
)
const untranslated = routes.filter((r) => !r.names.tr || !r.blurb.tr)
if (untranslated.length) {
  console.log(`NEEDS AUTHORING (${untranslated.length}): ${untranslated.map((r) => r.id).join(', ')}`)
}
