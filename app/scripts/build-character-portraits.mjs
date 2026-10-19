// Generate unified photographic archival portraits for all 33 Star Wars canon figures.
import fs from 'fs'
import path from 'path'
import https from 'https'
import sharp from 'sharp'

const OUT_DIR = '/Volumes/ProjectClaude/GalacticArchives/app/public/portraits'
const RAW_DIR = '/tmp/portraits_raw'

const CHARACTERS = [
  { id: 'luke-skywalker', file: 'LukeSkywalkerTransparent.png', type: 'transparent', scale: 0.90, offsetY: 0 },
  { id: 'leia-organa', file: 'Leia_Organa_TLJ.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'han-solo', file: 'HanSolo-Fathead.png', type: 'transparent', scale: 0.86, offsetY: 0 },
  { id: 'chewbacca', file: 'Chewbacca-Fathead.png', type: 'transparent', scale: 0.92, offsetY: 10 },
  { id: 'anakin-skywalker', file: 'AnakinSkywalker-TCWS7.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'obi-wan-kenobi', file: 'BattlefrontTwo-Obi-Wan-Kenobi.png', type: 'feathered', scale: 0.90, offsetY: 0 },
  { id: 'yoda', file: 'Yoda_SWSB.png', type: 'feathered', scale: 0.90, offsetY: 0 },
  { id: 'palpatine', file: 'Palpatine-CEUEEd.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'padme-amidala', file: 'PadmeAmidala-Awakenings.png', type: 'feathered', scale: 0.90, offsetY: 0 },
  { id: 'qui-gon-jinn', file: 'QuiGonJinn-SWITSB.png', type: 'feathered', scale: 0.90, offsetY: 0 },
  { id: 'darth-maul', file: 'Darth Maul.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'count-dooku', file: 'Dooku-SWBC61.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'grievous', file: 'GrievousStand-SWHC821.png', type: 'transparent', scale: 0.90, offsetY: 10 },
  { id: 'ahsoka-tano', file: 'Ahsoka-Tano-AG-2023.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'captain-rex', file: 'Rex Clone Captain WotF.png', type: 'feathered', scale: 0.90, offsetY: 0 },
  { id: 'thrawn', file: 'Thrawn_fullbody.png', type: 'transparent', scale: 0.90, offsetY: 10 },
  { id: 'ezra-bridger', file: 'Cadet Ezra Fathead.png', type: 'transparent', scale: 0.86, offsetY: 0 },
  { id: 'kanan-jarrus', file: 'Kanan-JediNight.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'hera-syndulla', file: 'HeraSyndulla1-Fathead.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'sabine-wren', file: 'Sabine_Wren-AG.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'din-djarin', file: 'TheMandalorian-Fathead.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'grogu', file: 'TheChild-Fathead.png', type: 'transparent', scale: 0.82, offsetY: 20 },
  { id: 'boba-fett', file: 'BobaFett-Fathead.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'bo-katan', file: 'BoKatanKryze-TTG2024.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'cassian-andor', file: 'CassianAndor-Fathead.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'jyn-erso', file: 'Jyn Erso Fathead.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'mon-mothma', file: 'Mon_Mothma_Ahsoka_poster.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'rey', file: 'Rey TROS Fathead.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'kylo-ren', file: 'KyloRenHS-Fathead.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'poe-dameron', file: 'PoeDameron-Heroes2023.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'finn', file: 'FinnHS-Fathead.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'lando-calrissian', file: 'LandoSolo-Fathead.png', type: 'transparent', scale: 0.88, offsetY: 0 },
  { id: 'jabba-the-hutt', file: 'Jabba32BBY-Fathead.png', type: 'transparent', scale: 0.90, offsetY: 25 },
]

async function getImageUrl(fileName) {
  const url = 'https://starwars.fandom.com/api.php?action=query&titles=File:' + encodeURIComponent(fileName) + '&prop=imageinfo&iiprop=url&format=json'
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const page = Object.values(json.query.pages)[0]
          resolve(page && page.imageinfo ? page.imageinfo[0].url : null)
        } catch {
          resolve(null)
        }
      })
    }).on('error', () => resolve(null))
  })
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode))
      }
      const stream = fs.createWriteStream(dest)
      res.pipe(stream)
      stream.on('finish', () => stream.close(resolve))
      stream.on('error', reject)
    }).on('error', reject)
  })
}

function generateBackgroundSvg(width = 1000, height = 820) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Deep space cosmic background -->
      <radialGradient id="bg" cx="50%" cy="45%" r="75%">
        <stop offset="0%" stop-color="#0a192f"/>
        <stop offset="50%" stop-color="#050d1a"/>
        <stop offset="85%" stop-color="#02050b"/>
        <stop offset="100%" stop-color="#010206"/>
      </radialGradient>

      <!-- Holographic backlight / aura -->
      <radialGradient id="aura" cx="50%" cy="42%" r="42%">
        <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.22"/>
        <stop offset="40%" stop-color="#0077b6" stop-opacity="0.10"/>
        <stop offset="75%" stop-color="#001220" stop-opacity="0.02"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>

      <!-- Tactical radar reticles -->
      <radialGradient id="ringGrad" cx="50%" cy="42%" r="40%">
        <stop offset="90%" stop-color="#00f0ff" stop-opacity="0.08"/>
        <stop offset="98%" stop-color="#00f0ff" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>

      <!-- Bottom dissolve vignette -->
      <linearGradient id="bottomVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#010308" stop-opacity="0.15"/>
        <stop offset="25%" stop-color="#010308" stop-opacity="0"/>
        <stop offset="68%" stop-color="#010308" stop-opacity="0"/>
        <stop offset="88%" stop-color="#010308" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#010308" stop-opacity="0.98"/>
      </linearGradient>
    </defs>

    <!-- Base cosmic background -->
    <rect width="${width}" height="${height}" fill="url(#bg)"/>

    <!-- Subtle starfield / cosmic particles -->
    <g fill="#ffffff" opacity="0.4">
      <circle cx="120" cy="90" r="1.2"/>
      <circle cx="880" cy="140" r="1.5" opacity="0.7"/>
      <circle cx="240" cy="220" r="0.9"/>
      <circle cx="810" cy="310" r="1.1"/>
      <circle cx="90" cy="480" r="1.4" opacity="0.6"/>
      <circle cx="920" cy="560" r="1.0"/>
      <circle cx="180" cy="690" r="1.3"/>
      <circle cx="840" cy="730" r="0.8"/>
      <circle cx="490" cy="80" r="1.2" opacity="0.5"/>
      <circle cx="350" cy="160" r="1.0"/>
      <circle cx="670" cy="190" r="1.2"/>
    </g>

    <!-- Holographic backlight -->
    <ellipse cx="500" cy="380" rx="360" ry="310" fill="url(#aura)"/>

    <!-- Subtle holographic target reticle -->
    <circle cx="500" cy="380" r="280" stroke="#00f0ff" stroke-width="1" stroke-dasharray="4,12" opacity="0.15" fill="none"/>
    <circle cx="500" cy="380" r="200" stroke="#00f0ff" stroke-width="0.8" stroke-dasharray="8,16" opacity="0.10" fill="none"/>

    <!-- Sci-fi Corner registration brackets -->
    <path d="M 40 70 L 40 40 L 70 40" stroke="#00f0ff" stroke-width="2" fill="none" opacity="0.35"/>
    <path d="M 960 70 L 960 40 L 930 40" stroke="#00f0ff" stroke-width="2" fill="none" opacity="0.35"/>
    <path d="M 40 750 L 40 780 L 70 780" stroke="#00f0ff" stroke-width="2" fill="none" opacity="0.35"/>
    <path d="M 960 750 L 960 780 L 930 780" stroke="#00f0ff" stroke-width="2" fill="none" opacity="0.35"/>

    <!-- Telemetry markings -->
    <text x="50" y="32" font-family="monospace" font-size="11" fill="#00f0ff" opacity="0.35" letter-spacing="2">ARCHIVE RECORD // DOSSIER</text>
    <text x="950" y="32" text-anchor="end" font-family="monospace" font-size="11" fill="#00f0ff" opacity="0.35" letter-spacing="2">SEC-07 // CANON</text>

    <!-- Bottom Vignette -->
    <rect width="${width}" height="${height}" fill="url(#bottomVignette)"/>
  </svg>
  `
}

function generateFeatherMaskSvg(width = 720, height = 720) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="feather" cx="50%" cy="48%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1.0"/>
        <stop offset="65%" stop-color="#ffffff" stop-opacity="1.0"/>
        <stop offset="85%" stop-color="#ffffff" stop-opacity="0.7"/>
        <stop offset="98%" stop-color="#ffffff" stop-opacity="0.0"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#feather)"/>
  </svg>
  `
}

function generateBottomFadeSvg(width = 1000, height = 820) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="90%" stop-color="#010308" stop-opacity="0.82"/>
        <stop offset="100%" stop-color="#010308" stop-opacity="1.0"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#fade)"/>
  </svg>
  `
}

async function run() {
  fs.mkdirSync(RAW_DIR, { recursive: true })
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const bgBuffer = await sharp(Buffer.from(generateBackgroundSvg())).png().toBuffer()
  const maskBuffer = await sharp(Buffer.from(generateFeatherMaskSvg())).png().toBuffer()
  const fadeBuffer = await sharp(Buffer.from(generateBottomFadeSvg())).png().toBuffer()

  for (const char of CHARACTERS) {
    const rawFile = path.join(RAW_DIR, `${char.id}.png`)
    if (!fs.existsSync(rawFile) || fs.statSync(rawFile).size < 1000) {
      console.log(`Downloading ${char.id} (${char.file})...`)
      const url = await getImageUrl(char.file)
      if (url) {
        await download(url, rawFile)
      } else {
        console.error(`Could not resolve URL for ${char.id}`)
        continue
      }
    }

    console.log(`Processing ${char.id}...`)
    const outFile = path.join(OUT_DIR, `${char.id}.webp`)

    try {
      if (char.type === 'transparent') {
        const raw = sharp(rawFile)
        const meta = await raw.metadata()
        const trimmed = meta.hasAlpha ? raw.trim() : raw

        const maxW = Math.round(720 * char.scale)
        const maxH = Math.round(720 * char.scale)

        const resized = await trimmed
          .resize({
            width: maxW,
            height: maxH,
            fit: 'inside',
            kernel: sharp.kernel.lanczos3
          })
          .toBuffer({ resolveWithObject: true })

        const left = Math.round((1000 - resized.info.width) / 2)
        const top = Math.round(820 - resized.info.height - 15 + char.offsetY)

        await sharp(bgBuffer)
          .composite([
            {
              input: resized.data,
              left: Math.max(0, left),
              top: Math.max(0, top)
            },
            {
              input: fadeBuffer,
              left: 0,
              top: 0
            }
          ])
          .webp({ quality: 90 })
          .toFile(outFile)

      } else {
        // Feathered bust composite
        const bust = await sharp(rawFile)
          .resize(720, 720, { fit: 'cover', position: 'top' })
          .composite([{ input: maskBuffer, blend: 'dest-in' }])
          .png()
          .toBuffer()

        await sharp(bgBuffer)
          .composite([
            {
              input: bust,
              left: 140,
              top: 50 + char.offsetY
            },
            {
              input: fadeBuffer,
              left: 0,
              top: 0
            }
          ])
          .webp({ quality: 90 })
          .toFile(outFile)
      }

      console.log(`✓ Generated ${char.id}.webp`)
    } catch (err) {
      console.error(`Error processing ${char.id}:`, err)
    }
  }

  console.log('All 33 character portraits successfully generated!')
}

run()
