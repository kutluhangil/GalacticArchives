// P0 data-verification pipeline, step 2: validate authored lore JSON against
// the schema AND cross-check hard facts (coordinates, diameters, populations
// presence) against the Wookieepedia digest produced by fetch-lore.mjs.
//
// Usage: node scripts/validate-lore.mjs <lore-digest.json>

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'src/data')

// Defaults to the committed slim fact snapshot so `npm run validate` and CI run
// with no network. Pass a freshly fetched digest to cross-check against live
// Wookieepedia instead: node scripts/validate-lore.mjs <lore-digest.json>
const digestPath = process.argv[2] ?? join(ROOT, 'test/fixtures/lore-digest.json')
const digest = JSON.parse(readFileSync(digestPath, 'utf8'))

const errors = []
const warnings = []
const err = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

const load = (p) => JSON.parse(readFileSync(join(DATA, p), 'utf8'))

const eras = load('meta/eras.json')
const regions = load('meta/regions.json')
const factions = load('meta/factions.json')
const media = load('meta/media.json')
const stations = load('stations.json')
const characters = load('characters.json')
const sources = load('sources.json')
const routesFile = load('routes.json')
const routeDigest = JSON.parse(
  readFileSync(join(ROOT, 'test/fixtures/route-digest.json'), 'utf8'),
)
const poiDigest = JSON.parse(
  readFileSync(join(ROOT, 'test/fixtures/poi-digest.json'), 'utf8'),
)

/** A cited point of interest claims two things: Wookieepedia has the article,
 *  and the article belongs to the same continuity as the body it sits on —
 *  a canon world must not pin a Legends-only place, or the archive states as
 *  canon something canon never wrote. Both are checked against the snapshot. */
function checkPoiCitation(poi, id, file, continuity) {
  const article = poi.source.slice('wookieepedia:'.length)
  const entry = poiDigest.articles[article]
  const where = `${file}: ${id} poi ${poi.id}`
  if (!entry) {
    err(`${where} cites "${article}", which is not in test/fixtures/poi-digest.json — rerun scripts/fetch-poi.mjs and scripts/slim-poi.mjs`)
    return
  }
  if (entry.missing) {
    err(`${where} cites "${article}", which Wookieepedia does not have`)
    return
  }
  if (entry.continuity !== continuity) {
    err(`${where} sits on a ${continuity} body but cites "${article}", a ${entry.continuity} article`)
  }
  if (entry.redirectsTo) {
    warn(`${id}: poi "${poi.id}" cites "${article}", which redirects to "${entry.redirectsTo}" — cite the article itself`)
  }
}

/** headline stat fields, as the Wookieepedia infobox names them -> our key */
const TRACKED_FIELDS = { diameter: 'diameterKm', population: 'population', government: 'government' }
/** values that pretend to be data; the panel has an explicit state for "no
 *  canon value", so a placeholder in the data is always a lie */
const PLACEHOLDERS = new Set(['—', '–', '-', '?', 'n/a', 'N/A', 'tbd', 'TBD', ''])

const eraIds = new Set(eras.map((e) => e.id))
const regionIds = new Set(regions.map((r) => r.id))
const factionIds = new Set(factions.map((f) => f.id))
const mediaIds = new Set(media.map((m) => m.id))
const ARCHETYPES = new Set([
  'desert', 'ecumenopolis', 'lava', 'ice', 'ocean-storm', 'gas-giant',
  'verdant', 'swamp-fog', 'crystal-red', 'dark-storm', 'barren', 'station',
])

const planetFiles = readdirSync(join(DATA, 'planets')).filter((f) => f.endsWith('.json'))
const bodies = new Map() // id -> {body, file}

function collectBody(body, file) {
  if (bodies.has(body.id)) err(`${file}: duplicate body id "${body.id}"`)
  bodies.set(body.id, { body, file })
  for (const moon of body.moonsDetail ?? []) collectBody(moon, file)
}
for (const f of planetFiles) collectBody(load(`planets/${f}`), f)
for (const s of stations) collectBody(s, 'stations.json')

const characterIds = new Set(characters.map((c) => c.id))

function checkLocalized(obj, path, file) {
  if (!obj || typeof obj.en !== 'string' || typeof obj.tr !== 'string' || !obj.en.trim() || !obj.tr.trim()) {
    err(`${file}: ${path} must have non-empty {en,tr}`)
  }
}

for (const [id, { body, file }] of bodies) {
  checkLocalized(body.names, `${id}.names`, file)
  checkLocalized(body.desc, `${id}.desc`, file)
  if (!regionIds.has(body.region)) err(`${file}: ${id}.region "${body.region}" not in regions.json`)
  if (!body.system) err(`${file}: ${id}.system missing`)
  // A missing stats block is only a gap when canon actually states something;
  // where it does not, the panel says so explicitly and there is nothing to
  // author. The per-field check further down reports the real gaps.
  for (const [key, value] of Object.entries(body.stats ?? {})) {
    const texts = typeof value === 'object' && value ? Object.values(value) : [value]
    for (const text of texts) {
      if (typeof text === 'string' && PLACEHOLDERS.has(text.trim())) {
        err(`${file}: ${id}.stats.${key} is the placeholder "${text}" — omit the field so the panel can say the value is unstated in canon`)
      }
    }
    if (key === 'diameterKm' && value === 0) {
      err(`${file}: ${id}.stats.diameterKm is 0 — omit the field instead of shipping a placeholder diameter`)
    }
  }
  if (!body.renderRecipe) err(`${file}: ${id}.renderRecipe missing`)
  else {
    if (!ARCHETYPES.has(body.renderRecipe.archetype)) err(`${file}: ${id} archetype "${body.renderRecipe.archetype}" invalid`)
    if (!body.renderRecipe.palette?.primary) err(`${file}: ${id} palette.primary missing`)
    for (const eraKey of Object.keys(body.renderRecipe.variantsByEra ?? {})) {
      if (!eraIds.has(eraKey)) err(`${file}: ${id} variantsByEra key "${eraKey}" invalid`)
    }
  }
  for (const m of body.appearances ?? []) {
    if (!mediaIds.has(m)) err(`${file}: ${id} appearance "${m}" not in media.json`)
  }
  for (const [eraKey, factionId] of Object.entries(body.affiliationsByEra ?? {})) {
    if (!eraIds.has(eraKey)) err(`${file}: ${id} affiliation era "${eraKey}" invalid`)
    if (!factionIds.has(factionId)) err(`${file}: ${id} affiliation faction "${factionId}" invalid`)
  }
  for (const c of body.characters ?? []) {
    if (!characterIds.has(c)) err(`${file}: ${id} character "${c}" not in characters.json`)
  }
  const poiIds = new Set()
  for (const p of body.poi ?? []) {
    checkLocalized(p.names, `${id}.poi.${p.id}.names`, file)
    checkLocalized(p.blurb, `${id}.poi.${p.id}.blurb`, file)
    if (typeof p.lat !== 'number' || p.lat < -90 || p.lat > 90) err(`${file}: ${id} poi ${p.id} lat out of range`)
    if (typeof p.lon !== 'number' || p.lon < -180 || p.lon > 180) err(`${file}: ${id} poi ${p.id} lon out of range`)
    if (poiIds.has(p.id)) err(`${file}: ${id} has two points of interest with id "${p.id}"`)
    poiIds.add(p.id)
    // the placement on the globe is ours; the place itself has to be canon, so
    // a POI either cites its own article or is reported as uncited
    if (p.source === undefined) {
      warn(`${id}: poi "${p.id}" cites no source article`)
    } else if (!/^wookieepedia:.+/.test(p.source)) {
      err(`${file}: ${id} poi ${p.id} source "${p.source}" is not "wookieepedia:<article>"`)
    } else {
      checkPoiCitation(p, id, file, body.continuity ?? 'canon')
    }
  }
  if (body.funFacts) {
    if (!Array.isArray(body.funFacts.en) || !Array.isArray(body.funFacts.tr) || body.funFacts.en.length !== body.funFacts.tr.length) {
      err(`${file}: ${id}.funFacts en/tr must be arrays of equal length`)
    }
  }
  if (body.destruction && !eraIds.has(body.destruction.destroyedFromEra)) {
    err(`${file}: ${id}.destruction.destroyedFromEra invalid`)
  }
  if (JSON.stringify(body).includes('(?)')) err(`${file}: ${id} contains an unresolved "(?)" marker`)

  // --- cross-check against Wookieepedia digest ---
  const dig = digest.planets[id] ?? (id === 'endor' ? digest.planets['endor-prime'] : undefined)
  if (dig?.infobox) {
    const ib = dig.infobox
    if (body.coordinates && ib.coordinates) {
      const want = ib.coordinates.split(' ')[0].trim()
      if (!ib.coordinates.startsWith(body.coordinates)) {
        err(`${file}: ${id}.coordinates "${body.coordinates}" != Wookieepedia "${want}"`)
      }
    } else if (body.coordinates && !ib.coordinates) {
      warn(`${id}: coordinates "${body.coordinates}" set but absent in digest — needs manual source note`)
    }
    if (body.stats?.diameterKm && ib.diameter) {
      const wookiee = parseInt(ib.diameter.replace(/[.,]/g, '').match(/\d+/)?.[0] ?? '0', 10)
      if (wookiee && Math.abs(wookiee - body.stats.diameterKm) > 1) {
        err(`${file}: ${id}.diameterKm ${body.stats.diameterKm} != Wookieepedia ${wookiee}`)
      }
    }
  } else if (!['death-star', 'death-star-2'].includes(id) && !dig) {
    warn(`${id}: no digest entry (not fetched) — verify manually`)
  }

  // --- provenance: the panel's four states must rest on real evidence ---
  const entry = sources.entities?.[id]
  if (!entry) {
    err(`sources.json: no entry for body "${id}" — every shipped body needs its source article`)
  } else {
    if (!entry.url) err(`sources.json: ${id} has no url`)
    if (dig?.absent) {
      const claimed = [...(entry.unverified ?? [])].sort().join(',')
      const evidenced = [...dig.absent].sort().join(',')
      if (claimed !== evidenced) {
        err(`sources.json: ${id}.unverified [${claimed}] does not match the digest's absent fields [${evidenced}] — rerun scripts/sync-sources.mjs`)
      }
    }
    if (!dig && body.kind !== 'station') {
      warn(`${id}: no digest entry, so its empty fields cannot be told apart from canon gaps`)
    }
    for (const [wikiField, ourKey] of Object.entries(TRACKED_FIELDS)) {
      const stated = dig?.infobox?.[wikiField] !== undefined
      const have = body.stats?.[ourKey] !== undefined
      if (stated && !have) warn(`${id}: canon states ${wikiField} but the archive has none — authoring gap`)
    }
  }
}

for (const c of characters) {
  checkLocalized(c.names, `${c.id}.names`, 'characters.json')
  checkLocalized(c.bio, `${c.id}.bio`, 'characters.json')
  checkLocalized(c.species, `${c.id}.species`, 'characters.json')
  if (c.homeworldId && !bodies.has(c.homeworldId)) {
    err(`characters.json: ${c.id}.homeworldId "${c.homeworldId}" not a known body`)
  }
  if (!c.homeworldId && !c.homeworldName) err(`characters.json: ${c.id} needs homeworldId or homeworldName`)
  for (const m of c.appearances ?? []) {
    if (!mediaIds.has(m)) err(`characters.json: ${c.id} appearance "${m}" not in media.json`)
  }
  for (const r of c.relatedCharacters ?? []) {
    if (!characterIds.has(r)) err(`characters.json: ${c.id} related "${r}" unknown`)
  }
  if (!c.portrait) err(`characters.json: ${c.id}.portrait missing`)
  if (!sources.entities?.[c.id]) {
    err(`sources.json: no entry for character "${c.id}" — every shipped character needs its source article`)
  }
  for (const [eraKey, factionId] of Object.entries(c.affiliationsByEra ?? {})) {
    if (!eraIds.has(eraKey)) err(`characters.json: ${c.id} era "${eraKey}" invalid`)
    if (!factionIds.has(factionId)) err(`characters.json: ${c.id} faction "${factionId}" invalid`)
  }
  const dig = digest.characters[c.id]
  if (dig?.infobox?.birth && c.birth) {
    const yearRe = /(\d+)\s*(BBY|ABY)/
    const a = c.birth.match(yearRe)
    const b = dig.infobox.birth.match(yearRe)
    if (a && b && (a[1] !== b[1] || a[2] !== b[2])) {
      err(`characters.json: ${c.id}.birth "${c.birth}" != Wookieepedia "${dig.infobox.birth.slice(0, 60)}"`)
    }
  }
}

// --- codex records ---------------------------------------------------------
// Starships, battles, Force powers, timeline events, watch-guide entries and
// transmissions each state facts the archive presents as canon, so each one
// cites the article it was written from, exactly as the bodies and characters
// do. Three things are checked: the record carries a citation, Wookieepedia
// has that article, and the continuity matches — an in-universe record must
// not quietly present a Legends-only article as canon, and a watch-guide entry
// points at a real-world article, which belongs to neither continuity.
const codexDigest = JSON.parse(
  readFileSync(join(ROOT, 'test/fixtures/codex-digest.json'), 'utf8'),
)

/** file -> which continuity its articles must belong to */
const CODEX_FILES = {
  'starships.json': 'in-universe',
  'battles.json': 'in-universe',
  'force-powers.json': 'in-universe',
  'timeline.json': 'in-universe',
  'transmissions.json': 'in-universe',
  'watch-guide.json': 'real-world',
}

let codexRecords = 0
for (const [file, kind] of Object.entries(CODEX_FILES)) {
  const records = load(file)
  const seen = new Set()
  for (const record of records) {
    codexRecords++
    const where = `${file}: ${record.id}`
    if (seen.has(record.id)) err(`${where} is declared twice`)
    seen.add(record.id)

    if (!record.source) {
      err(`${where} carries no source — every codex record cites its own article`)
      continue
    }
    if (!record.source.startsWith('wookieepedia:')) {
      err(`${where} source "${record.source}" is not a "wookieepedia:<article>" citation`)
      continue
    }
    const article = record.source.slice('wookieepedia:'.length)
    const entry = codexDigest.articles[article]
    if (!entry) {
      err(`${where} cites "${article}", which is not in test/fixtures/codex-digest.json — rerun scripts/fetch-codex.mjs`)
      continue
    }
    if (entry.missing) {
      err(`${where} cites "${article}", which Wookieepedia does not have`)
      continue
    }
    if (kind === 'real-world') {
      if (entry.continuity !== 'unstated') {
        err(`${where} is a real-world entry but cites "${article}", an in-universe ${entry.continuity} article`)
      }
      continue
    }
    const claimed = record.continuity ?? 'canon'
    if (entry.continuity === 'unstated') {
      err(`${where} cites "${article}", a real-world article, for an in-universe record`)
    } else if (entry.continuity !== claimed) {
      err(`${where} reads as ${claimed} but cites "${article}", a ${entry.continuity} article`)
    }
  }
}

// A transmission prints words in quotation marks, so it has to say whether the
// archive is quoting the article or paraphrasing the scene.
for (const transmission of load('transmissions.json')) {
  if (typeof transmission.verbatim !== 'boolean') {
    err(`transmissions.json: ${transmission.id}.verbatim must be true (quoted) or false (reconstructed)`)
  }
}

console.log(`codex records=${codexRecords}, cited articles=${Object.keys(codexDigest.articles).length}`)

// --- hyperlanes ------------------------------------------------------------
// A lane is drawn on the map and flown by the course plotter, so three things
// have to hold: every stop is placed by a canon grid cell, every lane cites the
// article its stops came from, and the lanes actually form one network. A lane
// nothing else touches is a line no course can ever use.
const GRID = /^[A-V]-([1-9]|1\d|2[01])$/
const routeIds = new Set()
const stopCells = new Map() // article -> grid cell, shared across lanes
const laneAdjacency = new Map()
const linkStops = (a, b) => {
  for (const [from, to] of [[a, b], [b, a]]) {
    if (!laneAdjacency.has(from)) laneAdjacency.set(from, new Set())
    laneAdjacency.get(from).add(to)
  }
}

for (const route of routesFile.routes ?? []) {
  const where = `routes.json: ${route.id}`
  if (routeIds.has(route.id)) err(`${where} is declared twice`)
  routeIds.add(route.id)
  checkLocalized(route.names, `${route.id}.names`, 'routes.json')
  checkLocalized(route.blurb, `${route.id}.blurb`, 'routes.json')
  if (!/^wookieepedia:.+/.test(route.source ?? '')) {
    err(`${where} source "${route.source}" is not "wookieepedia:<article>"`)
  }
  if (!/^#[0-9a-f]{6}$/i.test(route.color ?? '')) err(`${where} color "${route.color}" is not a hex color`)

  const dig = routeDigest.routes?.[route.id]
  if (!dig) {
    err(`${where} has no entry in test/fixtures/route-digest.json — rerun scripts/fetch-routes.mjs and scripts/sync-routes.mjs`)
  } else if (`wookieepedia:${dig.title}` !== route.source) {
    err(`${where} cites "${route.source}" but the digest fetched "${dig.title}"`)
  }
  for (const label of dig?.unplaced ?? []) {
    warn(`${route.id}: canon names "${label}" on this lane but states no grid cell for it, so it is not drawn`)
  }

  if ((route.stops ?? []).length < 2) {
    err(`${where} has ${route.stops?.length ?? 0} stop(s) — a lane needs two to be a line`)
  }
  const seenHere = new Set()
  for (const stop of route.stops ?? []) {
    if (!stop.article) err(`${where} has a stop with no article`)
    if (!GRID.test(stop.coordinates ?? '')) {
      err(`${where} stop "${stop.article}" grid "${stop.coordinates}" is not a Standard Galactic Grid cell`)
    }
    if (seenHere.has(stop.article)) err(`${where} calls at "${stop.article}" twice`)
    seenHere.add(stop.article)
    // the same stop reached from two lanes has to sit in one place
    const known = stopCells.get(stop.article)
    if (known && known !== stop.coordinates) {
      err(`routes.json: "${stop.article}" is grid ${known} on one lane and ${stop.coordinates} on another`)
    }
    stopCells.set(stop.article, stop.coordinates)
    if (dig && dig.stops?.[stop.article] === undefined) {
      err(`${where} stop "${stop.article}" is not in the fetched digest — it was not verified against Wookieepedia`)
    } else if (dig && dig.stops[stop.article] !== stop.coordinates) {
      err(`${where} stop "${stop.article}" is grid ${stop.coordinates} but the digest fetched ${dig.stops[stop.article]}`)
    }
    if (stop.bodyId && !bodies.has(stop.bodyId)) {
      err(`${where} stop "${stop.article}" binds to unknown body "${stop.bodyId}"`)
    }
    const body = stop.bodyId ? bodies.get(stop.bodyId)?.body : undefined
    if (body?.coordinates && body.coordinates !== stop.coordinates) {
      err(`${where} stop "${stop.article}" is grid ${stop.coordinates} but ${stop.bodyId}.json says ${body.coordinates}`)
    }
  }
  for (let i = 1; i < (route.stops ?? []).length; i++) {
    linkStops(route.stops[i - 1].article, route.stops[i].article)
  }
}

// one network, or the course plotter silently cannot reach half the map
const visited = new Set()
const components = []
for (const article of laneAdjacency.keys()) {
  if (visited.has(article)) continue
  const queue = [article]
  const group = []
  visited.add(article)
  while (queue.length) {
    const at = queue.shift()
    group.push(at)
    for (const next of laneAdjacency.get(at) ?? []) {
      if (visited.has(next)) continue
      visited.add(next)
      queue.push(next)
    }
  }
  components.push(group)
}
components.sort((a, b) => b.length - a.length)
if (components.length > 1) {
  const strays = components.slice(1).map((g) => `${g.length} stop(s): ${g.slice(0, 4).join(', ')}`)
  err(`routes.json: the lane network breaks into ${components.length} pieces — ${strays.join(' | ')}`)
}

const laneBodies = new Set(
  (routesFile.routes ?? []).flatMap((r) => (r.stops ?? []).filter((s) => s.bodyId).map((s) => s.bodyId)),
)
console.log(
  `hyperlanes=${routeIds.size}, stops=${stopCells.size} distinct, ${laneBodies.size} of them worlds in this archive`,
)

console.log(`bodies=${bodies.size} (planet files=${planetFiles.length}, stations=${stations.length})`)
console.log(`characters=${characters.length}, media=${media.length}, eras=${eras.length}, regions=${regions.length}, factions=${factions.length}`)

const allPoi = [...bodies.values()].flatMap(({ body }) => body.poi ?? [])
const bodiesWithPoi = [...bodies.values()].filter(({ body }) => (body.poi ?? []).length).length
console.log(
  `points of interest=${allPoi.length} across ${bodiesWithPoi}/${bodies.size} bodies, ${allPoi.filter((p) => p.source).length} cited`,
)
console.log(`\nERRORS: ${errors.length}`)
for (const e of errors) console.log('  ✗ ' + e)
console.log(`WARNINGS: ${warnings.length}`)
for (const w of warnings) console.log('  ~ ' + w)
process.exit(errors.length ? 1 : 0)
