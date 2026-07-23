// First-visit hint: the era selector and the Legends toggle are easy to miss.
// Shown once (localStorage-gated), dismissible, and suppressed under reduced
// motion's spirit — it never animates aggressively and never reappears.

import { useState } from 'react'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'

const KEY = 'ga-onboarded'

export default function OnboardingHint() {
  const lang = useApp((s) => s.lang)
  const [show, setShow] = useState(() => !localStorage.getItem(KEY))
  if (!show) return null

  const dismiss = () => {
    localStorage.setItem(KEY, '1')
    setShow(false)
  }

  return (
    <div
      role="dialog"
      aria-label={t('onboardTitle', lang)}
      className="pointer-events-auto absolute right-4 top-24 z-30 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-holo-cyan/25 bg-panel/95 p-3.5 backdrop-blur-md"
    >
      <div className="mb-2 font-display text-[13px] tracking-[0.2em] text-holo-cyan">
        {t('onboardTitle', lang).toUpperCase()}
      </div>
      <p className="text-[11.5px] leading-relaxed text-slate-300">{t('onboardEra', lang)}</p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-300">
        {t('onboardLegends', lang)}
      </p>
      <button
        onClick={dismiss}
        className="mt-3 w-full rounded border border-holo-cyan/30 bg-holo-cyan/10 px-3 py-1.5 text-[12px] text-holo-cyan transition-colors hover:bg-holo-cyan/20"
      >
        {t('onboardDismiss', lang)}
      </button>
    </div>
  )
}
