// Hyperlane pipeline, step 1: pull the canon super-hyperroutes from the
// Wookieepedia MediaWiki API and write a route digest.
//
// A lane article carries a {{TradeRoute}} infobox whose `endpoints` and
// `otherobjects` params list the lane's stops in travel order, core-ward end
// first. Each stop is then resolved on its own article for the Standard
// Galactic Grid cell, which is what places the lane on the disk.
//
// A stop whose own article states no grid cell is dropped and reported: the
// lane geometry is drawn through canon coordinates only, so a stop we cannot
// place would either invent a position or bend the lane through nothing.
//
// Usage: node scripts/fetch-routes.mjs <output-file.json>

const OUT = process.argv[2]
if (!OUT) {
  console.error('Usage: node scripts/fetch-routes.mjs <output-file.json>')
  process.exit(1)
}

const API = 'https://starwars.fandom.com/api.php'
const UA = 'GalacticArchives-research/1.0 (non-commercial fan project; data verification)'

/**
 * The lanes this archive charts, id -> article title.
 *
 * Two rules decided this list, and both are checked again by validate-lore:
 * a lane needs at least two placeable stops (one stop draws no line), and it
 * has to share a stop with the rest of the network (a lane the planner can
 * never route onto is a decoration). Canon lanes that fail those — Ootmian
 * Pabol, the Daragon Trail, the Harrin Trade Corridor and a dozen others —
 * are charted nowhere near the worlds this archive ships and were left out
 * rather than drawn as islands.
 */
const ROUTES = {
  // the four great lanes that frame the canon disk
  'perlemian-trade-route': 'Perlemian Trade Route',
  'corellian-run': 'Corellian Run',
  'hydian-way': 'Hydian Way',
  'rimma-trade-route': 'Rimma Trade Route',
  // major connecting routes
  'corellian-trade-spine': 'Corellian Trade Spine',
  'triellus-trade-route': 'Triellus Trade Route',
  'namadii-corridor': 'Namadii Corridor',
  'salin-corridor': 'Salin Corridor',
  'pabol-sleheyron': 'Pabol Sleheyron',
  'lipsec-run': 'Lipsec Run',
  'entralla-route': 'Entralla Route',
  "shipwrights-trace": "Shipwrights' Trace",
  'great-gran-run': 'Great Gran Run',
  'celanon-spur': 'Celanon Spur',
  // short runs and spurs that put a shipped world on the network
  'metellos-trade-route': 'Metellos Trade Route',
  'enarc-run': 'Enarc Run',
  'death-wind-corridor': 'Death Wind Corridor',
  'sanctuary-pipeline': 'Sanctuary Pipeline',
  'five-veils-route': 'Five Veils Route',
  'overic-griplink': 'Overic Griplink',
  'kessel-run': 'Kessel Run',
  'listehol-run': 'Listehol Run',
  'shwuy-exchange': 'Shwuy Exchange',
}

/** Strip citation markup before reading a field: a <ref> body is full of
 *  article links (source books, notes) that are not stops on the lane. */
function stripRefs(raw) {
  return raw.replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
}

function infoboxField(wikitext, name) {
  const re = new RegExp(`^\\|${name}\\s*=([\\s\\S]*?)(?=^\\|[a-z_]+\\s*=|^\\}\\})`, 'mi')
  return stripRefs(wikitext.match(re)?.[1] ?? '')
}

/** [[Target|shown]] -> {target, label}, skipping file/category plumbing */
function wikiLinks(raw) {
  const out = []
  for (const m of raw.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
    const target = m[1].trim()
    if (/^(File|Image|Category|Template):/i.test(target)) continue
    out.push({ target, label: (m[2] ?? m[1]).trim() })
  }
  return out
}

/** Standard Galactic Grid cell as the stop's own infobox states it */
function gridCoordinates(wikitext) {
  const raw = infoboxField(wikitext, 'coordinates')
  const m = raw.match(/\b([A-V])-(\d{1,2})\b/)
  if (!m) return null
  const num = parseInt(m[2], 10)
  return num >= 1 && num <= 21 ? `${m[1]}-${num}` : null
}

/** first real paragraph of the article — the reference the lane's authored
 *  blurb is written from, kept in the digest and not shipped */
function extractIntro(wikitext) {
  const lines = wikitext.replace(/<!--[\s\S]*?-->/g, '').split('\n')
  let depth = 0
  for (const line of lines) {
    depth += (line.match(/\{\{/g) || []).length
    depth -= (line.match(/\}\}/g) || []).length
    if (depth <= 0 && /^[A-Z"'[]/.test(line.trim()) && line.trim().length > 80) {
      return stripRefs(line)
        .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
        .replace(/'''?/g, '')
        .replace(/\{\{[^}]*\}\}/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 600)
    }
  }
  return ''
}

/** distance between two grid cells, in cells — used only to decide which end
 *  of a lane an endpoint belongs to */
function gridDistance(a, b) {
  const cell = (g) => {
    const [letter, num] = g.split('-')
    return { col: letter.charCodeAt(0) - 65, row: parseInt(num, 10) - 1 }
  }
  const x = cell(a)
  const y = cell(b)
  return Math.hypot(x.col - y.col, x.row - y.row)
}

async function fetchPage(title) {
  const url = `${API}?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1&titles=${encodeURIComponent(title)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for "${title}"`)
  const json = await res.json()
  const pages = json?.query?.pages
  if (!pages) throw new Error(`No pages in response for "${title}"`)
  const page = Object.values(pages)[0]
  if (page.missing !== undefined) return { missing: true }
  const wikitext = page.revisions?.[0]?.slots?.main?.['*']
  if (!wikitext) throw new Error(`No wikitext for "${title}"`)
  return { missing: false, resolvedTitle: page.title, wikitext }
}

/** one lookup per article across every lane that names it */
const stopCache = new Map()
async function resolveStop(target) {
  if (stopCache.has(target)) return stopCache.get(target)
  let resolved = null
  try {
    const page = await fetchPage(target)
    if (!page.missing) {
      resolved = { title: page.resolvedTitle, coordinates: gridCoordinates(page.wikitext) }
    }
  } catch (err) {
    resolved = { error: String(err) }
  }
  stopCache.set(target, resolved)
  await new Promise((r) => setTimeout(r, 120))
  return resolved
}

const digest = { fetchedAt: new Date().toISOString(), routes: {}, errors: [] }

for (const [id, title] of Object.entries(ROUTES)) {
  let page
  try {
    page = await fetchPage(title)
  } catch (err) {
    digest.errors.push({ id, title, error: String(err) })
    console.error(`ERROR    ${id}: ${err}`)
    continue
  }
  if (page.missing) {
    digest.routes[id] = { title, missing: true }
    console.log(`MISSING  ${id} (${title})`)
    continue
  }

  const unplaced = []
  /** resolve a link list to placeable stops, preserving order and dropping
   *  repeats within the list */
  const placeable = async (raw) => {
    const out = []
    const seen = new Set()
    for (const link of wikiLinks(raw)) {
      const stop = await resolveStop(link.target)
      if (!stop || stop.error) {
        unplaced.push({ label: link.label, reason: stop?.error ?? 'no such article' })
        continue
      }
      if (!stop.coordinates) {
        unplaced.push({ label: link.label, title: stop.title, reason: 'no grid coordinates' })
        continue
      }
      if (seen.has(stop.title)) continue
      seen.add(stop.title)
      out.push({ title: stop.title, label: link.label, coordinates: stop.coordinates })
    }
    return out
  }

  // `otherobjects` is the lane walked in order; `endpoints` names its two ends
  // and is almost always a subset of it. Concatenating the two would splice a
  // far endpoint in beside the near one and invent a leg across the galaxy, so
  // the walk is the spine and a missing end is attached to the side it is
  // nearer to.
  const spine = await placeable(infoboxField(page.wikitext, 'otherobjects'))
  const ends = await placeable(infoboxField(page.wikitext, 'endpoints'))
  const stops = spine.length ? spine : ends
  if (spine.length) {
    for (const end of ends) {
      if (spine.some((s) => s.title === end.title)) continue
      const toHead = gridDistance(end.coordinates, stops[0].coordinates)
      const toTail = gridDistance(end.coordinates, stops[stops.length - 1].coordinates)
      if (toHead <= toTail) stops.unshift(end)
      else stops.push(end)
    }
  }

  digest.routes[id] = {
    title: page.resolvedTitle,
    intro: extractIntro(page.wikitext),
    regions: wikiLinks(infoboxField(page.wikitext, 'regions')).map((l) => l.label),
    junctions: wikiLinks(infoboxField(page.wikitext, 'junctions')).map((l) => l.label),
    stops,
    unplaced,
  }
  console.log(
    `ok       ${id.padEnd(24)} stops=${String(stops.length).padStart(2)} unplaced=${unplaced.length}`,
  )
}

const { writeFileSync } = await import('node:fs')
writeFileSync(OUT, JSON.stringify(digest, null, 1))

const routeCount = Object.values(digest.routes).filter((r) => !r.missing).length
const stopCount = Object.values(digest.routes).reduce((n, r) => n + (r.stops?.length ?? 0), 0)
const unplacedCount = Object.values(digest.routes).reduce((n, r) => n + (r.unplaced?.length ?? 0), 0)
console.log(`\nDigest written: ${OUT}`)
console.log(`routes=${routeCount} stops=${stopCount} unplaced=${unplacedCount} errors=${digest.errors.length}`)
