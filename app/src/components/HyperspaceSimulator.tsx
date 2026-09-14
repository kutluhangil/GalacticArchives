import { useEffect, useRef, useState } from 'react'
import { calculateHyperspaceRoute } from '../lib/hyperspace'
import { L, loadAllPlanets } from '../lib/lore'
import type { CelestialBody } from '../types/lore'
import { useApp } from '../state/app'
import { sfx } from '../lib/audio'
import ModalShell from './ModalShell'

export default function HyperspaceSimulator({ onClose }: { onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const [planets, setPlanets] = useState<CelestialBody[]>([])
  const [origin, setOrigin] = useState<string>('coruscant')
  const [dest, setDest] = useState<string>('tatooine')
  const [warping, setWarping] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadAllPlanets().then(setPlanets)
  }, [])

  const route = calculateHyperspaceRoute(origin, dest)

  const startWarp = () => {
    sfx.playHyperspace()
    setWarping(true)
    setTimeout(() => {
      setWarping(false)
    }, 2800)
  }

  // Fullscreen Hyperspace Particles Canvas Animation
  useEffect(() => {
    if (!warping || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const stars: { x: number; y: number; z: number }[] = []
    for (let i = 0; i < 400; i++) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width,
        y: (Math.random() - 0.5) * canvas.height,
        z: Math.random() * canvas.width,
      })
    }

    let animId: number
    const render = () => {
      ctx.fillStyle = 'rgba(2, 6, 14, 0.25)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = '#66D9FF'
      ctx.lineWidth = 2

      const cx = canvas.width / 2
      const cy = canvas.height / 2

      for (const s of stars) {
        s.z -= 25
        if (s.z <= 0) s.z = canvas.width

        const k = 128 / s.z
        const px = s.x * k + cx
        const py = s.y * k + cy

        const prevK = 128 / (s.z + 40)
        const ppx = s.x * prevK + cx
        const ppy = s.y * prevK + cy

        ctx.beginPath()
        ctx.moveTo(ppx, ppy)
        ctx.lineTo(px, py)
        ctx.stroke()
      }

      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [warping])

  const originName = planets.find((p) => p.id === origin) ? L(planets.find((p) => p.id === origin)?.names, lang) : origin
  const destName = planets.find((p) => p.id === dest) ? L(planets.find((p) => p.id === dest)?.names, lang) : dest

  return (
    <ModalShell
      title={`🚀 ${lang === 'tr' ? 'HİPERUZAY ROTA SİCİLİ' : 'HYPERSPACE ROUTE CALCULATOR'}`}
      onClose={onClose}
      panelClassName="max-w-xl"
      backdrop={warping ? <canvas ref={canvasRef} className="absolute inset-0 z-10 h-full w-full" /> : null}
    >

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              {lang === 'tr' ? 'Kalkış Gezegeni' : 'Origin World'}
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full rounded border border-white/15 bg-black/50 p-2 text-xs text-slate-200 outline-hidden"
            >
              {planets.map((p) => (
                <option key={p.id} value={p.id}>{L(p.names, lang)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              {lang === 'tr' ? 'Hedef Gezegen' : 'Destination World'}
            </label>
            <select
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              className="w-full rounded border border-white/15 bg-black/50 p-2 text-xs text-slate-200 outline-hidden"
            >
              {planets.map((p) => (
                <option key={p.id} value={p.id}>{L(p.names, lang)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-black/40 p-4 space-y-2 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">{lang === 'tr' ? 'Ticaret Rotası:' : 'Hyperlane:'}</span>
            <span className="font-hud text-holo-cyan">{L(route.hyperlane.name, lang)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{lang === 'tr' ? 'Mesafe:' : 'Distance:'}</span>
            <span className="font-hud text-star-gold">{route.distanceParsecs} Parsec</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{lang === 'tr' ? 'Tahmini Hız Süresi:' : 'Class 1.0 Duration:'}</span>
            <span className="font-hud text-slate-200">{route.class1TravelHours} {lang === 'tr' ? 'Saat' : 'Hours'}</span>
          </div>
        </div>

        <button
          onClick={startWarp}
          disabled={warping}
          className="mt-6 w-full rounded border border-holo-cyan/60 bg-holo-cyan/20 py-2.5 font-hud text-xs font-bold uppercase tracking-[0.25em] text-holo-cyan transition-all hover:bg-holo-cyan/30 hover:shadow-[0_0_15px_rgba(102,217,255,0.4)] disabled:opacity-50"
        >
          {warping
            ? (lang === 'tr' ? '⚡ HİPERUZAY SIÇRAMASI YAPILIYOR...' : '⚡ WARPING THROUGH HYPERSPACE...')
            : (lang === 'tr' ? `⚡ ${originName} -> ${destName} SIÇRAMA YAP` : `⚡ JUMP HYPERSPACE TO ${destName}`)}
        </button>
    </ModalShell>
  )
}
