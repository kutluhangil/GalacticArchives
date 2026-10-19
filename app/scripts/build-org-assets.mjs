// Generate unified photographic archival assets for 10 Star Wars organizations, clans, and syndicates.
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import https from 'https'

const OUT_DIR = '/Volumes/ProjectClaude/GalacticArchives/app/public/organizations'
const RAW_DIR = '/tmp/org_raw'

const ORGANIZATIONS = [
  {
    id: 'jedi-order',
    url: 'https://static.wikia.nocookie.net/starwars/images/9/9d/Jedi_symbol.svg/revision/latest?cb=20080329163323',
    scale: 0.65,
    glow: '#38bdf8',
  },
  {
    id: 'sith-order',
    url: 'https://static.wikia.nocookie.net/starwars/images/1/16/Sith_Emblem.svg/revision/latest?cb=20240629214011',
    scale: 0.65,
    glow: '#ef4444',
  },
  {
    id: 'mandalorian-clans',
    url: 'https://static.wikia.nocookie.net/starwars/images/e/e1/MythosaurSkull-SW100Objects.png/revision/latest?cb=20230502050920',
    scale: 0.72,
    glow: '#14b8a6',
  },
  {
    id: 'bounty-hunters-guild',
    url: 'https://static.wikia.nocookie.net/starwars/images/0/03/Bounty_Hunters_Guild.jpg/revision/latest?cb=20090621063827',
    scale: 0.70,
    glow: '#f59e0b',
  },
  {
    id: 'pyke-syndicate',
    url: 'https://static.wikia.nocookie.net/starwars/images/0/0a/Pyke_syndicate.svg/revision/latest?cb=20160815080255',
    scale: 0.68,
    glow: '#a855f7',
  },
  {
    id: 'crimson-dawn',
    url: 'https://static.wikia.nocookie.net/starwars/images/9/95/Crimson_dawn.svg/revision/latest?cb=20240821221227',
    scale: 0.68,
    glow: '#e11d48',
  },
  {
    id: 'black-sun',
    url: 'https://static.wikia.nocookie.net/starwars/images/5/54/Blacksun.svg/revision/latest?cb=20250716001233',
    scale: 0.68,
    glow: '#6366f1',
  },
  {
    id: 'inquisitorius',
    url: 'https://static.wikia.nocookie.net/starwars/images/0/00/Grand_Inquisitor_symbol.svg/revision/latest?cb=20230525233130',
    scale: 0.65,
    glow: '#dc2626',
  },
  {
    id: 'hutt-cartels',
    url: 'https://static.wikia.nocookie.net/starwars/images/3/35/Hutt_Council.png/revision/latest?cb=20130517034124',
    scale: 0.75,
    glow: '#d97706',
  },
  {
    id: 'knights-of-ren',
    url: 'https://static.wikia.nocookie.net/starwars/images/2/23/Knights_of_Ren.png/revision/latest?cb=20160416230650',
    scale: 0.72,
    glow: '#991b1b',
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

async function createBackdropSvg(glowColor) {
  return Buffer.from(`
    <svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nebula" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#0a192f" stop-opacity="0.95" />
          <stop offset="50%" stop-color="#050d1a" stop-opacity="1" />
          <stop offset="100%" stop-color="#020408" stop-opacity="1" />
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="45%">
          <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.22" />
          <stop offset="60%" stop-color="${glowColor}" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" stroke-width="0.3" stroke-opacity="0.07" />
        </pattern>
      </defs>
      <rect width="800" height="450" fill="url(#nebula)" />
      <rect width="800" height="450" fill="url(#grid)" />
      <circle cx="400" cy="225" r="300" fill="url(#glow)" />
      <circle cx="400" cy="225" r="170" fill="none" stroke="${glowColor}" stroke-width="0.75" stroke-opacity="0.3" stroke-dasharray="3,5" />
      <circle cx="400" cy="225" r="195" fill="none" stroke="#38bdf8" stroke-width="0.4" stroke-opacity="0.15" />
      <rect x="20" y="20" width="760" height="410" fill="none" stroke="#38bdf8" stroke-width="0.75" stroke-opacity="0.2" />
      <path d="M 20 40 L 20 20 L 40 20 M 780 40 L 780 20 L 760 20 M 20 410 L 20 430 L 40 430 M 780 410 L 780 430 L 760 430" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.5" />
      <text x="35" y="420" font-family="monospace" font-size="11" fill="#38bdf8" fill-opacity="0.35" letter-spacing="2">ARCHIVE CODES // FACTION &amp; SYNDICATE INSIGNIA</text>
    </svg>
  `)
}

async function processOrg(org) {
  const isSvg = org.url.includes('.svg')
  const ext = isSvg ? 'svg' : 'raw'
  const rawPath = path.join(RAW_DIR, `${org.id}.${ext}`)
  const outPath = path.join(OUT_DIR, `${org.id}.webp`)

  console.log(`Processing org emblem [${org.id}]...`)
  if (!fs.existsSync(rawPath)) {
    await downloadFile(org.url, rawPath)
  }

  const backdropBuffer = await createBackdropSvg(org.glow)

  const maxW = Math.round(380 * org.scale)
  const maxH = Math.round(380 * org.scale)

  const subjectSharp = isSvg
    ? sharp(rawPath, { density: 300 })
    : sharp(rawPath)

  const resizedSubject = await subjectSharp
    .resize({
      width: maxW,
      height: maxH,
      fit: 'inside',
      withoutEnlargement: false,
    })
    .toBuffer()

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
  for (const o of ORGANIZATIONS) {
    try {
      await processOrg(o)
    } catch (err) {
      console.error(`Failed ${o.id}:`, err)
    }
  }
}

main()
