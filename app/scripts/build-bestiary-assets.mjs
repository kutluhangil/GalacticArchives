// Generate unified photographic archival assets for 12 Star Wars bestiary creatures.
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import https from 'https'

const OUT_DIR = '/Volumes/ProjectClaude/GalacticArchives/app/public/bestiary'
const RAW_DIR = '/tmp/bestiary_raw'

const CREATURES = [
  {
    id: 'rancor',
    url: 'https://static.wikia.nocookie.net/starwars/images/8/8c/Rancor-SWE.png/revision/latest?cb=20160913053623',
    scale: 0.88,
  },
  {
    id: 'krayt-dragon',
    url: 'https://static.wikia.nocookie.net/starwars/images/6/61/Krayt-dragon-mando.png/revision/latest?cb=20241130075239',
    scale: 0.92,
  },
  {
    id: 'purrgil',
    url: 'https://static.wikia.nocookie.net/starwars/images/5/57/Purrgil-CGSWG.png/revision/latest?cb=20241130030607',
    scale: 0.90,
  },
  {
    id: 'sarlacc',
    url: 'https://static.wikia.nocookie.net/starwars/images/2/21/Sarlacc_full_shot.png/revision/latest?cb=20120309122917',
    scale: 0.82,
  },
  {
    id: 'loth-wolf',
    url: 'https://static.wikia.nocookie.net/starwars/images/7/75/Loth-Wolf.png/revision/latest?cb=20180122044042',
    scale: 0.86,
  },
  {
    id: 'exogorth',
    url: 'https://static.wikia.nocookie.net/starwars/images/b/bf/Exogorth-SquadronsHologram.jpg/revision/latest?cb=20260102201636',
    scale: 0.88,
  },
  {
    id: 'acklay',
    url: 'https://static.wikia.nocookie.net/starwars/images/e/e2/Acklay.png/revision/latest?cb=20200427021451',
    scale: 0.88,
  },
  {
    id: 'reek',
    url: 'https://static.wikia.nocookie.net/starwars/images/8/8e/Reek.jpg/revision/latest?cb=20091202161701',
    scale: 0.85,
  },
  {
    id: 'nexu',
    url: 'https://static.wikia.nocookie.net/starwars/images/c/c1/Nexu-SWE.png/revision/latest?cb=20160913005453',
    scale: 0.85,
  },
  {
    id: 'varactyl',
    url: 'https://static.wikia.nocookie.net/starwars/images/7/79/Varactyl_DK.png/revision/latest?cb=20221008151825',
    scale: 0.88,
  },
  {
    id: 'bantha',
    url: 'https://static.wikia.nocookie.net/starwars/images/1/17/Bantha-SWE.png/revision/latest?cb=20140828153858',
    scale: 0.86,
  },
  {
    id: 'tauntaun',
    url: 'https://static.wikia.nocookie.net/starwars/images/9/9c/Tauntaun-SWE.png/revision/latest?cb=20160914005551',
    scale: 0.85,
  },
]

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(RAW_DIR, { recursive: true })

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const stream = fs.createWriteStream(dest)
      res.pipe(stream)
      stream.on('finish', () => resolve(dest))
      stream.on('error', reject)
    }).on('error', reject)
  })
}

// Unified background: 800x450 dark cosmic nebula + subtle cyan grid lines + vignette
async function createBackdropSvg() {
  return Buffer.from(`
    <svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nebula" cx="50%" cy="48%" r="65%">
          <stop offset="0%" stop-color="#0a192f" stop-opacity="0.95" />
          <stop offset="50%" stop-color="#050d1a" stop-opacity="1" />
          <stop offset="100%" stop-color="#020408" stop-opacity="1" />
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="45%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.12" />
          <stop offset="60%" stop-color="#0284c7" stop-opacity="0.04" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" stroke-width="0.3" stroke-opacity="0.08" />
        </pattern>
      </defs>
      <rect width="800" height="450" fill="url(#nebula)" />
      <rect width="800" height="450" fill="url(#grid)" />
      <circle cx="400" cy="225" r="300" fill="url(#glow)" />
      <circle cx="400" cy="225" r="180" fill="none" stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.15" stroke-dasharray="4,6" />
      <rect x="20" y="20" width="760" height="410" fill="none" stroke="#38bdf8" stroke-width="0.75" stroke-opacity="0.2" />
      <path d="M 20 40 L 20 20 L 40 20 M 780 40 L 780 20 L 760 20 M 20 410 L 20 430 L 40 430 M 780 410 L 780 430 L 760 430" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.5" />
      <text x="35" y="420" font-family="monospace" font-size="11" fill="#38bdf8" fill-opacity="0.35" letter-spacing="2">ARCHIVE BESTIARY BIO-SCAN // CLASSIFIED FAUNA</text>
    </svg>
  `)
}

async function processCreature(creature) {
  const rawPath = path.join(RAW_DIR, `${creature.id}.raw`)
  const outPath = path.join(OUT_DIR, `${creature.id}.webp`)

  console.log(`Processing bestiary [${creature.id}]...`)
  if (!fs.existsSync(rawPath)) {
    await downloadFile(creature.url, rawPath)
  }

  const backdropBuffer = await createBackdropSvg()

  const maxW = Math.round(700 * creature.scale)
  const maxH = Math.round(370 * creature.scale)

  const subjectSharp = sharp(rawPath)
  const metadata = await subjectSharp.metadata()

  let resizedSubject
  if (metadata.hasAlpha) {
    resizedSubject = await subjectSharp
      .resize({
        width: maxW,
        height: maxH,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .toBuffer()
  } else {
    resizedSubject = await subjectSharp
      .resize({
        width: maxW,
        height: maxH,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .toBuffer()
  }

  const subjectMeta = await sharp(resizedSubject).metadata()
  const left = Math.round((800 - (subjectMeta.width || maxW)) / 2)
  const top = Math.round((450 - (subjectMeta.height || maxH)) / 2)

  await sharp(backdropBuffer)
    .composite([
      {
        input: resizedSubject,
        left,
        top,
      },
    ])
    .webp({ quality: 86 })
    .toFile(outPath)

  console.log(`✓ Created: ${outPath}`)
}

async function main() {
  for (const c of CREATURES) {
    try {
      await processCreature(c)
    } catch (err) {
      console.error(`Failed ${c.id}:`, err)
    }
  }
}

main()
