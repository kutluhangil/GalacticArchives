import { useApp } from '../../state/app'

const SPEEDS = [1, 60, 600, 3600]

export default function TimeBar() {
  const { clockSpeed, clockPlaying, setClockSpeed, toggleClockPlaying } = useApp()
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-panel/80 px-2 py-1 backdrop-blur-md">
      <button
        onClick={toggleClockPlaying}
        className="rounded-full px-2 py-0.5 text-[12px] text-slate-200 hover:text-holo-cyan"
      >
        {clockPlaying ? '❚❚' : '▶'}
      </button>
      {SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => setClockSpeed(s)}
          className={`rounded-full px-2 py-0.5 text-[11px] transition-colors ${
            clockSpeed === s && clockPlaying
              ? 'bg-holo-cyan/20 text-holo-cyan'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {s === 1 ? '1×' : s === 60 ? '60×' : s === 600 ? '600×' : '1h/s'}
        </button>
      ))}
    </div>
  )
}
