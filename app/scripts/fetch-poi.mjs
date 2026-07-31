// Points-of-interest research pipeline, step 1: for every body in the archive,
// pull the canon location articles Wookieepedia files under that body, and
// check every article this repo already cites for a point of interest.
//
// A body's locations live in `Category:<article> locations`, where <article> is
// the body's own source article (src/data/sources.json) with any `/Legends`
// suffix dropped — Wookieepedia files both continuities of a world under one
// locations category. Which continuity a location belongs to is recorded per
// candidate, because this archive carries Legends worlds (Korriban, Taris,
// Manaan and the rest) alongside canon ones and a pin must not cross over.
//
// A handful of bodies have no locations category at all; for those the
// candidates come from an `intitle:` search instead, which is weaker evidence
// and marked as such.
//
// The digest is the reference used while authoring a point of interest — the
// place must exist in canon before it gets a pin. It is NOT shipped with the
// app; the slim snapshot committed under test/fixtures/ (scripts/slim-poi.mjs)
// is what CI reads offline.
//
// Usage: node scripts/fetch-poi.mjs <output-file.json>

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'src/data')

const OUT = process.argv[2]
if (!OUT) {
  console.error('Usage: node scripts/fetch-poi.mjs <output-file.json>')
  process.exit(1)
}

const API = 'https://starwars.fandom.com/api.php'
const UA = 'GalacticArchives-research/1.0 (non-commercial fan project; data verification)'

const load = (p) => JSON.parse(readFileSync(join(DATA, p), 'utf8'))

/** every body in the archive, moons and stations included, in file order */
function allBodies() {
  const bodies = []
  const collect = (body) => {
    bodies.push(body)
    for (const moon of body.moonsDetail ?? []) collect(moon)
  }
  for (const file of readdirSync(join(DATA, 'planets')).filter((f) => f.endsWith('.json'))) {
    collect(JSON.parse(readFileSync(join(DATA, 'planets', file), 'utf8')))
  }
  for (const station of load('stations.json')) collect(station)
  return bodies
}

async function api(params) {
  const url = new URL(API)
  for (const [k, v] of Object.entries({ format: 'json', ...params })) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.searchParams.get('action')} ${JSON.stringify(params).slice(0, 120)}`)
  const json = await res.json()
  if (json.error) throw new Error(`API ${json.error.code}: ${json.error.info}`)
  await new Promise((r) => setTimeout(r, 150))
  return json
}

/** locations categories that do not follow `<article> locations`. Both battle
 *  stations need one: `Category:Death Star locations` holds a subcategory per
 *  station, so following it would file the second Death Star's rooms on the
 *  first. */
const CATEGORY_ALIAS = {
  'death-star': 'DS-1 Orbital Battle Station locations',
  'death-star-2': 'Death Star II locations',
}

async function categoryMembers(category) {
  const json = await api({ action: 'query', list: 'categorymembers', cmtitle: `Category:${category}`, cmlimit: '500' })
  // `<page>/Legends` counterparts stay in: a Legends world's places are filed
  // there, and this archive carries Legends worlds
  return (json.query?.categorymembers ?? []).map((m) => m.title).filter((t) => !t.startsWith('Category:'))
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, (i + 1) * n))

/** resolve titles and tell canon from Legends. Asking for exactly the two
 *  continuity categories keeps the reply one page per batch. */
async function resolve(titles) {
  const out = new Map()
  for (const batch of chunk(titles, 50)) {
    const json = await api({
      action: 'query',
      prop: 'categories',
      clcategories: 'Category:Canon articles|Category:Legends articles',
      cllimit: 'max',
      redirects: '1',
      titles: batch.join('|'),
    })
    const query = json.query ?? {}
    const redirected = new Map((query.redirects ?? []).map((r) => [r.from, r.to]))
    const normalized = new Map((query.normalized ?? []).map((n) => [n.from, n.to]))
    const byTitle = new Map(Object.values(query.pages ?? {}).map((p) => [p.title, p]))
    for (const asked of batch) {
      const resolved = redirected.get(normalized.get(asked) ?? asked) ?? normalized.get(asked) ?? asked
      const page = byTitle.get(resolved)
      const cats = (page?.categories ?? []).map((c) => c.title)
      out.set(asked, {
        title: resolved,
        missing: page?.missing !== undefined,
        canon: cats.includes('Category:Canon articles'),
        legends: cats.includes('Category:Legends articles'),
        ...(resolved !== asked ? { redirectedFrom: asked } : {}),
      })
    }
  }
  return out
}

/** last resort for a body with no locations category: pages whose title names
 *  the body. Weaker than a category — nothing says these are places — so
 *  callers mark what came from here. Wookieepedia's search ignores `intitle:`,
 *  hence the full-text search narrowed by title afterwards. */
async function titleSearch(article) {
  const json = await api({ action: 'query', list: 'search', srsearch: article, srlimit: '50' })
  return (json.query?.search ?? [])
    .map((r) => r.title)
    .filter((t) => t !== article && !t.endsWith('/Legends') && t.includes(article))
}

/** wikitext markup down to readable prose (same shape as fetch-lore.mjs, which
 *  reads infobox values rather than body text) */
function cleanWikitext(raw) {
  return raw
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\{\{[\s\S]*?^\}\}/gm, '') // infobox and other block templates
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** lead section of each article — the text a blurb has to stay true to.
 *  Wookieepedia does not run TextExtracts, so this reads section 0 wikitext. */
async function intros(titles) {
  const out = new Map()
  for (const batch of chunk(titles, 20)) {
    const json = await api({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      rvsection: '0',
      redirects: '1',
      titles: batch.join('|'),
    })
    for (const page of Object.values(json.query?.pages ?? {})) {
      const wikitext = page.revisions?.[0]?.slots?.main?.['*']
      if (!wikitext) continue
      const prose = cleanWikitext(wikitext)
      if (prose) out.set(page.title, prose.slice(0, 600))
    }
  }
  return out
}

const digest = { fetchedAt: new Date().toISOString(), bodies: {}, cited: {}, errors: [] }

const sources = load('sources.json')
const bodies = allBodies()

// ---- what this archive already cites -----------------------------------------
const citedTitles = new Set()
for (const body of bodies) {
  for (const poi of body.poi ?? []) {
    if (poi.source?.startsWith('wookieepedia:')) citedTitles.add(poi.source.slice('wookieepedia:'.length))
  }
}
console.log(`resolving ${citedTitles.size} cited articles`)
for (const [asked, info] of await resolve([...citedTitles])) digest.cited[asked] = info

// ---- what canon files under each body ----------------------------------------
const candidateTitles = new Set()
for (const body of bodies) {
  const source = sources.entities?.[body.id]?.source
  if (!source?.startsWith('wookieepedia:')) {
    digest.bodies[body.id] = { unsourced: true }
    console.log(`SKIP     ${body.id} (no source article to build a category name from)`)
    continue
  }
  const article = source.slice('wookieepedia:'.length)
  // one locations category serves both continuities of a world
  const base = article.replace(/\/Legends$/, '')
  const category = CATEGORY_ALIAS[body.id] ?? `${base} locations`
  try {
    let members = await categoryMembers(category)
    let via = `Category:${category}`
    if (!members.length) {
      members = await titleSearch(base)
      via = `search:"${base}"`
    }
    digest.bodies[body.id] = { title: article, via, candidates: members.map((title) => ({ title })) }
    for (const title of members) candidateTitles.add(title)
    console.log(`${String(members.length).padStart(3)}      ${body.id} <- ${via}`)
  } catch (err) {
    digest.errors.push({ id: body.id, category, error: String(err) })
    console.error(`ERROR    ${body.id}: ${err}`)
  }
}

// ---- continuity + intro text for every candidate ------------------------------
console.log(`\nresolving ${candidateTitles.size} candidate articles`)
const resolved = await resolve([...candidateTitles])
// a page in neither continuity category is a stub or a disambiguation, not a place
const placed = [...candidateTitles].filter((t) => resolved.get(t)?.canon || resolved.get(t)?.legends)
console.log(`in a continuity: ${placed.length}, reading intros`)
const lead = await intros(placed)

for (const entry of Object.values(digest.bodies)) {
  if (!entry.candidates) continue
  entry.candidates = entry.candidates
    .map(({ title }) => {
      const info = resolved.get(title)
      const resolvedTitle = info?.title ?? title
      return {
        title: resolvedTitle,
        continuity: info?.canon ? 'canon' : info?.legends ? 'legends' : 'unknown',
        intro: lead.get(resolvedTitle) ?? '',
      }
    })
    .filter((c) => c.continuity !== 'unknown')
}

writeFileSync(OUT, JSON.stringify(digest, null, 1))
const covered = Object.values(digest.bodies).filter((b) => b.candidates?.length).length
console.log(`\nDigest written: ${OUT}`)
console.log(`bodies=${bodies.length} with canon location articles=${covered} cited=${citedTitles.size} errors=${digest.errors.length}`)
