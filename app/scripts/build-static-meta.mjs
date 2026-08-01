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

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const PLANET_DIR = join(ROOT, 'src', 'data', 'planets')
const BRAND_DIR = join(ROOT, 'raw', 'brand')
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

/** 1200x630 share card: the world's own palette, its name, its grid square */
function ogCard(planet) {
  const { primary, secondary = primary } = planet.renderRecipe.palette
  const name = escape(planet.names.en.toUpperCase())
  const grid = escape(planet.coordinates ?? '')
  const blurb = wrap(planet.desc.en, 42, 2)
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

function page({ title, description, path, image }) {
  const tags = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    `<link rel="canonical" href="${SITE}${path}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${SITE}${path}" />`,
    `<meta property="og:image" content="${SITE}${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ')
  // strip every tag this page is about to define; two og:image tags means the
  // crawler picks the site-wide card instead of the world's own
  return shell
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/[ \t]*<meta\s+name="description"[\s\S]*?\/>\n?/, '')
    .replace(/[ \t]*<meta\s+property="og:(?!site_name)[\s\S]*?\/>\n?/g, '')
    .replace(/[ \t]*<meta\s+name="twitter:[\s\S]*?\/>\n?/g, '')
    .replace(/[ \t]*<link\s+rel="canonical"[\s\S]*?\/>\n?/, '')
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

const urls = ['/', '/galaxy', '/holocron', '/compare']

for (const planet of planets) {
  const name = planet.names.en
  const description = planet.desc.en.slice(0, 180)
  const image = `/og/${planet.id}.png`

  mkdirSync(join(DIST, 'og'), { recursive: true })
  await sharp(ogCard(planet)).png().toFile(join(DIST, 'og', `${planet.id}.png`))

  for (const route of [`/planet/${planet.id}`, `/holocron/planet/${planet.id}`]) {
    writePage(
      route,
      page({
        title: `${name} — Galactic Archives`,
        description,
        path: route,
        image,
      }),
    )
    urls.push(route)
  }
}

// Site-wide card: generated art is the background and the build owns readable,
// deterministic text instead of asking an image model to typeset it.
const defaultOgText = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <text x="72" y="248" font-family="Helvetica, Arial, sans-serif"
        font-size="58" font-weight="700" letter-spacing="10" fill="#FFE81F">GALACTIC</text>
  <text x="72" y="318" font-family="Helvetica, Arial, sans-serif"
        font-size="58" font-weight="700" letter-spacing="10" fill="#FFE81F">ARCHIVES</text>
  <text x="76" y="374" font-family="Helvetica, Arial, sans-serif"
        font-size="24" letter-spacing="4" fill="#C8D1DC">AN INTERACTIVE GALACTIC ATLAS</text>
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

writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

console.log(`static meta: ${planets.length} worlds, ${urls.length} urls`)
