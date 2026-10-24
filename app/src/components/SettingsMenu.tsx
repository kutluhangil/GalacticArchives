// Render-quality control. Kept as its own popover so the top bar stays a row
// of single glyphs at every breakpoint.

import { useEffect, useRef, useState } from 'react'
import { setQuality as applyQuality } from '../lib/quality'
import { t } from '../lib/ui-strings'
import { useApp, type Quality } from '../state/app'

const QUALITY_LABELS: Record<Quality, { en: string; tr: string }> = {
  auto: { en: 'Auto', tr: 'Otomatik' },
  low: { en: 'Low', tr: 'Düşük' },
  high: { en: 'High', tr: 'Yüksek' },
}

/** labelled switch row — the settings popover has one per map layer */
function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="mt-3 border-t border-white/5 pt-2.5">
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="font-hud text-[10px] uppercase tracking-[0.25em] text-slate-500">
          {label}
        </span>
        <span
          className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
            checked ? 'bg-holo-cyan/40' : 'bg-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${
              checked ? 'left-3.5 bg-holo-cyan' : 'left-0.5 bg-slate-400'
            }`}
          />
        </span>
      </button>
      <p className="mt-1.5 text-[10px] leading-snug text-slate-600">{hint}</p>
    </div>
  )
}

export default function SettingsMenu() {
  const { lang, quality, setQuality, legends, setLegends, lanes, setLanes, sfx, setSfx, ambience, setAmbience } =
    useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    applyQuality(quality)
  }, [quality])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('settings', lang)}
        aria-expanded={open}
        className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-slate-300 transition-colors hover:text-holo-cyan"
      >
        ⚙
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-30 w-52 rounded-lg border border-holo-cyan/20 bg-panel/95 p-3 backdrop-blur-md">
          <div className="mb-1.5 font-hud text-[10px] uppercase tracking-[0.25em] text-slate-500">
            {t('quality', lang)}
          </div>
          <div className="flex gap-1">
            {(['auto', 'low', 'high'] as Quality[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`flex-1 rounded px-1.5 py-1 text-[11px] transition-colors ${
                  quality === q
                    ? 'bg-holo-cyan/20 text-holo-cyan'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {QUALITY_LABELS[q][lang]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-slate-600">{t('qualityHint', lang)}</p>

          <Toggle
            label={t('legends', lang)}
            hint={t('legendsHint', lang)}
            checked={legends}
            onChange={setLegends}
          />
          <Toggle
            label={t('lanes', lang)}
            hint={t('lanesHint', lang)}
            checked={lanes}
            onChange={setLanes}
          />
          <Toggle
            label={t('sfx', lang)}
            hint={t('sfxHint', lang)}
            checked={sfx}
            onChange={setSfx}
          />
          <Toggle
            label={t('ambience', lang)}
            hint={t('ambienceHint', lang)}
            checked={ambience}
            onChange={setAmbience}
          />
        </div>
      )}
    </div>
  )
}
