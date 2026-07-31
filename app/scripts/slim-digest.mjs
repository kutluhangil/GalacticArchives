// P0 data-verification pipeline, step 1b: turn a freshly fetched full digest
// (scripts/fetch-lore.mjs) into the slim snapshot committed under
// test/fixtures/, which is what `npm run validate` and CI read offline.
//
// The snapshot keeps two things:
//   • the hard facts we cross-check values against (coordinates, diameter,
//     population, government, character birth)
//   • `absent`: which of the TRACKED fields the canon infobox does NOT define
//
// `absent` is the evidence behind sources.json's `unverified` lists, which is
// what lets the app say "no canon-verified value" instead of quietly dropping
// a row. Without it that claim would be an assertion with nothing behind it.
//
// Usage: node scripts/slim-digest.mjs <full-digest.json> [out.json]

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const IN = process.argv[2]
if (!IN) {
  console.error('Usage: node scripts/slim-digest.mjs <full-digest.json> [out.json]')
  process.exit(1)
}
const OUT = process.argv[3] ?? join(ROOT, 'test/fixtures/lore-digest.json')

/** infobox fields the app surfaces as a headline fact, so their absence is a
 *  statement about canon rather than an authoring gap */
const TRACKED = ['diameter', 'population', 'government']
/** kept verbatim for value cross-checks in validate-lore.mjs */
const KEPT = ['coordinates', 'diameter', 'population', 'government']
/** infobox fields this app consumes; `present` records which of them the
 *  article defines. This is audit data, so it lives here rather than in the
 *  shipped sources.json, which would carry it into a route chunk. */
const CONSUMED = [
  'region', 'sector', 'system', 'coordinates', 'class', 'diameter', 'suns',
  'moons', 'atmosphere', 'climate', 'terrain', 'water', 'population',
  'government', 'affiliation',
]

const full = JSON.parse(readFileSync(IN, 'utf8'))
if (!full.planets || !full.characters) {
  console.error(`${IN} is not a fetch-lore digest (no planets/characters keys)`)
  process.exit(1)
}

const slim = {
  note: 'Slim fact snapshot for validate-lore CI regression. `absent` lists tracked infobox fields the canon article does not define — the evidence behind sources.json "unverified". Facts are not copyrightable; source Wookieepedia CC BY-SA. Rebuild: node scripts/fetch-lore.mjs <tmp> && node scripts/slim-digest.mjs <tmp>',
  planets: {},
  characters: {},
}

for (const [id, entry] of Object.entries(full.planets)) {
  if (entry.missing) {
    slim.planets[id] = { title: entry.title, missing: true }
    continue
  }
  const infobox = {}
  for (const field of KEPT) {
    if (entry.infobox?.[field]) infobox[field] = entry.infobox[field]
  }
  slim.planets[id] = {
    title: entry.title,
    infobox,
    present: CONSUMED.filter((field) => entry.infobox?.[field]),
    absent: TRACKED.filter((field) => !entry.infobox?.[field]),
  }
}

for (const [id, entry] of Object.entries(full.characters)) {
  if (entry.missing) {
    slim.characters[id] = { title: entry.title, missing: true }
    continue
  }
  slim.characters[id] = {
    title: entry.title,
    infobox: entry.infobox?.birth ? { birth: entry.infobox.birth } : {},
  }
}

writeFileSync(OUT, JSON.stringify(slim, null, 1) + '\n')
const absentCount = Object.values(slim.planets).filter((p) => p.absent?.length).length
console.log(`slim digest written: ${OUT}`)
console.log(
  `planets=${Object.keys(slim.planets).length} characters=${Object.keys(slim.characters).length} bodies with an absent tracked field=${absentCount}`,
)
