// Step-transition bell, built to survive iOS Safari screen-lock.
//
// iOS suspends the Web Audio AudioContext when the screen is off, so a
// synthesized tone (lib/chime.ts) goes silent during practice. An
// HTMLAudioElement whose first play() happened inside a user gesture keeps
// working from timer callbacks even with the screen locked. We generate the
// bell as an inline WAV data URI so there's no asset to ship.

function buildBellDataUri(): string {
  const sampleRate = 22050
  const seconds = 0.5
  const n = Math.floor(sampleRate * seconds)
  const samples = new Int16Array(n)

  // Soft bell: A4 + fifth + octave, exponential decay.
  const partials: Array<[number, number]> = [
    [440, 1.0],
    [659.25, 0.35],
    [880, 0.2],
  ]
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const env = Math.exp(-t * 6) // ~0.45s perceptual tail
    let s = 0
    for (const [freq, g] of partials) s += g * Math.sin(2 * Math.PI * freq * t)
    s = (s / 1.55) * env * 0.7 // normalize + 70% headroom
    samples[i] = Math.max(-1, Math.min(1, s)) * 0x7fff
  }

  const bytesPerSample = 2
  const dataLen = n * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLen)
  const view = new DataView(buffer)
  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataLen, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)        // PCM chunk size
  view.setUint16(20, 1, true)         // audio format = PCM
  view.setUint16(22, 1, true)         // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true) // byte rate
  view.setUint16(32, bytesPerSample, true)              // block align
  view.setUint16(34, 16, true)        // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, dataLen, true)
  for (let i = 0; i < n; i++) view.setInt16(44 + i * 2, samples[i], true)

  // ArrayBuffer → base64
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return `data:audio/wav;base64,${btoa(binary)}`
}

let audio: HTMLAudioElement | null = null
let unlocked = false

function getAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  if (!audio) {
    audio = new Audio(buildBellDataUri())
    audio.preload = 'auto'
  }
  return audio
}

/**
 * Call inside the user gesture that starts a session (the "Start" tap).
 * Plays + immediately pauses to satisfy iOS's gesture-unlock requirement so
 * later timer-driven plays are allowed even with the screen locked.
 */
export function unlockBell(): void {
  const a = getAudio()
  if (!a || unlocked) return
  a.muted = true
  a.play()
    .then(() => {
      a.pause()
      a.currentTime = 0
      a.muted = false
      unlocked = true
    })
    .catch(() => {
      a.muted = false
      /* gesture unlock failed — ringBell still tries, vibration is the backup */
    })
}

/**
 * Ring at a step transition. Safe to call from a setInterval/timeout callback.
 * Always also fires a short vibration as the durable iOS-locked-screen backup.
 */
export function ringBell(): void {
  const a = getAudio()
  if (a) {
    try {
      a.currentTime = 0
      const p = a.play()
      if (p && typeof p.catch === 'function') {
        p.catch((err) => console.log('[bell] play blocked:', err?.name ?? err))
      }
    } catch (err) {
      console.log('[bell] play threw:', err)
    }
  }
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(300)
  }
}
