// What a crawler gets before any JavaScript runs. These pages are written by
// scripts/build-static-meta.mjs into dist/, so the assertions here are about the
// real build artifact, fetched without a browser rendering it.
//
// The archive is bilingual on one address: language lives in localStorage, not
// in the URL. That is why the tags are Turkish (a first visit has nothing
// stored and renders Turkish) and why there is no hreflang — hreflang needs one
// URL per language, and there is one URL per record.

import { expect, test } from '@playwright/test'

const SITE = 'https://galactic-archives.vercel.app'

interface LdNode {
  '@type': string
  [key: string]: unknown
}
interface LdThing {
  '@type': string
  sameAs: string
}

const jsonLd = (html: string) => {
  const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  expect(raw, 'the page carries structured data').not.toBeNull()
  return JSON.parse(raw![1]) as { '@graph': LdNode[] }
}

const node = (graph: { '@graph': LdNode[] }, type: string): LdNode => {
  const found = graph['@graph'].find((n) => n['@type'] === type)
  expect(found, `the graph carries a ${type}`).toBeDefined()
  return found!
}

test('a world page states its language, its locale and no alternate it cannot serve', async ({
  request,
}) => {
  const html = await (await request.get('/planet/hoth')).text()

  expect(html).toContain('<html lang="tr">')
  expect(html).toContain('<title>Hoth — Galactic Archives</title>')
  expect(html).toContain(`<link rel="canonical" href="${SITE}/planet/hoth" />`)
  expect(html).toContain('<meta property="og:locale" content="tr_TR" />')
  expect(html).toContain('<meta property="og:locale:alternate" content="en_US" />')
  expect(html).not.toMatch(/hreflang/)
  // the description is Turkish and cut on a word boundary, not mid-word
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? ''
  expect(description).toContain('Echo Base')
  expect(description).not.toMatch(/\w…$/)
})

test('a world page describes itself as a fictional thing, not a real place', async ({ request }) => {
  const graph = jsonLd(await (await request.get('/planet/hoth')).text())

  const page = node(graph, 'WebPage')
  expect(page.url).toBe(`${SITE}/planet/hoth`)
  expect(page.inLanguage).toBe('tr')

  // Place would tell a crawler Hoth exists; Thing plus the article it was
  // written from is the claim this archive can actually make
  const about = page.about as LdThing
  expect(about['@type']).toBe('Thing')
  expect(about.sameAs).toBe('https://starwars.fandom.com/wiki/Hoth')

  const site = node(graph, 'WebSite')
  expect(site.inLanguage).toEqual(['tr', 'en'])

  const crumbs = node(graph, 'BreadcrumbList').itemListElement as { name: string }[]
  expect(crumbs.map((crumb) => crumb.name)).toEqual([
    'Galactic Archives',
    'Galaksi Haritası',
    'Hoth',
  ])
})

test('a character record cites the article it was written from', async ({ request }) => {
  const graph = jsonLd(await (await request.get('/holocron/character/luke-skywalker')).text())
  const about = node(graph, 'WebPage').about as LdThing

  expect(about['@type']).toBe('Thing')
  expect(about.sameAs).toBe('https://starwars.fandom.com/wiki/Luke_Skywalker')
})

// These three were in the sitemap while their canonical still pointed at the
// front door, so a crawler was told they were the same page.
for (const [path, title] of [
  ['/galaxy', 'Galaksi Haritası'],
  ['/holocron', 'Holocron'],
  ['/compare', 'Karşılaştırma'],
] as const) {
  test(`${path} is its own page, not the front door`, async ({ request }) => {
    const html = await (await request.get(path)).text()

    expect(html).toContain(`<title>${title} — Galactic Archives</title>`)
    expect(html).toContain(`<link rel="canonical" href="${SITE}${path}" />`)
    expect(node(jsonLd(html), 'WebPage').url).toBe(`${SITE}${path}`)
  })
}
