// In-universe decoration: a world's name written in Aurebesh beside the Latin
// one. Aurebesh fonts map straight onto ASCII, so the text is unchanged — only
// the face differs.
//
// The face itself is NOT bundled: no Aurebesh font with a redistributable
// licence ships with this repo. Drop an OFL-licensed `aurebesh.woff2` into
// public/fonts/ and this decoration appears everywhere on its own; without it
// the component renders nothing rather than falling back to plain Latin, which
// would just look like a duplicated label.

import { useEffect, useState } from 'react'

const FONT_FAMILY = 'Aurebesh'

let ready: Promise<boolean> | null = null

function fontAvailable(): Promise<boolean> {
  if (!ready) {
    ready = document.fonts
      .load(`12px "${FONT_FAMILY}"`)
      .then(() => document.fonts.check(`12px "${FONT_FAMILY}"`))
      .catch(() => false)
  }
  return ready
}

export default function Aurebesh({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    fontAvailable().then((ok) => {
      if (!cancelled) setAvailable(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!available) return null
  return (
    <span aria-hidden className={`font-aurebesh ${className}`}>
      {text}
    </span>
  )
}
