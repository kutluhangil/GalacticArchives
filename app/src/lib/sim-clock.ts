// Module-level anchor-based simulation clock (same math as useSimClock, but
// framework-free so both engines and any view share one timeline).

let simAnchor = Date.now()
let wallAnchor = performance.now()
let speed = 1
let playing = true

export const simClock = {
  getTime(): number {
    if (!playing) return simAnchor
    return simAnchor + (performance.now() - wallAnchor) * speed
  },
  getSpeed: () => speed,
  isPlaying: () => playing,
  setSpeed(s: number) {
    simAnchor = simClock.getTime()
    wallAnchor = performance.now()
    speed = s
    playing = true
  },
  pause() {
    if (!playing) return
    simAnchor = simClock.getTime()
    wallAnchor = performance.now()
    playing = false
  },
  resume() {
    if (playing) return
    wallAnchor = performance.now()
    playing = true
  },
  goNow() {
    simAnchor = Date.now()
    wallAnchor = performance.now()
    speed = 1
    playing = true
  },
}
