// Archival portrait viewer for Star Wars canon figures with unified holographic styling.

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
  return (
    <div
      className={`group relative overflow-hidden rounded border border-holo-cyan/30 bg-[#060B14] shadow-[0_0_12px_rgba(102,217,255,0.15)] ${
        size === 'sm' ? 'aspect-5/4' : 'aspect-5/4'
      } w-full`}
    >
      <img
        src={`/portraits/${id}.webp`}
        alt={name}
        width={1000}
        height={820}
        decoding="async"
        loading={size === 'sm' ? 'lazy' : 'eager'}
        style={vtName ? { viewTransitionName: vtName } : undefined}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Sci-fi holographic scanline overlay (subtle) */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,255,255,0.03)_50%)] bg-size-[100%_4px]" />
      {/* Top corner holo beam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-holo-cyan/40 to-transparent" />
      {/* Subtle corner light accents */}
      <div className="pointer-events-none absolute top-1 left-1 h-1.5 w-1.5 border-t border-l border-holo-cyan/60" />
      <div className="pointer-events-none absolute top-1 right-1 h-1.5 w-1.5 border-t border-r border-holo-cyan/60" />
    </div>
  )
}

