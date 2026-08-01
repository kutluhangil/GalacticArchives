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
    <img
      src={`/portraits/${id}.webp`}
      alt={name}
      width={1000}
      height={820}
      decoding="async"
      loading={size === 'sm' ? 'lazy' : 'eager'}
      style={vtName ? { viewTransitionName: vtName } : undefined}
      className={`w-full ${size === 'sm' ? 'h-24' : 'h-52'} bg-[#060B14] object-contain`}
    />
  )
}
