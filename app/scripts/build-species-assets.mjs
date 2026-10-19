// Generate unified photographic archival portraits for all 12 Star Wars sentient species.
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import https from 'https'

const OUT_DIR = '/Volumes/ProjectClaude/GalacticArchives/app/public/species'
const RAW_DIR = '/tmp/species_raw'

const SPECIES = [
  {
    id: 'wookiee',
    url: 'https://static.wikia.nocookie.net/starwars/images/1/1e/Chewbacca-Fathead.png/revision/latest?cb=20161108052810',
    scale: 0.90,
    offsetY: 10
  },
  {
    id: 'twilek',
    url: 'https://static.wikia.nocookie.net/starwars/images/5/54/Twileks.png/revision/latest?cb=20151229035344',
    scale: 0.85,
    offsetY: 0
  },
  {
    id: 'zabrak',
    url: 'https://static.wikia.nocookie.net/starwars/images/a/a4/Zabrak_DICE.png/revision/latest?cb=20230723013313',
    scale: 0.88,
    offsetY: 0
  },
  {
    id: 'mon-calamari',
    url: 'https://static.wikia.nocookie.net/starwars/images/2/23/The_Mon_Calamari.png/revision/latest?cb=20150801202537',
    scale: 0.86,
    offsetY: 0
  },
  {
    id: 'chiss',
    url: 'https://static.wikia.nocookie.net/starwars/images/f/ff/Thrawn_fullbody.png/revision/latest?cb=20221120173900',
    scale: 0.90,
    offsetY: 10
  },
  {
    id: 'togruta',
    url: 'https://static.wikia.nocookie.net/starwars/images/a/af/ShaakTi-TCWs3BR1.png/revision/latest?cb=20220909175007',
    scale: 0.88,
    offsetY: 0
  },
  {
    id: 'rodian',
    url: 'https://static.wikia.nocookie.net/starwars/images/d/d3/Rodian_DICE.png/revision/latest?cb=20260227044626',
    scale: 0.88,
    offsetY: 0
  },
  {
    id: 'hutt',
    url: 'https://static.wikia.nocookie.net/starwars/images/c/cc/Jabba-USCVV.png/revision/latest?cb=20230513042612',
    scale: 0.90,
    offsetY: 20
  },
  {
    id: 'trandoshan',
    url: 'https://static.wikia.nocookie.net/starwars/images/7/72/Bossk_full_body.png/revision/latest?cb=20221008024202',
    scale: 0.90,
    offsetY: 10
  },
  {
    id: 'kaminoan',
    url: 'https://static.wikia.nocookie.net/starwars/images/5/5f/Kaminoans-SWHC31.png/revision/latest?cb=20241114001128',
    scale: 0.92,
    offsetY: 0
  },
  {
    id: 'kel-dor',
    url: 'https://static.wikia.nocookie.net/starwars/images/f/fd/Plokoon_detail.png/revision/latest?cb=20241210055804',
    scale: 0.88,
    offsetY: 0
  },
  {
    id: 'ewok',
    url: 'https://static.wikia.nocookie.net/starwars/images/a/a8/Ewoks_Encyclopedia.png/revision/latest?cb=20210904221240',
    scale: 0.85,
    offsetY: 15
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
        <stop offset="0%" stop-color="#0a182d"/>
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

  for (const item of SPECIES) {
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

  console.log('All 12 species portraits successfully generated!')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
