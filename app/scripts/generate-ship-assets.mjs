// Generate unified photographic assets for all 10 Star Wars starships.
// Ensures identical cinematic deep-space backdrop, identical color temperature/tonality,
// consistent framing/scale, and high-fidelity 800x450 WebP output.

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const RAW_DIR = '/tmp/starship_raw'
const OUT_DIR = '/Volumes/ProjectClaude/GalacticArchives/app/public/ships'

const SHIPS = [
  { id: 'millennium-falcon', file: 'millennium-falcon.png', scale: 0.86 },
  { id: 'imperial-star-destroyer', file: 'imperial-star-destroyer.png', scale: 0.88 },
  { id: 't-65b-x-wing', file: 't-65b-x-wing.png', scale: 0.84 },
  { id: 'slave-i', file: 'slave-i.png', scale: 0.78 },
  { id: 'venator-star-destroyer', file: 'venator-star-destroyer.png', scale: 0.88 },
  { id: 'razor-crest', file: 'razor-crest.png', fileKeyed: null, scale: 0.84 },
  { id: 'executor-star-dreadnought', file: null, fileKeyed: '/tmp/executor_keyed.png', scale: 0.92 },
  { id: 'ghost-vcx-100', file: 'ghost-vcx-100.png', scale: 0.84 },
  { id: 'tantive-iv', file: 'tantive-iv.png', scale: 0.90 },
  { id: 'tie-interceptor', file: 'tie-interceptor.png', scale: 0.82 }
]

// Generate deterministic beautiful starfield SVG
function generateSpaceBackgroundSvg(width = 800, height = 450) {
  // Deterministic PRNG
  let seed = 42
  function random() {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  const stars = []
  for (let i = 0; i < 160; i++) {
    const x = (random() * width).toFixed(1)
    const y = (random() * height).toFixed(1)
    const r = (random() * 0.9 + 0.35).toFixed(2)
    const op = (random() * 0.65 + 0.25).toFixed(2)
    const hue = random() > 0.8 ? '#a5f3fc' : random() > 0.6 ? '#93c5fd' : '#ffffff'
    stars.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${hue}" opacity="${op}"/>`)
  }

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="spaceGradient" cx="50%" cy="50%" r="75%">
        <stop offset="0%" stop-color="#0b1728"/>
        <stop offset="45%" stop-color="#050b14"/>
        <stop offset="85%" stop-color="#020408"/>
        <stop offset="100%" stop-color="#010204"/>
      </radialGradient>
      <radialGradient id="nebulaGlow" cx="55%" cy="52%" r="55%">
        <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.06"/>
        <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.03"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
        <stop offset="20%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="80%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
      </linearGradient>
    </defs>
    <!-- Deep space background -->
    <rect width="${width}" height="${height}" fill="url(#spaceGradient)"/>
    <!-- Subtle cosmic nebula glow -->
    <rect width="${width}" height="${height}" fill="url(#nebulaGlow)"/>
    <!-- Starfield -->
    <g>${stars.join('')}</g>
    <!-- Vignette -->
    <rect width="${width}" height="${height}" fill="url(#vignette)"/>
  </svg>
  `
}

async function run() {
  const bgSvg = generateSpaceBackgroundSvg(800, 450)
  const bgBuffer = await sharp(Buffer.from(bgSvg)).png().toBuffer()

  for (const ship of SHIPS) {
    const inputPath = ship.fileKeyed || path.join(RAW_DIR, ship.file)
    console.log(`Processing ${ship.id} from ${inputPath}...`)

    // First trim transparent borders to get actual ship bounds
    let trimmed = sharp(inputPath).trim()
    const trimmedMeta = await trimmed.metadata()

    // Determine target size within 800x450
    const maxW = Math.round(760 * ship.scale)
    const maxH = Math.round(410 * ship.scale)

    const resizedShipBuffer = await sharp(inputPath)
      .trim()
      .resize({
        width: maxW,
        height: maxH,
        fit: 'inside',
        withoutEnlargement: false,
        kernel: sharp.kernel.lanczos3
      })
      .toBuffer()

    const resizedMeta = await sharp(resizedShipBuffer).metadata()
    const left = Math.round((800 - resizedMeta.width) / 2)
    const top = Math.round((450 - resizedMeta.height) / 2)

    // Composite resized ship onto unified space background
    const finalWebp = await sharp(bgBuffer)
      .composite([
        {
          input: resizedShipBuffer,
          left,
          top
        }
      ])
      // Subtle color grading: crisp contrast, slight cool temperature enhancement
      .modulate({
        brightness: 1.02,
        saturation: 1.04
      })
      .webp({ quality: 90 })
      .toFile(path.join(OUT_DIR, `${ship.id}.webp`))

    console.log(`✓ Saved ${ship.id}.webp (${finalWebp.size} bytes)`)
  }

  console.log('All 10 ships successfully generated with unified photography!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
