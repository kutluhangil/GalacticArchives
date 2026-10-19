// Build-output budget. Chunk sizes are the one performance property that can
// only be measured after `vite build`, so this runs on dist/ rather than in the
// unit suite. It also asserts the split that keeps three.js and the KTX2
// transcoder off the first paint — the property those chunks exist for.
//
// Usage: node scripts/check-bundle-budget.mjs   (requires a completed build)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const ASSETS = join(DIST, 'assets')

if (!existsSync(ASSETS)) {
  console.error(`No build output at ${DIST}. Run "npm run build" first.`)
  process.exit(1)
}

// raw (uncompressed) bytes, with ~8% headroom over the sizes at the time these
// were set. A deliberate increase means moving the number here in the same
// commit, which is the point: the budget change becomes reviewable.
const BUDGETS = [
  // adjusted to 665,000 for interactive 3D starship tactical inspection models
  { name: 'three vendor chunk', pattern: /^three-.*\.js$/, max: 665_000 },
  // dropped from 360,000 when the tour player moved behind its own host: it
  // reached lib/lore for names, which statically carries the station, era,
  // region, faction and production tables, none of which a first paint needs
  { name: 'entry chunk', pattern: /^index-.*\.js$/, max: 330_000 },
  // raised from 48,000 when the Timeline, Force, Watch Guide and Hangar routes
  // landed: five new pages' Tailwind utilities are a real, wanted increase, and
  // first paint stays inside its own 400,000 ceiling. Raised again to 84,000
  // for Tailwind 4, and 86,000 for 3D starship tactical dossier modal styling.
  { name: 'entry stylesheet', pattern: /^index-.*\.css$/, max: 86_000 },
  { name: 'KTX2 transcoder chunk', pattern: /^KTX2Loader-.*\.js$/, max: 40_000 },
  // rides along on every route, so it is the easiest place to accidentally put
  // a panel nobody opened — the five tool modals are lazy for that reason
  { name: 'top bar chunk', pattern: /^TopBar-.*\.js$/, max: 22_000 },
  { name: 'planet route chunk', pattern: /^PlanetView-.*\.js$/, max: 40_000 },
  // provenance for every body and character; shared by the planet HUD and the
  // Holocron, and easy to grow without noticing — see scripts/sync-sources.mjs
  { name: 'sources chunk', pattern: /^sources-.*\.js$/, max: 24_000 },
  // the charted hyperlanes and their stops; loaded with the galaxy map only
  { name: 'routes chunk', pattern: /^routes-.*\.js$/, max: 26_000 },
]

const files = readdirSync(ASSETS)
const errors = []
const report = []

for (const budget of BUDGETS) {
  const matches = files.filter((f) => budget.pattern.test(f))
  if (matches.length !== 1) {
    errors.push(
      `${budget.name}: expected exactly 1 file matching ${budget.pattern}, found ${matches.length} (${matches.join(', ') || 'none'})`,
    )
    continue
  }
  const bytes = statSync(join(ASSETS, matches[0])).size
  report.push(`${budget.name.padEnd(24)} ${String(bytes).padStart(8)} / ${budget.max} bytes`)
  if (bytes > budget.max) {
    errors.push(
      `${budget.name} is ${bytes} bytes, over its ${budget.max} budget by ${bytes - budget.max} (${matches[0]})`,
    )
  }
}

// --- first-paint split ---------------------------------------------------
const html = readFileSync(join(DIST, 'index.html'), 'utf8')

if (/three-[^"']*\.js/.test(html)) {
  errors.push('index.html loads the three chunk on first paint — the engine routes must stay lazy')
}
if (/KTX2Loader-[^"']*\.js/.test(html)) {
  errors.push('index.html loads the KTX2 transcoder on first paint — it belongs to a dynamic import')
}

const entryJs = files.find((f) => /^index-.*\.js$/.test(f))
const entryCss = files.find((f) => /^index-.*\.css$/.test(f))
const firstPaint =
  Buffer.byteLength(html) +
  (entryJs ? statSync(join(ASSETS, entryJs)).size : 0) +
  (entryCss ? statSync(join(ASSETS, entryCss)).size : 0)
const FIRST_PAINT_MAX = 390_000
report.push(`${'first paint total'.padEnd(24)} ${String(firstPaint).padStart(8)} / ${FIRST_PAINT_MAX} bytes`)
if (firstPaint > FIRST_PAINT_MAX) {
  errors.push(`first paint payload is ${firstPaint} bytes, over its ${FIRST_PAINT_MAX} budget`)
}

// --- generated assets the shell and share cards depend on ----------------
for (const asset of [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'og/default.png',
  'manifest.webmanifest',
  'sitemap.xml',
  'robots.txt',
]) {
  if (!existsSync(join(DIST, asset))) errors.push(`missing generated asset: dist/${asset}`)
}

const planets = readdirSync(join(ROOT, 'src/data/planets'))
  .filter((f) => f.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(ROOT, 'src/data/planets', file), 'utf8')))
const stations = JSON.parse(readFileSync(join(ROOT, 'src/data/stations.json'), 'utf8'))
const characters = JSON.parse(readFileSync(join(ROOT, 'src/data/characters.json'), 'utf8'))
const bodyCount = planets.length + planets.flatMap((planet) => planet.moonsDetail ?? []).length + stations.length
const expectedOgCount = bodyCount + characters.length + 1
const ogCount = readdirSync(join(DIST, 'og')).filter((f) => f.endsWith('.png')).length
report.push(`${'og cards'.padEnd(24)} ${String(ogCount).padStart(8)} for ${bodyCount} bodies + ${characters.length} characters + default`)
if (ogCount !== expectedOgCount) {
  errors.push(`og cards: ${ogCount} png files (expected ${expectedOgCount}: ${bodyCount} bodies, ${characters.length} characters and default.png)`)
}

for (const line of report) console.log('  ' + line)
console.log(`\nERRORS: ${errors.length}`)
for (const e of errors) console.log('  ✗ ' + e)
process.exit(errors.length ? 1 : 0)
