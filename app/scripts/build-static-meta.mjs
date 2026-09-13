#!/usr/bin/env node
// Post-build pass that gives a single-page app the static surface crawlers and
// share sheets need:
//
//   dist/og/<id>.png          share card per world, drawn from its own palette
//   dist/planet/<id>/index.html   the SPA shell with that world's meta tags
//   dist/holocron/planet/<id>/index.html   same, for the wiki route
//   dist/sitemap.xml, dist/robots.txt
//   dist/icons/*.png          PWA icons
//
// Vercel serves a matching file before applying the SPA rewrite, so a crawler
// hitting /planet/hoth gets Hoth's tags while the router still takes over in
// the browser.
//
// The tags are Turkish because the app renders Turkish: the language lives in
// localStorage (src/state/app.ts), not in the URL, and a first visit has none
// stored, so Turkish is what a crawler and a first-time reader actually get.
// English is one switch away on the same address, which is what
// og:locale:alternate says. hreflang is deliberately absent — it needs one URL
// per language and there is one URL per record here.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const PLANET_DIR = join(ROOT, 'src', 'data', 'planets')
const STATIONS_FILE = join(ROOT, 'src', 'data', 'stations.json')
const CHARACTERS_FILE = join(ROOT, 'src', 'data', 'characters.json')
const SOURCES_FILE = join(ROOT, 'src', 'data', 'sources.json')
const SECTIONS_FILE = join(ROOT, 'src', 'data', 'sections.json')
const BRAND_DIR = join(ROOT, 'raw', 'brand')
const PORTRAIT_DIR = join(ROOT, 'public', 'portraits')
const SITE = process.env.SITE_URL ?? 'https://galactic-archives.vercel.app'

const shell = readFileSync(join(DIST, 'index.html'), 'utf8')

function requiredAsset(name) {
  const path = join(BRAND_DIR, name)
  if (!existsSync(path)) {
    throw new Error(`static meta: required brand asset is missing: ${path}`)
  }
  return path
}

const planets = readdirSync(PLANET_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(PLANET_DIR, f), 'utf8')))
const stations = JSON.parse(readFileSync(STATIONS_FILE, 'utf8'))
const characters = JSON.parse(readFileSync(CHARACTERS_FILE, 'utf8'))
const sources = JSON.parse(readFileSync(SOURCES_FILE, 'utf8'))

/** the Wookieepedia article a record was written from, as a url. For a
 *  fictional thing that article is the one external identifier this archive can
 *  honestly claim, so it is what `sameAs` points at. */
function articleUrl(id) {
  const entry = sources.entities?.[id]
  if (!entry) throw new Error(`static meta: "${id}" has no entry in sources.json`)
  return (
    entry.url ??
    `https://starwars.fandom.com/wiki/${entry.source.replace(/^wookieepedia:/, '').replace(/ /g, '_')}`
  )
}
const bodies = [...planets, ...planets.flatMap((planet) => planet.moonsDetail ?? []), ...stations]
const bodyIds = new Set()
for (const body of bodies) {
  if (bodyIds.has(body.id)) throw new Error(`static meta: duplicate body id "${body.id}"`)
  bodyIds.add(body.id)
}

/** meta descriptions are cut to length, and a cut lands mid-word often enough
 *  that "İmparatorluk yürüyücüleri sırtı aşa" was shipping as a description.
 *  Trim on the last word boundary instead and say the sentence continues. */
function clamp(text, max) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[ ,;:—-]+$/, '')}…`
}

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** greedy word wrap; the card's text column stops well short of the globe */
function wrap(text, perLine, maxLines) {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > perLine) {
      lines.push(escape(line.trim()))
      line = word
      if (lines.length === maxLines) return [...lines.slice(0, -1), `${lines.at(-1)} …`]
    } else {
      line = `${line} ${word}`
    }
  }
  if (line.trim() && lines.length < maxLines) lines.push(escape(line.trim()))
  return lines
}

/** 1200x630 share card: the world's own palette, its name, its grid square.
 *  Turkish, like the tags around it; `toLocaleUpperCase('tr')` because
 *  `toUpperCase()` turns "İzole" into "IZOLE". */
function ogCard(planet) {
  const { primary, secondary = primary } = planet.renderRecipe.palette
  const name = escape(planet.names.tr.toLocaleUpperCase('tr'))
  const grid = escape(planet.coordinates ?? '')
  const blurb = wrap(planet.desc.tr, 42, 2)
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="world" cx="35%" cy="32%" r="72%">
      <stop offset="0%" stop-color="${secondary}"/>
      <stop offset="62%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="#05070c"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="60%" stop-color="${primary}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#04060a"/>
  <circle cx="880" cy="315" r="290" fill="url(#halo)"/>
  <circle cx="880" cy="315" r="215" fill="url(#world)"/>
  <text x="80" y="150" font-family="Helvetica, Arial, sans-serif" font-size="26"
        letter-spacing="10" fill="#FFE81F">GALACTIC ARCHIVES</text>
  <text x="80" y="270" font-family="Helvetica, Arial, sans-serif" font-size="82"
        letter-spacing="8" fill="#F1F5F9">${name}</text>
  <text x="80" y="322" font-family="Helvetica, Arial, sans-serif" font-size="24"
        letter-spacing="6" fill="#66D9FF">${grid}</text>
  ${blurb
    .map(
      (line, i) =>
        `<text x="80" y="${400 + i * 38}" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#94A3B8">${line}</text>`,
    )
    .join('\n  ')}
</svg>`)
}

async function characterOgCard(character) {
  const portrait = join(PORTRAIT_DIR, `${character.id}.webp`)
  if (!existsSync(portrait)) {
    throw new Error(`static meta: required character portrait is missing: ${portrait}`)
  }
  const name = escape(character.names.tr.toLocaleUpperCase('tr'))
  const bio = wrap(character.bio.tr, 54, 2)
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="shade" x1="0" x2="1"><stop stop-color="#04060a" stop-opacity="0.98"/><stop offset="0.62" stop-color="#04060a" stop-opacity="0.72"/><stop offset="1" stop-color="#04060a" stop-opacity="0.06"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <text x="72" y="126" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="9" fill="#FFE81F">GALACTIC ARCHIVES</text>
  <text x="72" y="254" font-family="Helvetica, Arial, sans-serif" font-size="64" letter-spacing="5" fill="#F1F5F9">${name}</text>
  <text x="72" y="310" font-family="Helvetica, Arial, sans-serif" font-size="21" letter-spacing="4" fill="#66D9FF">KARAKTER KAYDI</text>
  ${bio.map((line, i) => `<text x="72" y="${390 + i * 34}" font-family="Helvetica, Arial, sans-serif" font-size="23" fill="#CBD5E1">${line}</text>`).join('\n  ')}
</svg>`)
  return sharp(portrait).resize(1200, 630, { fit: 'cover', position: 'right' }).composite([{ input: overlay }]).png()
}

// One table for the archive's own sections, shared with the running app
// (src/lib/sections.ts): a renamed section has to reach the menu and the tab
// title together. The descriptions here are Turkish only — see the note at the
// top of this file; the app never renders them.
const SECTION_META = JSON.parse(readFileSync(SECTIONS_FILE, 'utf8'))
const SITE_NAME = SECTION_META.siteName
const SITE_DESCRIPTION = SECTION_META.home.description

/** Structured data for one page.
 *
 *  A record here is a fictional thing, so `about` is typed `Thing` — never
 *  `Place` or `Person`. Those types describe entities that exist, and telling a
 *  crawler that Hoth is a real place is the kind of claim the rest of this
 *  archive refuses to make. `sameAs` carries the Wookieepedia article the record
 *  was written from, which is the identifier that is actually true.
 */
function structuredData({ title, description, path, image, about, breadcrumb }) {
  const url = `${SITE}${path}`
  const webPage = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'tr',
    isPartOf: { '@id': `${SITE}/#website` },
    primaryImageOfPage: `${SITE}${image}`,
  }
  if (breadcrumb) webPage.breadcrumb = { '@id': `${url}#breadcrumb` }
  if (about) webPage.about = { '@type': 'Thing', ...about }

  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: ['tr', 'en'],
    },
    webPage,
  ]
  if (breadcrumb) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: breadcrumb.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.name,
        item: `${SITE}${crumb.path}`,
      })),
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

function page({ title, description, path, image, about, breadcrumb }) {
  // a literal `<` inside the JSON would end the script element early
  const jsonLd = JSON.stringify(
    structuredData({ title, description, path, image, about, breadcrumb }),
  ).replace(/</g, '\\u003c')
  const tags = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    `<link rel="canonical" href="${SITE}${path}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${SITE}${path}" />`,
    `<meta property="og:image" content="${SITE}${image}" />`,
    // one address serves both languages — the reader switches in place — so the
    // page states which language it is written in and which one it also offers
    `<meta property="og:locale" content="tr_TR" />`,
    `<meta property="og:locale:alternate" content="en_US" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ')
  // strip every tag this page is about to define; two og:image tags means the
  // crawler picks the site-wide card instead of the world's own
  return shell
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/[ \t]*<meta\s+name="description"[\s\S]*?\/>\n?/, '')
    .replace(/[ \t]*<meta\s+property="og:(?!site_name)[\s\S]*?\/>\n?/g, '')
    .replace(/[ \t]*<meta\s+name="twitter:[\s\S]*?\/>\n?/g, '')
    .replace(/[ \t]*<link\s+rel="canonical"[\s\S]*?\/>\n?/, '')
    .replace(/[ \t]*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
    .replace('</head>', `  ${tags}\n  </head>`)
}

// both shapes: hosts differ on whether /planet/hoth resolves to hoth.html or
// hoth/index.html, and an extra 4 kB per world is cheaper than guessing wrong
function writePage(routePath, html) {
  const relative = routePath.replace(/^\//, '')
  mkdirSync(join(DIST, relative), { recursive: true })
  writeFileSync(join(DIST, relative, 'index.html'), html)
  writeFileSync(join(DIST, `${relative}.html`), html)
}

const urls = []
const ROOT_CRUMB = { name: SITE_NAME, path: '/' }

// The front door is generated like every other page, so the structured data has
// one shape written in one place.
writeFileSync(
  join(DIST, 'index.html'),
  page({
    title: SECTION_META.home.title.tr,
    description: SITE_DESCRIPTION,
    path: '/',
    image: '/og/default.png',
  }),
)
urls.push('/')

// The archive sections have no per-record page of their own, so they get one
// static page each: without it a crawler sees only the SPA shell's site-wide
// title, and /galaxy, /holocron and /compare were in the sitemap while their
// canonical still pointed at the front door.
const sections = SECTION_META.sections.map((section) => ({
  path: section.path,
  name: section.name.tr,
  description: section.description,
}))

for (const section of sections) {
  writePage(
    section.path,
    page({
      title: `${section.name} — ${SITE_NAME}`,
      description: section.description,
      path: section.path,
      image: '/og/default.png',
      breadcrumb: [ROOT_CRUMB, { name: section.name, path: section.path }],
    }),
  )
  urls.push(section.path)
}

for (const body of bodies) {
  const name = body.names.tr
  const description = clamp(body.desc.tr, 180)
  const image = `/og/${body.id}.png`
  const about = { name, description, sameAs: articleUrl(body.id) }

  mkdirSync(join(DIST, 'og'), { recursive: true })
  await sharp(ogCard(body)).png().toFile(join(DIST, 'og', `${body.id}.png`))

  // the same record under the map and under the wiki; each says where it sits
  for (const [route, parent] of [
    [`/planet/${body.id}`, { name: 'Galaksi Haritası', path: '/galaxy' }],
    [`/holocron/planet/${body.id}`, { name: 'Holocron', path: '/holocron' }],
  ]) {
    writePage(
      route,
      page({
        title: `${name} — ${SITE_NAME}`,
        description,
        path: route,
        image,
        about,
        breadcrumb: [ROOT_CRUMB, parent, { name, path: route }],
      }),
    )
    urls.push(route)
  }
}

for (const character of characters) {
  const image = `/og/character-${character.id}.png`
  await (await characterOgCard(character)).toFile(join(DIST, 'og', `character-${character.id}.png`))
  const route = `/holocron/character/${character.id}`
  const name = character.names.tr
  const description = clamp(character.bio.tr, 180)
  writePage(
    route,
    page({
      title: `${name} — ${SITE_NAME}`,
      description,
      path: route,
      image,
      about: { name, description, sameAs: articleUrl(character.id) },
      breadcrumb: [ROOT_CRUMB, { name: 'Holocron', path: '/holocron' }, { name, path: route }],
    }),
  )
  urls.push(route)
}

// Site-wide card: generated art is the background and the build owns readable,
// deterministic text instead of asking an image model to typeset it.
const defaultOgText = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <text x="72" y="248" font-family="Helvetica, Arial, sans-serif"
        font-size="58" font-weight="700" letter-spacing="10" fill="#FFE81F">GALACTIC</text>
  <text x="72" y="318" font-family="Helvetica, Arial, sans-serif"
        font-size="58" font-weight="700" letter-spacing="10" fill="#FFE81F">ARCHIVES</text>
  <text x="76" y="374" font-family="Helvetica, Arial, sans-serif"
        font-size="24" letter-spacing="4" fill="#C8D1DC">ETKİLEŞİMLİ BİR GALAKSİ ATLASI</text>
</svg>`)
await sharp(requiredAsset('og-default.png'))
  .composite([{ input: defaultOgText }])
  .png()
  .toFile(join(DIST, 'og', 'default.png'))

// PWA icons from the generated master artwork.
const icon = requiredAsset('app-icon.png')
mkdirSync(join(DIST, 'icons'), { recursive: true })
for (const size of [192, 512]) {
  await sharp(icon).resize(size, size).png().toFile(join(DIST, 'icons', `icon-${size}.png`))
}
await sharp(icon).resize(180, 180).png().toFile(join(DIST, 'icons', 'apple-touch-icon.png'))

writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>
`,
)

// Vercel serves this for any address that matches no file and no rewrite, with
// a real 404 status. It is the SPA shell, so the router's catch-all renders the
// themed NotFound page inside it — the status code and the page agree.
writeFileSync(
  join(DIST, '404.html'),
  page({
    title: `${SECTION_META.notFound.title.tr} — ${SITE_NAME}`,
    description: SECTION_META.notFound.description,
    path: '/404',
    image: '/og/default.png',
  })
    .replace(/[ \t]*<link\s+rel="canonical"[\s\S]*?\/>\n?/, '')
    .replace('</head>', '  <meta name="robots" content="noindex" />\n  </head>'),
)

writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

console.log(`static meta: ${bodies.length} worlds, ${characters.length} characters, ${urls.length} urls`)
