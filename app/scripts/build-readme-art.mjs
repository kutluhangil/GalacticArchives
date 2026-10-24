// The animated README artwork in docs/brand/readme-*.svg. Pure SVG + CSS
// animation: GitHub shows README SVGs as <img>, so no script runs and no
// external font loads — the title face is embedded as a data URI. The hero's
// counts are written in by hand below; rerun after the archive grows.
//
// Usage: node scripts/build-readme-art.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = `${ROOT}/docs/brand`
const FONTS = `${ROOT}/app/node_modules/@fontsource/barlow-condensed/files`
const b64 = (f) => readFileSync(`${FONTS}/${f}`).toString('base64')

const GOLD = '#ffe81f'
const CYAN = '#66d9ff'
const RED = '#e0312e'
const SPACE = '#030509'

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let x = Math.imul(s ^ (s >>> 15), 1 | s)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}
const f1 = (n) => Math.round(n * 10) / 10

function fontFace({ ext = false } = {}) {
  const latin = `@font-face{font-family:'BC';font-weight:600;src:url(data:font/woff2;base64,${b64('barlow-condensed-latin-600-normal.woff2')}) format('woff2');unicode-range:U+0000-00FF,U+2000-206F,U+20AC,U+2122;}`
  const latinExt = ext
    ? `@font-face{font-family:'BC';font-weight:600;src:url(data:font/woff2;base64,${b64('barlow-condensed-latin-ext-600-normal.woff2')}) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;}`
    : ''
  return latin + latinExt
}
const REDUCED = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}'

function stars(r, n, w, h, { maxR = 1.3, twinkle = true } = {}) {
  let out = ''
  for (let i = 0; i < n; i++) {
    const x = f1(r() * w)
    const y = f1(r() * h)
    const rad = f1(0.3 + r() ** 3 * maxR)
    const op = f1(0.35 + r() * 0.65)
    const tw = twinkle && r() < 0.35
    const cls = tw ? ` class="tw" style="animation-delay:-${f1(r() * 6)}s;animation-duration:${f1(2.5 + r() * 4)}s"` : ''
    const fill = r() < 0.12 ? CYAN : r() < 0.08 ? '#ffd9a8' : '#fff'
    out += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" opacity="${op}"${cls}/>`
  }
  return out
}

// ---------------------------------------------------------------- hero
function hero() {
  const W = 1200
  const H = 440
  const cx = W / 2
  const cy = 200
  const r = rng(1977)
  // hyperspace streaks: radial lines that sit as dots, stretch on the jump, flash
  let streaks = ''
  for (let i = 0; i < 140; i++) {
    const a = r() * Math.PI * 2
    const r0 = 40 + r() * 260
    const len = 220 + r() * 520
    const x1 = cx + Math.cos(a) * r0
    const y1 = cy + Math.sin(a) * r0 * 0.62
    const x2 = cx + Math.cos(a) * (r0 + len)
    const y2 = cy + Math.sin(a) * (r0 + len) * 0.62
    const L = Math.round(Math.hypot(x2 - x1, y2 - y1))
    streaks += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" style="--l:${L}px;stroke-dasharray:1.6 ${L + 10}" class="st" stroke="${r() < 0.3 ? CYAN : '#e8f6ff'}"/>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Galactic Archives</title>
<desc id="d">Animated banner: a starfield jumps to hyperspace behind the Galactic Archives title.</desc>
<style>${fontFace({ ext: true })}
.tw{animation:tw ease-in-out infinite alternate}
@keyframes tw{from{opacity:.15}to{opacity:1}}
.st{stroke-width:1.3;stroke-linecap:round;fill:none;animation:jump 12s cubic-bezier(.6,0,.3,1) infinite}
@keyframes jump{0%,55%{stroke-dasharray:1.6 2000;opacity:.8}70%{stroke-dasharray:var(--l) 2000;opacity:1}78%{stroke-dasharray:var(--l) 2000;opacity:0}79%,100%{stroke-dasharray:1.6 2000;opacity:0}}
.stars{animation:calm 12s ease-in-out infinite}
@keyframes calm{0%,52%{opacity:1}60%,80%{opacity:0}92%,100%{opacity:1}}
.flash{animation:flash 12s linear infinite;opacity:0}
@keyframes flash{0%,68%{opacity:0}71%{opacity:.85}82%{opacity:0}100%{opacity:0}}
.neb{animation:drift 30s ease-in-out infinite alternate;transform-origin:center}
@keyframes drift{from{transform:translate(-20px,6px) scale(1)}to{transform:translate(24px,-8px) scale(1.08)}}
.title{font:600 84px 'BC',Impact,'Arial Narrow',sans-serif;letter-spacing:.26em;fill:${GOLD};animation:glow 4s ease-in-out infinite}
@keyframes glow{0%,100%{opacity:1}50%{opacity:.86}}
.sub{font:600 19px 'BC','Arial Narrow',sans-serif;letter-spacing:.42em;fill:${CYAN}}
.hud{font:600 14px 'BC','Arial Narrow',sans-serif;letter-spacing:.3em;fill:#8fa3b8}
.scan{animation:scan 6s linear infinite}
@keyframes scan{from{transform:translateY(-40px)}to{transform:translateY(${H + 40}px)}}
.blink{animation:blink 1.2s steps(2) infinite}
@keyframes blink{50%{opacity:0}}
${REDUCED}
</style>
<defs>
<radialGradient id="bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#0b1424"/><stop offset=".55" stop-color="#050912"/><stop offset="1" stop-color="${SPACE}"/></radialGradient>
<radialGradient id="n1"><stop offset="0" stop-color="#5b3aa8" stop-opacity=".45"/><stop offset="1" stop-color="#5b3aa8" stop-opacity="0"/></radialGradient>
<radialGradient id="n2"><stop offset="0" stop-color="${CYAN}" stop-opacity=".22"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></radialGradient>
<radialGradient id="fl"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#bfefff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="sc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${CYAN}" stop-opacity="0"/><stop offset=".5" stop-color="${CYAN}" stop-opacity=".12"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></linearGradient>
<filter id="glow" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<g class="neb"><ellipse cx="300" cy="140" rx="380" ry="170" fill="url(#n1)"/><ellipse cx="930" cy="290" rx="420" ry="160" fill="url(#n2)"/></g>
<g class="stars">${stars(r, 230, W, H)}</g>
<g>${streaks}</g>
<ellipse class="flash" cx="${cx}" cy="${cy}" rx="700" ry="380" fill="url(#fl)"/>
<rect class="scan" x="0" y="0" width="${W}" height="40" fill="url(#sc)"/>
<g fill="none" stroke="${CYAN}" stroke-width="2" opacity=".7">
<path d="M28 60V28h32M${W - 60} 28h32v32M28 ${H - 60}v32h32M${W - 60} ${H - 28}h32v-32"/>
</g>
<text x="40" y="52" class="hud">◉ HOLONET</text><text x="148" y="52" class="hud blink" fill="${RED}" style="fill:${RED}">●</text>
<text x="${W - 40}" y="52" class="hud" text-anchor="end">ARŞİV DÜĞÜMÜ // 88</text>
<g filter="url(#glow)"><text x="${cx + 11}" y="${cy + 30}" class="title" text-anchor="middle">GALACTIC ARCHIVES</text></g>
<text x="${cx + 4}" y="${cy + 82}" class="sub" text-anchor="middle">ÇOK UZAK BİR GALAKSİNİN ETKİLEŞİMLİ 3B ATLASI</text>
<line x1="${cx - 260}" x2="${cx + 260}" y1="${cy + 108}" y2="${cy + 108}" stroke="${GOLD}" stroke-opacity=".35"/>
<text x="${cx + 2}" y="${cy + 140}" class="hud" text-anchor="middle">88 GÖK CİSMİ · 23 HİPERUZAY HATTI · 15 SAVAŞ · 33 FİGÜR · 0 BACKEND</text>
<text x="40" y="${H - 36}" class="hud" opacity=".7">REACT 19 · THREE.JS · GLSL</text>
<text x="${W - 40}" y="${H - 36}" class="hud" text-anchor="end" opacity=".7">TR / EN · WEB + macOS</text>
</g>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="18" fill="none" stroke="${CYAN}" stroke-opacity=".25" stroke-width="1.5"/>
</svg>`
}

// ---------------------------------------------------------------- crawl
function crawl() {
  const W = 1200
  const H = 560
  const r = rng(1980)
  const lines = [
    ['ep', 'BÖLÜM IV'],
    ['head', 'BİR ARŞİV UYANIYOR'],
    ['gap', ''],
    ['p', 'Galaksi bölünmüş durumda. Seksen sekiz'],
    ['p', 'dünya, yirmi üç hiperuzay hattı ve dört'],
    ['p', 'dönem boyunca savaşlar, imparatorluklar'],
    ['p', 've kahramanlar dağınık kayıtlarda kayboldu.'],
    ['gap', ''],
    ['p', 'Tek bir sunucuya, tek bir hesaba ihtiyaç'],
    ['p', 'duymayan bir atlas, her gezegeni ışık ve'],
    ['p', 'gölgeyle yeniden çizmek için yola çıktı:'],
    ['p', 'her satırı Wookieepedia’dan kaynaklı,'],
    ['p', 'her yüzeyi gerçek zamanlı bir shader...'],
    ['gap', ''],
    ['p', 'Şimdi Holocron açık. Rota çizilmeyi'],
    ['p', 'bekliyor ve sıçrama koordinatları hazır.'],
  ]
  const D = 30 // seconds a line takes from the bottom edge to the vanishing point
  const START = 5.5
  const y0 = H + 30
  const yh = 120
  const SPACING = { ep: 46, head: 64, p: 38, gap: 30 }
  // line i starts when the text below it has climbed its spacing
  const speed = (y0 - yh) / D
  let t = START
  const placed = []
  for (const [kind, text] of lines) {
    placed.push({ kind, text, delay: t })
    t += SPACING[kind] / speed
  }
  const T = Math.ceil(t + D + 3)
  const frac = (D / T) * 100
  const kf = `@keyframes cr{0%{transform:translateY(0) scale(1);opacity:0}${f1(frac * 0.04)}%{opacity:1}${f1(frac * 0.72)}%{opacity:.85}${f1(frac)}%{transform:translateY(-${y0 - yh}px) scale(.04);opacity:0}100%{transform:translateY(-${y0 - yh}px) scale(.04);opacity:0}}`
  const items = placed
    .filter((l) => l.kind !== 'gap')
    .map((l) => {
      const cls = l.kind === 'p' ? 'cp' : l.kind === 'head' ? 'ch' : 'ce'
      return `<text x="${W / 2}" y="${y0}" text-anchor="middle" class="c ${cls}" style="animation-delay:${f1(l.delay)}s">${l.text}</text>`
    })
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Bölüm IV — Bir Arşiv Uyanıyor</title>
<desc id="d">Açılış yazısı: "Uzun zaman önce, çok çok uzak bir galakside…" ardından projeyi anlatan, ufka doğru kayan altın renkli metin.</desc>
<style>${fontFace({ ext: true })}
.tw{animation:tw ease-in-out infinite alternate}
@keyframes tw{from{opacity:.15}to{opacity:.9}}
.intro{font:600 30px 'BC','Arial Narrow',sans-serif;letter-spacing:.06em;fill:#4bd5ee;opacity:0;animation:intro ${T}s linear infinite}
@keyframes intro{0%{opacity:0}${f1((0.6 / T) * 100)}%{opacity:1}${f1((3.8 / T) * 100)}%{opacity:1}${f1((5 / T) * 100)}%{opacity:0}100%{opacity:0}}
.c{fill:${GOLD};opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:cr ${T}s linear infinite}
.cp{font:600 34px 'BC','Arial Narrow',sans-serif;letter-spacing:.04em}
.ch{font:600 58px 'BC',Impact,'Arial Narrow',sans-serif;letter-spacing:.14em}
.ce{font:600 30px 'BC','Arial Narrow',sans-serif;letter-spacing:.3em}
${kf}
${REDUCED}
@media (prefers-reduced-motion: reduce){.intro{opacity:1}}
</style>
<defs>
<linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="1"/><stop offset=".32" stop-color="#000" stop-opacity="0"/></linearGradient>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="#000"/>
<g>${stars(r, 170, W, H, { maxR: 0.9 })}</g>
<text x="${W / 2}" y="${H / 2}" text-anchor="middle" class="intro">Uzun zaman önce, çok çok uzak bir galakside…</text>
${items}
<rect width="${W}" height="${H}" fill="url(#fade)"/>
</g>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="18" fill="none" stroke="${GOLD}" stroke-opacity=".18" stroke-width="1.5"/>
</svg>`
}

// ---------------------------------------------------------------- saber divider
function saber() {
  const W = 1200
  const H = 70
  const y = H / 2
  const hilt = (x, dir) => {
    const s = dir
    return `<g transform="translate(${x} ${y})"><rect x="${s > 0 ? -58 : 0}" y="-6" width="58" height="12" rx="2" fill="#9aa4ad"/><rect x="${s > 0 ? -52 : 6}" y="-7.5" width="8" height="15" rx="1.5" fill="#2b3138"/><rect x="${s > 0 ? -34 : 20}" y="-7" width="14" height="14" rx="1.5" fill="#3a424b"/><rect x="${s > 0 ? -14 : 4}" y="-8" width="10" height="16" rx="2" fill="#c9d1d8"/><circle cx="${s > 0 ? -27 : 31}" cy="0" r="2.4" fill="${s > 0 ? CYAN : RED}"/></g>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Ayırıcı: çarpışan iki ışın kılıcı">
<style>
.b{transform-box:fill-box;stroke-linecap:round;animation:ign 9s cubic-bezier(.2,.9,.3,1) infinite}
.l{transform-origin:0% 50%}.r{transform-origin:100% 50%}
@keyframes ign{0%,6%{transform:scaleX(0)}16%,78%{transform:scaleX(1)}86%,100%{transform:scaleX(0)}}
.hum{animation:hum .11s steps(2) infinite}
@keyframes hum{50%{opacity:.82}}
.clash{opacity:0;transform-box:fill-box;transform-origin:center;animation:clash 9s ease-out infinite}
@keyframes clash{0%,15%{opacity:0;transform:scale(.3)}16.5%{opacity:1;transform:scale(1.4)}22%{opacity:.25;transform:scale(1)}40%{opacity:0}46%{opacity:.9;transform:scale(1.1)}52%,100%{opacity:0;transform:scale(.6)}}
${REDUCED}
@media (prefers-reduced-motion: reduce){.b{transform:scaleX(1)}}
</style>
<defs>
<filter id="g" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><feGaussianBlur stdDeviation="5"/></filter>
<radialGradient id="sp"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffe7b0" stop-opacity=".8"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
</defs>
${hilt(62, 1)}
${hilt(W - 62, -1)}
<g class="hum">
<line class="b l" x1="64" x2="${W / 2 + 4}" y1="${y}" y2="${y}" stroke="${CYAN}" stroke-width="14" filter="url(#g)"/>
<line class="b l" x1="64" x2="${W / 2 + 4}" y1="${y}" y2="${y}" stroke="#eafaff" stroke-width="4"/>
<line class="b r" x1="${W / 2 - 4}" x2="${W - 64}" y1="${y}" y2="${y}" stroke="${RED}" stroke-width="14" filter="url(#g)"/>
<line class="b r" x1="${W / 2 - 4}" x2="${W - 64}" y1="${y}" y2="${y}" stroke="#ffe9e6" stroke-width="4"/>
</g>
<ellipse class="clash" cx="${W / 2}" cy="${y}" rx="34" ry="22" fill="url(#sp)"/>
</svg>`
}

// ---------------------------------------------------------------- holotable galaxy
function holotable() {
  const W = 1200
  const H = 460
  const cx = W / 2
  const cy = 236
  const r = rng(2005)
  let arms = ''
  for (let arm = 0; arm < 4; arm++) {
    for (let i = 0; i < 150; i++) {
      const t = i / 150
      const rad = 18 + t * 330
      const a = arm * (Math.PI / 2) + t * 4.2 + (r() - 0.5) * 0.45
      const jitter = (r() - 0.5) * 26 * (0.4 + t)
      const x = Math.cos(a) * rad + jitter
      const y = Math.sin(a) * rad + (r() - 0.5) * 26 * (0.4 + t)
      const op = f1(Math.min(1, (1 - t * 0.55) * (0.6 + r() * 0.6)))
      arms += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1 + r() * 2.2)}" fill="${r() < 0.25 ? '#fff' : CYAN}" opacity="${op}"/>`
    }
  }
  // worlds on the disc: gold = archive worlds, red = battle sites, joined by a lane
  const worlds = [
    [0.9, 60, GOLD], [2.4, 120, GOLD], [3.3, 210, RED], [4.6, 160, GOLD], [5.5, 260, RED],
    [1.6, 290, GOLD], [0.2, 230, RED], [4.0, 300, GOLD], [2.9, 80, GOLD],
  ]
  const pos = worlds.map(([a, rad, c]) => [Math.cos(a) * rad, Math.sin(a) * rad, c])
  const lane = [0, 8, 1, 5, 7, 3, 2, 4].map((i) => `${f1(pos[i][0])},${f1(pos[i][1])}`).join(' ')
  const nodes = pos
    .map(([x, y, c], i) => `<g transform="translate(${f1(x)} ${f1(y)})"><circle r="10" fill="none" stroke="${c}" stroke-width="2.5" class="pulse" style="animation-delay:-${f1(i * 0.37)}s"/><circle r="5" fill="${c}"/></g>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Holotablo</title>
<desc id="d">Dönen hologram galaksi: sarmal kollar, altın arşiv dünyaları, kırmızı savaş alanları ve akan bir hiperuzay hattı.</desc>
<style>${fontFace({ ext: true })}
.spin{animation:spin 90s linear infinite;transform-origin:0 0}
@keyframes spin{to{transform:rotate(360deg)}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.6s ease-out infinite}
@keyframes pulse{0%{transform:scale(.4);opacity:1}100%{transform:scale(2.4);opacity:0}}
.lane{stroke-dasharray:6 10;animation:flow 2s linear infinite}
@keyframes flow{to{stroke-dashoffset:-32}}
.sweep{animation:spin 7s linear infinite;transform-origin:0 0}
.hud{font:600 14px 'BC','Arial Narrow',sans-serif;letter-spacing:.3em;fill:#8fa3b8}
.hudc{font:600 14px 'BC','Arial Narrow',sans-serif;letter-spacing:.3em;fill:${CYAN}}
.flick{animation:flick 5s steps(1) infinite}
@keyframes flick{0%,96%{opacity:1}97%{opacity:.4}98%{opacity:1}99%{opacity:.6}}
${REDUCED}
</style>
<defs>
<radialGradient id="bg" cx="50%" cy="55%" r="70%"><stop offset="0" stop-color="#071a2a"/><stop offset="1" stop-color="${SPACE}"/></radialGradient>
<radialGradient id="core"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#fff3c4" stop-opacity=".9"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
<radialGradient id="beam" cx="50%" cy="100%" r="100%"><stop offset="0" stop-color="${CYAN}" stop-opacity=".22"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></radialGradient>
<linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="${CYAN}" stop-opacity="0"/><stop offset="1" stop-color="${CYAN}" stop-opacity=".35"/></linearGradient>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path d="M${cx - 380} ${H} L${cx - 150} ${cy} L${cx + 150} ${cy} L${cx + 380} ${H} Z" fill="url(#beam)"/>
<g transform="translate(${cx} ${cy}) scale(1 .42)">
<g class="flick">
<circle r="350" fill="none" stroke="${CYAN}" stroke-opacity=".25" stroke-width="2"/>
<circle r="250" fill="none" stroke="${CYAN}" stroke-opacity=".14" stroke-width="2" stroke-dasharray="4 8"/>
<circle r="140" fill="none" stroke="${CYAN}" stroke-opacity=".14" stroke-width="2"/>
<g class="spin">${arms}
<polyline points="${lane}" fill="none" stroke="${GOLD}" stroke-opacity=".75" stroke-width="2.5" class="lane"/>
${nodes}
</g>
<g class="sweep"><path d="M0 0 L350 0 A350 350 0 0 0 303 -175 Z" fill="url(#sw)"/></g>
<circle r="70" fill="url(#core)"/>
</g>
</g>
<ellipse cx="${cx}" cy="${H - 22}" rx="360" ry="16" fill="none" stroke="${CYAN}" stroke-opacity=".5" stroke-width="2"/>
<text x="40" y="48" class="hudc">◈ HOLOTABLO</text>
<text x="40" y="72" class="hud">GALAKSİ HARİTASI // CANLI</text>
<text x="${W - 40}" y="48" class="hud" text-anchor="end"><tspan fill="${GOLD}" style="fill:${GOLD}">●</tspan> ARŞİV DÜNYASI</text>
<text x="${W - 40}" y="72" class="hud" text-anchor="end"><tspan fill="${RED}" style="fill:${RED}">●</tspan> SAVAŞ ALANI</text>
<text x="${W - 40}" y="96" class="hud" text-anchor="end"><tspan fill="${GOLD}" style="fill:${GOLD}">━</tspan> HİPERUZAY HATTI</text>
</g>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="18" fill="none" stroke="${CYAN}" stroke-opacity=".25" stroke-width="1.5"/>
</svg>`
}

const files = {
  'readme-hero.svg': hero(),
  'readme-crawl.svg': crawl(),
  'readme-saber.svg': saber(),
  'readme-holotable.svg': holotable(),
}
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(`${OUT}/${name}`, svg)
  console.log(name, (Buffer.byteLength(svg) / 1024).toFixed(1), 'KB')
}
