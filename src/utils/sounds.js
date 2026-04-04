/**
 * Sound + haptic utilities.
 * All sounds generated via Web Audio API — no external files.
 * Haptics via navigator.vibrate (Android only; iOS silently skips).
 */

let audioCtx = null
const STORAGE_KEY = 'wedding_muted'

export function isMuted() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setMuted(val) {
  localStorage.setItem(STORAGE_KEY, String(val))
}

function ctx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function masterGain() {
  const g = ctx().createGain()
  g.gain.value = 0.35
  g.connect(ctx().destination)
  return g
}

// ─── Haptics ────────────────────────────────────────────────

export function haptic(type = 'light') {
  if (!navigator.vibrate) return
  switch (type) {
    case 'light':   navigator.vibrate(8); break
    case 'medium':  navigator.vibrate(20); break
    case 'success': navigator.vibrate([12, 60, 12]); break
    case 'error':   navigator.vibrate([60, 40, 60]); break
  }
}

// ─── Sounds ─────────────────────────────────────────────────

/** Chip hitting felt table — selecting an option */
export function playTick() {
  if (isMuted()) return
  try {
    const c = ctx()
    const now = c.currentTime

    // --- Impact: filtered noise burst (the felt/table thud) ---
    const impactSamples = Math.floor(c.sampleRate * 0.07)
    const impactBuf = c.createBuffer(1, impactSamples, c.sampleRate)
    const impactData = impactBuf.getChannelData(0)
    for (let i = 0; i < impactSamples; i++) {
      // Fast exponential decay so it cuts off sharply like a chip drop
      impactData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (impactSamples * 0.12))
    }
    const impactSrc = c.createBufferSource()
    impactSrc.buffer = impactBuf

    // Band-pass to get that midrange felt thud (not too bassy, not too tinny)
    const bpf = c.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.value = 1800
    bpf.Q.value = 0.6

    const impactGain = c.createGain()
    impactGain.gain.setValueAtTime(0.55, now)

    impactSrc.connect(bpf)
    bpf.connect(impactGain)
    impactGain.connect(c.destination)
    impactSrc.start(now)

    // --- Ring: the high-freq resonance of the chip itself ---
    const ring = c.createOscillator()
    const ringGain = c.createGain()
    ring.connect(ringGain)
    ringGain.connect(c.destination)
    ring.type = 'sine'
    ring.frequency.setValueAtTime(3200, now)
    ring.frequency.exponentialRampToValueAtTime(2400, now + 0.05)
    ringGain.gain.setValueAtTime(0.18, now)
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    ring.start(now)
    ring.stop(now + 0.07)

    // --- Subtle low body thump (chip weight hitting surface) ---
    const thump = c.createOscillator()
    const thumpGain = c.createGain()
    thump.connect(thumpGain)
    thumpGain.connect(c.destination)
    thump.type = 'sine'
    thump.frequency.setValueAtTime(140, now)
    thump.frequency.exponentialRampToValueAtTime(60, now + 0.04)
    thumpGain.gain.setValueAtTime(0.2, now)
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    thump.start(now)
    thump.stop(now + 0.06)

  } catch (_) {}
}

/** Chip drop — bet placed */
export function playChip() {
  if (isMuted()) return
  try {
    const c = ctx()
    const g = masterGain()

    // Low thump
    const thump = c.createOscillator()
    thump.connect(g)
    thump.type = 'sine'
    thump.frequency.setValueAtTime(180, c.currentTime)
    thump.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.12)
    g.gain.setValueAtTime(0.5, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18)
    thump.start(c.currentTime)
    thump.stop(c.currentTime + 0.2)

    // High click on top
    const click = c.createOscillator()
    const cg = masterGain()
    click.connect(cg)
    click.type = 'triangle'
    click.frequency.setValueAtTime(900, c.currentTime)
    cg.gain.setValueAtTime(0.2, c.currentTime)
    cg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04)
    click.start(c.currentTime)
    click.stop(c.currentTime + 0.05)
  } catch (_) {}
}

/** Ascending chime — correct answer */
export function playSuccess() {
  if (isMuted()) return
  try {
    const c = ctx()
    const notes = [523, 659, 784] // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.connect(g)
      g.connect(c.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = c.currentTime + i * 0.13
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.25, t + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t)
      osc.stop(t + 0.42)
    })
  } catch (_) {}
}

/** Dull thud — wrong answer */
export function playWrong() {
  if (isMuted()) return
  try {
    const c = ctx()
    const g = masterGain()
    const osc = c.createOscillator()
    osc.connect(g)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.2)
    g.gain.setValueAtTime(0.3, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + 0.26)
  } catch (_) {}
}

/** Card flip — entering the board */
export function playCardFlip() {
  if (isMuted()) return
  try {
    const c = ctx()
    const bufferSize = c.sampleRate * 0.06
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const source = c.createBufferSource()
    source.buffer = buffer
    const g = masterGain()
    const filter = c.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 3000
    filter.Q.value = 0.8
    source.connect(filter)
    filter.connect(g)
    source.start(c.currentTime)
  } catch (_) {}
}
