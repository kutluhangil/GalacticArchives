// CockpitHUDModal — Interactive Star Wars Cockpit Flight Telemetry & Targeting Computer
// Wireframe targeting vectors, sublight throttle control, deflector shield balancing,
// and hyperdrive jump simulation.

import { useCallback, useEffect, useState } from 'react'
import type { Starship } from '../types/lore'
import { L } from '../lib/lore'
import Aurebesh from './Aurebesh'
import { useLater } from '../hooks/useLater'

interface Props {
  starship: Starship | null
  onClose: () => void
  lang: 'en' | 'tr'
}

export default function CockpitHUDModal({ starship, onClose, lang }: Props) {
  const [throttle, setThrottle] = useState(65)
  const [sFoilsLocked, setSFoilsLocked] = useState(false)
  const [shieldForward, setShieldForward] = useState(50)
  const [targetDistance, setTargetDistance] = useState(1450)
  const [targetLocked, setTargetLocked] = useState(false)
  const [isFiring, setIsFiring] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const later = useLater()

  const triggerFire = useCallback(() => {
    setIsFiring(true)
    later(() => setIsFiring(false), 200)
  }, [later])

  useEffect(() => {
    if (!starship) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowUp') setThrottle((t) => Math.min(100, t + 5))
      if (e.key === 'ArrowDown') setThrottle((t) => Math.max(0, t - 5))
      if (e.key === ' ') {
        e.preventDefault()
        triggerFire()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [starship, onClose, triggerFire])

  // Countdown target distance. 10 Hz is plenty for a whole-metre readout; the
  // old per-frame rAF loop re-rendered the entire HUD 60 times a second.
  useEffect(() => {
    if (!starship) return
    const TICK = 0.1
    const id = window.setInterval(() => {
      setTargetDistance((dist) => {
        const next = dist - (throttle / 100) * 400 * TICK
        if (next <= 120) setTargetLocked(true)
        return next <= 10 ? 2500 : next
      })
    }, TICK * 1000)
    return () => clearInterval(id)
  }, [starship, throttle])

  if (!starship) return null

  const isImperial = starship.id.includes('destroyer') || starship.id.includes('tie') || starship.id.includes('executor')
  const hudTextColor = isImperial ? 'text-red-400' : 'text-emerald-400'
  const hudBorderColor = isImperial ? 'border-red-500/40' : 'border-emerald-500/40'
  const hudBgColor = isImperial ? 'bg-red-950/20' : 'bg-emerald-950/20'

  const maxSublight = starship.sublightMGLT ?? 80
  const currentSpeedKmH = Math.round((throttle / 100) * (starship.maxSpeed ? parseInt(starship.maxSpeed) || 1050 : 1050))
  const currentMGLT = Math.round((throttle / 100) * maxSublight)

  const triggerHyperdrive = () => {
    if (isJumping) return
    setIsJumping(true)
    later(() => {
      setIsJumping(false)
      setTargetDistance(3200)
      setTargetLocked(false)
    }, 2400)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cockpit-hud-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none animate-fade-in p-2 sm:p-4"
    >
      <div className={`relative flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border ${hudBorderColor} bg-space-dark shadow-[0_0_60px_rgba(0,0,0,0.9)]`}>
        {/* CRT Scanline Overlay */}
        <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-70" />

        {/* Top Telemetry Header */}
        <div className={`relative z-20 flex items-center justify-between border-b ${hudBorderColor} px-4 py-2.5 bg-black/60 font-mono text-xs ${hudTextColor}`}>
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 animate-ping rounded-full bg-current" />
            <h2 id="cockpit-hud-title" className="font-bold tracking-widest uppercase">
              {lang === 'tr' ? 'KOKPİT TELEMETRİSİ // SİSTEM ÇEVRİMİÇİ' : 'COCKPIT TELEMETRY // ONLINE'}
            </h2>
            <span className="opacity-40">|</span>
            <span className="text-[11px] text-slate-300 font-bold">{L(starship.names, lang)}</span>
            <Aurebesh text={starship.model} className="hidden md:inline-block text-[9px] opacity-60" />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] hidden sm:inline-block opacity-75">
              HYPERDRIVE: {starship.hyperdriveRating ?? 'CLASS 1.0'}
            </span>
            <button
              onClick={onClose}
              aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
              className="rounded border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:border-white/40 hover:text-white transition-colors"
            >
              ✕ {lang === 'tr' ? 'ÇIKIŞ' : 'EXIT'}
            </button>
          </div>
        </div>

        {/* Main Cockpit Viewport */}
        <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
          {/* Deep Space Background with Stars */}
          <div
            className={`absolute inset-0 transition-transform duration-700 ${
              isJumping ? 'scale-[3] opacity-30 filter blur-xs' : 'scale-100 opacity-90'
            }`}
            style={{
              backgroundImage: 'radial-gradient(1.5px 1.5px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 80px 140px, #38bdf8, rgba(0,0,0,0)), radial-gradient(2px 2px at 150px 70px, #e0f2fe, rgba(0,0,0,0)), radial-gradient(1px 1px at 240px 220px, #ffffff, rgba(0,0,0,0))',
              backgroundSize: '300px 300px',
            }}
          />

          {/* Hyperdrive Jump Warp Streaks */}
          {isJumping && (
            <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-black/60 pointer-events-none">
              <div className="h-full w-full animate-pulse bg-[radial-gradient(circle,#38bdf8_10%,transparent_70%)] opacity-80" />
              <div className="absolute font-display text-2xl tracking-[0.3em] text-holo-cyan animate-ping">
                {lang === 'tr' ? 'HİPERUZAYA SIÇRANDI' : 'JUMPING TO LIGHTSPEED'}
              </div>
            </div>
          )}

          {/* Laser Fire Blast Animation */}
          {isFiring && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className={`h-1 w-full max-w-lg ${isImperial ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'bg-emerald-400 shadow-[0_0_20px_#10b981]'} animate-ping`} />
            </div>
          )}

          {/* Vector Targeting Grid (Center HUD) */}
          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
            {/* Outer Pitch Ladder and Crosshairs */}
            <div className={`relative h-64 w-64 sm:h-80 sm:w-80 rounded-full border border-dashed ${hudBorderColor} flex items-center justify-center`}>
              {/* Concentric reticles */}
              <div className={`h-48 w-48 rounded-full border ${hudBorderColor} opacity-50`} />
              <div className={`h-24 w-24 rounded-full border border-dotted ${hudBorderColor} opacity-80`} />

              {/* Crosshair lines */}
              <div className={`absolute h-full w-0.5 ${isImperial ? 'bg-red-500/30' : 'bg-emerald-500/30'}`} />
              <div className={`absolute h-0.5 w-full ${isImperial ? 'bg-red-500/30' : 'bg-emerald-500/30'}`} />

              {/* Center Target Box */}
              <div
                className={`absolute h-14 w-14 border-2 transition-all duration-200 flex items-center justify-center ${
                  targetLocked
                    ? `${isImperial ? 'border-red-500 bg-red-500/20' : 'border-emerald-400 bg-emerald-400/20'} scale-110 shadow-[0_0_25px_currentColor]`
                    : `${hudBorderColor} scale-95`
                }`}
              >
                <div className="h-1.5 w-1.5 bg-current rounded-full" />
              </div>

              {/* Pitch Ladder notches */}
              <div className="absolute top-4 font-mono text-[9px] text-slate-400">+15°</div>
              <div className="absolute bottom-4 font-mono text-[9px] text-slate-400">-15°</div>
            </div>

            {/* Target Telemetry Readout */}
            <div className={`mt-3 rounded border ${hudBorderColor} ${hudBgColor} px-3 py-1 font-mono text-center text-xs backdrop-blur-xs`}>
              <div className="font-bold tracking-wider">
                {targetLocked ? (
                  <span className="text-red-400 animate-pulse">
                    ⚠ {lang === 'tr' ? 'HEDEF KİLİTLENDİ // ATEŞE HAZIR' : 'TARGET LOCKED // FIRE AT WILL'}
                  </span>
                ) : (
                  <span>
                    {lang === 'tr' ? 'HEDEF MENZİLİ' : 'TARGET RANGE'}: {Math.round(targetDistance)}m
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                VECTOR: 042.8 // AZIMUTH: +12.4
              </div>
            </div>
          </div>

          {/* Left Cockpit Instrument Cluster (Velocity & Throttle) */}
          <div className={`pointer-events-auto absolute left-3 top-16 z-20 flex flex-col gap-2 rounded-xl border ${hudBorderColor} ${hudBgColor} p-3 font-mono text-xs backdrop-blur-md w-48 sm:w-56`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {lang === 'tr' ? 'İTKİ / HIZ GÖSTERGESİ' : 'SUB-LIGHT DRIVE'}
              </span>
              <span className="font-bold">{throttle}%</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">SPEED:</span>
                <span className="text-slate-100 font-bold">{currentSpeedKmH} km/h</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">SUBLIGHT:</span>
                <span className="text-holo-cyan font-bold">{currentMGLT} MGLT</span>
              </div>
            </div>

            {/* Throttle Range Slider */}
            <div className="mt-1">
              <input
                type="range"
                min="0"
                max="100"
                value={throttle}
                onChange={(e) => setThrottle(Number(e.target.value))}
                className="w-full accent-current cursor-pointer h-1.5 rounded-lg bg-black/60"
              />
              <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
                <span>0% (STOP)</span>
                <span>50%</span>
                <span>100% (MAX)</span>
              </div>
            </div>

            {/* S-Foils Toggle (If Fighter) */}
            <button
              onClick={() => setSFoilsLocked(!sFoilsLocked)}
              className={`mt-1 rounded border px-2 py-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${
                sFoilsLocked
                  ? 'border-red-500 bg-red-950/40 text-red-300'
                  : 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
              }`}
            >
              S-FOILS: {sFoilsLocked ? (lang === 'tr' ? 'SEYİR MODU' : 'CRUISE') : (lang === 'tr' ? 'SALDIRI POZİSYONU' : 'ATTACK POSITION')}
            </button>
          </div>

          {/* Right Cockpit Instrument Cluster (Shields & Armament) */}
          <div className={`pointer-events-auto absolute right-3 top-16 z-20 flex flex-col gap-2 rounded-xl border ${hudBorderColor} ${hudBgColor} p-3 font-mono text-xs backdrop-blur-md w-48 sm:w-56`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {lang === 'tr' ? 'SAPIRICI KALKANLAR' : 'DEFLECTOR SHIELDS'}
              </span>
              <span className="text-holo-cyan">100%</span>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">{lang === 'tr' ? 'ÖN KALKAN' : 'FORWARD'}:</span>
                <span className="text-slate-200">{shieldForward}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{lang === 'tr' ? 'ARKA KALKAN' : 'AFT'}:</span>
                <span className="text-slate-200">{100 - shieldForward}%</span>
              </div>
            </div>

            {/* Shield Balance Range */}
            <input
              type="range"
              min="10"
              max="90"
              value={shieldForward}
              onChange={(e) => setShieldForward(Number(e.target.value))}
              className="w-full accent-current cursor-pointer h-1.5 rounded-lg bg-black/60"
            />

            {/* Armament Telemetry */}
            <div className="mt-1 border-t border-white/10 pt-1.5">
              <span className="text-[8.5px] uppercase text-slate-400 block mb-0.5">
                {lang === 'tr' ? 'SİLAH SİSTEMLERİ' : 'WEAPONS MATRIX'}
              </span>
              <div className="text-[9.5px] text-slate-300 line-clamp-2">
                {L(starship.armament, lang) ?? 'Dual Laser Cannons, Proton Torpedoes'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Cockpit Action Command Bar */}
        <div className={`relative z-20 flex flex-wrap items-center justify-between gap-3 border-t ${hudBorderColor} bg-black/80 px-4 py-3 font-mono text-xs`}>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] hidden md:inline-block">
              {lang === 'tr' ? 'KONTROLLER: [BOŞLUK] = ATEŞ | [YUKARI/AŞAĞI] = İTKİ' : 'CONTROLS: [SPACE] = FIRE | [UP/DOWN] = THROTTLE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerFire}
              className={`rounded border px-4 py-1.5 font-bold tracking-wider transition-all ${
                isImperial
                  ? 'border-red-500 bg-red-600/30 text-red-200 hover:bg-red-600/50 hover:shadow-[0_0_15px_#ef4444]'
                  : 'border-emerald-500 bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/50 hover:shadow-[0_0_15px_#10b981]'
              }`}
            >
              ⚡ {lang === 'tr' ? 'PLAZMA ATEŞLE [BOŞLUK]' : 'FIRE CANNONS [SPACE]'}
            </button>

            <button
              onClick={triggerHyperdrive}
              disabled={isJumping}
              className="rounded border border-holo-cyan/50 bg-holo-cyan/20 px-4 py-1.5 font-bold tracking-wider text-holo-cyan transition-all hover:bg-holo-cyan/35 hover:shadow-[0_0_15px_rgba(56,189,248,0.5)] disabled:opacity-50"
            >
              🚀 {lang === 'tr' ? 'HİPERUZAY SIÇRAMASI' : 'LIGHTSPEED JUMP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
