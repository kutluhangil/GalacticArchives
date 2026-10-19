// Generate unified photographic archival portraits for all 12 Star Wars droids.
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import https from 'https'

const OUT_DIR = '/Volumes/ProjectClaude/GalacticArchives/app/public/droids'
const RAW_DIR = '/tmp/droids_raw'

const DROIDS = [
  {
    id: 'r2-d2-astromech',
    url: 'https://static.wikia.nocookie.net/starwars/images/9/95/R2-D2-TROSOCE.png/revision/latest?cb=20240104043013',
    scale: 0.88,
    offsetY: 10
  },
  {
    id: 'c-3po-protocol',
    url: 'https://static.wikia.nocookie.net/starwars/images/a/a2/C-3PO-TROSTGG.png/revision/latest?cb=20230706042830',
    scale: 0.90,
    offsetY: 5
  },
  {
    id: 'bb-8-astromech',
    url: 'https://static.wikia.nocookie.net/starwars/images/6/68/BB8-Fathead.png/revision/latest?cb=20161108050455',
    scale: 0.84,
    offsetY: 20
  },
  {
    id: 'chopper-c1-10p',
    url: 'https://static.wikia.nocookie.net/starwars/images/b/bb/Chopper_Live_Action.png/revision/latest?cb=20230620225311',
    scale: 0.86,
    offsetY: 15
  },
  {
    id: 'k-2so-security',
    url: 'https://static.wikia.nocookie.net/starwars/images/2/23/K2SO-SWBC35cvr.png/revision/latest?cb=20241112052810',
    scale: 0.92,
    offsetY: 5
  },
  {
    id: 'ig-11-assassin',
    url: 'https://static.wikia.nocookie.net/starwars/images/a/ad/IG-11-assault.png/revision/latest?cb=20220223054735',
    scale: 0.92,
    offsetY: 5
  },
  {
    id: 'b1-battle-droid',
    url: 'https://static.wikia.nocookie.net/starwars/images/c/cd/Battle_Droid.png/revision/latest?cb=20160910192832',
    scale: 0.92,
    offsetY: 5
  },
  {
    id: 'droideka-destroyer',
    url: 'https://static.wikia.nocookie.net/starwars/images/9/9d/Droideka-SWE.png/revision/latest?cb=20240929174903',
    scale: 0.88,
    offsetY: 10
  },
  {
    id: 'hk-47-assassin',
    url: 'https://static.wikia.nocookie.net/starwars/images/3/37/HK-47.png/revision/latest?cb=20130204122718',
    scale: 0.90,
    offsetY: 5
  },
  {
    id: '2-1b-surgical',
    url: 'https://static.wikia.nocookie.net/starwars/images/5/5c/21B-MF26.png/revision/latest?cb=20260305142651',
    scale: 0.90,
    offsetY: 5
  },
  {
    id: 'gnk-power-droid',
    url: 'https://static.wikia.nocookie.net/starwars/images/c/c4/GNKpowerdroid-DB.png/revision/latest?cb=20150609065637',
    scale: 0.84,
    offsetY: 15
  },
  {
    id: 'mse-6-mouse',
    url: 'https://static.wikia.nocookie.net/starwars/images/b/bc/MSE6series-TGTB.png/revision/latest?cb=20250108061335',
    scale: 0.82,
    offsetY: 30
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

function generatePortraitBackgroundSvg(width = 400, height = 500) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="grad" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#0a192c"/>
        <stop offset="60%" stop-color="#040915"/>
        <stop offset="100%" stop-color="#010307"/>
      </radialGradient>
      <radialGradient id="halo" cx="50%" cy="45%" r="45%">
        <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.12"/>
        <stop offset="70%" stop-color="#3b82f6" stop-opacity="0.03"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="vign" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.4"/>
        <stop offset="30%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.8"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grad)"/>
    <circle cx="200" cy="220" r="160" fill="url(#halo)"/>
    <rect width="${width}" height="${height}" fill="url(#vign)"/>
  </svg>
  `
}

async function run() {
  const bgSvg = generatePortraitBackgroundSvg(400, 500)
  const bgBuffer = await sharp(Buffer.from(bgSvg)).png().toBuffer()

  for (const item of DROIDS) {
    const rawFile = path.join(RAW_DIR, `${item.id}.png`)
    if (!fs.existsSync(rawFile)) {
      console.log(`Downloading ${item.id}...`)
      await download(item.url, rawFile)
    }

    console.log(`Processing ${item.id}...`)
    const raw = sharp(rawFile)
    const meta = await raw.metadata()

    // Trim transparent padding
    let processed = raw
    if (meta.hasAlpha) {
      processed = processed.trim()
    }

    const maxW = Math.round(360 * item.scale)
    const maxH = Math.round(460 * item.scale)

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
    const left = Math.round((400 - resizedMeta.width) / 2)
    const top = Math.round((500 - resizedMeta.height) / 2) + item.offsetY

    await sharp(bgBuffer)
      .composite([
        {
          input: resizedBuffer,
          left: Math.max(0, left),
          top: Math.max(0, Math.min(500 - resizedMeta.height, top))
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

  console.log('All 12 droid portraits successfully generated!')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
