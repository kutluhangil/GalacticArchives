// Generate unified photographic archival assets for 12 Star Wars weapons, armor, and superweapons.
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import https from 'https'

const OUT_DIR = '/Volumes/ProjectClaude/GalacticArchives/app/public/arsenal'
const RAW_DIR = '/tmp/arsenal_raw'

const ARSENAL = [
  {
    id: 'dl-44-heavy-blaster',
    url: 'https://static.wikia.nocookie.net/starwars/images/0/0f/Han_Solo_DL-44_SWIconsHS.png/revision/latest?cb=20190201010326',
    scale: 0.85
  },
  {
    id: 'e-11-blaster-rifle',
    url: 'https://static.wikia.nocookie.net/starwars/images/2/20/E-11_blaster_rifle_DICE.png/revision/latest?cb=20230723052825',
    scale: 0.90
  },
  {
    id: 'dc-15a-blaster-rifle',
    url: 'https://static.wikia.nocookie.net/starwars/images/7/7a/DC-15_blaster_rifle_-_SW_Card_Trader.png/revision/latest?cb=20240101061008',
    scale: 0.92
  },
  {
    id: 'wookiee-bowcaster',
    url: 'https://static.wikia.nocookie.net/starwars/images/a/a9/Bowcaster_DICE.png/revision/latest?cb=20220911002039',
    scale: 0.88
  },
  {
    id: 'amban-phase-pulse',
    url: 'https://static.wikia.nocookie.net/starwars/images/2/2d/AmbanSniperRifle-SW100Objects.png/revision/latest?cb=20230419205034',
    scale: 0.94
  },
  {
    id: 'thermal-detonator',
    url: 'https://static.wikia.nocookie.net/starwars/images/6/66/ThermalDetonator-GotR2022.png/revision/latest?cb=20251224033240',
    scale: 0.72
  },
  {
    id: 'darksaber',
    url: 'https://static.wikia.nocookie.net/starwars/images/4/4c/Darksaber-SWGE.png/revision/latest?cb=20250601050517',
    scale: 0.92
  },
  {
    id: 'beskar-ingot',
    url: 'https://static.wikia.nocookie.net/starwars/images/1/12/Beskar-TSWB.png/revision/latest?cb=20211225211302',
    scale: 0.78
  },
  {
    id: 'cortosis-ore',
    url: 'https://static.wikia.nocookie.net/starwars/images/6/67/Cortosis-TeachCorrupt.png/revision/latest?cb=20240730234904',
    scale: 0.75
  },
  {
    id: 'death-star-i',
    url: 'https://static.wikia.nocookie.net/starwars/images/7/72/DeathStar1-SWE.png/revision/latest?cb=20150121020639',
    scale: 0.84
  },
  {
    id: 'starkiller-base',
    url: 'https://static.wikia.nocookie.net/starwars/images/8/8d/StarkillerBaseCrop-FH.png/revision/latest?cb=20220314044340',
    scale: 0.84
  },
  {
    id: 'malevolence-superweapon',
    url: 'https://static.wikia.nocookie.net/starwars/images/b/be/Malevolence-TCWIV.png/revision/latest?cb=20221119221606',
    scale: 0.92
  }
]

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`))
      }
      const stream = fs.createWriteStream(dest)
      res.pipe(stream)
      stream.on('finish', () => stream.close(resolve))
      stream.on('error', reject)
    }).on('error', reject)
  })
}

function generateArsenalBackgroundSvg(width = 800, height = 450) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="grad" cx="50%" cy="50%" r="75%">
        <stop offset="0%" stop-color="#0c1728"/>
        <stop offset="55%" stop-color="#050a14"/>
        <stop offset="85%" stop-color="#020408"/>
        <stop offset="100%" stop-color="#010204"/>
      </radialGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.08"/>
        <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.03"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="vign" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
        <stop offset="15%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="85%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grad)"/>
    <rect width="${width}" height="${height}" fill="url(#glow)"/>
    <!-- Subtle technical tactical grid -->
    <circle cx="400" cy="225" r="180" stroke="#00f0ff" stroke-width="0.5" stroke-opacity="0.12" fill="none"/>
    <circle cx="400" cy="225" r="90" stroke="#00f0ff" stroke-width="0.5" stroke-opacity="0.1" fill="none"/>
    <line x1="160" y1="225" x2="640" y2="225" stroke="#00f0ff" stroke-width="0.5" stroke-opacity="0.08"/>
    <line x1="400" y1="60" x2="400" y2="390" stroke="#00f0ff" stroke-width="0.5" stroke-opacity="0.08"/>
    <rect width="${width}" height="${height}" fill="url(#vign)"/>
  </svg>
  `
}

async function run() {
  const bgSvg = generateArsenalBackgroundSvg(800, 450)
  const bgBuffer = await sharp(Buffer.from(bgSvg)).png().toBuffer()

  for (const item of ARSENAL) {
    const rawFile = path.join(RAW_DIR, `${item.id}.png`)
    if (!fs.existsSync(rawFile)) {
      console.log(`Downloading ${item.id}...`)
      await download(item.url, rawFile)
    }

    console.log(`Processing ${item.id}...`)
    const raw = sharp(rawFile)
    const meta = await raw.metadata()

    let processed = raw
    if (meta.hasAlpha) {
      processed = processed.trim()
    }

    const maxW = Math.round(740 * item.scale)
    const maxH = Math.round(390 * item.scale)

    const resizedBuffer = await processed
      .resize({
        width: maxW,
        height: maxH,
        fit: 'inside',
        withoutEnlargement: false,
        kernel: sharp.kernel.lanczos3
      })
      .toBuffer()

    const resizedMeta = await sharp(resizedBuffer).metadata()
    const left = Math.round((800 - resizedMeta.width) / 2)
    const top = Math.round((450 - resizedMeta.height) / 2)

    await sharp(bgBuffer)
      .composite([
        {
          input: resizedBuffer,
          left: Math.max(0, left),
          top: Math.max(0, top)
        }
      ])
      .modulate({
        brightness: 1.02,
        saturation: 1.05
      })
      .webp({ quality: 90 })
      .toFile(path.join(OUT_DIR, `${item.id}.webp`))

    console.log(`✓ Generated ${item.id}.webp`)
  }

  console.log('All 12 arsenal assets successfully generated!')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
