// WebAudio manager. Every sound effect is synthesised here — no sample files,
// no licensing surface, nothing to download. Music is slot-based: if a track
// exists under public/audio/music/<id>.mp3 it plays, otherwise the channel
// stays silent and nothing else changes.
//
// Browsers refuse to start audio before a gesture, so the context is created
// on the first real interaction and `unlock()` is safe to call repeatedly.

export type Channel = 'music' | 'ambience' | 'sfx'

export type Sfx =
  | 'hover'
  | 'select'
  | 'panel'
  | 'jump'
  | 'era'
  | 'porg'

interface ChannelState {
  gain: GainNode
  volume: number
}

const STORAGE_MUTED = 'ga-muted'
const STORAGE_VOLUME = 'ga-volume'

class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private channels = new Map<Channel, ChannelState>()
  private musicSource: AudioBufferSourceNode | null = null
  private musicId: string | null = null
  private missingTracks = new Set<string>()
  private muted = localStorage.getItem(STORAGE_MUTED) === '1'
  private volume = Number(localStorage.getItem(STORAGE_VOLUME) ?? '0.7')

  /** Create or resume the context. Call from a user gesture. */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume
      this.master.connect(this.ctx.destination)
      for (const [name, level] of [
        ['music', 0.5],
        ['ambience', 0.4],
        ['sfx', 0.85],
      ] as const) {
        const gain = this.ctx.createGain()
        gain.gain.value = level
        gain.connect(this.master)
        this.channels.set(name, { gain, volume: level })
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  isMuted() {
    return this.muted
  }

  getVolume() {
    return this.volume
  }

  setMuted(muted: boolean) {
    this.muted = muted
    localStorage.setItem(STORAGE_MUTED, muted ? '1' : '0')
    this.applyMasterGain()
  }

  setVolume(volume: number) {
    this.volume = Math.min(Math.max(volume, 0), 1)
    localStorage.setItem(STORAGE_VOLUME, String(this.volume))
    this.applyMasterGain()
  }

  private applyMasterGain() {
    if (!this.master || !this.ctx) return
    const target = this.muted ? 0 : this.volume
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05)
  }

  private channelNode(channel: Channel): GainNode | null {
    return this.channels.get(channel)?.gain ?? null
  }

  /** Short synthesised UI sounds. Silent until unlock() has run. */
  play(sfx: Sfx) {
    if (this.muted || !this.ctx) return
    const out = this.channelNode('sfx')
    if (!out) return
    const now = this.ctx.currentTime
    switch (sfx) {
      case 'hover':
        this.blip(out, now, 1180, 0.05, 0.1, 'sine')
        break
      case 'select':
        this.blip(out, now, 660, 0.09, 0.18, 'triangle')
        this.blip(out, now + 0.05, 990, 0.09, 0.13, 'triangle')
        break
      case 'panel':
        this.sweep(out, now, 320, 880, 0.18, 0.12)
        break
      case 'jump':
        // filtered noise sweep: the hyperspace whoosh
        this.noiseSweep(out, now, 0.9)
        this.sweep(out, now, 90, 1400, 0.75, 0.14, 'sawtooth')
        break
      case 'era':
        this.sweep(out, now, 1200, 240, 0.5, 0.11, 'sine')
        break
      case 'porg':
        // two rising chirps — the Ahch-To easter egg
        this.blip(out, now, 1500, 0.07, 0.16, 'square')
        this.blip(out, now + 0.1, 2100, 0.06, 0.13, 'square')
        break
    }
  }

  private blip(
    out: GainNode,
    at: number,
    freq: number,
    dur: number,
    peak: number,
    type: OscillatorType,
  ) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(peak, at + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    osc.connect(gain).connect(out)
    osc.start(at)
    osc.stop(at + dur + 0.02)
  }

  private sweep(
    out: GainNode,
    at: number,
    from: number,
    to: number,
    dur: number,
    peak: number,
    type: OscillatorType = 'sine',
  ) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, at)
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), at + dur)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(peak, at + dur * 0.2)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    osc.connect(gain).connect(out)
    osc.start(at)
    osc.stop(at + dur + 0.02)
  }

  private noiseSweep(out: GainNode, at: number, dur: number) {
    const ctx = this.ctx!
    const frames = Math.floor(ctx.sampleRate * dur)
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 1.4
    filter.frequency.setValueAtTime(240, at)
    filter.frequency.exponentialRampToValueAtTime(5200, at + dur * 0.62)
    filter.frequency.exponentialRampToValueAtTime(400, at + dur)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.3, at + 0.12)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    source.connect(filter).connect(gain).connect(out)
    source.start(at)
    source.stop(at + dur)
  }

  /** Play a looping track if one is present; a missing file is not an error. */
  async playMusic(id: string) {
    if (!this.ctx || this.musicId === id || this.missingTracks.has(id)) return
    const out = this.channelNode('music')
    if (!out) return
    const url = `/audio/music/${id}.mp3`
    let buffer: AudioBuffer
    try {
      const res = await fetch(url)
      if (!res.ok) {
        this.missingTracks.add(id)
        return
      }
      buffer = await this.ctx.decodeAudioData(await res.arrayBuffer())
    } catch {
      // no track in this slot — the channel simply stays quiet
      this.missingTracks.add(id)
      return
    }
    this.stopMusic()
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(out)
    source.start()
    this.musicSource = source
    this.musicId = id
  }

  stopMusic() {
    this.musicSource?.stop()
    this.musicSource?.disconnect()
    this.musicSource = null
    this.musicId = null
  }
}

export const audio = new AudioManager()
