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

export default function SettingsMenu() {
  const { lang, quality, setQuality } = useApp()
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
        </div>
      )}
    </div>
  )
}
