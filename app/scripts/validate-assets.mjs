#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLANET_DIR = join(ROOT, 'src', 'data', 'planets')
const RAW_PLANETS = join(ROOT, 'raw', 'planets')
const CARDS = join(ROOT, 'public', 'cards')
const PORTRAITS = join(ROOT, 'public', 'portraits')
const PUBLIC_TEXTURES = join(ROOT, 'public', 'textures', 'planets')
const MANIFEST = join(PUBLIC_TEXTURES, 'manifest.json')
const SEAM_TOLERANCE = 12
const TIER_DIMENSIONS = {
  '4k': { width: 4096, height: 2048 },
  '2k': { width: 2048, height: 1024 },
  '1k': { width: 1024, height: 512 },
}

const errors = []

const planets = readdirSync(PLANET_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(PLANET_DIR, file), 'utf8')))
const stations = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'stations.json'), 'utf8'))
const characters = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'characters.json'), 'utf8'))
const bodies = [
  ...planets,
  ...planets.flatMap((planet) => planet.moonsDetail ?? []),
  ...stations,
]
const bodyIds = bodies.map((body) => body.id).sort()
const characterIds = characters.map((character) => character.id).sort()
const nightIds = [
  'cato-neimoidia',
  'chandrila',
  'corellia',
  'coruscant',
  'daiyu',
  'ferrix',
  'hosnian-prime',
  'kijimi',
  'nal-hutta',
  'nar-shaddaa',
  'shakari',
  'taris',
]

function fail(message) {
  errors.push(message)
}

function inspectInventory(dir, expectedNames, extensions) {
  if (!existsSync(dir)) {
    fail(`${dir}: missing asset directory`)
    return
  }
  const expected = new Set(expectedNames)
  const actual = readdirSync(dir).filter((name) => extensions.some((ext) => name.endsWith(ext)))
  for (const name of actual) {
    if (!expected.has(name)) fail(`${join(dir, name)}: unexpected asset`)
  }
}

// The 4K masters are 1.6 GB, so they live outside the repository; only the
// derived tiers under public/textures ship. When a checkout has them —
// anyone re-running the texture pipeline — they are validated in full, and
// when it does not, the skip is reported rather than passed over in silence.
const hasMasters = existsSync(RAW_PLANETS)

if (hasMasters) {
  inspectInventory(
    RAW_PLANETS,
    [...bodyIds.map((id) => `${id}-albedo.png`), ...nightIds.map((id) => `${id}-night.png`)],
    ['.png'],
  )
}
inspectInventory(CARDS, bodyIds.map((id) => `${id}.webp`), ['.webp'])
inspectInventory(PORTRAITS, characterIds.map((id) => `${id}.webp`), ['.webp'])
inspectInventory(join(ROOT, 'raw', 'brand'), ['app-icon.png', 'og-default.png'], ['.png'])
inspectInventory(join(ROOT, '..', 'docs', 'brand'), ['readme-banner.png'], ['.png'])

async function inspectImage(path, expected) {
  if (!existsSync(path)) {
    fail(`${path}: missing asset`)
    return null
  }
  try {
    const metadata = await sharp(path).metadata()
    if (metadata.width !== expected.width || metadata.height !== expected.height) {
      fail(
        `${path}: expected ${expected.width}x${expected.height}, got ${metadata.width}x${metadata.height}`,
      )
    }
    if (metadata.format !== expected.format) {
      fail(`${path}: expected ${expected.format}, got ${metadata.format ?? 'unknown format'}`)
    }
    return metadata
  } catch (error) {
    fail(`${path}: Sharp could not decode the image: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

async function seamDelta(path) {
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let sum = 0
  for (let y = 0; y < info.height; y++) {
    const left = y * info.width * info.channels
    const right = (y * info.width + info.width - 1) * info.channels
    for (let channel = 0; channel < 3; channel++) {
      sum += Math.abs(data[left + channel] - data[right + channel])
    }
  }
  return sum / (info.height * 3)
}

async function inspectMap(id, kind) {
  const path = join(RAW_PLANETS, `${id}-${kind}.png`)
  const metadata = await inspectImage(path, { width: 4096, height: 2048, format: 'png' })
  if (!metadata) return
  const delta = await seamDelta(path)
  if (delta > SEAM_TOLERANCE) {
    fail(`${path}: seam delta ${delta.toFixed(2)} exceeds ${SEAM_TOLERANCE}`)
  }
}

if (hasMasters) {
  for (const id of bodyIds) await inspectMap(id, 'albedo')
  for (const id of nightIds) await inspectMap(id, 'night')
}

for (const id of bodyIds) {
  await inspectImage(join(CARDS, `${id}.webp`), {
    width: 1200,
    height: 600,
    format: 'webp',
  })
}

for (const id of characterIds) {
  await inspectImage(join(PORTRAITS, `${id}.webp`), {
    width: 1000,
    height: 820,
    format: 'webp',
  })
}

await inspectImage(join(ROOT, 'raw', 'brand', 'app-icon.png'), {
  width: 1024,
  height: 1024,
  format: 'png',
})
await inspectImage(join(ROOT, 'raw', 'brand', 'og-default.png'), {
  width: 1200,
  height: 630,
  format: 'png',
})
await inspectImage(join(ROOT, '..', 'docs', 'brand', 'readme-banner.png'), {
  width: 1600,
  height: 400,
  format: 'png',
})

if (!existsSync(MANIFEST)) {
  fail(`${MANIFEST}: missing texture manifest; run "npm run textures" first`)
} else {
  try {
    const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
    for (const id of Object.keys(manifest)) {
      if (!bodyIds.includes(id)) fail(`${MANIFEST}: unexpected body ${id}`)
    }
    for (const id of bodyIds) {
      const kinds = nightIds.includes(id) ? ['albedo', 'night'] : ['albedo']
      inspectInventory(
        join(PUBLIC_TEXTURES, id),
        kinds.flatMap((kind) => Object.keys(TIER_DIMENSIONS).map((tier) => `${kind}-${tier}.webp`)),
        ['.webp', '.ktx2'],
      )
      for (const kind of kinds) {
        const available = manifest[id]?.[kind]
        if (!available) {
          fail(`${MANIFEST}: ${id} has no ${kind} entry`)
          continue
        }
        for (const [tier, dimensions] of Object.entries(TIER_DIMENSIONS)) {
          const file = available[tier]
          if (!file) {
            fail(`${MANIFEST}: ${id}/${kind} has no ${tier} entry`)
            continue
          }
          await inspectImage(join(PUBLIC_TEXTURES, id, file), {
            ...dimensions,
            format: 'webp',
          })
        }
      }
    }
  } catch (error) {
    fail(`${MANIFEST}: invalid JSON: ${error instanceof Error ? error.message : error}`)
  }
}

console.log(
  `assets: ${bodyIds.length} albedo, ${nightIds.length} night, 300 texture tiers, ${bodyIds.length} cards, ${characterIds.length} portraits, 3 brand`,
)
console.log(
  hasMasters
    ? `masters: ${bodyIds.length + nightIds.length} checked for size and seam`
    : `masters: not in this checkout, ${bodyIds.length + nightIds.length} size/seam checks skipped (see docs/kalan-isler.md)`,
)
console.log(`ERRORS: ${errors.length}`)
for (const error of errors) console.log(`  ✗ ${error}`)

if (errors.length) process.exit(1)
