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
  for (const p of body.poi ?? []) {
    checkLocalized(p.names, `${id}.poi.${p.id}.names`, file)
    checkLocalized(p.blurb, `${id}.poi.${p.id}.blurb`, file)
    if (typeof p.lat !== 'number' || p.lat < -90 || p.lat > 90) err(`${file}: ${id} poi ${p.id} lat out of range`)
    if (typeof p.lon !== 'number' || p.lon < -180 || p.lon > 180) err(`${file}: ${id} poi ${p.id} lon out of range`)
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

console.log(`bodies=${bodies.size} (planet files=${planetFiles.length}, stations=${stations.length})`)
console.log(`characters=${characters.length}, media=${media.length}, eras=${eras.length}, regions=${regions.length}, factions=${factions.length}`)
console.log(`\nERRORS: ${errors.length}`)
for (const e of errors) console.log('  ✗ ' + e)
console.log(`WARNINGS: ${warnings.length}`)
for (const w of warnings) console.log('  ~ ' + w)
process.exit(errors.length ? 1 : 0)
