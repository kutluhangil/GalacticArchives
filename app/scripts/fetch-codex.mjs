// Codex citation pipeline: verify the Wookieepedia article every starship,
// battle, Force power, timeline event, watch-guide entry and transmission is
// written from, and write the slim snapshot CI reads offline.
//
// These six files arrived without citations, unlike the bodies and characters
// whose provenance sync-sources.mjs has always tracked. A record whose article
// cannot be pointed at is a claim this archive cannot stand behind, and the
// CC BY-SA attribution has nothing to attach to either.
//
// What the snapshot keeps per cited article: whether Wookieepedia has it, which
// continuity it belongs to, and the title it resolves to when the citation is a
// redirect — a redirect is not an error, but the record should say so.
//
// Usage: node scripts/fetch-codex.mjs [out.json]
//        (default out: test/fixtures/codex-digest.json)

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'src/data')
const OUT = process.argv[2] ?? join(ROOT, 'test/fixtures/codex-digest.json')

const API = 'https://starwars.fandom.com/api.php'
const UA = 'GalacticArchives-research/1.0 (non-commercial fan project; data verification)'

/** the files whose records must each carry a `source` */
export const CODEX_FILES = [
  'starships.json',
  'battles.json',
  'force-powers.json',
  'timeline.json',
  'watch-guide.json',
  'transmissions.json',
]

const load = (p) => JSON.parse(readFileSync(join(DATA, p), 'utf8'))

const cited = new Set()
for (const file of CODEX_FILES) {
  for (const record of load(file)) {
    if (!record.source) throw new Error(`${file}: record "${record.id}" carries no source`)
    cited.add(record.source.replace(/^wookieepedia:/, ''))
  }
}

async function api(params) {
  const url = new URL(API)
  for (const [k, v] of Object.entries({ format: 'json', ...params })) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const json = await res.json()
  if (json.error) throw new Error(`API ${json.error.code}: ${json.error.info}`)
  await new Promise((r) => setTimeout(r, 150))
  return json
}

const chunk = (items, size) =>
  items.reduce((out, item, i) => (i % size ? out[out.length - 1].push(item) : out.push([item]), out), [])

const articles = {}
for (const batch of chunk([...cited].sort((a, b) => a.localeCompare(b)), 40)) {
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
    if (!page || page.missing !== undefined) {
      articles[asked] = { missing: true }
      console.log(`MISSING  ${asked}`)
      continue
    }
    const cats = (page.categories ?? []).map((c) => c.title)
    articles[asked] = {
      continuity: cats.includes('Category:Canon articles')
        ? 'canon'
        : cats.includes('Category:Legends articles')
          ? 'legends'
          : 'unstated',
      ...(resolved !== asked ? { resolvesTo: resolved } : {}),
    }
    console.log(`ok       ${asked}${resolved !== asked ? ` -> ${resolved}` : ''} (${articles[asked].continuity})`)
  }
}

const snapshot = {
  note: 'Slim snapshot of the Wookieepedia articles the codex records (starships, battles, Force powers, timeline events, watch-guide entries, transmissions) are written from, so validate-lore can check every citation resolves — and in the continuity the record claims — without going online. Facts are not copyrightable; source Wookieepedia CC BY-SA. Rebuild: node scripts/fetch-codex.mjs',
  articles: Object.fromEntries(Object.entries(articles).sort(([a], [b]) => a.localeCompare(b))),
}
writeFileSync(OUT, JSON.stringify(snapshot, null, 1) + '\n')

const missing = Object.values(articles).filter((a) => a.missing).length
console.log(`\nSnapshot written: ${OUT}`)
console.log(`cited articles=${Object.keys(articles).length} missing=${missing}`)
process.exit(missing ? 1 : 0)
