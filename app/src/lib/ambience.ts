// Planet ambience: a looping soundscape synthesised per archetype with the Web
// Audio API — filtered noise for wind, surf and rumble, a few detuned
// oscillators for hum and drone. No audio files ship with the archive.

import type { Archetype } from '../types/lore'

export interface AmbienceRecipe {
  /** filtered noise bed: wind, surf, rumble */
  noise: { type: BiquadFilterType; freq: number; q: number; gain: number }
  /** slow swell of the noise bed (gusts, waves); rate in Hz */
  swell: { rate: number; depth: number }
  /** sustained tones in Hz: city hum, gas-giant drone, crystal ring */
  drone?: { freqs: number[]; type: OscillatorType; gain: number }
}

export const AMBIENCE: Record<Archetype, AmbienceRecipe> = {
  desert: { noise: { type: 'bandpass', freq: 520, q: 0.7, gain: 0.5 }, swell: { rate: 0.09, depth: 0.6 } },
  ecumenopolis: {
    noise: { type: 'lowpass', freq: 900, q: 0.5, gain: 0.32 },
    swell: { rate: 0.05, depth: 0.25 },
    drone: { freqs: [55, 110.4, 164.8], type: 'sawtooth', gain: 0.018 },
  },
  lava: {
    noise: { type: 'lowpass', freq: 140, q: 0.8, gain: 0.9 },
    swell: { rate: 0.13, depth: 0.5 },
    drone: { freqs: [36, 48.5], type: 'sine', gain: 0.05 },
  },
  ice: { noise: { type: 'bandpass', freq: 1300, q: 3.5, gain: 0.42 }, swell: { rate: 0.07, depth: 0.75 } },
  'ocean-storm': { noise: { type: 'lowpass', freq: 750, q: 0.6, gain: 0.7 }, swell: { rate: 0.11, depth: 0.85 } },
  'gas-giant': {
    noise: { type: 'lowpass', freq: 260, q: 0.9, gain: 0.35 },
    swell: { rate: 0.03, depth: 0.5 },
    drone: { freqs: [41, 61.7], type: 'sine', gain: 0.06 },
  },
  verdant: { noise: { type: 'lowpass', freq: 650, q: 0.5, gain: 0.35 }, swell: { rate: 0.06, depth: 0.5 } },
  'swamp-fog': {
    noise: { type: 'lowpass', freq: 320, q: 1.2, gain: 0.45 },
    swell: { rate: 0.04, depth: 0.4 },
    drone: { freqs: [3100, 3180], type: 'sine', gain: 0.004 }, // insect whine beating against itself
  },
  'crystal-red': {
    noise: { type: 'highpass', freq: 2400, q: 0.7, gain: 0.12 },
    swell: { rate: 0.05, depth: 0.6 },
    drone: { freqs: [880, 1318.5, 1760.6], type: 'sine', gain: 0.01 },
  },
  'dark-storm': {
    noise: { type: 'lowpass', freq: 380, q: 0.8, gain: 0.75 },
    swell: { rate: 0.1, depth: 0.7 },
    drone: { freqs: [44, 46.2], type: 'triangle', gain: 0.04 },
  },
  barren: { noise: { type: 'bandpass', freq: 420, q: 1.4, gain: 0.25 }, swell: { rate: 0.05, depth: 0.5 } },
  station: {
    noise: { type: 'bandpass', freq: 600, q: 0.9, gain: 0.16 },
    swell: { rate: 0.02, depth: 0.2 },
    drone: { freqs: [60, 120.3], type: 'sine', gain: 0.035 },
  },
}

const MASTER_GAIN = 0.16
const FADE_IN_S = 2.2
const FADE_OUT_S = 0.6

let ctx: AudioContext | null = null
let current: { stop: () => void } | null = null

function context(): AudioContext | null {
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** two seconds of brown noise, looped: random-walk noise sounds like wind and
 *  surf where white noise only hisses */
function noiseBuffer(ac: AudioContext): AudioBuffer {
  const buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    data[i] = last * 3.5
  }
  return buffer
}

/** Starts the soundscape for an archetype, replacing any one already playing. */
export function startAmbience(archetype: Archetype): void {
  stopAmbience()
  const ac = context()
  if (!ac) return
  const recipe = AMBIENCE[archetype]
  const now = ac.currentTime

  const master = ac.createGain()
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(MASTER_GAIN, now + FADE_IN_S)
  master.connect(ac.destination)

  const source = ac.createBufferSource()
  source.buffer = noiseBuffer(ac)
  source.loop = true
  const filter = ac.createBiquadFilter()
  filter.type = recipe.noise.type
  filter.frequency.value = recipe.noise.freq
  filter.Q.value = recipe.noise.q
  const bed = ac.createGain()
  bed.gain.value = recipe.noise.gain * (1 - recipe.swell.depth / 2)
  source.connect(filter).connect(bed).connect(master)

  // the swell: an LFO riding the bed's gain and nudging the filter
  const lfo = ac.createOscillator()
  lfo.frequency.value = recipe.swell.rate
  const lfoGain = ac.createGain()
  lfoGain.gain.value = (recipe.noise.gain * recipe.swell.depth) / 2
  lfo.connect(lfoGain).connect(bed.gain)
  const sweep = ac.createGain()
  sweep.gain.value = recipe.noise.freq * 0.25
  lfo.connect(sweep).connect(filter.frequency)

  const oscillators = (recipe.drone?.freqs ?? []).map((freq) => {
    const osc = ac.createOscillator()
    osc.type = recipe.drone!.type
    osc.frequency.value = freq
    const g = ac.createGain()
    g.gain.value = recipe.drone!.gain
    osc.connect(g).connect(master)
    return osc
  })

  const sources = [source, lfo, ...oscillators]
  for (const s of sources) s.start(now)

  current = {
    stop: () => {
      const t = ac.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setValueAtTime(master.gain.value, t)
      master.gain.linearRampToValueAtTime(0, t + FADE_OUT_S)
      for (const s of sources) s.stop(t + FADE_OUT_S + 0.05)
      window.setTimeout(() => master.disconnect(), (FADE_OUT_S + 0.1) * 1000)
    },
  }
}

export function stopAmbience(): void {
  current?.stop()
  current = null
}
