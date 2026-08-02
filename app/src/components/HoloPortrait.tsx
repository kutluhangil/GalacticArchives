// Generated portraits deliberately remain faceless hologram silhouettes. They
// distinguish figures through outline and posture without reproducing actors.

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
    <div className={`relative overflow-hidden rounded border border-holo-cyan/30 bg-[#060B14] shadow-[0_0_12px_rgba(102,217,255,0.15)] ${size === 'sm' ? 'h-24' : 'h-52'} w-full`}>
      <img
        src={`/portraits/${id}.webp`}
        alt={name}
        width={1000}
        height={820}
        decoding="async"
        loading={size === 'sm' ? 'lazy' : 'eager'}
        style={vtName ? { viewTransitionName: vtName } : undefined}
        className="h-full w-full object-contain opacity-90 transition-opacity hover:opacity-100"
      />
      {/* Sci-fi holographic scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,255,255,0.06)_50%)] bg-[length:100%_4px]" />
      {/* Top corner holo beam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-holo-cyan/40 to-transparent" />
    </div>
  )
}

