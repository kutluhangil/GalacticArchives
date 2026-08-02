#!/usr/bin/env node
// Turns raw generated planet maps into the tiered textures the engine loads.
//
//   raw/planets/<id>-albedo.png   (equirectangular, 2:1)
//   raw/planets/<id>-night.png    (optional, city lights)
//   raw/planets/<id>-clouds.png   (optional, alpha in the red channel)
//
// For every map it checks the horizontal seam, writes 4K/2K/1K variants into
// public/textures/planets/<id>/, and records what exists in a manifest the
// engine reads at runtime. Output is KTX2/ETC1S: the GPU keeps it compressed,
// so a 4K albedo costs about 11 MB of VRAM instead of the 43 MB an RGBA upload
// would take, and the transcode happens off the main thread.
//
//   node scripts/process-textures.mjs            process everything new
//   node scripts/process-textures.mjs tatooine   process one world
//   node scripts/process-textures.mjs --force    rebuild even if up to date

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { NodeBasisEncoder } from 'ktx2-encoder'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RAW_DIR = join(ROOT, 'raw', 'planets')
const OUT_DIR = join(ROOT, 'public', 'textures', 'planets')
const MANIFEST = join(OUT_DIR, 'manifest.json')

const KINDS = ['albedo', 'night', 'clouds']
const TIERS = [
  { name: '4k', width: 4096 },
  { name: '2k', width: 2048 },
  { name: '1k', width: 1024 },
]
/** a seam this visible would show as a bright line down the globe */
const SEAM_TOLERANCE = 12

const args = process.argv.slice(2)
const force = args.includes('--force')
const only = args.filter((a) => !a.startsWith('--'))

const encoder = new NodeBasisEncoder()

/** Basis reads raw RGBA; sharp is already here, so it does the decoding. */
async function imageDecoder(buffer) {
  const { data, info } = await sharp(Buffer.from(buffer))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data), width: info.width, height: info.height }
}

/** mean absolute difference between the first and last texel column */
async function seamDelta(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  let sum = 0
  for (let y = 0; y < height; y++) {
    const left = (y * width) * channels
    const right = (y * width + width - 1) * channels
    for (let c = 0; c < 3; c++) sum += Math.abs(data[left + c] - data[right + c])
  }
  return sum / (height * 3)
}

async function writeTier(file, outBase, width) {
  const resized = await sharp(file)
    .resize({ width, height: width / 2, fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toBuffer()
  // ETC1S, not UASTC: on these surfaces UASTC costs ~7x the bytes for detail
  // that a globe at this distance never shows (4K: 9.7 MB against 1.4 MB).
  const ktx2 = await encoder.encode(resized, {
    imageDecoder,
    isUASTC: false,
    isInputSRGB: true,
    generateMipmap: true,
    needSupercompression: true,
    qualityLevel: 150,
  })
  writeFileSync(`${outBase}.ktx2`, Buffer.from(ktx2))
  return `${outBase.split('/').pop()}.ktx2`
}

function isStale(source, target) {
  if (force || !existsSync(target)) return true
  return statSync(source).mtimeMs > statSync(target).mtimeMs
}

async function main() {
  if (!existsSync(RAW_DIR)) {
    console.error(`no raw directory at ${RAW_DIR} — drop the generated PNGs there first`)
    process.exit(1)
  }
  mkdirSync(OUT_DIR, { recursive: true })
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}

  const ids = new Set()
  for (const file of readdirSync(RAW_DIR)) {
    const match = file.match(/^(.+)-(albedo|night|clouds)\.png$/)
    if (match && (!only.length || only.includes(match[1]))) ids.add(match[1])
  }
  if (!ids.size) {
    console.error(only.length ? `no raw maps for: ${only.join(', ')}` : 'no raw maps found')
    process.exit(1)
  }

  for (const id of [...ids].sort()) {
    const outPlanet = join(OUT_DIR, id)
    mkdirSync(outPlanet, { recursive: true })
    const entry = manifest[id] ?? {}

    for (const kind of KINDS) {
      const source = join(RAW_DIR, `${id}-${kind}.png`)
      if (!existsSync(source)) continue

      const meta = await sharp(source).metadata()
      if (meta.width !== meta.height * 2) {
        throw new Error(
          `${id}-${kind}.png is ${meta.width}x${meta.height}; an equirectangular map must be 2:1`,
        )
      }
      const delta = await seamDelta(source)
      if (delta > SEAM_TOLERANCE) {
        console.warn(`  ! ${id}-${kind}: seam delta ${delta.toFixed(1)} — the wrap will be visible`)
      }

      entry[kind] = {}
      for (const tier of TIERS) {
        if (meta.width < tier.width && tier.name !== '1k') continue
        const outBase = join(outPlanet, `${kind}-${tier.name}`)
        if (!isStale(source, `${outBase}.ktx2`)) {
          entry[kind][tier.name] = `${kind}-${tier.name}.ktx2`
          continue
        }
        entry[kind][tier.name] = await writeTier(source, outBase, tier.width)
        console.log(`  ${id}/${kind}-${tier.name}`)
      }
    }
    manifest[id] = entry
  }

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`manifest updated: ${Object.keys(manifest).length} worlds, format ktx2`)
}

await main()
