// Points-of-interest research pipeline, step 2: turn a freshly fetched digest
// (scripts/fetch-poi.mjs) into the slim snapshot committed under
// test/fixtures/, which is what `npm run validate` and CI read offline.
//
// The snapshot keeps one line per article this archive cites for a point of
// interest: whether Wookieepedia has it at all, and which continuity it belongs
// to. That is the evidence behind every cited pin — without it "cited" is only
// a well-formed string. The candidate lists in the full digest are authoring
// reference, not a claim the app makes, so they stay out.
//
// Usage: node scripts/slim-poi.mjs <full-digest.json> [out.json]

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const IN = process.argv[2]
if (!IN) {
  console.error('Usage: node scripts/slim-poi.mjs <full-digest.json> [out.json]')
  process.exit(1)
}
const OUT = process.argv[3] ?? join(ROOT, 'test/fixtures/poi-digest.json')

const full = JSON.parse(readFileSync(IN, 'utf8'))
if (!full.cited || !full.bodies) {
  console.error(`${IN} is not a fetch-poi digest (no cited/bodies keys)`)
  process.exit(1)
}

const slim = {
  note: 'Slim snapshot of the articles this archive cites for points of interest, used by validate-lore so CI can check every citation resolves — and resolves in the same continuity as the body it sits on — without going online. Facts are not copyrightable; source Wookieepedia CC BY-SA. Rebuild: node scripts/fetch-poi.mjs <tmp> && node scripts/slim-poi.mjs <tmp>',
  articles: {},
}

for (const [asked, info] of Object.entries(full.cited).sort(([a], [b]) => a.localeCompare(b))) {
  const entry = info.missing
    ? { missing: true }
    : { continuity: info.canon ? 'canon' : info.legends ? 'legends' : 'unstated' }
  if (info.title !== asked) entry.redirectsTo = info.title
  slim.articles[asked] = entry
}

writeFileSync(OUT, `${JSON.stringify(slim, null, 1)}\n`)
const values = Object.values(slim.articles)
console.log(`Snapshot written: ${OUT}`)
console.log(
  `articles=${values.length} canon=${values.filter((a) => a.continuity === 'canon').length}` +
    ` legends=${values.filter((a) => a.continuity === 'legends').length}` +
    ` unstated=${values.filter((a) => a.continuity === 'unstated').length}` +
    ` missing=${values.filter((a) => a.missing).length}`,
)
