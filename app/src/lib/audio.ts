// Web Audio API synthesizer for sci-fi Holocron UI audio feedback.
// Zero external assets required — synthesized procedurally.

/** the visitor's choice survives a reload, like every other app preference */
const STORAGE_KEY = 'ga-sfx'

class AudioEngine {
  private ctx: AudioContext | null = null
  private enabled: boolean =
    typeof localStorage === 'undefined' || localStorage.getItem(STORAGE_KEY) !== '0'

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public isMuted(): boolean {
    return !this.enabled
  }

  public setMuted(muted: boolean) {
    this.enabled = !muted
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, muted ? '0' : '1')
  }

  /** Subtle holographic button hover click */
  public playHover() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.04)

    gain.gain.setValueAtTime(0.015, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.04)
  }

  /** Holocron card select or panel open chime */
  public playSelect() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(520, now)
    osc.frequency.setValueAtTime(659.25, now + 0.05) // E5 note
    osc.frequency.setValueAtTime(783.99, now + 0.1)  // G5 note

    gain.gain.setValueAtTime(0.03, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.25)
  }

  /** Hyperdrive / Transmission scan effect */
  public playTransmission() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15)

    gain.gain.setValueAtTime(0.02, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.2)
  }

  /** Hyperspace jump roar sound effect */
  public playHyperspace() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(60, now)
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.6)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.7)
  }

  /** Lightsaber ignition snap & hum effect */
  public playLightsaberIgnition() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.35)

    gain.gain.setValueAtTime(0.09, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.4)
  }
}

export const sfx = new AudioEngine()

