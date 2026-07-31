// P0 data-verification pipeline, step 3: rebuild src/data/sources.json from a
// full digest (scripts/fetch-lore.mjs), so every shipped body and character
// carries the article it was sourced from.
//
// `unverified` comes out of the digest rather than out of a claim: it lists the
// tracked fields the article does NOT define. The panel says so for those rows
// instead of hiding them, which is a different statement from "nobody has
// authored this yet". Which infobox fields the article does define is recorded
// as `present` in the digest fixture, not here — see scripts/slim-digest.mjs.
//
// Hand-written `note` entries are preserved. Entities absent from the digest
// keep whatever is already recorded for them.
//
// Usage: node scripts/sync-sources.mjs <full-digest.json>

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'src/data')
const SOURCES = join(DATA, 'sources.json')

const IN = process.argv[2]
if (!IN) {
  console.error('Usage: node scripts/sync-sources.mjs <full-digest.json>')
  process.exit(1)
}

/** headline facts whose absence is a statement about canon (see PlanetPanel) */
const TRACKED = ['diameter', 'population', 'government']

/** digest ids that do not match a body id one-to-one */
const DIGEST_TO_BODY = { 'endor-prime': 'endor' }

const digest = JSON.parse(readFileSync(IN, 'utf8'))
const previous = JSON.parse(readFileSync(SOURCES, 'utf8'))

const load = (p) => JSON.parse(readFileSync(join(DATA, p), 'utf8'))
const bodyIds = new Set()
const collect = (body) => {
  bodyIds.add(body.id)
  for (const moon of body.moonsDetail ?? []) collect(moon)
}
for (const file of readdirSync(join(DATA, 'planets')).filter((f) => f.endsWith('.json'))) {
  collect(load(`planets/${file}`))
}
for (const station of load('stations.json')) collect(station)
const characterIds = new Set(load('characters.json').map((c) => c.id))

const wikiUrl = (title) => `https://starwars.fandom.com/wiki/${title.replace(/ /g, '_')}`

const entities = {}
const unsourced = []
const covered = new Set()

// Only what the running app needs: the article, its url, and the fields canon
// states nothing for. Which infobox fields were consumed is audit data and
// lives in the digest fixture (`present`), so it does not ride along into a
// route chunk — it is roughly half this file's bytes.
function entryFor(digestEntry, tracked) {
  const infobox = digestEntry.infobox ?? {}
  const entry = {
    source: `wookieepedia:${digestEntry.title}`,
    url: wikiUrl(digestEntry.title),
  }
  const unverified = tracked.filter((f) => !infobox[f])
  if (unverified.length) entry.unverified = unverified
  return entry
}

for (const [digestId, digestEntry] of Object.entries(digest.planets)) {
  const id = DIGEST_TO_BODY[digestId] ?? digestId
  if (digestEntry.missing) continue
  const entry = entryFor(digestEntry, bodyIds.has(id) ? TRACKED : [])
  const note = previous.entities?.[id]?.note ?? previous.entities?.[digestId]?.note
  if (note) entry.note = note
  entities[id] = entry
  if (bodyIds.has(id)) covered.add(id)
}

for (const [id, digestEntry] of Object.entries(digest.characters)) {
  if (digestEntry.missing) continue
  const entry = entryFor(digestEntry, [])
  const note = previous.entities?.[id]?.note
  if (note) entry.note = note
  entities[id] = entry
}

// keep anything already recorded that the digest does not cover, rather than
// silently dropping a source. Digest aliases (endor-prime) are excluded: their
// content already lives under the body id they map to.
for (const [id, entry] of Object.entries(previous.entities ?? {})) {
  if (!entities[id] && !DIGEST_TO_BODY[id]) entities[id] = entry
}

for (const id of [...bodyIds, ...characterIds]) {
  if (!entities[id]) unsourced.push(id)
}

const out = {
  generatedAt: new Date().toISOString(),
  method: previous.method,
  notes: {
    ...previous.notes,
    'global-unverified':
      '`unverified` lists fields the sourced article does not define at all — the app states those rows as unstated in canon rather than hiding them. A field the article does define but this archive has not authored yet is simply absent, and validate-lore reports it as a gap.',
  },
  entities: Object.fromEntries(Object.keys(entities).sort().map((id) => [id, entities[id]])),
}

writeFileSync(SOURCES, JSON.stringify(out, null, 1) + '\n')

const withUnverified = Object.values(entities).filter((e) => e.unverified?.length).length
console.log(`sources written: ${SOURCES}`)
console.log(`entities=${Object.keys(entities).length}, bodies covered=${covered.size}/${bodyIds.size}, entries with unverified fields=${withUnverified}`)
if (unsourced.length) console.log(`UNSOURCED (${unsourced.length}): ${unsourced.join(', ')}`)
