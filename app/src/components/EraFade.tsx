// Brief crossfade veil when the era changes — covers scene rebuilds.

import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/app'

export default function EraFade() {
  const era = useApp((s) => s.era)
  const [visible, setVisible] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 160)
    return () => window.clearTimeout(timer)
  }, [era])

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-40 bg-space transition-opacity duration-150 ${
        visible ? 'opacity-90' : 'opacity-0'
      }`}
    />
  )
}
