// Full-screen hyperspace jump: 2D-canvas star streaks accelerating into a
// white flash. Mounted globally; renders only while state.jumping is true.

import { useEffect, useRef } from 'react'
import { useApp } from '../state/app'

const DURATION = 1050

export default function HyperspaceOverlay() {
  const jumping = useApp((s) => s.jumping)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!jumping) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2

    const stars = Array.from({ length: 320 }, () => {
      const ang = Math.random() * Math.PI * 2
      return {
        ang,
        dist: 20 + Math.random() * Math.max(w, h) * 0.5,
        speed: 0.5 + Math.random() * 1.6,
        hue: 195 + Math.random() * 30,
      }
    })

    const start = performance.now()
    let raf = 0
    const draw = () => {
      const t = (performance.now() - start) / DURATION
      if (t >= 1) return
      raf = requestAnimationFrame(draw)
      const accel = Math.pow(t, 2.2) * 60
      ctx.fillStyle = `rgba(2,4,9,${t < 0.15 ? 0.9 : 0.32})`
      ctx.fillRect(0, 0, w, h)
      ctx.lineCap = 'round'
      for (const s of stars) {
        const stretch = 2 + accel * s.speed * 6
        const r0 = s.dist + accel * s.speed * 14
        const x0 = cx + Math.cos(s.ang) * r0
        const y0 = cy + Math.sin(s.ang) * r0
        const x1 = cx + Math.cos(s.ang) * (r0 + stretch)
        const y1 = cy + Math.sin(s.ang) * (r0 + stretch)
        ctx.strokeStyle = `hsla(${s.hue}, 80%, ${70 + t * 25}%, ${0.5 + t * 0.5})`
        ctx.lineWidth = (1 + t * 2.5) * dpr
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
      if (t > 0.72) {
        ctx.fillStyle = `rgba(255,255,255,${((t - 0.72) / 0.28) * 0.95})`
        ctx.fillRect(0, 0, w, h)
      }
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [jumping])

  if (!jumping) return null
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden
    />
  )
}
