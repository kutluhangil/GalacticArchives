// Landing: the archive's front door. Load sequence is one orchestrated beat —
// crawl line, then a holo scan sweep that reveals the wordmark, then the CTAs.
// Featured world cards take their gradient straight from each planet's own
// render palette and are labelled with its canon Galactic Atlas grid
// reference, so the page is built from the archive's real material.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { CelestialBody } from '../types/lore'
import { L, loadAllPlanets } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'

const FEATURED = ['tatooine', 'coruscant', 'mustafar', 'hoth', 'kamino', 'exegol']

/** Lightweight drifting starfield — 2D canvas keeps the landing LCP cheap
 *  while the WebGL engines stay behind the route split. */
function Starfield({ still }: { still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    let w = 0
    let h = 0
    let stars: { x: number; y: number; r: number; a: number; tw: number }[] = []

    const seed = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round((w * h) / 5200)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.86 ? 0.55 + Math.random() * 0.7 : 1.1 + Math.random() * 0.9,
        a: 0.25 + Math.random() * 0.6,
        tw: Math.random() < 0.3 ? 0.4 + Math.random() * 1.6 : 0,
      }))
    }
    seed()

    let raf = 0
    const start = performance.now()
    const draw = () => {
      const time = (performance.now() - start) / 1000
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        const alpha = s.tw ? s.a * (0.72 + 0.28 * Math.sin(time * s.tw + s.x)) : s.a
        ctx.fillStyle = `rgba(214, 230, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      if (!still) raf = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      seed()
      if (still) draw()
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [still])

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />
}

function WorldCard({ body, lang }: { body: CelestialBody; lang: 'en' | 'tr' }) {
  const { primary, secondary } = body.renderRecipe.palette
  return (
    <Link
      to={`/planet/${body.id}`}
      className="group relative block overflow-hidden rounded-lg border border-white/10 transition-colors hover:border-holo-cyan/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-cyan"
    >
      <div
        className="h-32 w-full transition-transform duration-500 group-hover:scale-105"
        style={{
          background: `radial-gradient(120% 130% at 30% 25%, ${primary} 0%, ${secondary ?? primary} 55%, #05070c 100%)`,
        }}
      />
      <div className="flex items-baseline justify-between gap-2 bg-panel/90 px-3 py-2">
        <span className="font-display text-[13px] tracking-[0.18em] text-slate-100">
          {L(body.names, lang).toUpperCase()}
        </span>
        <span className="font-hud text-[11px] tracking-[0.2em] text-holo-cyan/70">
          {body.coordinates ?? '—'}
        </span>
      </div>
    </Link>
  )
}

export default function Landing() {
  const lang = useApp((s) => s.lang)
  const setLang = useApp((s) => s.setLang)
  const [featured, setFeatured] = useState<CelestialBody[]>([])
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // phase 0: crawl line · 1: wordmark scan · 2: settled
  const [phase, setPhase] = useState(reduced ? 2 : 0)

  useEffect(() => {
    loadAllPlanets().then((all) =>
      setFeatured(FEATURED.map((id) => all.find((p) => p.id === id)).filter(Boolean) as CelestialBody[]),
    )
  }, [])

  useEffect(() => {
    if (reduced) return
    const toWordmark = window.setTimeout(() => setPhase(1), 2100)
    const toSettled = window.setTimeout(() => setPhase(2), 3400)
    return () => {
      window.clearTimeout(toWordmark)
      window.clearTimeout(toSettled)
    }
  }, [reduced])

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-space">
      <section className="relative flex min-h-full flex-col items-center justify-center px-6 py-20">
        <Starfield still={reduced} />
        {/* faint Galactic Atlas grid — the archive's own coordinate vernacular */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #66D9FF 1px, transparent 1px), linear-gradient(to bottom, #66D9FF 1px, transparent 1px)',
            backgroundSize: '88px 88px',
            maskImage: 'radial-gradient(circle at 50% 45%, black 5%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 45%, black 5%, transparent 72%)',
          }}
        />

        <button
          onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
          className="absolute right-6 top-6 z-20 rounded border border-white/10 bg-black/30 px-2 py-1 font-hud text-[12px] font-semibold tracking-wider text-slate-300 transition-colors hover:text-holo-cyan"
        >
          {lang === 'tr' ? 'EN' : 'TR'}
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
          <p
            className={`max-w-xl font-display text-[15px] leading-relaxed tracking-[0.12em] text-[#4B77D6] transition-opacity duration-700 sm:text-[17px] ${
              phase === 0 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {t('crawlIntro', lang)}
          </p>

          <div
            className={`transition-all duration-700 ${
              phase === 0 ? '-mt-10 opacity-0' : 'mt-6 opacity-100'
            }`}
          >
            <h1 className="relative font-display text-[clamp(2rem,8.5vw,4.6rem)] font-black leading-[0.95] tracking-[0.16em] text-star-gold drop-shadow-[0_0_28px_rgba(255,232,31,0.28)]">
              GALACTIC
              <br />
              ARCHIVES
              {/* holo scan sweep: one pass as the wordmark resolves */}
              {phase === 1 && (
                <span
                  aria-hidden
                  className="absolute inset-x-[-8%] top-0 h-full animate-[scan_1.3s_ease-out_1]"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 0%, rgba(102,217,255,0.55) 48%, rgba(102,217,255,0.9) 50%, rgba(102,217,255,0.55) 52%, transparent 100%)',
                    mixBlendMode: 'screen',
                  }}
                />
              )}
            </h1>
            <p className="mt-4 font-hud text-[13px] uppercase tracking-[0.42em] text-slate-400">
              {t('tagline', lang)}
            </p>
          </div>

          <div
            className={`mt-10 flex flex-col gap-3 transition-opacity duration-700 sm:flex-row ${
              phase === 2 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Link
              to="/galaxy"
              className="rounded border border-star-gold/60 bg-star-gold/10 px-6 py-2.5 font-hud text-[14px] tracking-[0.28em] text-star-gold transition-colors hover:bg-star-gold/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-star-gold"
            >
              {t('exploreCta', lang)}
            </Link>
            <Link
              to="/holocron"
              className="rounded border border-holo-cyan/40 bg-holo-cyan/5 px-6 py-2.5 font-hud text-[14px] tracking-[0.28em] text-holo-cyan transition-colors hover:bg-holo-cyan/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-cyan"
            >
              {t('holocronCta', lang)}
            </Link>
          </div>
        </div>

        <div
          className={`absolute bottom-8 font-hud text-[11px] uppercase tracking-[0.4em] text-slate-400 transition-opacity duration-700 ${
            phase === 2 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {t('scrollHint', lang)} ↓
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <h2 className="mb-5 font-hud text-[12px] uppercase tracking-[0.4em] text-slate-400">
          {t('featuredWorlds', lang)}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((body) => (
            <WorldCard key={body.id} body={body} lang={lang} />
          ))}
        </div>
        <p className="mt-14 max-w-2xl font-hud text-[11px] leading-relaxed text-slate-400">
          {t('disclaimer', lang)}
        </p>
      </section>
    </div>
  )
}
