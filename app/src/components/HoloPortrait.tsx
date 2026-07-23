// Holo-bust placeholder: a cyan scanline silhouette rather than a likeness.
// Rendering real actors' faces is both a rights problem and a consistency
// problem; the in-universe hologram is the honest stand-in. The silhouette
// varies by a hash of the character id so the gallery doesn't read as one
// repeated icon.

const SILHOUETTES = [
  // hooded
  'M50 22c-12 0-19 9-19 20 0 7 3 12 6 15-11 4-19 12-22 25h70c-3-13-11-21-22-25 3-3 6-8 6-15 0-11-7-20-19-20z',
  // helmeted
  'M50 20c-13 0-21 9-21 21v8c0 5 3 9 7 11-12 4-20 13-23 22h74c-3-9-11-18-23-22 4-2 7-6 7-11v-8c0-12-8-21-21-21z',
  // long hair
  'M50 21c-11 0-18 8-18 19 0 6 2 11 5 14-9 3-16 9-20 16-2 4-3 8-4 12h74c-1-4-2-8-4-12-4-7-11-13-20-16 3-3 5-8 5-14 0-11-7-19-18-19z',
  // crested
  'M50 18l-4 6c-9 2-14 10-14 19 0 6 2 11 6 14-11 4-19 13-22 25h68c-3-12-11-21-22-25 4-3 6-8 6-14 0-9-5-17-14-19z',
]

function hashIndex(id: string, buckets: number): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973
  return h % buckets
}

export default function HoloPortrait({
  id,
  name,
  size = 'md',
  vtName,
}: {
  id: string
  name: string
  size?: 'sm' | 'md'
  /** view-transition-name for the card->detail shared-element morph */
  vtName?: string
}) {
  const path = SILHOUETTES[hashIndex(id, SILHOUETTES.length)]
  // a small hue spread keeps a wall of portraits from reading as one repeated
  // icon while staying inside the hologram's blue-cyan range
  const hue = 186 + hashIndex(`${id}-hue`, 5) * 9
  const top = `hsl(${hue} 92% ${74 - hashIndex(`${id}-l`, 3) * 5}%)`
  const bottom = `hsl(${hue + 8} 62% 38%)`
  const scanId = `holo-scan-${id}`
  const glowId = `holo-glow-${id}`
  return (
    <svg
      viewBox="0 0 100 82"
      role="img"
      aria-label={name}
      style={vtName ? { viewTransitionName: vtName } : undefined}
      className={`w-full ${size === 'sm' ? 'h-24' : 'h-44'} bg-[#060B14]`}
    >
      <defs>
        <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} stopOpacity="0.95" />
          <stop offset="100%" stopColor={bottom} stopOpacity="0.35" />
        </linearGradient>
        <pattern id={scanId} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="2" fill="#0A1622" opacity="0.55" />
        </pattern>
      </defs>
      {/* projector base */}
      <ellipse cx="50" cy="79" rx="26" ry="2.6" fill="#66D9FF" opacity="0.28" />
      <path d={path} fill={`url(#${glowId})`} />
      <path d={path} fill={`url(#${scanId})`} />
      <path d={path} fill="none" stroke="#9FEBFF" strokeWidth="0.7" opacity="0.75" />
    </svg>
  )
}
