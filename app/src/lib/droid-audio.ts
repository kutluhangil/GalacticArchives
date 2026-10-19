// Droid Vocabulator Audio Synthesizer — Real-time Web Audio API synthesis
// for authentic Star Wars droid communication sounds (Astromech FM chirps, Gonk honks,
// Battle Droid vocoder blips, Protocol chimes, and Mouse Droid squeaks).

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) audioCtx = new AudioCtx()
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playDroidVocabulator(soundType: string): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  switch (soundType) {
    case 'astromech': {
      // Astromech frequency-modulated binary chirps (R2-D2 style)
      const carrier = ctx.createOscillator()
      const modulator = ctx.createOscillator()
      const modGain = ctx.createGain()
      const masterGain = ctx.createGain()

      carrier.type = 'sine'
      modulator.type = 'sine'

      // Randomize melody sequence for lively feeling
      const baseFreq = 800 + Math.random() * 400
      carrier.frequency.setValueAtTime(baseFreq, now)
      carrier.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.12)
      carrier.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.28)
      carrier.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.42)

      modulator.frequency.setValueAtTime(32, now)
      modulator.frequency.linearRampToValueAtTime(14, now + 0.42)

      modGain.gain.setValueAtTime(180, now)
      modGain.gain.linearRampToValueAtTime(40, now + 0.42)

      modulator.connect(modGain)
      modGain.connect(carrier.frequency)

      masterGain.gain.setValueAtTime(0, now)
      masterGain.gain.linearRampToValueAtTime(0.18, now + 0.04)
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48)

      carrier.connect(masterGain)
      masterGain.connect(ctx.destination)

      modulator.start(now)
      carrier.start(now)
      modulator.stop(now + 0.5)
      carrier.stop(now + 0.5)
      break
    }

    case 'gonk': {
      // Low-frequency resonant square-wave "GONK" honk
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(110, now)
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.35)

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(440, now)
      filter.Q.setValueAtTime(4, now)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.46)
      break
    }

    case 'battledroid': {
      // Dual-tone comlink vocoder burst ("Roger Roger" acknowledge)
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'square'
      osc2.type = 'triangle'

      osc1.frequency.setValueAtTime(580, now)
      osc1.frequency.setValueAtTime(740, now + 0.12)

      osc2.frequency.setValueAtTime(290, now)
      osc2.frequency.setValueAtTime(370, now + 0.12)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02)
      gain.gain.setValueAtTime(0.02, now + 0.11)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.14)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.34)
      osc2.stop(now + 0.34)
      break
    }

    case 'protocol': {
      // Polite diplomatic chime harmonic
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.setValueAtTime(659.25, now + 0.12) // E5
      osc.frequency.setValueAtTime(783.99, now + 0.24) // G5

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.62)
      break
    }

    case 'mouse': {
      // High-pitched mouse droid electronic squeak
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(2200, now)
      osc.frequency.exponentialRampToValueAtTime(3400, now + 0.08)
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.2)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.25)
      break
    }

    case 'assassin': {
      // Cold targeting lock scanner tone
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.linearRampToValueAtTime(880, now + 0.25)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.14, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.4)
      break
    }

    default: {
      // Diagnostic telemetry pulse
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(987.77, now) // B5

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.32)
      break
    }
  }
}
